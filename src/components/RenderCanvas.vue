<script setup lang="ts">
import { ref } from 'vue'
import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from '../composables/useSpine'
import type { Stamp } from '../composables/useStamps'
import MotifStamp from './MotifStamp.vue'

defineProps<{
  motifPathD: string
  stamps: Stamp[]
  strokeWidth: number
  backgroundColor: string
}>()

const svgRef = ref<SVGSVGElement | null>(null)

const EXPORT_SCALE = 3

async function downloadPng(filename = 'drawing.png') {
  const svg = svgRef.value
  if (!svg) return

  const svgString = new XMLSerializer().serializeToString(svg)
  const svgUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }))

  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = reject
    image.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = SPINE_CANVAS_WIDTH * EXPORT_SCALE
  canvas.height = SPINE_CANVAS_HEIGHT * EXPORT_SCALE
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(svgUrl)

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
    <svg
      ref="svgRef"
      :width="SPINE_CANVAS_WIDTH"
      :height="SPINE_CANVAS_HEIGHT"
      :viewBox="`0 0 ${SPINE_CANVAS_WIDTH} ${SPINE_CANVAS_HEIGHT}`"
      class="canvas"
    >
      <rect :width="SPINE_CANVAS_WIDTH" :height="SPINE_CANVAS_HEIGHT" :fill="backgroundColor" />
      <MotifStamp
        v-for="(stamp, i) in stamps"
        :key="i"
        :d="motifPathD"
        :transform="stamp.transform"
        :stroke-width="strokeWidth"
        :color="stamp.color"
      />
    </svg>
  </div>
</template>

<style scoped>
.render-canvas {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}
.canvas {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
}
</style>
