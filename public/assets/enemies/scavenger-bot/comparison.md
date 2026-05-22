# Scavenger Bot GIF Comparison

Public asset variants for the accepted W-facing scavenger bot anchor.
The I2V column now uses fixed-canvas post-selection exports: no foreground bbox
recovery, no pixel snap, and preserve-motion runtime finalization.

| Animation | I2V | Action-generated | Notes |
|---|---|---|---|
| Idle | ![I2V idle](i2v/idle.gif) | Not available | I2V idle is provisional; no action-board idle exists yet. |
| Walk | ![I2V walk](i2v/walk.gif) | Not available | I2V uses the 2s Grok walk rerun for a fuller cycle. |
| Run | ![I2V run](i2v/run.gif) | Not available | No action-board run exists yet. |
| Attack | ![I2V attack](i2v/attack.gif) | ![Action-generated attack](action-generated/attack.gif) | Compare claw-swipe readability and scale stability. |
| Hurt | ![I2V hurt](i2v/hurt.gif) | ![Action-generated hurt](action-generated/hurt.gif) | Compare recoil pose, anchor stability, and silhouette consistency. |
| Death | ![I2V death](i2v/death.gif) | ![Action-generated death](action-generated/death.gif) | Compare collapse readability and final grounded pose. |
| Jump | ![I2V jump](i2v/jump.gif) | ![Action-generated jump](action-generated/jump.gif) | Compare airborne pose clarity and body proportions. |

## Source Notes

- I2V assets come from `runs/20260518-212924-scavenger-bot-w-anchor-v2/actions-v*/.../post-selection/fixed-canvas-no-pixelsnap-v1/export/`.
- Action-generated assets come from `runs/20260518-212924-scavenger-bot-w-anchor-v2/actions-v1/*-w-image/`.
- Root files such as `walk.png` and `walk.gif` are aliases of the i2v variant for existing game loaders.
