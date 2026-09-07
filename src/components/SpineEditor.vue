<script setup lang="ts">
import { useSpine, SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from '../composables/useSpine'
import AnchorPoint from './AnchorPoint.vue'

const props = defineProps<{
  stampSpacing: number
}>()

const { anchors, pathD, stampSamples, addAnchor, moveAnchor, removeAnchor } = useSpine(
  () => props.stampSpacing,
)

// The editor's own canvas is padded beyond the area that actually appears in the
// final render, so anchors dragged near/past the render's edge stay visible and
// clickable instead of getting clipped at the SVG boundary.
const EDITOR_MARGIN = 60
const EDITOR_WIDTH = SPINE_CANVAS_WIDTH + EDITOR_MARGIN * 2
const EDITOR_HEIGHT = SPINE_CANVAS_HEIGHT + EDITOR_MARGIN * 2

function onBackgroundClick(event: MouseEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  addAnchor(event.clientX - rect.left - EDITOR_MARGIN, event.clientY - rect.top - EDITOR_MARGIN)
}

defineExpose({ stampSamples })
</script>

<template>
  <div class="spine-editor">
    <h2>2. Draw the Spine</h2>
    <p class="hint">Click to add a point, drag any point (including the ends) freely, shift-click to remove it. The dashed rectangle is what actually appears in the render.</p>
    <svg
      :width="EDITOR_WIDTH"
      :height="EDITOR_HEIGHT"
      :viewBox="`${-EDITOR_MARGIN} ${-EDITOR_MARGIN} ${EDITOR_WIDTH} ${EDITOR_HEIGHT}`"
      class="canvas"
      @click="onBackgroundClick"
    >
      <rect
        :x="0"
        :y="0"
        :width="SPINE_CANVAS_WIDTH"
        :height="SPINE_CANVAS_HEIGHT"
        class="active-bounds"
      />
      <path :d="pathD" class="spine-path" />
      <AnchorPoint
        v-for="anchor in anchors"
        :key="anchor.id"
        :x="anchor.x"
        :y="anchor.y"
        :is-edge="anchor.isEdge"
        draggable
        :view-box-offset-x="-EDITOR_MARGIN"
        :view-box-offset-y="-EDITOR_MARGIN"
        @move="(x, y) => moveAnchor(anchor.id, x, y)"
        @remove="() => removeAnchor(anchor.id)"
        @click.stop
      />
    </svg>
  </div>
</template>

<style scoped>
.canvas {
  background: #f0f0f0;
  border: 1px solid #ddd;
  touch-action: none;
}
.active-bounds {
  fill: #fafafa;
  stroke: #999;
  stroke-dasharray: 4 4;
}
.spine-path {
  fill: none;
  stroke: #bbb;
  stroke-dasharray: 4 4;
}
.hint {
  color: #666;
  font-size: 0.85rem;
}
</style>
