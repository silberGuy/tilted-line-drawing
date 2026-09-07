<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    x: number
    y: number
    isEdge: boolean
    draggable: boolean
    lockX?: boolean
    lockY?: boolean
    /** Offset added to convert a screen click into local SVG coordinates, for SVGs whose viewBox doesn't start at (0,0). */
    viewBoxOffsetX?: number
    viewBoxOffsetY?: number
  }>(),
  { viewBoxOffsetX: 0, viewBoxOffsetY: 0 },
)

const emit = defineEmits<{
  move: [x: number, y: number]
  remove: []
}>()

function toLocalPoint(event: PointerEvent) {
  const svg = (event.currentTarget as SVGElement).ownerSVGElement
  const rect = svg!.getBoundingClientRect()
  return {
    x: event.clientX - rect.left + props.viewBoxOffsetX,
    y: event.clientY - rect.top + props.viewBoxOffsetY,
  }
}

function onPointerDown(event: PointerEvent) {
  if (event.shiftKey) {
    if (!props.isEdge) emit('remove')
    return
  }
  if (!props.draggable) return
  ;(event.currentTarget as SVGElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!props.draggable || event.buttons === 0) return
  const point = toLocalPoint(event)
  emit('move', props.lockX ? props.x : point.x, props.lockY ? props.y : point.y)
}
</script>

<template>
  <circle
    :cx="x"
    :cy="y"
    r="6"
    :class="['anchor', { edge: isEdge, disabled: !draggable }]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
  />
</template>

<style scoped>
.anchor {
  fill: #3b82f6;
  stroke: white;
  stroke-width: 1.5;
  cursor: grab;
}
.anchor.edge {
  fill: #f97316;
}
.anchor.disabled {
  cursor: default;
}
</style>
