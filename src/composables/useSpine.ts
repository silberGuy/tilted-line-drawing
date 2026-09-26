import { computed, reactive } from 'vue'
import type { AnchorPoint } from '../types/domain'
import { sampleAtArcLengthIntervals, sampleSplineDetailed, toPathD } from './useSpline'

export const SPINE_CANVAS_WIDTH = 400
export const SPINE_CANVAS_HEIGHT = 300
export const DEFAULT_STAMP_SPACING = 6

let nextId = 1

export function useSpine(stampSpacing: () => number) {
  const anchors = reactive<AnchorPoint[]>([
    { id: nextId++, x: SPINE_CANVAS_WIDTH * 0.1, y: SPINE_CANVAS_HEIGHT / 2, isEdge: true },
    { id: nextId++, x: SPINE_CANVAS_WIDTH * 0.9, y: SPINE_CANVAS_HEIGHT / 2, isEdge: true },
  ])

  const denseSamples = computed(() => sampleSplineDetailed(anchors))

  const pathD = computed(() => toPathD(denseSamples.value))

  const stampSamples = computed(() => sampleAtArcLengthIntervals(denseSamples.value, stampSpacing()))

  function addAnchor(x: number, y: number) {
    let bestIndex = anchors.length - 1
    let bestDistance = Infinity
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i]
      const b = anchors[i + 1]
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const distance = Math.hypot(x - midX, y - midY)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = i + 1
      }
    }
    anchors.splice(bestIndex, 0, { id: nextId++, x, y, isEdge: false })
  }

  function moveAnchor(id: number, x: number, y: number) {
    const anchor = anchors.find((a) => a.id === id)
    if (!anchor) return
    anchor.x = x
    anchor.y = y
  }

  function removeAnchor(id: number) {
    const index = anchors.findIndex((a) => a.id === id)
    if (index === -1 || anchors[index].isEdge) return
    anchors.splice(index, 1)
  }

  return {
    anchors,
    denseSamples,
    pathD,
    stampSamples,
    addAnchor,
    moveAnchor,
    removeAnchor,
  }
}

export type UseSpineReturn = ReturnType<typeof useSpine>
