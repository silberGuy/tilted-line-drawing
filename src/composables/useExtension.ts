import type { Point } from '../types/domain'
import { SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT } from './useSpine'

/** Continuations of a Motif line past each end of its baseline, in march order (away from the Motif). */
export interface Extensions {
  start: Point[]
  end: Point[]
}

const STEP = 2
/** An extension can't bend tighter than a circle of this radius. That circle is wider than the
 *  frame is tall, so a capped extension can never close a loop inside the frame. */
const MAX_CURVATURE = 2 / Math.max(SPINE_CANVAS_WIDTH, SPINE_CANVAS_HEIGHT)
/** The bend is measured over this fraction of the line, ending at the edge being extended. */
const CURVATURE_WINDOW = 0.1

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

/**
 * Continues the line beyond its last point as a constant-curvature arc, using the average
 * curvature over the last stretch of the line (the curvature at the very end of a Motif is
 * about zero, so it can't be read from there), capped so it can't curl into a loop. Stops once `isInside` is false for the first
 * time, or after `maxLength`, so a tight curl can't loop forever. Returns nothing when the
 * end itself is already outside.
 */
function extendEnd(points: Point[], maxLength: number, isInside: (p: Point) => boolean): Point[] {
  const count = points.length
  const last = points[count - 1]
  if (count < 3 || !isInside(last)) return []

  const first = Math.max(0, count - 1 - Math.max(2, Math.round((count - 1) * CURVATURE_WINDOW)))
  const heading = (i: number) =>
    Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x)
  const segmentLength = (i: number) =>
    Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y)

  // Turning between the midpoints of the window's first and last segments, over the arc between them.
  let length = -0.5 * (segmentLength(first) + segmentLength(count - 2))
  for (let i = first; i <= count - 2; i++) length += segmentLength(i)
  const turned = wrapAngle(heading(count - 2) - heading(first))
  const curvature = length > 0 ? Math.max(-MAX_CURVATURE, Math.min(MAX_CURVATURE, turned / length)) : 0

  const result: Point[] = []
  let { x, y } = last
  let angle = heading(count - 2)
  for (let travelled = 0; travelled < maxLength; travelled += STEP) {
    const midAngle = angle + (curvature * STEP) / 2
    x += Math.cos(midAngle) * STEP
    y += Math.sin(midAngle) * STEP
    angle += curvature * STEP
    result.push({ x, y })
    if (!isInside({ x, y })) break
  }
  return result
}

export function extendBothEnds(
  points: Point[],
  maxLength: number,
  isInside: (p: Point) => boolean,
): Extensions {
  return {
    start: extendEnd([...points].reverse(), maxLength, isInside),
    end: extendEnd(points, maxLength, isInside),
  }
}
