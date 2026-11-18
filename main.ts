// Deterministic make.fun hand-in: copy the playable files, then describe that exact output tree.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const root = import.meta.dirname;
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

mkdirSync(output, { recursive: true });
// Keep repeated local runs exact even when their destination already exists.
rmSync(resolve(output, 'game'), { recursive: true, force: true });
rmSync(resolve(output, 'screenshots'), { recursive: true, force: true });
rmSync(resolve(output, 'dossier.json'), { force: true });
cpSync(resolve(root, 'game'), resolve(output, 'game'), { recursive: true });
cpSync(resolve(root, 'screenshots'), resolve(output, 'screenshots'), { recursive: true });
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648
});
writeFileSync(resolve(output, 'dossier.json'), dossier);
