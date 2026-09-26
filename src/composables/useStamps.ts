import { computed } from 'vue'
import type { AnchorPoint, SampledPoint } from '../types/domain'
import { heightsAt, sampleMotifHeights, smoothstep, type EasingFunction } from './useBlend'

export interface Stamp {
  /** [a, b, c, d, e, f] mapping motif board-local coordinates to world coordinates - same layout as CanvasRenderingContext2D.setTransform. */
  matrix: [number, number, number, number, number, number]
  /** The Stamp's blended Motif: board-local heights at uniform x steps across the baseline. */
  heights: number[]
  color: string
}

/**
 * Places Stamps of the Motif along the Spine's sampled points. At each point, the
 * Motif board's local x-axis (its baseline, edge-to-edge) is mapped onto the Spine's
 * normal - so the baseline crosses the Spine like a tick mark - and the board's local
 * y-axis (anchor bump height) is mapped onto the Spine's tangent. Each Stamp's color
 * comes from sampling the gradient at the Stamp's fractional position along the Spine.
 *
 * Each Stamp's Motif is blended from the two Spine anchors' Motifs it sits between, weighted
 * by its eased progress along the Spine between them.
 */
export function useStamps(
  spineSamples: () => SampledPoint[],
  boardCenter: () => { x: number; y: number },
  colorAt: (t: number) => string,
  blend: () => { anchorFractions: number[]; motifs: AnchorPoint[][] },
  ease: EasingFunction = smoothstep,
) {
  const stamps = computed<Stamp[]>(() => {
    const { x: cx, y: cy } = boardCenter()
    const { anchorFractions, motifs } = blend()
    // Spine anchors that follow the Default Motif share one list, so resample each list once.
    const tableByMotif = new Map<AnchorPoint[], number[]>()
    const tables = motifs.map((motif) => {
      if (!tableByMotif.has(motif)) tableByMotif.set(motif, sampleMotifHeights(motif))
      return tableByMotif.get(motif)!
    })
    if (tables.length === 0) return []

    return spineSamples().map((sample) => {
      const { normal, tangent } = sample
      const e = sample.x - cx * normal.x - cy * tangent.x
      const f = sample.y - cx * normal.y - cy * tangent.y
      return {
        matrix: [normal.x, normal.y, tangent.x, tangent.y, e, f],
        heights: heightsAt(sample.t, anchorFractions, tables, ease),
        color: colorAt(sample.t),
      }
    })
  })

  return { stamps }
}
