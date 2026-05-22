# Prompt Template: Character Asset Registration And Gym

Use this after generating character spritesheets.

## Prompt

```text
We have character spritesheets in [CHARACTER_ASSET_DIR] for:
idle, walk, run, jump, attack, hurt, death.

Register them in public/assets/index.json under a character section. For each
animation record:
- loader key
- file path
- frame width and height
- frame count
- default fps
- loop flag
- variant if applicable, such as snap or nosnap

Then create a Character Gym scene.

The scene should:
- Preview one selected animation at a time.
- Face the character right for a left-to-right side scroller.
- Show the sprite centered on a grid, not hidden by backgrounds.
- Provide zoom via mouse wheel / trackpad.
- Display current frame number and playback fps.
- Allow the animation fps to be edited and saved.

Debug overlays:
- White: source frame bounds.
- Blue: visual footprint.
- Green: collision bounds.
- Red: attack hit box.

The debug panel should allow selecting which bounds are being edited, with the
bounds selector above x/y/w/h inputs. Width and height changes must resize from
the center. Bounds are saved per animation, with an optional "apply to all"
action for shared collision settings.
```

## Active Frame Prompt

```text
Attack hit boxes should only be active on specific frames. Add a frame stepper
and per-frame toggles so frames can be marked active or inactive. Save the
active frame list in public/assets/config/character-bounds.json.
```

## Lesson From Robin Chute

The attack could not simply be a rectangle for the whole animation. Wind-up and recovery frames must not register hits.
