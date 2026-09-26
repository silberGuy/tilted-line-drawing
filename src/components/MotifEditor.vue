<script setup lang="ts">
import { computed } from 'vue'
import { useMotif, MOTIF_BOARD_WIDTH, MOTIF_BOARD_HEIGHT, MOTIF_BASELINE_Y } from '../composables/useMotif'
import AnchorPoint from './AnchorPoint.vue'
import MotifTrack, { type TrackSlot } from './MotifTrack.vue'

const props = defineProps<{
  slots: TrackSlot[]
}>()

const {
  anchors,
  pathD,
  motifs,
  selectedId,
  hasOwnMotif,
  addAnchor,
  moveAnchor,
  removeAnchor,
  select,
  copyFrom,
  resetToDefault,
} = useMotif(() => props.slots.map((slot) => slot.id))

const ownIds = computed(() => props.slots.filter((slot) => hasOwnMotif(slot.id)).map((slot) => slot.id))

function onBackgroundClick(event: MouseEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  addAnchor(event.clientX - rect.left, event.clientY - rect.top)
}

defineExpose({ motifs })
</script>

<template>
  <div class="motif-editor">
    <h2>1. Build the Motif</h2>
    <p class="hint">
      Click the board to add a point, drag a point up/down, shift-click to remove it. Click a dot on the
      track to edit that spot's Motif (option-click one to copy its Motif into the selected one).
    </p>
    <button type="button" :disabled="selectedId === undefined || !hasOwnMotif(selectedId)" @click="resetToDefault">
      Reset to default
    </button>
    <div class="editor-row">
    <svg
      :width="MOTIF_BOARD_WIDTH"
      :height="MOTIF_BOARD_HEIGHT"
      :viewBox="`0 0 ${MOTIF_BOARD_WIDTH} ${MOTIF_BOARD_HEIGHT}`"
      class="board"
      @click="onBackgroundClick"
    >
      <line
        :x1="0"
        :y1="MOTIF_BASELINE_Y"
        :x2="MOTIF_BOARD_WIDTH"
        :y2="MOTIF_BASELINE_Y"
        class="baseline"
      />
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
  background: #fafafa;
  border: 1px solid #ddd;
  touch-action: none;
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
