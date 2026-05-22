# Prompt Template: HUD And Game Polish

Use this when the core loop works and the game needs a coherent UI/audio layer.

## HUD Image Prompt

```text
Create a single clean pixel-art HUD asset sheet for [GAME_NAME].

Use [CHARACTER_REFERENCE] as the identity and palette reference for the player.
The sheet should be on a perfectly flat [BACKGROUND_CHROMA] background.

Include:
- A portrait medallion of the player facing right.
- A long horizontal health bar frame made from [WORLD_MATERIALS].
- An empty fill slot inside the bar using a perfectly flat [FILL_CHROMA]
  rectangle with crisp edges, no texture, no shine, and no shadow.
- Optional score/pickup counter frame matching the same style.

Constraints:
- No text, numbers, watermark, extra icons, or full-body character.
- Do not use [BACKGROUND_CHROMA] inside the asset.
- Use [FILL_CHROMA] only inside the mask/fill rectangle.
- Runtime code will remove chroma and draw the live health fill underneath.
```

## Runtime Prompt

```text
Integrate the HUD into both the playground and main game.

Health behavior:
- Green fill at high health.
- Amber fill at mid health.
- Red fill and blink when low.
- Flash when damaged.
- Refill one health point at the start of each new level.
- Show game over when health reaches zero.

Pickup polish:
- Track collected [PICKUP_NAME] count per level.
- Tween collected pickup sprites toward the UI counter.
- Keep the tween path inside the camera viewport.
- Show "Scrap Collected: X/Y" in level-select cards and clear screens.
```

## Audio Prompt

```text
Generate music and sound effects for a [THEME] 2D pixel-art platformer.

Cover:
- menu confirm / cancel
- jump
- attack
- player hurt
- enemy hurt / death
- projectile fire / impact
- pickup collect
- level clear
- game over
- gentle loopable background music

Register all audio in public/assets/index.json and wire volume controls into
settings/debug. Keep generated source notes and prompts in a run folder.
```

## Lesson From Robin Chute

The HUD looked best when generated as an ornate frame, but the fill area stayed code-driven. The pickup tween needed camera-space targets, not stale world-space coordinates.
