# Context: tilted-line-drawing

## Glossary

- **Motif** — the shape constructed by the user in Phase 1 on a fixed-width horizontal board with a straight center line (the baseline). The user builds the Motif by adding **anchor points** onto the baseline and dragging each one up or down to bend the line; shift-clicking an anchor point deletes it. The line is a smooth curve (spline) running through all anchor points, not a straight-segment polyline. An anchor's horizontal position is fixed at creation (wherever it was placed) — dragging only ever changes its height, never its horizontal position. The board always has two **edge anchors**, one at each end, which cannot be removed (shift-click has no effect on them); in v1 they are also disabled for dragging, so they stay fixed at baseline height (0) — the Motif always starts and ends level. (Architecturally they are real anchors, not a special case, so they can be made draggable later without changing the model.) Not freehand-drawn, not parametric, not assembled from a fixed primitive palette.
- **Spine** — the curve constructed by the user in Phase 2 across the full page/canvas, via freely-placed 2D anchor points (auto-smoothed into a curve), starting from a straight line between two edge anchors.
- **Stamp** — one placed copy of the Motif along the Spine, rotated so it stays perpendicular to the Spine's local direction at that point.

## Orientation rule

At each Stamp point, the Motif board is rotated rigidly as a whole so its **horizontal baseline axis** (edge-anchor to edge-anchor) aligns with the Spine's *normal* direction — the baseline crosses the Spine like a tick mark. The anchors' up/down bump axis aligns with the Spine's *tangent* (direction of travel). The rule is purely geometric — it never analyzes what was actually drawn inside the Motif, only its board axes.

## Overlap and flipping

Stamps are rendered independently in Spine order (later Stamps drawn on top); overlap on tight curves is allowed and not corrected. The perpendicular direction always uses a fixed side (e.g. left-hand normal) relative to travel direction — no correction is applied to prevent visible flips at inflection points; a flip there is an accepted visual quirk.

## Scale rule

A Stamp is rendered at the same physical size the Motif was drawn at on its board — no separate scale/size control exists in v1.

## Spacing rule

Stamps are placed at a fixed arc-length interval along the Spine (a tunable setting, independent of the Motif's own size) — not tiled edge-to-edge and not a fixed count.

## Workflow

Motif and Spine are each editable after being drawn: redrawing the Motif live-updates all existing Stamps; redrawing the Spine recomputes Stamp placement. The Spine is always an open path (has a start and an end) — closed-loop Spines are not supported.

## Scope

A drawing consists of exactly one Motif and one Spine (v1). No multiple layered Motif+Spine pairs on the same canvas.

## Phases

1. **Motif construction** — user builds the Motif on its board by adding, dragging, and removing anchor points (see Glossary).
2. **Spine drawing** — starts as a straight line with two edge anchors already present. The user can add further anchor points anywhere on the canvas (full 2D freedom, unlike the Motif's baseline-constrained anchors), drag any anchor freely to reposition it (including the two edge anchors — unlike the Motif's edge anchors, the Spine's edge anchors are draggable), and shift-click to remove any anchor except the two edge anchors (which are permanent, though movable). The curve is auto-smoothed through all anchors (no manual Bezier-handle dragging, at least for v1). The Motif is repeated as Stamps along the Spine, each oriented perpendicular to the Spine's tangent at its position.
