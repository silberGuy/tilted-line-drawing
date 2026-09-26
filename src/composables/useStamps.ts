import { computed } from 'vue'
import type { SampledPoint } from '../types/domain'
import { heightsAt, heightsToPoints, smoothstep, type EasingFunction } from './useBlend'
import { extendBothEnds, type Extensions } from './useExtension'
import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from './useSpine'

// Long enough for any non-looping line to cross the whole frame.
const EXTENSION_MAX_LENGTH = Math.hypot(SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT)

export interface Stamp {
  /** [a, b, c, d, e, f] mapping motif board-local coordinates to world coordinates - same layout as CanvasRenderingContext2D.setTransform. */
  matrix: [number, number, number, number, number, number]
  /** The Stamp's blended Motif: board-local heights at uniform x steps across the baseline. */
  heights: number[]
  /** Continuations of the line past its ends that land inside the frame, until they leave it. */
  extensions: Extensions
  color: string
}

/**
 * Places Stamps of the Motif along the Spine's sampled points. At each point, the
 * Motif board's local x-axis (its baseline, edge-to-edge) is mapped onto the Spine's
 * normal - so the baseline crosses the Spine like a tick mark - and the board's local
 * y-axis (anchor bump height) is mapped onto the Spine's tangent. Each Stamp's color
 * comes from sampling the gradient at the Stamp's fractional position along the Spine.
 *
 * Each Stamp's Motif is blended from the two nearest own Motifs around it, weighted by its
 * eased progress along the Spine between them.
 */
export function useStamps(
  spineSamples: () => SampledPoint[],
  boardCenter: () => { x: number; y: number },
  colorAt: (t: number) => string,
  blend: () => { fractions: number[]; tables: number[][] },
  ease: () => EasingFunction = () => smoothstep,
) {
  const stamps = computed<Stamp[]>(() => {
    const { x: cx, y: cy } = boardCenter()
    const { fractions, tables } = blend()
    if (tables.length === 0) return []
    const easing = ease()

    return spineSamples().map((sample) => {
      const { normal, tangent } = sample
      const e = sample.x - cx * normal.x - cy * tangent.x
      const f = sample.y - cx * normal.y - cy * tangent.y
      const inFrame = (p: { x: number; y: number }) => {
        const worldX = normal.x * p.x + tangent.x * p.y + e
        const worldY = normal.y * p.x + tangent.y * p.y + f
        return worldX >= 0 && worldX <= SPINE_CANVAS_WIDTH && worldY >= 0 && worldY <= SPINE_CANVAS_HEIGHT
      }
      const heights = heightsAt(sample.t, fractions, tables, easing)
      return {
        matrix: [normal.x, normal.y, tangent.x, tangent.y, e, f],
        heights,
        extensions: extendBothEnds(heightsToPoints(heights), EXTENSION_MAX_LENGTH, inFrame),
        color: colorAt(sample.t),
      }
    })
  })

  return { stamps }
}
