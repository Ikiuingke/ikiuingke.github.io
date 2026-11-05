import fs from 'node:fs';
import path from 'node:path';
import { SHOPS_DIR, files } from './paths.js';
import { readJson } from './json.js';

/** Curated shop list: one JSON file per shop, id = file name (host without www). */
export function loadShops({ withCandidates = true } = {}) {
  const curated = fs.readdirSync(SHOPS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ id: f.slice(0, -5), ...readJson(path.join(SHOPS_DIR, f)) }));
  if (!withCandidates) return curated;
  // shops found by `npm run discover`, until they are written to data/shops
  const ids = new Set(curated.map((s) => s.id));
  const found = readJson(files.candidates, [])
    .filter((c) => !ids.has(c.id))
    .map(({ id, url, name, country, city, osm }) => ({ id, url, name, country, city, osm, source: 'osm' }));
  return [...curated, ...found];
}

/** Machine state from the last check run, keyed by shop id. */
export const loadState = () => readJson(files.state, {});

/** Shops that passed the last check and can be crawled. */
export function crawlableShops() {
  const state = loadState();
  return loadShops()
    .filter((s) => !s.disabled)
    .map((s) => ({ ...s, state: state[s.id] }))
    .filter((s) => s.state?.status === 'ok' && ['shopify', 'woocommerce'].includes(s.state.platform));
}

export const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
};
