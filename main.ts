// Solara Bay v3 — the entry program for make.fun's gta6-01 "Make GTA 6".
// It hands the game in: copy this repository's game/ and screenshots/
// into the output directory and write /output/dossier.json with the
// vendored make.fun library, exactly as the kit's starter does.
// The output directory may already exist from an earlier run, so the
// game/ and screenshots/ subdirectories are cleared first: without that,
// files deleted from the repo would linger in the output and be judged.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
// Clear any previous copy so the output matches the repo exactly.
rmSync(join(out, 'game'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (from the kit's gate): only text_max_bytes shapes
// the dossier bytes; the other caps refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; game/ over 993 files or
// 48 MiB in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
