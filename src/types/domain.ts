export interface AnchorPoint {
  id: number
  x: number
  y: number
  /** Edge anchors are permanent: they can't be shift-clicked away. */
  isEdge: boolean
}

export interface SampledPoint {
  x: number
  y: number
  /** Unit tangent vector (direction of travel) at this point. */
  tangent: { x: number; y: number }
  /** Unit normal vector (perpendicular to tangent) at this point. */
  normal: { x: number; y: number }
}
