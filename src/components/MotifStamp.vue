<script setup lang="ts">
defineProps<{
  d: string
  transform: string
  strokeWidth: number
}>()
</script>

<template>
  <path :d="d" :transform="transform" :stroke-width="strokeWidth" class="stamp" />
</template>

<style scoped>
.stamp {
  fill: none;
  stroke: #111;
}
</style>
