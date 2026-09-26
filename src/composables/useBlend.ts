import type { AnchorPoint, Point } from '../types/domain'
import type { Extensions } from './useExtension'
import { sampleSpline } from './useSpline'
import { MOTIF_BOARD_WIDTH } from './motifBoard'

/** Every Motif is resampled at this many uniform steps across its baseline (about 2px each). */
export const MOTIF_SAMPLE_COUNT = 250

export type EasingFunction = (t: number) => number

export const smoothstep: EasingFunction = (t) => t * t * (3 - 2 * t)

/** Heights (board-local y) of the Motif's curve at MOTIF_SAMPLE_COUNT + 1 uniform x positions. */
export function sampleMotifHeights(anchors: AnchorPoint[]): number[] {
  const dense = sampleSpline([...anchors].sort((a, b) => a.x - b.x))
  const heights: number[] = []
  let j = 0
  for (let k = 0; k <= MOTIF_SAMPLE_COUNT; k++) {
    const x = (k * MOTIF_BOARD_WIDTH) / MOTIF_SAMPLE_COUNT
    while (j < dense.length - 2 && dense[j + 1].x < x) j++
    const a = dense[j]
    const b = dense[j + 1]
    const span = b.x - a.x
    const f = span > 1e-9 ? Math.min(Math.max((x - a.x) / span, 0), 1) : 0
    heights.push(a.y + (b.y - a.y) * f)
  }
  return heights
}

/** Height of a resampled Motif at board-local x, interpolating between its uniform samples. */
export function heightAtX(heights: number[], x: number): number {
  const position = Math.min(Math.max((x / MOTIF_BOARD_WIDTH) * MOTIF_SAMPLE_COUNT, 0), MOTIF_SAMPLE_COUNT)
  const k = Math.min(Math.floor(position), MOTIF_SAMPLE_COUNT - 1)
  return heights[k] + (heights[k + 1] - heights[k]) * (position - k)
}

/** Weighted average of two height tables: weight 0 is all `from`, weight 1 is all `to`. */
export function blendHeights(from: number[], to: number[], weight: number): number[] {
  return from.map((h, i) => h + (to[i] - h) * weight)
}

/**
 * The Motif height table to stamp at `fraction` of the way along the Spine, blended from the
 * two Spine anchors' tables it sits between. `anchorFractions` are the anchors' own positions
 * along the Spine (ascending, 0-1), one per table.
 */
export function heightsAt(
  fraction: number,
  anchorFractions: number[],
  tables: number[][],
  ease: EasingFunction,
): number[] {
  let i = 0
  while (i < tables.length - 2 && anchorFractions[i + 1] < fraction) i++
  const next = tables[i + 1]
  if (!next) return tables[i]

  const gap = anchorFractions[i + 1] - anchorFractions[i]
  const progress = gap > 0 ? Math.min(Math.max((fraction - anchorFractions[i]) / gap, 0), 1) : 0
  const weight = ease(progress)
  return weight === 0 ? tables[i] : blendHeights(tables[i], next, weight)
}

export function heightsToPoints(heights: number[]): Point[] {
  return heights.map((y, k) => ({ x: (k * MOTIF_BOARD_WIDTH) / MOTIF_SAMPLE_COUNT, y }))
}

/** The Motif line as a path, with its extensions attached to either end. */
export function heightsToPath(heights: number[], extensions?: Extensions): Path2D {
  const points = [
    ...(extensions ? [...extensions.start].reverse() : []),
    ...heightsToPoints(heights),
    ...(extensions?.end ?? []),
  ]
  const path = new Path2D()
  points.forEach((p, i) => (i === 0 ? path.moveTo(p.x, p.y) : path.lineTo(p.x, p.y)))
  return path
}
