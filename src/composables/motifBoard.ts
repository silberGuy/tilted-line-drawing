import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from './useSpine'

// Per the 1:1 scale rule (a Stamp is exactly as long as the Motif's baseline), the
// board is sized so the Motif's length matches the rendered area's diagonal.
export const MOTIF_BOARD_WIDTH = Math.hypot(SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT)
export const MOTIF_BOARD_HEIGHT = 200
export const MOTIF_BASELINE_Y = MOTIF_BOARD_HEIGHT / 2
