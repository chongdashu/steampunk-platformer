import { defineConfig } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const movementConfigPath = resolve(
  import.meta.dirname,
  'public/assets/config/character-movement.json'
);
const backgroundLayerOffsetsPath = resolve(
  import.meta.dirname,
  'public/assets/config/background-layer-offsets.json'
);
const baselineLevelConfigPath = resolve(
  import.meta.dirname,
  'public/assets/config/baseline-level.json'
);
const characterPlaygroundConfigPath = resolve(
  import.meta.dirname,
  'public/assets/config/character-playground.json'
);
const gameConfigPath = resolve(
  import.meta.dirname,
  'public/assets/config/game-config.json'
);
const characterBoundsPath = resolve(
  import.meta.dirname,
  'public/assets/config/character-bounds.json'
);
const enemyBoundsPath = resolve(
  import.meta.dirname,
  'public/assets/config/enemy-bounds.json'
);
const platformingElementsPath = resolve(
  import.meta.dirname,
  'public/assets/config/platforming-elements.json'
);
const firstLevelPath = resolve(
  import.meta.dirname,
  'public/assets/levels/first-level.json'
);
const levelsDir = resolve(import.meta.dirname, 'public/assets/levels');
const levelsIndexPath = resolve(import.meta.dirname, 'public/assets/levels/index.json');

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolveBody(body));
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: object): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function normalizeLevelId(value: unknown): string {
  const id = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return id || 'untitled-level';
}

export default defineConfig({
  plugins: [
    {
      name: 'character-movement-config-writer',
      configureServer(server) {
        server.middlewares.use('/__debug/character-movement-config', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(movementConfigPath), { recursive: true });
            await writeFile(movementConfigPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: movementConfigPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/background-layer-offsets', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(backgroundLayerOffsetsPath), { recursive: true });
            await writeFile(backgroundLayerOffsetsPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: backgroundLayerOffsetsPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/baseline-level-config', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(baselineLevelConfigPath), { recursive: true });
            await writeFile(baselineLevelConfigPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: baselineLevelConfigPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/character-playground-config', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(characterPlaygroundConfigPath), { recursive: true });
            await writeFile(characterPlaygroundConfigPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: characterPlaygroundConfigPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/game-config', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(gameConfigPath), { recursive: true });
            await writeFile(gameConfigPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: gameConfigPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/character-bounds', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(characterBoundsPath), { recursive: true });
            await writeFile(characterBoundsPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: characterBoundsPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/enemy-bounds', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(enemyBoundsPath), { recursive: true });
            await writeFile(enemyBoundsPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: enemyBoundsPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/platforming-elements', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(platformingElementsPath), { recursive: true });
            await writeFile(platformingElementsPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: platformingElementsPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/first-level', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as unknown;

            if (!parsed || typeof parsed !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a JSON object' });
              return;
            }

            await mkdir(dirname(firstLevelPath), { recursive: true });
            await writeFile(firstLevelPath, `${JSON.stringify(parsed, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: firstLevelPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
        server.middlewares.use('/__debug/levels', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as {
              level?: { id?: string };
              catalog?: object;
              id?: string;
            };
            const level = parsed.level ?? parsed;

            if (!level || typeof level !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected a level JSON object' });
              return;
            }

            const id = normalizeLevelId(parsed.id ?? level.id);
            const levelPath = resolve(levelsDir, `${id}.json`);

            if (!levelPath.startsWith(levelsDir)) {
              sendJson(response, 400, { ok: false, error: 'Invalid level id' });
              return;
            }

            await mkdir(levelsDir, { recursive: true });
            await writeFile(levelPath, `${JSON.stringify({ ...level, id }, null, 2)}\n`);

            if (parsed.catalog && typeof parsed.catalog === 'object') {
              await writeFile(levelsIndexPath, `${JSON.stringify(parsed.catalog, null, 2)}\n`);
            }

            sendJson(response, 200, { ok: true, path: levelPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
