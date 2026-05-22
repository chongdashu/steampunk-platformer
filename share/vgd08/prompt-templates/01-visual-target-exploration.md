# Prompt Template: Visual Target Exploration

Use this first. The goal is to create several gameplay mockups, then select one as the art direction anchor for the rest of the project.

## Prompt

```text
We are designing a new 2D side-scrolling platformer called [GAME_NAME].

Brainstorm 4 visually distinct concepts for the main character and world.
The character should be [CHARACTER_TRAITS], with a memorable twist on
[INSPIRATION_OR_ARCHETYPE]. The game should feel [TONE_WORDS].

Then use image generation to create 4 gameplay mockups in a pixel-art style.

Each mockup should:
- Look like an actual side-scrolling platformer screenshot, not poster art.
- Use a clear 16:9 composition.
- Show the character at gameplay scale, not as a large illustration.
- Include simple platforms, pickups, obstacles, and one enemy.
- Include enough background depth to suggest parallax layers.
- Prioritize readability over spectacle.

Avoid UI text, logos, readable words, photorealism, 3D render style, blur,
smooth gradients, and cluttered backgrounds.

After generation, store the prompts and outputs in a timestamped run folder.
Write a short note explaining which mockup is strongest and why.
```

## Knobs To Adjust

- `[CHARACTER_TRAITS]`: cute-ish, human-like, rogue, scavenger, knight, courier, etc.
- `[INSPIRATION_OR_ARCHETYPE]`: Robin Hood, pirate, inventor, chef, ghost hunter.
- `[TONE_WORDS]`: whimsical, rebellious, forest-steampunk, cozy danger, scrapyard fantasy.

## Lesson From Robin Chute

The chosen target was not the busiest image. It was the one with the clearest gameplay read: forest, steampunk trash, parallax depth, simple platforms, pickups, enemies, and a readable hero scale.
