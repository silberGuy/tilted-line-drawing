import type { SampledPoint } from '../types/domain'

interface Point {
  x: number
  y: number
}

/** One cubic piece of the spline: p(t) = a + b*t + c*t^2 + d*t^3 for t in [0, length]. */
interface Piece {
  length: number
  x: [number, number, number, number]
  y: [number, number, number, number]
}

/** A densely-sampled curve point that also remembers where it came from, so a later
 *  arc-length lookup can re-evaluate the curve analytically instead of approximating
 *  from this dense point's neighbors. */
export interface DenseSample extends Point {
  piece: Piece
  t: number
}

const SAMPLES_PER_SEGMENT = 20

/** Second derivatives of the natural cubic spline through (knots[i], values[i]). */
function naturalSecondDerivatives(h: number[], values: number[]): number[] {
  const n = values.length
  const m = new Array<number>(n).fill(0)
  if (n < 3) return m

  // Thomas algorithm on the tridiagonal system for the interior second derivatives.
  const diag = new Array<number>(n).fill(0)
  const rhs = new Array<number>(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    diag[i] = 2 * (h[i - 1] + h[i])
    rhs[i] = 6 * ((values[i + 1] - values[i]) / h[i] - (values[i] - values[i - 1]) / h[i - 1])
  }
  for (let i = 2; i < n - 1; i++) {
    const w = h[i - 1] / diag[i - 1]
    diag[i] -= w * h[i - 1]
    rhs[i] -= w * rhs[i - 1]
  }
  for (let i = n - 2; i >= 1; i--) {
    m[i] = (rhs[i] - (i < n - 2 ? h[i] * m[i + 1] : 0)) / diag[i]
  }
  return m
}

function buildCoefficients(
  h: number[],
  values: number[],
  m: number[],
  i: number,
): [number, number, number, number] {
  return [
    values[i],
    (values[i + 1] - values[i]) / h[i] - (h[i] * (2 * m[i] + m[i + 1])) / 6,
    m[i] / 2,
    (m[i + 1] - m[i]) / (6 * h[i]),
  ]
}

function evaluate(c: [number, number, number, number], t: number): number {
  return c[0] + t * (c[1] + t * (c[2] + t * c[3]))
}

function evaluateDerivative(c: [number, number, number, number], t: number): number {
  return c[1] + t * (2 * c[2] + t * 3 * c[3])
}

/** Builds a C2 (continuous-curvature) cubic spline through the points, parameterized by chord length. */
function buildPieces(points: Point[]): Piece[] {
  const h = points.slice(1).map((p, i) => Math.max(Math.hypot(p.x - points[i].x, p.y - points[i].y), 1e-6))
  const mx = naturalSecondDerivatives(h, points.map((p) => p.x))
  const my = naturalSecondDerivatives(h, points.map((p) => p.y))
  return h.map((length, i) => ({
    length,
    x: buildCoefficients(h, points.map((p) => p.x), mx, i),
    y: buildCoefficients(h, points.map((p) => p.y), my, i),
  }))
}

/** Densely samples a smooth curve through the given points, in order, keeping each dense
 *  sample's originating piece/t so the curve can later be re-evaluated exactly at any
 *  point in between (see `sampleAtArcLengthIntervals`). */
export function sampleSplineDetailed(points: Point[]): DenseSample[] {
  if (points.length < 2) {
    const flat: Piece = { length: 1, x: [0, 0, 0, 0], y: [0, 0, 0, 0] }
    return points.map((p) => ({ ...p, piece: flat, t: 0 }))
  }

  const pieces = buildPieces(points)
  const dense: DenseSample[] = []
  pieces.forEach((piece, i) => {
    const steps = i === pieces.length - 1 ? SAMPLES_PER_SEGMENT : SAMPLES_PER_SEGMENT - 1
    for (let s = 0; s <= steps; s++) {
      const t = (s / SAMPLES_PER_SEGMENT) * piece.length
      dense.push({ x: evaluate(piece.x, t), y: evaluate(piece.y, t), piece, t })
    }
  })
  return dense
}

/** Densely samples a smooth curve through the given points, in order. */
export function sampleSpline(points: Point[]): Point[] {
  return sampleSplineDetailed(points).map(({ x, y }) => ({ x, y }))
}

/** Builds an SVG path `d` attribute from a dense point list. */
export function toPathD(densePoints: Point[]): string {
  if (densePoints.length === 0) return ''
  return densePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

function cumulativeArcLengths(densePoints: Point[]): number[] {
  const lengths = [0]
  for (let i = 1; i < densePoints.length; i++) {
    const dx = densePoints[i].x - densePoints[i - 1].x
    const dy = densePoints[i].y - densePoints[i - 1].y
    lengths.push(lengths[i - 1] + Math.hypot(dx, dy))
  }
  return lengths
}

/** Fraction (0-1) of the curve's total arc length at which each input point sits. */
export function anchorArcFractions(densePoints: DenseSample[], anchorCount: number): number[] {
  if (densePoints.length < 2 || anchorCount < 2) return []
  const arcLengths = cumulativeArcLengths(densePoints)
  const total = arcLengths[arcLengths.length - 1]
  return Array.from({ length: anchorCount }, (_, i) => {
    const index = Math.min(i * SAMPLES_PER_SEGMENT, arcLengths.length - 1)
    return total > 0 ? arcLengths[index] / total : i / (anchorCount - 1)
  })
}

/**
 * Samples the curve at a fixed arc-length interval, returning position, tangent,
 * and normal at each sample. The normal is always the same fixed side of the
 * tangent (rotate +90 degrees) - it is never flipped to "correct" for inflections.
 *
 * Position and tangent are both re-evaluated analytically from the spline formula
 * at each sample's precise arc-length position (rather than approximated from the dense
 * sampling grid's nearest secant) so they vary smoothly between samples instead of
 * stair-stepping in lockstep with the dense grid.
 */
export function sampleAtArcLengthIntervals(densePoints: DenseSample[], spacing: number): SampledPoint[] {
  if (densePoints.length < 2 || spacing <= 0) return []

  const arcLengths = cumulativeArcLengths(densePoints)
  const totalLength = arcLengths[arcLengths.length - 1]
  const result: SampledPoint[] = []

  let segmentIndex = 1
  for (let target = 0; target <= totalLength; target += spacing) {
    while (segmentIndex < arcLengths.length - 1 && arcLengths[segmentIndex] < target) {
      segmentIndex++
    }
    const a = densePoints[segmentIndex - 1]
    const b = densePoints[segmentIndex]
    const segLength = arcLengths[segmentIndex] - arcLengths[segmentIndex - 1]
    const frac = segLength > 0 ? (target - arcLengths[segmentIndex - 1]) / segLength : 0

    // a and b share a piece except across a piece boundary, where b is the next piece's
    // t=0 - equivalent to the end of a's piece.
    const piece = a.piece
    const t = a.piece === b.piece ? a.t + (b.t - a.t) * frac : a.t + (piece.length - a.t) * frac

    const x = evaluate(piece.x, t)
    const y = evaluate(piece.y, t)
    const rawTangent = { x: evaluateDerivative(piece.x, t), y: evaluateDerivative(piece.y, t) }
    const len = Math.hypot(rawTangent.x, rawTangent.y) || 1
    const tangent = { x: rawTangent.x / len, y: rawTangent.y / len }
    const normal = { x: -tangent.y, y: tangent.x }

    result.push({ x, y, tangent, normal, t: totalLength > 0 ? target / totalLength : 0 })
  }

  return result
}
