# Prompt Template: Enemy Concepts And Grok Imagine Animation

Use this when creating enemy assets.

## Concept Prompt

```text
Generate a lineup of enemy concepts for [GAME_NAME], matching the style of
[VISUAL_TARGET].

The enemies should suit a [THEME] 2D platformer and be readable at gameplay
scale. Explore a mix of:
- static hazards
- patrolling melee enemies
- ranged enemies
- small support enemies
- one larger signature enemy

For each concept, keep a clean silhouette and avoid modern sci-fi elements.
Use materials from the world: [MATERIALS]. Do not include player characters.
```

## Anchor Prompt

```text
Create a game-ready side-profile W-facing anchor for [ENEMY_NAME].

Requirements:
- 2D pixel-art game sprite, readable at runtime scale.
- Neutral pose.
- Feet/base grounded.
- Stable silhouette.
- Flat [CHROMA_COLOR] background.
- No projectile, smoke, scenery, text, shadow, or extra effect baked in.
- Size should be roughly [RELATIVE_SIZE] compared with the hero.

Pixel snap the anchor, then upscale it for animation input.
```

## Grok Imagine I2V Prompt

```text
Animate the provided W-facing side-profile enemy into a [DURATION] second
[ACTION] animation.

Preserve the exact identity, palette, proportions, scale, silhouette, and
equipment from the input image. Keep the camera locked. Keep the feet/base
anchored unless the action explicitly requires a hop or fall.

Use a flat [CHROMA_COLOR] background. Do not add scenery, text, shadows,
projectiles, costume changes, new weapons, or extra characters.

The motion should be game-readable, loopable if [ACTION] is idle/walk/run,
and short enough for spritesheet extraction.
```

## Processing Rule

For video-derived frames, preserve the full video canvas. Do not re-crop and re-fit every frame independently, or the spritesheet will bounce, grow, shrink, and slide.

## Lesson From Robin Chute

Grok Imagine worked best with 1-2 second clips and strict identity-preservation prompts. Effects like projectiles and steam bursts were kept as separate assets, not baked into the enemy sheet.
