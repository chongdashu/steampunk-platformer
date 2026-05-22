# Prompt Template: Parallax Background Layers

Use this after choosing a visual target. The goal is to create background layers that support gameplay instead of competing with it.

## Prompt

```text
Using [VISUAL_TARGET] as the art direction reference, generate parallax
background layers for a 2D side-scrolling platformer.

Create [LAYER_COUNT] horizontally tileable layers:
- Sky / far atmosphere layer
- Far city or landscape silhouette layer
- Mid-distance forest / machinery / architecture layer

The layers should be designed for [GAME_RESOLUTION], but large enough to
scroll horizontally without obvious repetition. Use chroma-key backing where
transparency is needed, because the image generator may not support alpha.

Important constraints:
- Background layers must not look like playable platforms.
- The nearest background layer must be softer, lower-contrast, or less crisp
  than the actual gameplay layer.
- Do not put detailed props, collectibles, or walkable-looking platforms in
  background layers.
- Leave visual space for the main gameplay floor and character silhouettes.
- Store the exact prompts, raw output sizes, and post-processing steps in the
  run folder.

After generation, process chroma to alpha, create runtime-ready PNGs, and
register them in public/assets/index.json under a versioned backgrounds entry.
```

## Follow-Up Prompt

```text
Create a Background Test scene that loads these layers from the asset index,
scrolls them infinitely at different parallax speeds, and provides contextual
debug controls for per-layer visibility, version selection, Y offset, scroll
factor, reset, and save-to-config persistence.
```

## Lesson From Robin Chute

The first near layer was too clear and looked like the game itself. The fix was to make the playable layer visually dominant and keep background layers atmospheric.
