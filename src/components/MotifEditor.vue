<script setup lang="ts">
import { computed } from 'vue'
import type { TrackSlot } from '../types/domain'
import { heightsToPoints, sampleMotifHeights, smoothstep, type EasingFunction } from '../composables/useBlend'
import { extendBothEnds } from '../composables/useExtension'
import { useMotif, MOTIF_BOARD_WIDTH, MOTIF_BOARD_HEIGHT, MOTIF_BASELINE_Y } from '../composables/useMotif'
import AnchorPoint from './AnchorPoint.vue'
import MotifTrack from './MotifTrack.vue'

const props = withDefaults(
  defineProps<{
    slots: TrackSlot[]
    ease?: EasingFunction
  }>(),
  { ease: smoothstep },
)

const {
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
} = useMotif(
  () => props.slots,
  () => props.ease,
)

const ownIds = computed(() => props.slots.filter((slot) => hasOwnMotif(slot.id)).map((slot) => slot.id))

// Room on each side of the board for the dashed preview of the Motif's Extensions.
const PREVIEW_MARGIN = 60
const EDITOR_WIDTH = MOTIF_BOARD_WIDTH + PREVIEW_MARGIN * 2

const previewPathDs = computed(() => {
  const points = heightsToPoints(sampleMotifHeights(anchors.value))
  const { start, end } = extendBothEnds(points, PREVIEW_MARGIN, () => true)
  const toD = (edge: { x: number; y: number }, extension: { x: number; y: number }[]) =>
    [edge, ...extension].map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return [toD(points[0], start), toD(points[points.length - 1], end)]
})

function onBackgroundClick(event: MouseEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  addAnchor(event.clientX - rect.left - PREVIEW_MARGIN, event.clientY - rect.top)
}

defineExpose({ blendStops })
</script>

<template>
  <div class="motif-editor">
    <h2>1. Build the Motif</h2>
    <p class="hint">
      Click the board to add a point, drag a point up/down, shift-click to remove it. Click a dot on the
      track to edit that spot's Motif (option-click one to copy its Motif into the selected one).
    </p>
    <button type="button" :disabled="selectedId === undefined || !canReset(selectedId)" @click="resetToInherited">
      Reset (inherit from neighbors)
    </button>
    <div class="editor-row">
      <svg
        :width="EDITOR_WIDTH"
        :height="MOTIF_BOARD_HEIGHT"
        :viewBox="`${-PREVIEW_MARGIN} 0 ${EDITOR_WIDTH} ${MOTIF_BOARD_HEIGHT}`"
        class="board"
        @click="onBackgroundClick"
      >
        <rect :x="0" :y="0" :width="MOTIF_BOARD_WIDTH" :height="MOTIF_BOARD_HEIGHT" class="board-area" />
        <line
          :x1="-PREVIEW_MARGIN"
          :y1="MOTIF_BASELINE_Y"
          :x2="MOTIF_BOARD_WIDTH + PREVIEW_MARGIN"
          :y2="MOTIF_BASELINE_Y"
          class="baseline"
        />
        <path v-for="d in previewPathDs" :key="d" :d="d" class="extension-path" />
        <path :d="pathD" class="motif-path" />
        <AnchorPoint
          v-for="anchor in anchors"
          :key="anchor.id"
          :x="anchor.x"
          :y="anchor.y"
          :is-edge="anchor.isEdge"
          :draggable="!anchor.isEdge"
          lock-x
          @move="(_, y) => moveAnchor(anchor.id, y)"
          @remove="() => removeAnchor(anchor.id)"
          @click.stop
        />
      </svg>
      <MotifTrack
        :slots="slots"
        :selected-id="selectedId"
        :own-ids="ownIds"
        @select="select"
        @copy="copyFrom"
      />
    </div>
  </div>
</template>

<style scoped>
.editor-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 0.5rem;
}
.board {
  background: #f0f0f0;
  border: 1px solid #ddd;
  touch-action: none;
}
.board-area {
  fill: #fafafa;
  stroke: #ddd;
}
.extension-path {
  fill: none;
  stroke: #111;
  stroke-width: 2;
  stroke-dasharray: 3 4;
  opacity: 0.4;
}
.baseline {
  stroke: #ccc;
  stroke-dasharray: 4 4;
}
.motif-path {
  fill: none;
  stroke: #111;
  stroke-width: 2;
}
.hint {
  color: #666;
  font-size: 0.85rem;
}
</style>
