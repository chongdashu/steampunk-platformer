import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LEVEL_PROGRESS,
  loadLevelProgress,
  markLevelComplete,
  resetLevelProgress
} from './levelProgress';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('level progress', () => {
  it('unlocks the next level when a level is completed', () => {
    const storage = new MemoryStorage();

    const next = markLevelComplete('first-level', { collected: 4, total: 5 }, storage);

    expect(next.completedLevelIds).toContain('first-level');
    expect(next.unlockedLevelIds).toContain('level-2-turret-run');
    expect(loadLevelProgress(storage).unlockedLevelIds).toContain('level-2-turret-run');
  });

  it('resets progress back to only the first level', () => {
    const storage = new MemoryStorage();
    markLevelComplete('first-level', { collected: 4, total: 5 }, storage);

    expect(resetLevelProgress(storage)).toEqual(DEFAULT_LEVEL_PROGRESS);
  });
});
