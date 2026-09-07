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
  /** Fraction (0-1) of the total arc length travelled to reach this point. */
  t: number
}

export interface ColorStop {
  id: number
  /** Position along the gradient, 0-1. */
  offset: number
  color: string
  /** The first stop is permanent: it can't be shift-clicked away. */
  removable: boolean
}
