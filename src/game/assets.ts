import * as Phaser from 'phaser';

import { AUDIO_ASSETS, type GameAudioAsset } from './audio';
import {
  CHARACTER_ANIMATION_VARIANTS,
  CHARACTER_FRAME,
  registerCharacterAnimations
} from './characterAssets';
import { EFFECT_SPRITESHEETS, registerEffectAnimations } from './effectAssets';
import { ENEMY_ANIMATIONS, registerEnemyAnimations } from './enemyAssets';
import { EXIT_CHUTE_TEXTURE_KEY } from './platformingElements';
import { MENU_ASSETS } from './menuBackdrop';
import {
  PLAYER_HUD_HEALTH_FRAME_KEY,
  PLAYER_HUD_PORTRAIT_KEY,
  SCRAP_COUNTER_BADGE_KEY
} from './ui';
import type { BackgroundLayerId, BackgroundSetId } from './types';

export interface ImageAsset {
  kind: 'image';
  key: string;
  url: string;
  width?: number;
  height?: number;
  usage?: string;
  parallaxScrollFactor?: {
    x: number;
    y: number;
  };
}

export interface BackgroundLayerAsset extends ImageAsset {
  setId: BackgroundSetId;
  layerId: BackgroundLayerId;
  label: string;
  defaultVisible: boolean;
  speed: number;
  tileOffsetY?: number;
}

export interface BackgroundSet {
  id: BackgroundSetId;
  label: string;
  sourceRun: string;
  layers: BackgroundLayerAsset[];
}

export interface SpritesheetAsset {
  kind: 'spritesheet';
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  columns?: number;
  rows?: number;
  usage?: string;
  sourceRun?: string;
  margin?: number;
  spacing?: number;
}

export interface AudioAsset extends GameAudioAsset {
  kind: 'audio';
}

export interface AtlasAsset {
  kind: 'atlas';
  key: string;
  url: string;
  atlasUrl: string;
  width?: number;
  height?: number;
  usage?: string;
  sourceRun?: string;
}

export type StarterAsset = ImageAsset | SpritesheetAsset | AtlasAsset | AudioAsset;

// Keep these entries mirrored with public/assets/index.json. Vite dev mode
// does not allow importing files directly from public/ into application code.
export const BACKGROUND_SETS: Record<BackgroundSetId, BackgroundSet> = {
  v1: {
    id: 'v1',
    label: 'V1 scenic alpha stack',
    sourceRun: 'runs/20260511-142135-robin-chute-parallax-alpha-backgrounds',
    layers: [
      {
        kind: 'image',
        key: 'parallax-v1-far-skyline',
        setId: 'v1',
        layerId: 'far',
        label: 'Far skyline',
        url: '/assets/backgrounds/v1/parallax-far-skyline-alpha-5760x1080.png',
        width: 5760,
        height: 1080,
        usage: 'v1 far transparent parallax background layer',
        defaultVisible: true,
        speed: 12,
        parallaxScrollFactor: { x: 0.2, y: 0 }
      },
      {
        kind: 'image',
        key: 'parallax-v1-mid-forest-chutes',
        setId: 'v1',
        layerId: 'mid',
        label: 'Mid forest chutes',
        url: '/assets/backgrounds/v1/parallax-mid-forest-chutes-alpha-5760x1080.png',
        width: 5760,
        height: 1080,
        usage: 'v1 midground transparent parallax background layer',
        defaultVisible: true,
        speed: 30,
        parallaxScrollFactor: { x: 0.45, y: 0 }
      },
      {
        kind: 'image',
        key: 'parallax-v1-near-village-backing',
        setId: 'v1',
        layerId: 'near',
        label: 'Near village backing',
        url: '/assets/backgrounds/v1/parallax-near-village-backing-alpha-5760x1080.png',
        width: 5760,
        height: 1080,
        usage: 'v1 near transparent parallax backing layer',
        defaultVisible: true,
        speed: 58,
        parallaxScrollFactor: { x: 0.75, y: 0 }
      }
    ]
  },
  v2: {
    id: 'v2',
    label: 'V2 coverage contract',
    sourceRun: 'runs/20260511-150423-robin-chute-parallax-coverage-contract',
    layers: [
      {
        kind: 'image',
        key: 'parallax-v2-sky-base',
        setId: 'v2',
        layerId: 'sky',
        label: 'Sky base',
        url: '/assets/backgrounds/v2/parallax-sky-base-5760x1080.png',
        width: 5760,
        height: 1080,
        usage: 'v2 opaque sky and atmosphere base layer',
        defaultVisible: true,
        speed: 4,
        parallaxScrollFactor: { x: 0.08, y: 0 }
      },
      {
        kind: 'image',
        key: 'parallax-v2-far-city-forest',
        setId: 'v2',
        layerId: 'far',
        label: 'Far city forest',
        url: '/assets/backgrounds/v2/parallax-far-city-forest-alpha-5760x1080.png',
        width: 5760,
        height: 1080,
        usage: 'v2 far transparent parallax layer with intentional top and gameplay gaps',
        defaultVisible: true,
        speed: 14,
        parallaxScrollFactor: { x: 0.25, y: 0 }
      },
      {
        kind: 'image',
        key: 'parallax-v2-mid-forest-chutes',
        setId: 'v2',
        layerId: 'mid',
        label: 'Mid forest chutes',
        url: '/assets/backgrounds/v2/parallax-mid-forest-chutes-alpha-5760x1080.png',
        width: 5760,
        height: 1080,
        usage: 'v2 mid transparent parallax layer with preserved gameplay readability gaps',
        defaultVisible: true,
        speed: 34,
        tileOffsetY: 120,
        parallaxScrollFactor: { x: 0.5, y: 0 }
      }
    ]
  }
};

export const BACKGROUND_LAYER_ORDER: BackgroundLayerId[] = ['sky', 'far', 'mid', 'near'];

export const BACKGROUND_ASSETS = (
  import.meta.env.PROD
    ? BACKGROUND_SETS.v2.layers
    : Object.values(BACKGROUND_SETS).flatMap((set) => set.layers)
) satisfies BackgroundLayerAsset[];

export const GAMEPLAY_ATLASES = [
  {
    kind: 'atlas',
    key: 'gameplay-platforming-v1',
    url: '/assets/gameplay/v1/platforming-elements-atlas-alpha-1536x1024.png',
    atlasUrl: '/assets/gameplay/v1/platforming-elements-atlas.json',
    width: 1536,
    height: 1024,
    usage: 'variable-frame platforming and collision element atlas',
    sourceRun: 'runs/20260511-160126-main-layer-atlases-v2'
  },
  {
    kind: 'atlas',
    key: 'gameplay-props-pickups-v1',
    url: '/assets/gameplay/v1/props-pickups-atlas-alpha-1536x1024.png',
    atlasUrl: '/assets/gameplay/v1/props-pickups-atlas.json',
    width: 1536,
    height: 1024,
    usage: 'variable-frame static prop and pickup atlas',
    sourceRun: 'runs/20260511-160126-main-layer-atlases-v2'
  }
] satisfies AtlasAsset[];

export const CHARACTER_SPRITESHEETS = CHARACTER_ANIMATION_VARIANTS.map((animation) => ({
  kind: 'spritesheet',
  key: animation.key,
  url: animation.url,
  frameWidth: CHARACTER_FRAME.width,
  frameHeight: CHARACTER_FRAME.height,
  frames: animation.frames,
  columns: animation.columns,
  rows: animation.rows,
  usage: `${animation.label} animation spritesheet for Robin Chute`,
  sourceRun: animation.source
})) satisfies SpritesheetAsset[];

export const ENEMY_SPRITESHEETS = ENEMY_ANIMATIONS.map((animation) => ({
  kind: 'spritesheet',
  key: animation.key,
  url: animation.url,
  frameWidth: animation.frameWidth,
  frameHeight: animation.frameHeight,
  frames: animation.frames,
  columns: animation.columns,
  rows: animation.rows,
  usage: `${animation.label} animation spritesheet for ${animation.enemyLabel}`,
  sourceRun: animation.source
})) satisfies SpritesheetAsset[];

export const EFFECT_ASSETS = EFFECT_SPRITESHEETS.map((effect) => ({
  kind: 'spritesheet',
  key: effect.key,
  url: effect.url,
  frameWidth: effect.frameWidth,
  frameHeight: effect.frameHeight,
  frames: effect.frames,
  columns: effect.columns,
  rows: effect.rows,
  usage: effect.label,
  sourceRun: effect.sourceRun
})) satisfies SpritesheetAsset[];

export const HUD_ASSETS = [
  {
    kind: 'image',
    key: PLAYER_HUD_PORTRAIT_KEY,
    url: '/assets/ui/hud/player-portrait.png',
    width: 531,
    height: 528,
    usage: 'Robin Chute player portrait medallion for the HUD health display'
  },
  {
    kind: 'image',
    key: PLAYER_HUD_HEALTH_FRAME_KEY,
    url: '/assets/ui/hud/player-health-frame.png',
    width: 1037,
    height: 444,
    usage: 'Forest steampunk player health frame with transparent live-fill slot'
  },
  {
    kind: 'image',
    key: SCRAP_COUNTER_BADGE_KEY,
    url: '/assets/ui/hud/scrap-counter-badge.png',
    width: 282,
    height: 91,
    usage: 'Scrap collected counter badge with gear icon and runtime text panel'
  }
] satisfies ImageAsset[];

export const EXIT_ASSETS = [
  {
    kind: 'image',
    key: EXIT_CHUTE_TEXTURE_KEY,
    url: '/assets/exit/exit-chute.png',
    width: 228,
    height: 420,
    usage: 'Standalone end-of-level chute finish gate with editable trigger bounds'
  }
] satisfies ImageAsset[];

export const STARTER_ASSETS: StarterAsset[] = [
  ...BACKGROUND_ASSETS,
  ...GAMEPLAY_ATLASES,
  ...CHARACTER_SPRITESHEETS,
  ...ENEMY_SPRITESHEETS,
  ...EFFECT_ASSETS,
  ...HUD_ASSETS,
  ...MENU_ASSETS,
  ...EXIT_ASSETS,
  ...AUDIO_ASSETS
];

export function preloadStarterAssets(scene: Phaser.Scene, assets: StarterAsset[] = STARTER_ASSETS): void {
  assets.forEach((asset) => {
    if (asset.kind === 'image') {
      if (!scene.textures.exists(asset.key)) {
        scene.load.image(asset.key, asset.url);
      }

      return;
    }

    if (asset.kind === 'spritesheet') {
      if (!scene.textures.exists(asset.key)) {
        scene.load.spritesheet(asset.key, asset.url, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
          margin: asset.margin ?? 0,
          spacing: asset.spacing ?? 0
        });
      }

      return;
    }

    if (asset.kind === 'atlas') {
      if (!scene.textures.exists(asset.key)) {
        scene.load.atlas(asset.key, asset.url, asset.atlasUrl);
      }

      return;
    }

    if (!scene.cache.audio.exists(asset.key)) {
      scene.load.audio(asset.key, asset.url);
    }
  });
}

export function registerStarterAnimations(scene: Phaser.Scene): void {
  registerCharacterAnimations(scene);
  registerEnemyAnimations(scene);
  registerEffectAnimations(scene);
}
