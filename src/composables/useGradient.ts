import { computed, reactive } from 'vue'
import type { ColorStop } from '../types/domain'

let nextId = 1

function hexToRgb(hex: string) {
  const value = parseInt(hex.slice(1), 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((c) => Math.round(Math.min(Math.max(c, 0), 255)).toString(16).padStart(2, '0'))
      .join('')
  )
}

function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t)
}

export function useGradient() {
  const stops = reactive<ColorStop[]>([{ id: nextId++, offset: 0, color: '#000000', removable: false }])

  const sortedStops = computed(() => [...stops].sort((a, b) => a.offset - b.offset))

  function colorAt(t: number): string {
    const sorted = sortedStops.value
    if (sorted.length === 0) return '#000000'
    if (t <= sorted[0].offset) return sorted[0].color
    const last = sorted[sorted.length - 1]
    if (t >= last.offset) return last.color
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]
      const b = sorted[i + 1]
      if (t >= a.offset && t <= b.offset) {
        const span = b.offset - a.offset
        return lerpColor(a.color, b.color, span > 0 ? (t - a.offset) / span : 0)
      }
    }
    return last.color
  }

  function addStop(offset: number) {
    const clamped = Math.min(Math.max(offset, 0), 1)
    stops.push({ id: nextId++, offset: clamped, color: colorAt(clamped), removable: true })
  }

  function moveStop(id: number, offset: number) {
    const stop = stops.find((s) => s.id === id)
    if (!stop) return
    stop.offset = Math.min(Math.max(offset, 0), 1)
  }

  function setColor(id: number, color: string) {
    const stop = stops.find((s) => s.id === id)
    if (stop) stop.color = color
  }

  function removeStop(id: number) {
    const index = stops.findIndex((s) => s.id === id)
    if (index === -1 || !stops[index].removable) return
    stops.splice(index, 1)
  }

  return { stops, sortedStops, colorAt, addStop, moveStop, setColor, removeStop }
}

export type UseGradientReturn = ReturnType<typeof useGradient>
