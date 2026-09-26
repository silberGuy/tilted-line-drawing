import { computed, reactive, ref, watch } from 'vue'
import type { AnchorPoint } from '../types/domain'
import { sampleSpline, toPathD } from './useSpline'
import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from './useSpine'

// Per the 1:1 scale rule (a Stamp is exactly as long as the Motif's baseline), the
// board is sized so the Motif's length matches the rendered area's diagonal.
export const MOTIF_BOARD_WIDTH = Math.hypot(SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT)
export const MOTIF_BOARD_HEIGHT = 200
export const MOTIF_BASELINE_Y = MOTIF_BOARD_HEIGHT / 2

let nextId = 1

function toPathOf(anchors: AnchorPoint[]): string {
  return toPathD(sampleSpline([...anchors].sort((a, b) => a.x - b.x)))
}

/** Copies keep their anchor ids, so a drag in progress survives the copy-on-first-edit swap. */
function clone(anchors: AnchorPoint[]): AnchorPoint[] {
  return anchors.map((a) => ({ ...a }))
}

/**
 * The Default Motif belongs to the Spine's first anchor; every other Spine anchor follows
 * it until it gets a Motif of its own (on first edit, or by copying another anchor's).
 * The selected Spine anchor is the one whose Motif the editor shows and edits.
 */
export function useMotif(spineAnchorIds: () => number[]) {
  const defaultAnchors = reactive<AnchorPoint[]>([
    { id: nextId++, x: 0, y: MOTIF_BASELINE_Y, isEdge: true },
    { id: nextId++, x: MOTIF_BOARD_WIDTH, y: MOTIF_BASELINE_Y, isEdge: true },
  ])
  const ownAnchors = reactive(new Map<number, AnchorPoint[]>())
  const requestedId = ref<number | null>(null)

  const topId = computed(() => spineAnchorIds()[0])
  // Falls back to the top anchor when nothing is picked yet or the picked anchor was deleted.
  const selectedId = computed(() => {
    const ids = spineAnchorIds()
    const requested = requestedId.value
    return requested !== null && ids.includes(requested) ? requested : ids[0]
  })
  const isTopSelected = computed(() => selectedId.value === topId.value)

  watch(
    () => spineAnchorIds(),
    (ids) => {
      for (const id of [...ownAnchors.keys()]) {
        if (!ids.includes(id)) ownAnchors.delete(id)
      }
    },
  )

  function motifOf(id: number | undefined): AnchorPoint[] {
    return (id !== undefined && id !== topId.value && ownAnchors.get(id)) || defaultAnchors
  }

  function hasOwnMotif(id: number): boolean {
    return id !== topId.value && ownAnchors.has(id)
  }

  const anchors = computed(() => motifOf(selectedId.value))
  const pathD = computed(() => toPathOf(anchors.value))
  /** The Default Motif's path - what the render uses for every Stamp for now. */
  const defaultPathD = computed(() => toPathOf(defaultAnchors))

  /** The list edits go to: the Default Motif for the top anchor, otherwise the selected
   *  anchor's own Motif, created as a copy of the Default Motif on first edit. */
  function writableAnchors(): AnchorPoint[] {
    const id = selectedId.value
    if (isTopSelected.value || id === undefined) return defaultAnchors
    if (!ownAnchors.has(id)) ownAnchors.set(id, clone(defaultAnchors))
    return ownAnchors.get(id)!
  }

  function addAnchor(x: number, y: number) {
    const clampedX = Math.min(Math.max(x, 0), MOTIF_BOARD_WIDTH)
    const clampedY = Math.min(Math.max(y, 0), MOTIF_BOARD_HEIGHT)
    writableAnchors().push({ id: nextId++, x: clampedX, y: clampedY, isEdge: false })
  }

  function moveAnchor(id: number, y: number) {
    const anchor = writableAnchors().find((a) => a.id === id)
    if (!anchor || anchor.isEdge) return
    anchor.y = Math.min(Math.max(y, 0), MOTIF_BOARD_HEIGHT)
  }

  function removeAnchor(id: number) {
    const list = writableAnchors()
    const index = list.findIndex((a) => a.id === id)
    if (index === -1 || list[index].isEdge) return
    list.splice(index, 1)
  }

  function select(id: number) {
    requestedId.value = id
  }

  /** Copies another Spine anchor's Motif into the selected one, as an independent copy. */
  function copyFrom(sourceId: number) {
    const id = selectedId.value
    if (id === undefined || sourceId === id) return
    const copy = clone(motifOf(sourceId))
    if (isTopSelected.value) defaultAnchors.splice(0, defaultAnchors.length, ...copy)
    else ownAnchors.set(id, copy)
  }

  /** Drops the selected anchor's own Motif so it follows the Default Motif again. */
  function resetToDefault() {
    if (selectedId.value !== undefined) ownAnchors.delete(selectedId.value)
  }

  return {
    anchors,
    pathD,
    defaultPathD,
    selectedId,
    hasOwnMotif,
    addAnchor,
    moveAnchor,
    removeAnchor,
    select,
    copyFrom,
    resetToDefault,
  }
}

export type UseMotifReturn = ReturnType<typeof useMotif>
