import { loadShops, loadState } from '../lib/shops.js';
import { writeJson } from '../lib/json.js';
import { files } from '../lib/paths.js';
import { pool } from '../lib/pool.js';
import { config } from '../lib/config.js';
import { checkShop } from './shop.js';

/** Weekly health check of every curated shop; writes generated/shops-state.json. */
const shops = loadShops().filter((s) => !s.disabled);
const previous = loadState();
const only = process.argv[2];
const todo = only ? shops.filter((s) => s.id.includes(only)) : shops;
const next = only ? previous : {};
const started = Date.now();
let done = 0;

await pool(todo, config.crawl.concurrency * 2, async (shop) => {
  try {
    next[shop.id] = await checkShop(shop, previous[shop.id]);
  } catch (e) {
    next[shop.id] = { status: 'dead', reason: `check_error_${e.message}`.slice(0, 80), checkedAt: new Date().toISOString() };
  }
  if (++done % 100 === 0) console.log(`checked ${done}/${todo.length}`);
});

// the same shop listed under two domains (one redirects to the other): keep the first
const byOrigin = new Map();
for (const [id, st] of Object.entries(next)) {
  if (st.status !== 'ok' && st.status !== 'listed') continue;
  const origin = (st.url || '').replace('://www.', '://');
  if (byOrigin.has(origin)) Object.assign(st, { status: 'duplicate', reason: `same_as_${byOrigin.get(origin)}` });
  else byOrigin.set(origin, id);
}

writeJson(files.state, next, true);
const counts = Object.values(next).reduce((a, s) => ({ ...a, [s.status]: (a[s.status] || 0) + 1 }), {});
console.log('check done in', Math.round((Date.now() - started) / 1000), 's', counts);
