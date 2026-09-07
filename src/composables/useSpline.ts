import type { SampledPoint } from '../types/domain'

interface Point {
  x: number
  y: number
}

const SAMPLES_PER_SEGMENT = 20

function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

/** Densely samples a smooth Catmull-Rom curve through the given points, in order. */
export function sampleSpline(points: Point[]): Point[] {
  if (points.length < 2) return points.slice()

  const dense: Point[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? points[i + 1]
    const steps = i === points.length - 2 ? SAMPLES_PER_SEGMENT : SAMPLES_PER_SEGMENT - 1
    for (let s = 0; s <= steps; s++) {
      dense.push(catmullRom(p0, p1, p2, p3, s / SAMPLES_PER_SEGMENT))
    }
  }
  return dense
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

/**
 * Samples the curve at a fixed arc-length interval, returning position, tangent,
 * and normal at each sample. The normal is always the same fixed side of the
 * tangent (rotate +90 degrees) - it is never flipped to "correct" for inflections.
 */
export function sampleAtArcLengthIntervals(densePoints: Point[], spacing: number): SampledPoint[] {
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
    const t = segLength > 0 ? (target - arcLengths[segmentIndex - 1]) / segLength : 0
    const x = a.x + (b.x - a.x) * t
    const y = a.y + (b.y - a.y) * t

    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const tangent = { x: dx / len, y: dy / len }
    const normal = { x: -tangent.y, y: tangent.x }

    result.push({ x, y, tangent, normal, t: totalLength > 0 ? target / totalLength : 0 })
  }

  return result
}
