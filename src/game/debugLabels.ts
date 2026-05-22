import * as Phaser from 'phaser';

export interface AssetLabelSpec {
  text: string;
  x: number;
  y: number;
  depth?: number;
  scrollFactor?: number;
}

export function syncAssetLabels(
  scene: Phaser.Scene,
  labels: Phaser.GameObjects.Text[],
  specs: AssetLabelSpec[]
): Phaser.GameObjects.Text[] {
  while (labels.length < specs.length) {
    labels.push(createAssetLabel(scene));
  }

  while (labels.length > specs.length) {
    labels.pop()?.destroy();
  }

  specs.forEach((spec, index) => {
    labels[index]
      .setText(spec.text)
      .setPosition(spec.x, spec.y)
      .setDepth(spec.depth ?? 120)
      .setScrollFactor(spec.scrollFactor ?? 1)
      .setVisible(true);
  });

  return labels;
}

export function clearAssetLabels(labels: Phaser.GameObjects.Text[]): void {
  labels.forEach((label) => label.destroy());
  labels.length = 0;
}

function createAssetLabel(scene: Phaser.Scene): Phaser.GameObjects.Text {
  return scene.add
    .text(0, 0, '', {
      backgroundColor: 'rgba(2, 6, 23, 0.72)',
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: '10px',
      padding: { x: 5, y: 3 }
    })
    .setOrigin(0.5, 1)
    .setVisible(false);
}
