# Prompt Template: Character Playground

Use this after the Character Gym. The goal is to test how the character feels in a simple playable environment before building full levels.

## Prompt

```text
Create a Character Playground scene backed by a level data structure.

It should load:
- Background layers from the asset index.
- Platform elements using saved collision bounds.
- Character animations and bounds from the character config.
- Optional enemies, props, pickups, and exit objects from a level JSON file.

Gameplay controls:
- Idle, walk, run, jump, attack, hurt, and death.
- The attack key should always complete a full animation cycle even if the
  player presses the button repeatedly.
- The character should still fall to the ground if killed mid-air.
- Include a health value of [HEALTH_COUNT].
- Show a game-over state when health reaches zero.

Debug controls should be contextual to this scene:
- Walk speed.
- Run speed.
- Jump height.
- Character global scale.
- Toggle sprite vs placeholder shape.
- Toggle platform sprites vs placeholder shapes.
- Toggle visual/collision/attack/hurt bounds.
- Save this scene's tuning config independently from other scenes.
```

## Lesson From Robin Chute

The playground became the fastest place to verify the full loop: movement, attack timing, health, enemy contact, pickups, and exit behavior without scrolling through a full level.
