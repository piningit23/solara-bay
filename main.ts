// Solara Bay — make.fun entry program (gta6-01).
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-game.ts.
// Runs on plain Node 22 stdlib only: no installs, no network.
// Rebuild 2 (2026-11-19): written fresh under the new recording after two
// sealed recordings failed; the game it hands in is the v3 rebuild.

import { cp, mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const gameDir = join(here, 'game');
  const shotsDir = join(here, 'screenshots');
  if (!(await exists(gameDir))) throw new Error('game/ is missing from the repository');
  await cp(gameDir, join(outDir, 'game'), { recursive: true });
  if (await exists(shotsDir)) {
    await mkdir(join(outDir, 'screenshots'), { recursive: true });
    await cp(shotsDir, join(outDir, 'screenshots'), { recursive: true });
  } else {
    // No screenshots yet: still write an empty folder so the dossier step
    // sees a consistent tree instead of failing on a missing directory.
    await mkdir(join(outDir, 'screenshots'), { recursive: true });
  }
  const dossier = await buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  await writeFile(join(outDir, 'dossier.json'), dossier, 'utf8');
  const names = await readdir(join(outDir, 'screenshots')).catch(() => []);
  console.log(`Solara Bay v3: wrote ${outDir} (${names.length} screenshots)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
