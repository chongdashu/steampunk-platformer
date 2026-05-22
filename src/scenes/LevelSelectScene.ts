import * as Phaser from 'phaser';

import { BACKGROUND_SETS } from '../game/assets';
import { getCharacterAnimation } from '../game/characterAssets';
import { GAME_TITLE } from '../game/constants';
import {
  SCAVENGER_BOT_ENEMY_ID,
  TURRET_ENEMY_ID,
  getEnemyAnimation
} from '../game/enemyAssets';
import {
  DEFAULT_LEVEL_CATALOG,
  LEVELS_INDEX_URL,
  PLAYABLE_LEVEL_IDS,
  getLevelUrl,
  normalizeLevelCatalog,
  type LevelCatalog,
  type LevelCatalogEntry
} from '../game/levelData';
import {
  LEVEL_PROGRESS_CHANGED_EVENT,
  isLevelUnlocked,
  loadLevelProgress,
  type LevelProgress
} from '../game/levelProgress';
import { createMenuBackdrop } from '../game/menuBackdrop';
import { EXIT_CHUTE_TEXTURE_KEY } from '../game/platformingElements';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

interface SelectableLevel {
  entry: LevelCatalogEntry;
  unlocked: boolean;
  completed: boolean;
  pickups: string;
}

interface LevelCard {
  group: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  detail: Phaser.GameObjects.Text;
  setSelected(selected: boolean): void;
  destroy(): void;
}

export class LevelSelectScene extends BaseScene {
  private catalog: LevelCatalog = DEFAULT_LEVEL_CATALOG;
  private progress: LevelProgress = loadLevelProgress();
  private cards: LevelCard[] = [];
  private selectedIndex = 0;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.LevelSelect);
  }

  init(): void {
    this.progress = loadLevelProgress();
  }

  create(): void {
    this.progress = loadLevelProgress();
    this.enableAudioSettingsSync();
    this.markActiveScene(SCENE_KEYS.LevelSelect);
    this.cameras.main.setBackgroundColor(0x020617);
    createMenuBackdrop(this, 'menu');
    this.createHeading('Select Level', `${GAME_TITLE} route progress`);

    const camera = this.cameras.main;
    this.add
      .text(camera.centerX, 130, 'Collect every piece of scrap before reaching the chute.', {
        align: 'center',
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '17px'
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(camera.centerX, camera.height - 74, '', {
        align: 'center',
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '15px'
      })
      .setOrigin(0.5);

    this.createInput();
    this.renderLevels();
    void this.loadCatalog();

    const handleProgressChanged = (): void => {
      this.progress = loadLevelProgress();
      this.renderLevels();
    };

    window.addEventListener(LEVEL_PROGRESS_CHANGED_EVENT, handleProgressChanged);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener(LEVEL_PROGRESS_CHANGED_EVENT, handleProgressChanged);
      this.clearCards();
    });

    this.createFooterHint('Left/Right select • Enter/Space play • Esc back');
  }

  private async loadCatalog(): Promise<void> {
    try {
      const response = await fetch(LEVELS_INDEX_URL, { cache: 'no-store' });

      if (response.ok) {
        this.catalog = normalizeLevelCatalog(await response.json());
        this.renderLevels();
      }
    } catch {
      this.catalog = DEFAULT_LEVEL_CATALOG;
      this.renderLevels();
    }
  }

  private createInput(): void {
    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-D', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.playSelected());
    this.input.keyboard?.on('keydown-SPACE', () => this.playSelected());
    this.input.keyboard?.on('keydown-ESC', () => this.goToMenu());
    this.input.keyboard?.on('keydown-BACKSPACE', () => this.goToMenu());
  }

  private renderLevels(): void {
    this.clearCards();
    const levels = this.getSelectableLevels();
    const camera = this.cameras.main;
    const gap = 16;
    const availableWidth = camera.width - 112;
    const cardWidth = Phaser.Math.Clamp(
      Math.floor((availableWidth - gap * (levels.length - 1)) / levels.length),
      145,
      192
    );
    const cardHeight = Math.min(210, Math.max(170, cardWidth + 18));
    const totalWidth = levels.length * cardWidth + (levels.length - 1) * gap;
    const startX = camera.centerX - totalWidth / 2 + cardWidth / 2;
    const cardY = camera.centerY + 18;

    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex, 0, Math.max(0, levels.length - 1));

    levels.forEach((level, index) => {
      this.cards.push(
        this.createLevelCard({
          level,
          index,
          x: startX + index * (cardWidth + gap),
          y: cardY,
          width: cardWidth,
          height: cardHeight
        })
      );
    });

    this.setSelection(this.selectedIndex);
  }

  private createLevelCard(config: {
    level: SelectableLevel;
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }): LevelCard {
    const { level, index, x, y, width, height } = config;
    const fillColor = level.completed ? 0x2c2338 : level.unlocked ? 0x152238 : 0x0f172a;
    const selectedFillColor = level.completed ? 0x47335f : 0x26384f;
    const strokeColor = level.completed ? 0xc084fc : level.unlocked ? 0x38bdf8 : 0x31506a;
    const numberColor = level.completed ? '#f0abfc' : level.unlocked ? '#86efac' : '#64748b';
    const badgeBackground = level.completed
      ? 'rgba(192, 132, 252, 0.22)'
      : level.unlocked
        ? 'rgba(34, 197, 94, 0.18)'
        : 'rgba(100, 116, 139, 0.16)';
    const badgeColor = level.completed ? '#f0abfc' : level.unlocked ? '#86efac' : '#64748b';
    const detailColor = level.completed ? '#f5d0fe' : level.unlocked ? '#cbd5e1' : '#64748b';
    const selectedDetailColor = level.completed ? '#fef3c7' : '#a7f3d0';
    const frame = this.add
      .rectangle(0, 0, width, height, fillColor, level.unlocked ? 0.96 : 0.72)
      .setStrokeStyle(3, strokeColor, level.unlocked ? 0.95 : 0.72);
    const previewY = -height / 2 + 74;
    const previewObjects = this.createLevelPreview({
      levelId: level.entry.id,
      index,
      y: previewY,
      width: width - 22,
      height: Math.min(82, height * 0.38),
      unlocked: level.unlocked,
      completed: level.completed
    });
    const number = this.add
      .text(-width / 2 + 22, -height / 2 + 22, String(index + 1).padStart(2, '0'), {
        align: 'center',
        color: numberColor,
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    const title = this.add
      .text(0, 22, level.entry.title, {
        align: 'center',
        color: level.unlocked ? '#f8fafc' : '#94a3b8',
        fontFamily: 'monospace',
        fontSize: width < 160 ? '15px' : '17px',
        wordWrap: { width: width - 22, useAdvancedWrap: true }
      })
      .setOrigin(0.5);
    const badgeText = level.completed ? 'CLEARED' : level.unlocked ? 'READY' : 'LOCKED';
    const badge = this.add
      .text(0, height / 2 - 54, badgeText, {
        align: 'center',
        backgroundColor: badgeBackground,
        color: badgeColor,
        fontFamily: 'monospace',
        fontSize: '13px',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5);
    const detail = this.add
      .text(0, height / 2 - 22, level.pickups, {
        align: 'center',
        color: detailColor,
        fontFamily: 'monospace',
        fontSize: '12px',
        wordWrap: { width: width - 18, useAdvancedWrap: true }
      })
      .setOrigin(0.5);
    const group = this.add.container(x, y, [frame, ...previewObjects, number, title, badge, detail]);

    frame.setInteractive({ useHandCursor: level.unlocked });
    frame.on('pointerover', () => this.setSelection(index));
    frame.on('pointerdown', () => this.confirmLevel(index));
    group.setAlpha(level.unlocked ? 1 : 0.56);

    return {
      group,
      frame,
      title,
      detail,
      setSelected: (selected: boolean) => {
        frame.setStrokeStyle(selected ? 4 : 3, selected ? 0xf8fafc : strokeColor, selected ? 1 : 0.86);
        frame.setFillStyle(selected ? selectedFillColor : fillColor, level.unlocked ? 0.98 : 0.72);
        title.setColor(selected && level.unlocked ? '#ffffff' : level.unlocked ? '#f8fafc' : '#94a3b8');
        detail.setColor(selected && level.unlocked ? selectedDetailColor : detailColor);
      },
      destroy: () => {
        group.destroy(true);
      }
    };
  }

  private createLevelPreview(config: {
    levelId: string;
    index: number;
    y: number;
    width: number;
    height: number;
    unlocked: boolean;
    completed: boolean;
  }): Phaser.GameObjects.GameObject[] {
    const { levelId, index, y, width, height, unlocked, completed } = config;
    const tint = unlocked ? 0xffffff : 0x64748b;
    const alpha = unlocked ? 1 : 0.58;
    const bgKey = BACKGROUND_SETS.v2.layers[0].key;
    const farKey = BACKGROUND_SETS.v2.layers[1].key;
    const panel = this.add
      .rectangle(0, y, width, height, completed ? 0x31223d : 0x0f1f33, 1);
    const sky = this.add.image(0, y, bgKey).setDisplaySize(width, height).setAlpha(0.9 * alpha);
    const far = this.add
      .image(0, y + 4, farKey)
      .setDisplaySize(width, height)
      .setAlpha((completed ? 0.64 : 0.48) * alpha)
      .setTint(tint);
    const platform = this.add
      .image(0, y + height / 2 - 7, 'gameplay-platforming-v1', 'ground_medium_mossy')
      .setDisplaySize(width * 0.82, Math.max(26, height * 0.27))
      .setAlpha(alpha)
      .setTint(tint);
    const foreground = this.createLevelPreviewForeground(levelId, index, y, width, height, tint, alpha);
    const shade = this.add
      .rectangle(0, y, width, height, unlocked ? 0x000000 : 0x020617, unlocked ? 0.08 : 0.42);
    const border = this.add
      .rectangle(0, y, width, height, 0x000000, 0)
      .setStrokeStyle(1, completed ? 0xc084fc : 0x466985, unlocked ? 0.75 : 0.45);

    return [panel, sky, far, platform, ...foreground, shade, border];
  }

  private createLevelPreviewForeground(
    levelId: string,
    index: number,
    y: number,
    width: number,
    height: number,
    tint: number,
    alpha: number
  ): Phaser.GameObjects.GameObject[] {
    const objects: Phaser.GameObjects.GameObject[] = [];
    const floorY = y + height / 2 - 4;
    const scrapFrame =
      this.textures.exists('gameplay-props-pickups-v1') &&
      this.textures.get('gameplay-props-pickups-v1').has('pickup_scrap_token')
        ? 'pickup_scrap_token'
        : 'pickup_gear_small';
    const addIcon = (
      x: number,
      texture: string,
      frame: string | number | undefined,
      displayWidth: number,
      displayHeight: number,
      originY = 1,
      flipX = false,
      yNudge = 14
    ): void => {
      const icon = this.add
        .image(x, floorY + yNudge, texture, frame)
        .setOrigin(0.5, originY)
        .setDisplaySize(displayWidth, displayHeight)
        .setAlpha(alpha)
        .setTint(tint)
        .setFlipX(flipX);
      objects.push(icon);
    };
    const addScrap = (x: number, yNudge = 2): void => {
      objects.push(
        this.add
          .image(x, floorY + yNudge, 'gameplay-props-pickups-v1', scrapFrame)
          .setOrigin(0.5, 1)
          .setDisplaySize(22, 22)
          .setAlpha(alpha)
          .setTint(tint)
      );
    };

    const playerKey = getCharacterAnimation('run').key;
    const turretKey = getEnemyAnimation('idle', TURRET_ENEMY_ID).key;
    const scavengerKey = getEnemyAnimation('idle', SCAVENGER_BOT_ENEMY_ID).key;

    if (levelId === 'first-level') {
      const player = this.add
        .image(-width * 0.25, floorY - 17, playerKey, 0)
        .setOrigin(0.5, 1)
        .setDisplaySize(48, 48)
        .setAlpha(alpha)
        .setTint(tint)
        .setFlipX(true);
      objects.push(player);
      addScrap(width * 0.06, -15);
      addScrap(width * 0.24, -15);
      return objects;
    }

    if (levelId === 'level-2-turret-run') {
      addIcon(0, turretKey, 0, 64, 64, 1, false, -4);
      return objects;
    }

    if (levelId === 'level-3-scrap-patrol') {
      addIcon(0, scavengerKey, 0, 64, 64, 1, false, -4);
      return objects;
    }

    if (levelId === 'level-4-pressure-yard') {
      addIcon(-width * 0.16, scavengerKey, 0, 62, 62, 1, false, -4);
      addScrap(width * 0.22, -26);
      addScrap(width * 0.34, -30);
      return objects;
    }

    addIcon(-width * 0.32, scavengerKey, 0, 56, 56, 1, false, -6);
    addIcon(-width * 0.04, turretKey, 0, 54, 54, 1, false, -5);
    addIcon(width * 0.3, EXIT_CHUTE_TEXTURE_KEY, undefined, 42, 70, 1, false, -10);
    return objects.length > 0
      ? objects
      : [
          this.add
            .text(0, y, `Route ${index + 1}`, {
              align: 'center',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              fontSize: '12px'
            })
            .setOrigin(0.5)
        ];
  }

  private clearCards(): void {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
  }

  private getSelectableLevels(): SelectableLevel[] {
    return PLAYABLE_LEVEL_IDS.map((levelId) => {
      const entry =
        this.catalog.levels.find((level) => level.id === levelId) ?? fallbackEntry(levelId);
      const stats = this.progress.pickupBestByLevel[levelId];
      const unlocked = isLevelUnlocked(this.progress, levelId);
      const completed = this.progress.completedLevelIds.includes(levelId);

      return {
        entry,
        unlocked,
        completed,
        pickups: completed
          ? `Scrap Collected: ${stats?.collected ?? 0}/${stats?.total ?? 0}`
          : unlocked
            ? 'Ready'
            : 'Complete the previous level to unlock'
      };
    });
  }

  private moveSelection(direction: number): void {
    const next = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.cards.length);
    this.setSelection(next);
  }

  private setSelection(index: number): void {
    this.selectedIndex = index;
    const levels = this.getSelectableLevels();
    this.cards.forEach((card, cardIndex) => {
      card.setSelected(cardIndex === index);
    });
    const selected = levels[index];
    this.statusText.setText(
      selected?.unlocked
        ? `${selected.entry.title} • ${selected.pickups}`
        : 'This route is still locked.'
    );
  }

  private confirmLevel(index: number): void {
    this.selectedIndex = index;
    this.playSelected();
  }

  private playSelected(): void {
    const level = this.getSelectableLevels()[this.selectedIndex];

    if (!level || !level.unlocked) {
      this.statusText.setText('Complete the previous level first.');
      this.playDenySfx();
      return;
    }

    this.playConfirmSfx();
    this.scene.start(SCENE_KEYS.Game, {
      levelId: level.entry.id,
      levelUrl: level.entry.url
    });
  }
}

function fallbackEntry(levelId: string): LevelCatalogEntry {
  return {
    id: levelId,
    title: levelId
      .split('-')
      .filter(Boolean)
      .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
      .join(' '),
    path: `levels/${levelId}.json`,
    url: getLevelUrl(levelId)
  };
}
