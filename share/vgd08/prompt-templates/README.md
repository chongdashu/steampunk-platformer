# VGD08 Prompt Templates

These are public-ready prompt templates distilled from the Robin Chute build transcript and project notes. They are not raw logs. They are reusable versions of the key user prompts that drove the game from concept to a playable Phaser platformer.

Use them in sequence when building a 2D platformer with AI-generated assets:

1. [Visual target exploration](./01-visual-target-exploration.md)
2. [Parallax background layers](./02-parallax-background-layers.md)
3. [Gameplay atlas generation](./03-gameplay-atlas-generation.md)
4. [Platforming element editor](./04-platforming-element-editor.md)
5. [Character asset registration and gym](./05-character-asset-gym.md)
6. [Character playground](./06-character-playground.md)
7. [Enemy concepts and animation](./07-enemy-concepts-and-animation.md)
8. [Enemy gym and behavior tuning](./08-enemy-gym-and-behavior.md)
9. [Level editor and JSON levels](./09-level-editor-json-levels.md)
10. [HUD and game polish](./10-hud-and-game-polish.md)
11. [Level progression](./11-level-progression.md)

Each template assumes an AI coding agent working inside an existing Phaser project. Replace bracketed values like `[GAME_NAME]`, `[VISUAL_TARGET]`, and `[ASSET_PATH]` with your own project details.

Core rule from the build: art is not an asset yet. It becomes an asset when the game can trust its catalog entry, bounds, anchor, active frames, and saved config.
