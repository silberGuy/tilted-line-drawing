import type { AnchorPoint } from '../types/domain'
import { sampleSpline } from './useSpline'
import { MOTIF_BOARD_WIDTH } from './useMotif'

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

export function heightsToPath(heights: number[]): Path2D {
  const path = new Path2D()
  heights.forEach((y, k) => {
    const x = (k * MOTIF_BOARD_WIDTH) / MOTIF_SAMPLE_COUNT
    if (k === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  })
  return path
}
