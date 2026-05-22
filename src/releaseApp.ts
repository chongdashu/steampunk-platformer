import { setAppContext } from './game/context';
import { createGame } from './game/createGame';
import { createDebugStore } from './game/debug';
import { createGameConfigStore } from './game/gameConfig';
import { resolveStartupProfile } from './game/profiles';
import { createSettingsStore } from './game/settings';

export function createReleaseApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="app-shell app-shell--game-only" data-profile="landscape">
      <div class="app-shell__workspace">
        <section class="game-host">
          <div id="game-root" class="game-root"></div>
        </section>
      </div>
    </div>
  `;

  const appShell = root.querySelector<HTMLElement>('.app-shell');
  const gameRoot = root.querySelector<HTMLElement>('#game-root');

  if (!appShell || !gameRoot) {
    throw new Error('Release app shell failed to mount');
  }

  const profile = resolveStartupProfile(window.location.search);
  const settingsStore = createSettingsStore();
  const debugStore = createDebugStore();
  const gameConfigStore = createGameConfigStore();

  appShell.dataset.profile = profile;
  setAppContext({
    settingsStore,
    debugStore,
    gameConfigStore,
    getProfile: () => profile
  });

  const game = createGame(gameRoot, profile);

  window.addEventListener('beforeunload', () => {
    game.destroy(true);
  });
}
