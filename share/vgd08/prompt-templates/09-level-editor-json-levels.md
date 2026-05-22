# Prompt Template: Level Editor And JSON Levels

Use this once character, platforming elements, props, pickups, enemies, and exits exist.

## Prompt

```text
Create a Level Editor scene that loads and saves levels as JSON files under
[LEVELS_DIR].

The level data structure should support:
- metadata: id, name, width, background set
- platforms: asset id, x, y, optional scale, collision from config
- props: frame id, x, y, depth
- pickups: pickup type, x, y
- enemies: enemy id, x, y, facing, per-enemy tuning overrides
- exits: exit id, x, y, collision bounds, target animation

Editor features:
- Dropdown to load existing levels.
- Create new level.
- Save over current level.
- Save as new level.
- Add platform / prop / pickup / enemy / exit.
- Click to select an object.
- Canvas gizmos like Unity/Unreal/Blender: X/Y axes drawn on the selected
  object, with axis-constrained drag on hover.
- DOM panel for absolute x/y, object type settings, and delete.
- Asset labels and collision overlays.
- Horizontal scrolling for levels wider than one viewport.
```

## Runtime Prompt

```text
Update the main game and playground to load from the same level JSON format.
When the player reaches an exit, align the player to the exit center, play the
exit animation, move slightly into the exit, fade out, show cinematic black
bars, then display a "Level Cleared!" overlay with "Press any key to continue."
```

## Lesson From Robin Chute

Hardcoded scenes slowed iteration. JSON levels made it possible to edit the playground and production levels with the same tools.
