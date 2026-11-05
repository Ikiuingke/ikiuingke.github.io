import path from 'node:path';

/** Repo root: scripts run from it (npm scripts, Astro build). */
export const ROOT = process.cwd();
export const DATA = path.join(ROOT, 'data');
export const SHOPS_DIR = path.join(DATA, 'shops');
export const I18N_DIR = path.join(DATA, 'i18n');
export const GENERATED = path.join(ROOT, 'generated');
export const PUBLIC = path.join(ROOT, 'public');

export const files = {
  state: path.join(GENERATED, 'shops-state.json'),
  products: path.join(GENERATED, 'products.ndjson.gz'),
  candidates: path.join(GENERATED, 'candidates.json'),
  crawlReport: path.join(GENERATED, 'crawl-report.json'),
};
