# Prompt Template: Gameplay Atlas Generation

Use this when you need platforms, props, pickups, and decorative gameplay objects.

## Prompt

```text
Now focus on the actual gameplay layer where the player runs, jumps, and
collects items.

Based on [VISUAL_TARGET], generate chroma-backed pixel-art atlases for:

1. Platforming elements:
   - ground segments
   - ledges
   - small platforms
   - platform ends / corners
   - vertical supports or underside details

2. Props and pickups:
   - background-safe props that add depth but do not imply collision
   - collectible [PICKUP_NAME] items
   - non-character set dressing such as lanterns, crates, pipes, huts, signs

Do not include characters.

Do not force every item into a fixed [CHARACTER_FRAME_SIZE] cell. The character
frame size is only a scale reference. Platforms, props, and large objects should
use variable frame sizes.

Use a flat [CHROMA_COLOR] background for removal. Leave padding between items.
After generation, create JSON metadata identifying each item rectangle, name,
role, suggested anchor, and suggested collision behavior.
```

## Output Contract

```text
For each atlas, produce:
- PNG source with chroma background.
- Transparent runtime PNG.
- JSON frame metadata keyed by descriptive slugs.
- Notes explaining which frames are platforms, props, pickups, or decorations.
```

## Lesson From Robin Chute

The 256x256 character frame was a useful size reference, but it was a mistake to make all atlas objects 256x256. Large props need large frames; platform pieces need collision-aware bounds.
