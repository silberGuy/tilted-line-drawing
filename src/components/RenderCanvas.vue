<script setup lang="ts">
import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from '../composables/useSpine'
import type { Stamp } from '../composables/useStamps'
import MotifStamp from './MotifStamp.vue'

defineProps<{
  motifPathD: string
  stamps: Stamp[]
  strokeWidth: number
}>()
</script>

<template>
  <div class="render-canvas">
    <svg :viewBox="`0 0 ${SPINE_CANVAS_WIDTH} ${SPINE_CANVAS_HEIGHT}`" class="canvas">
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
  background: #fff;
  border: 1px solid #ddd;
}
</style>
