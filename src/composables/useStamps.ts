import { computed } from 'vue'
import type { SampledPoint } from '../types/domain'

export interface Stamp {
  /** SVG `matrix(a,b,c,d,e,f)` mapping motif board-local coordinates to world coordinates. */
  transform: string
}

/**
 * Places Stamps of the Motif along the Spine's sampled points. At each point, the
 * Motif board's local x-axis (its baseline, edge-to-edge) is mapped onto the Spine's
 * normal - so the baseline crosses the Spine like a tick mark - and the board's local
 * y-axis (anchor bump height) is mapped onto the Spine's tangent.
 */
export function useStamps(
  spineSamples: () => SampledPoint[],
  boardCenter: () => { x: number; y: number },
) {
  const stamps = computed<Stamp[]>(() => {
    const { x: cx, y: cy } = boardCenter()
    return spineSamples().map((sample) => {
      const { normal, tangent } = sample
      const e = sample.x - cx * normal.x - cy * tangent.x
      const f = sample.y - cx * normal.y - cy * tangent.y
      return {
        transform: `matrix(${normal.x} ${normal.y} ${tangent.x} ${tangent.y} ${e} ${f})`,
      }
    })
  })

  return { stamps }
}
