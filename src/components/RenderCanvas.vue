<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from '../composables/useSpine'
import { heightsToPath } from '../composables/useBlend'
import type { Stamp } from '../composables/useStamps'

const props = defineProps<{
  stamps: Stamp[]
  strokeWidth: number
  backgroundColor: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

// The canvas's backing bitmap is rendered at this multiple of the model's
// coordinate space, so both the on-screen view and the downloaded PNG - which
// reads pixels straight off this same canvas - are crisp rather than upscaled.
const RESOLUTION_SCALE = 4

function draw() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  canvas.width = SPINE_CANVAS_WIDTH * RESOLUTION_SCALE
  canvas.height = SPINE_CANVAS_HEIGHT * RESOLUTION_SCALE

  ctx.setTransform(RESOLUTION_SCALE, 0, 0, RESOLUTION_SCALE, 0, 0)
  ctx.fillStyle = props.backgroundColor
  ctx.fillRect(0, 0, SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT)

  ctx.lineWidth = props.strokeWidth

  for (const stamp of props.stamps) {
    const [a, b, c, d, e, f] = stamp.matrix
    ctx.setTransform(
      RESOLUTION_SCALE * a,
      RESOLUTION_SCALE * b,
      RESOLUTION_SCALE * c,
      RESOLUTION_SCALE * d,
      RESOLUTION_SCALE * e,
      RESOLUTION_SCALE * f,
    )
    ctx.strokeStyle = stamp.color
    ctx.stroke(heightsToPath(stamp.heights, stamp.extensions))
  }
}

watchEffect(draw)

async function downloadPng(filename = 'drawing.png') {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (!blob) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }, 'image/png')
}

defineExpose({ downloadPng })
</script>

<template>
  <div class="render-canvas">
    <canvas
      ref="canvasRef"
      class="canvas"
      :style="{ aspectRatio: `${SPINE_CANVAS_WIDTH} / ${SPINE_CANVAS_HEIGHT}` }"
    />
  </div>
</template>

<style scoped>
.render-canvas {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
}
.canvas {
  display: block;
  margin: auto;
  max-width: 100%;
  max-height: 100%;
  border: 1px solid #ddd;
}
</style>
