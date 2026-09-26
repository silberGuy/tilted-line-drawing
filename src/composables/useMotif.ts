import { computed, reactive, ref, watch } from 'vue'
import type { AnchorPoint, TrackSlot } from '../types/domain'
import { sampleSpline, toPathD } from './useSpline'
import { MOTIF_BOARD_WIDTH, MOTIF_BOARD_HEIGHT, MOTIF_BASELINE_Y } from './motifBoard'
import { heightAtX, heightsAt, sampleMotifHeights, smoothstep, type EasingFunction } from './useBlend'

export { MOTIF_BOARD_WIDTH, MOTIF_BOARD_HEIGHT, MOTIF_BASELINE_Y }

let nextId = 1

function toPathOf(anchors: AnchorPoint[]): string {
  return toPathD(sampleSpline([...anchors].sort((a, b) => a.x - b.x)))
}

/** Copies keep their anchor ids, so a drag in progress survives the copy-on-first-edit swap. */
function clone(anchors: AnchorPoint[]): AnchorPoint[] {
  return anchors.map((a) => ({ ...a }))
}

interface Stop {
  fraction: number
  anchors: AnchorPoint[]
}

/**
 * A Spine anchor either has an own Motif (the top anchor always does; the others once they've
 * been edited or copied into) or inherits one: the blend of the nearest own Motifs before and
 * after it, or the top Motif's copy when none comes after. The selected Spine anchor is the one
 * whose Motif the editor shows and edits.
 */
export function useMotif(
  spineSlots: () => TrackSlot[],
  ease: () => EasingFunction = () => smoothstep,
) {
  const topAnchors = reactive<AnchorPoint[]>([
    { id: nextId++, x: 0, y: MOTIF_BASELINE_Y, isEdge: true },
    { id: nextId++, x: MOTIF_BOARD_WIDTH, y: MOTIF_BASELINE_Y, isEdge: true },
  ])
  const ownAnchors = reactive(new Map<number, AnchorPoint[]>())
  const requestedId = ref<number | null>(null)

  const slotIds = computed(() => spineSlots().map((slot) => slot.id))
  const topId = computed(() => slotIds.value[0])
  // Falls back to the top anchor when nothing is picked yet or the picked anchor was deleted.
  const selectedId = computed(() => {
    const ids = slotIds.value
    const requested = requestedId.value
    return requested !== null && ids.includes(requested) ? requested : ids[0]
  })
  const isTopSelected = computed(() => selectedId.value === topId.value)

  watch(slotIds, (ids) => {
    for (const id of [...ownAnchors.keys()]) {
      if (!ids.includes(id)) ownAnchors.delete(id)
    }
  })

  /** The own Motifs along the Spine. Past the last one, Stamps blend toward the top Motif,
   *  finishing at the end of the Spine - so a closing stop is added when needed. */
  const stops = computed<Stop[]>(() => {
    const slots = spineSlots()
    if (slots.length === 0) return []
    const result: Stop[] = []
    slots.forEach((slot, i) => {
      const own = i === 0 ? topAnchors : ownAnchors.get(slot.id)
      if (own) result.push({ fraction: slot.position, anchors: own })
    })
    if (result[result.length - 1].fraction < 1) result.push({ fraction: 1, anchors: topAnchors })
    return result
  })

  /** What the render blends Stamps between: each stop's position and resampled height table. */
  const blendStops = computed(() => {
    const cache = new Map<AnchorPoint[], number[]>()
    const tables = stops.value.map((stop) => {
      let table = cache.get(stop.anchors)
      if (!table) {
        table = sampleMotifHeights(stop.anchors)
        cache.set(stop.anchors, table)
      }
      return table
    })
    return { fractions: stops.value.map((stop) => stop.fraction), tables }
  })

  /** An inherited Motif as editable anchors: one at every x where either surrounding own Motif
   *  has one, at the height of the blend there. Ids are negative so they can't clash with
   *  anchors the user adds, and stay the same when the blend becomes an own Motif. */
  function inheritedAnchors(id: number): AnchorPoint[] {
    const slot = spineSlots().find((s) => s.id === id)
    const { fractions, tables } = blendStops.value
    if (!slot || tables.length < 2) return topAnchors

    let i = 0
    while (i < tables.length - 2 && fractions[i + 1] < slot.position) i++
    const blended = heightsAt(slot.position, fractions, tables, ease())
    const xs = [...stops.value[i].anchors, ...stops.value[i + 1].anchors]
      .map((a) => a.x)
      .sort((a, b) => a - b)
      .filter((x, k, all) => k === 0 || x - all[k - 1] > 1e-6)
    return xs.map((x, k) => ({
      id: -(k + 1),
      x,
      y: heightAtX(blended, x),
      isEdge: x <= 0 || x >= MOTIF_BOARD_WIDTH,
    }))
  }

  function motifOf(id: number | undefined): AnchorPoint[] {
    if (id === undefined || id === topId.value) return topAnchors
    return ownAnchors.get(id) ?? inheritedAnchors(id)
  }

  function hasOwnMotif(id: number): boolean {
    return id === topId.value || ownAnchors.has(id)
  }

  /** Only anchors with an Motif they earned by editing can go back to inheriting. */
  function canReset(id: number): boolean {
    return id !== topId.value && ownAnchors.has(id)
  }

  const anchors = computed(() => motifOf(selectedId.value))
  const pathD = computed(() => toPathOf(anchors.value))

  /** The list edits go to: the top Motif for the top anchor, otherwise the selected anchor's
   *  own Motif, created from its inherited Motif on first edit. */
  function writableAnchors(): AnchorPoint[] {
    const id = selectedId.value
    if (isTopSelected.value || id === undefined) return topAnchors
    if (!ownAnchors.has(id)) ownAnchors.set(id, clone(inheritedAnchors(id)))
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

  /** Copies another Spine anchor's Motif into the selected one, as an independent own Motif. */
  function copyFrom(sourceId: number) {
    const id = selectedId.value
    if (id === undefined || sourceId === id) return
    const copy = clone(motifOf(sourceId))
    if (isTopSelected.value) topAnchors.splice(0, topAnchors.length, ...copy)
    else ownAnchors.set(id, copy)
  }

  /** Drops the selected anchor's own Motif so it inherits from its neighbors again. */
  function resetToInherited() {
    const id = selectedId.value
    if (id !== undefined && canReset(id)) ownAnchors.delete(id)
  }

  return {
    anchors,
    pathD,
    blendStops,
    selectedId,
    hasOwnMotif,
    canReset,
    addAnchor,
    moveAnchor,
    removeAnchor,
    select,
    copyFrom,
    resetToInherited,
  }
}

export type UseMotifReturn = ReturnType<typeof useMotif>
