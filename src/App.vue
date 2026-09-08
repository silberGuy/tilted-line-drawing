<script setup lang="ts">
import { computed, ref } from 'vue'
import MotifEditor from './components/MotifEditor.vue'
import SpineEditor from './components/SpineEditor.vue'
import RenderCanvas from './components/RenderCanvas.vue'
import GradientEditor from './components/GradientEditor.vue'
import { useStamps } from './composables/useStamps'
import { MOTIF_BOARD_WIDTH, MOTIF_BASELINE_Y } from './composables/useMotif'
import { DEFAULT_STAMP_SPACING } from './composables/useSpine'

const motifEditorRef = ref<InstanceType<typeof MotifEditor> | null>(null)
const spineEditorRef = ref<InstanceType<typeof SpineEditor> | null>(null)
const gradientEditorRef = ref<InstanceType<typeof GradientEditor> | null>(null)

const stampSpacing = ref(DEFAULT_STAMP_SPACING)
const stampWidth = ref(0.5)
const backgroundColor = ref('#ffffff')

const { stamps } = useStamps(
  () => spineEditorRef.value?.stampSamples ?? [],
  () => ({ x: MOTIF_BOARD_WIDTH / 2, y: MOTIF_BASELINE_Y }),
  (t) => gradientEditorRef.value?.colorAt(t) ?? '#000000',
)

const motifPathD = computed(() => motifEditorRef.value?.pathD ?? '')
</script>

<template>
  <main class="app">
    <div class="motif-area">
      <MotifEditor ref="motifEditorRef" />
    </div>
    <div class="spine-area">
      <SpineEditor ref="spineEditorRef" :stamp-spacing="stampSpacing" />
    </div>
    <div class="render-area">
      <div class="controls">
        <label>
          Stamp density
          <input v-model.number="stampSpacing" type="range" min="1" max="40" step="1" />
          <span>{{ stampSpacing }}px apart</span>
        </label>
        <label>
          Stamp width
          <input v-model.number="stampWidth" type="range" min="0.1" max="5" step="0.1" />
          <span>{{ stampWidth }}px</span>
        </label>
        <GradientEditor ref="gradientEditorRef" />
        <label>
          Background
          <input v-model="backgroundColor" type="color" />
        </label>
      </div>
      <RenderCanvas
        :motif-path-d="motifPathD"
        :stamps="stamps"
        :stroke-width="stampWidth"
        :background-color="backgroundColor"
      />
    </div>
  </main>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 560px 1fr 1fr;
  grid-template-rows: auto 1fr 1fr;
  grid-template-areas:
    'motif render render'
    'spine render render'
    'spine render render';
  gap: 1.5rem;
  padding: 1.5rem;
  height: 100vh;
  box-sizing: border-box;
  font-family: system-ui, sans-serif;
}
.motif-area {
  grid-area: motif;
}
.spine-area {
  grid-area: spine;
}
.render-area {
  grid-area: render;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.controls {
  display: flex;
  gap: 1.5rem;
}
.controls label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #444;
}
</style>
