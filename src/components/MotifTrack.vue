<script setup lang="ts">
import { MOTIF_BOARD_HEIGHT } from '../composables/useMotif'
import type { TrackSlot } from '../types/domain'
import AnchorPoint from './AnchorPoint.vue'

defineProps<{
  slots: TrackSlot[]
  selectedId: number | undefined
  ownIds: number[]
}>()

const emit = defineEmits<{
  select: [id: number]
  copy: [id: number]
}>()

const TRACK_WIDTH = 40
const PADDING = 14

function slotY(position: number) {
  return PADDING + position * (MOTIF_BOARD_HEIGHT - PADDING * 2)
}

function onSlotClick(id: number, event: MouseEvent) {
  if (event.altKey) emit('copy', id)
  else emit('select', id)
}
</script>

<template>
  <svg :width="TRACK_WIDTH" :height="MOTIF_BOARD_HEIGHT" class="track">
    <line :x1="TRACK_WIDTH / 2" :y1="0" :x2="TRACK_WIDTH / 2" :y2="MOTIF_BOARD_HEIGHT" class="line" />
    <AnchorPoint
      v-for="slot in slots"
      :key="slot.id"
      :x="TRACK_WIDTH / 2"
      :y="slotY(slot.position)"
      :is-edge="slot.isEdge"
      :draggable="false"
      :selected="slot.id === selectedId"
      :hollow="!ownIds.includes(slot.id)"
      clickable
      @click="onSlotClick(slot.id, $event)"
    />
  </svg>
</template>

<style scoped>
.track {
  flex: none;
}
.line {
  stroke: #bbb;
  stroke-dasharray: 4 4;
}
</style>
