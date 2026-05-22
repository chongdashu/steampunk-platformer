import * as Phaser from 'phaser';

/**
 * Returns true when a world-space horizontal span overlaps the main camera view.
 */
export function isWorldBoundsInCameraView(
  scene: Phaser.Scene,
  left: number,
  right: number,
  margin = 80
): boolean {
  const camera = scene.cameras.main;
  const viewLeft = camera.scrollX - margin;
  const viewRight = camera.scrollX + camera.width + margin;

  return right >= viewLeft && left <= viewRight;
}
