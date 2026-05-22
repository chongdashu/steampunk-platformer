import { PLAYABLE_LEVEL_IDS } from './levelData';

export const LEVEL_PROGRESS_STORAGE_KEY = 'robin-chute-level-progress';
export const LEVEL_PROGRESS_CHANGED_EVENT = 'robin-chute-level-progress-changed';

export interface LevelPickupStats {
  collected: number;
  total: number;
}

export interface LevelProgress {
  version: 1;
  unlockedLevelIds: string[];
  completedLevelIds: string[];
  pickupBestByLevel: Record<string, LevelPickupStats>;
}

export const DEFAULT_LEVEL_PROGRESS: LevelProgress = {
  version: 1,
  unlockedLevelIds: [PLAYABLE_LEVEL_IDS[0]],
  completedLevelIds: [],
  pickupBestByLevel: {}
};

export function normalizeLevelProgress(value: unknown): LevelProgress {
  const candidate = value as Partial<LevelProgress> | null;
  const unlocked = new Set(
    Array.isArray(candidate?.unlockedLevelIds)
      ? candidate.unlockedLevelIds.filter(isPlayableLevelId)
      : DEFAULT_LEVEL_PROGRESS.unlockedLevelIds
  );
  unlocked.add(PLAYABLE_LEVEL_IDS[0]);

  const completed = new Set(
    Array.isArray(candidate?.completedLevelIds)
      ? candidate.completedLevelIds.filter(isPlayableLevelId)
      : []
  );

  completed.forEach((levelId) => {
    const next = getNextLevelId(levelId);
    if (next) {
      unlocked.add(next);
    }
  });

  return {
    version: 1,
    unlockedLevelIds: sortPlayableIds([...unlocked]),
    completedLevelIds: sortPlayableIds([...completed]),
    pickupBestByLevel: normalizePickupBest(candidate?.pickupBestByLevel)
  };
}

export function loadLevelProgress(storage: Storage = window.localStorage): LevelProgress {
  try {
    const raw = storage.getItem(LEVEL_PROGRESS_STORAGE_KEY);
    return raw ? normalizeLevelProgress(JSON.parse(raw)) : DEFAULT_LEVEL_PROGRESS;
  } catch {
    return DEFAULT_LEVEL_PROGRESS;
  }
}

export function saveLevelProgress(
  progress: LevelProgress,
  storage: Storage = window.localStorage
): void {
  storage.setItem(LEVEL_PROGRESS_STORAGE_KEY, JSON.stringify(normalizeLevelProgress(progress)));
  dispatchProgressChanged();
}

export function resetLevelProgress(storage: Storage = window.localStorage): LevelProgress {
  saveLevelProgress(DEFAULT_LEVEL_PROGRESS, storage);
  return DEFAULT_LEVEL_PROGRESS;
}

export function setUnlockedLevelIds(
  levelIds: string[],
  storage: Storage = window.localStorage
): LevelProgress {
  const current = loadLevelProgress(storage);
  const next = normalizeLevelProgress({
    ...current,
    unlockedLevelIds: levelIds
  });
  saveLevelProgress(next, storage);
  return next;
}

export function markLevelComplete(
  levelId: string,
  pickupStats: LevelPickupStats,
  storage: Storage = window.localStorage
): LevelProgress {
  const current = loadLevelProgress(storage);
  const completedLevelIds = new Set(current.completedLevelIds);
  const unlockedLevelIds = new Set(current.unlockedLevelIds);
  const existingBest = current.pickupBestByLevel[levelId];
  const nextLevelId = getNextLevelId(levelId);

  completedLevelIds.add(levelId);
  unlockedLevelIds.add(levelId);
  if (nextLevelId) {
    unlockedLevelIds.add(nextLevelId);
  }

  const nextBest =
    !existingBest || pickupStats.collected > existingBest.collected
      ? pickupStats
      : {
          collected: existingBest.collected,
          total: Math.max(existingBest.total, pickupStats.total)
        };

  const next = normalizeLevelProgress({
    ...current,
    completedLevelIds: [...completedLevelIds],
    unlockedLevelIds: [...unlockedLevelIds],
    pickupBestByLevel: {
      ...current.pickupBestByLevel,
      [levelId]: nextBest
    }
  });

  saveLevelProgress(next, storage);
  return next;
}

export function isPlayableLevelId(levelId: string): levelId is (typeof PLAYABLE_LEVEL_IDS)[number] {
  return PLAYABLE_LEVEL_IDS.includes(levelId as (typeof PLAYABLE_LEVEL_IDS)[number]);
}

export function isLevelUnlocked(progress: LevelProgress, levelId: string): boolean {
  return progress.unlockedLevelIds.includes(levelId);
}

export function getNextLevelId(levelId: string): string | null {
  const index = PLAYABLE_LEVEL_IDS.indexOf(levelId as (typeof PLAYABLE_LEVEL_IDS)[number]);
  return index >= 0 ? PLAYABLE_LEVEL_IDS[index + 1] ?? null : null;
}

function normalizePickupBest(value: unknown): Record<string, LevelPickupStats> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, Partial<LevelPickupStats>>)
      .filter(([levelId]) => isPlayableLevelId(levelId))
      .map(([levelId, stats]) => [
        levelId,
        {
          collected: clampInteger(stats.collected, 0, 999),
          total: clampInteger(stats.total, 0, 999)
        }
      ])
  );
}

function sortPlayableIds(levelIds: string[]): string[] {
  return PLAYABLE_LEVEL_IDS.filter((levelId) => levelIds.includes(levelId));
}

function clampInteger(value: unknown, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : min;
}

function dispatchProgressChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(LEVEL_PROGRESS_CHANGED_EVENT));
}
