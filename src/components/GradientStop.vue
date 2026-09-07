<script setup lang="ts">
const props = defineProps<{
  x: number
  color: string
  removable: boolean
}>()

const emit = defineEmits<{
  move: [x: number]
  remove: []
  activate: []
}>()

const SIZE = 16

let dragged = false

function toLocalX(event: PointerEvent) {
  const svg = (event.currentTarget as SVGElement).ownerSVGElement
  const rect = svg!.getBoundingClientRect()
  return event.clientX - rect.left
}

function onPointerDown(event: PointerEvent) {
  if (event.shiftKey) {
    if (props.removable) emit('remove')
    return
  }
  dragged = false
  ;(event.currentTarget as SVGElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (event.buttons === 0) return
  dragged = true
  emit('move', toLocalX(event))
}

function onPointerUp() {
  if (!dragged) emit('activate')
}
</script>

<template>
  <rect
    :x="x - SIZE / 2"
    y="2"
    :width="SIZE"
    :height="SIZE"
    rx="3"
    ry="3"
    :fill="color"
    class="stop-handle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  />
</template>

<style scoped>
.stop-handle {
  stroke: #333;
  stroke-width: 1;
  cursor: grab;
}
</style>
