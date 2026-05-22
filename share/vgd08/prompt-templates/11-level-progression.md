# Prompt Template: Level Progression

Use this when a single playable level is working and you want a game loop.

## Prompt

```text
Add level progression to [GAME_NAME].

Create [LEVEL_COUNT] authored JSON levels with escalating challenge:

1. First level: no enemies, only pickups and exit.
2. Second level: one ranged enemy; place one pickup in its threat range.
3. Third level: one patrol enemy and one ranged enemy.
4. Fourth level: two ranged enemies and two patrol enemies.
5. Fifth level: three ranged enemies and three patrol enemies.

For now, use one pickup type: [PICKUP_NAME].
The player is encouraged to collect all pickups before reaching the exit, but
level completion should not require perfect collection.

Add a level-select screen:
- First level unlocked by default.
- Later levels unlock only after completing the previous level.
- Cleared levels have a distinct visual state.
- Each level card shows an image, level title, locked/ready/cleared state, and
  "Scrap Collected: X/Y".
- Persist progress in localStorage.

Settings should include a clear-progress action.
Dev debug should include controls to mark levels as unlocked for testing.
```

## Bug-Prevention Prompt

```text
Make sure level-select reloads progress every time the scene opens. Phaser may
reuse scene instances, so do not read localStorage only in the constructor.
Progress must update immediately after completing a level without requiring a
browser refresh.
```

## Lesson From Robin Chute

The first version unlocked level two only after refresh because scene state was stale. Reload progression in scene lifecycle methods, not just construction.
