# Prompt Template: Platforming Element Editor

Use this once the gameplay atlas exists. The goal is to correct the mismatch between visible pixels and collision geometry.

## Prompt

```text
Create a Platforming Element Editor scene for [ENGINE_OR_FRAMEWORK].

The editor should load platforming elements from public/assets/index.json and
their saved overrides from public/assets/config/platforming-elements.json.

For each element, show:
- The visible sprite centered on a simple grid.
- A white outline for the source PNG/frame bounds.
- A green outline for collision bounds.
- A label with the asset id.

The DOM debug panel should allow:
- Previous / next element.
- Mark element as included in procedural or level-editor placement.
- Edit collision x, y, width, height.
- Resize bounds from the center when width/height changes.
- Reset the selected element to defaults.
- Save all edited bounds to JSON so the data persists outside localStorage.

Runtime code must use these saved collision bounds, not the raw PNG bounds.
If a platform has decorative moss or underside details, the collision body
should usually be a thin strip aligned to the walkable top surface.
```

## Verification Prompt

```text
Add a test scene with accepted platform elements arranged into a flat floor.
Turn on hitbox overlays and confirm the character stands on the visible top
surface without floating or sinking.
```

## Lesson From Robin Chute

Pretty atlas art is not enough. The game only became playable after each platform had saved collision bounds aligned to the visible walkable top.
