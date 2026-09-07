<script setup lang="ts">
defineProps<{
  d: string
  transform: string
  strokeWidth: number
  color: string
}>()
</script>

<template>
  <path :d="d" :transform="transform" :stroke-width="strokeWidth" :stroke="color" class="stamp" />
</template>

<style scoped>
.stamp {
  fill: none;
}
</style>
