# Prompt Template: Enemy Gym And Behavior Tuning

Use this after enemy spritesheets are in the asset catalog.

## Enemy Gym Prompt

```text
Create an Enemy Gym scene similar to the Character Gym.

It should load enemies from public/assets/index.json and expose a dropdown for
[ENEMY_LIST]. Each enemy can have a different set of animations.

For each selected enemy and animation, show:
- White source frame bounds.
- Blue visual footprint.
- Green collision bounds.
- Orange hurt box, where the player can hit this enemy.
- Red attack box, where this enemy can hit the player.
- Current frame number and playback fps.

Add per-frame active toggles for hurt/attack boxes, so hits only register on
the correct frames. Save everything to public/assets/config/enemy-bounds.json,
routed by enemy id and animation id.

Width and height edits must resize from the center. Add zoom support via mouse
wheel / trackpad, plus asset name labels above sprites.
```

## Behavior Prompt

```text
Implement enemy behavior in the playground and main level.

For static ranged enemies:
- Detect the player only inside a configurable range.
- Use a configurable fire cooldown.
- Spawn projectile and smoke as separate effect assets.
- Respect attack active frames.

For patrolling melee enemies:
- Patrol between platform-safe bounds.
- Only chase the player when the enemy is facing the player and the player is
  on the same platform/level.
- If the player jumps over the enemy but remains on the same platform, keep
  chasing after turning.
- Do not chase across platform height changes that would trap the enemy.
- On hit, turn toward the hit source, play hurt, apply knockback away from the
  hit direction, and wait through a cooldown before reacquiring the player.
```

## Lesson From Robin Chute

Enemy AI needed platform-awareness. A scavenger that sees the player from a different level will run into edges and get stuck unless detection respects platform height.
