import { computed, reactive } from 'vue'
import type { AnchorPoint } from '../types/domain'
import { sampleSpline, toPathD } from './useSpline'
import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from './useSpine'

// Per the 1:1 scale rule (a Stamp is exactly as long as the Motif's baseline), the
// board is sized so the Motif's length matches the rendered area's diagonal.
export const MOTIF_BOARD_WIDTH = Math.hypot(SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT)
export const MOTIF_BOARD_HEIGHT = 200
export const MOTIF_BASELINE_Y = MOTIF_BOARD_HEIGHT / 2

let nextId = 1

export function useMotif() {
  const anchors = reactive<AnchorPoint[]>([
    { id: nextId++, x: 0, y: MOTIF_BASELINE_Y, isEdge: true },
    { id: nextId++, x: MOTIF_BOARD_WIDTH, y: MOTIF_BASELINE_Y, isEdge: true },
  ])

  const orderedAnchors = computed(() => [...anchors].sort((a, b) => a.x - b.x))

  const densePoints = computed(() => sampleSpline(orderedAnchors.value))

  const pathD = computed(() => toPathD(densePoints.value))

  function addAnchor(x: number, y: number) {
    const clampedX = Math.min(Math.max(x, 0), MOTIF_BOARD_WIDTH)
    const clampedY = Math.min(Math.max(y, 0), MOTIF_BOARD_HEIGHT)
    anchors.push({ id: nextId++, x: clampedX, y: clampedY, isEdge: false })
  }

  function moveAnchor(id: number, y: number) {
    const anchor = anchors.find((a) => a.id === id)
    if (!anchor || anchor.isEdge) return
    anchor.y = Math.min(Math.max(y, 0), MOTIF_BOARD_HEIGHT)
  }

  function removeAnchor(id: number) {
    const index = anchors.findIndex((a) => a.id === id)
    if (index === -1 || anchors[index].isEdge) return
    anchors.splice(index, 1)
  }

  return {
    anchors,
    orderedAnchors,
    densePoints,
    pathD,
    addAnchor,
    moveAnchor,
    removeAnchor,
  }
}

export type UseMotifReturn = ReturnType<typeof useMotif>
