<script setup lang="ts">
import { ref } from 'vue'
import { useGradient } from '../composables/useGradient'
import GradientStop from './GradientStop.vue'

const BAR_WIDTH = 260
const BAR_HEIGHT = 24

const { stops, sortedStops, colorAt, addStop, moveStop, setColor, removeStop } = useGradient()

const colorInput = ref<HTMLInputElement | null>(null)
const activeStopId = ref<number | null>(null)

function onBackgroundClick(event: MouseEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  addStop((event.clientX - rect.left) / BAR_WIDTH)
}

function openPicker(id: number, color: string) {
  activeStopId.value = id
  const input = colorInput.value
  if (!input) return
  input.value = color
  input.click()
}

function onColorInput(event: Event) {
  if (activeStopId.value == null) return
  setColor(activeStopId.value, (event.target as HTMLInputElement).value)
}

defineExpose({ colorAt })
</script>

<template>
  <div class="gradient-editor">
    <span class="label">Stamp color</span>
    <svg
      :width="BAR_WIDTH"
      :height="BAR_HEIGHT"
      :viewBox="`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`"
      class="bar-svg"
      @click="onBackgroundClick"
    >
      <defs>
        <linearGradient id="stamp-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop v-for="s in sortedStops" :key="s.id" :offset="s.offset" :stop-color="s.color" />
        </linearGradient>
      </defs>
      <rect x="0" y="8" :width="BAR_WIDTH" height="10" rx="3" ry="3" fill="url(#stamp-gradient)" />
      <GradientStop
        v-for="stop in stops"
        :key="stop.id"
        :x="stop.offset * BAR_WIDTH"
        :color="stop.color"
        :removable="stop.removable"
        @move="(x) => moveStop(stop.id, x / BAR_WIDTH)"
        @remove="() => removeStop(stop.id)"
        @activate="() => openPicker(stop.id, stop.color)"
        @click.stop
      />
    </svg>
    <input ref="colorInput" type="color" class="color-input" @input="onColorInput" />
  </div>
</template>

<style scoped>
.gradient-editor {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #444;
}
.bar-svg {
  touch-action: none;
}
.color-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
