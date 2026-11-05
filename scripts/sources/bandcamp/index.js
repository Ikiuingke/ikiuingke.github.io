import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { config } from '../../lib/config.js';
import { GENERATED } from '../../lib/paths.js';
import { ndjsonWriter } from '../../lib/json.js';
import { get } from '../../lib/http.js';
import { pool, sleep } from '../../lib/pool.js';
import { countryOfLocation } from '../../lib/country.js';
import { discover } from './discover.js';
import { parseMerch } from './merch.js';

/**
 * Bandcamp labels and artists selling vinyl.
 *  1. discover (allowed by bandcamp.com/robots.txt) finds sellers of vinyl releases:
 *     a full sweep every `fullSweepDays`, otherwise only the newest pages.
 *  2. each seller's /merch page (one request) gives every physical item with stock;
 *     sellers are visited in rotation, `merchPerRun` per run, never-visited first.
 * State: generated/bandcamp-state.json.gz. Output: generated/products-bandcamp.ndjson.gz.
 */
const bc = config.bandcamp;
const STATE = path.join(GENERATED, 'bandcamp-state.json.gz');
const OUT = path.join(GENERATED, 'products-bandcamp.ndjson.gz');
const started = Date.now();
const deadline = started + bc.maxMinutes * 60_000;
const now = new Date().toISOString();

const state = fs.existsSync(STATE) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(STATE))) : { sellers: {}, lastFullSweep: null };
const sellers = state.sellers;

// 1. discover sellers
const full = !state.lastFullSweep || Date.now() - Date.parse(state.lastFullSweep) > bc.fullSweepDays * 864e5;
let pages = 0, found = 0, finished = false;
for await (const { releases, next } of discover({
  categoryId: bc.categoryId, format: bc.format, deadline: started + bc.maxDiscoverMinutes * 60_000,
  maxPages: Number(process.env.BANDCAMP_PAGES) || (full ? bc.maxDiscoverPages : bc.incrementalPages),
  cursor: full ? state.sweepCursor || '*' : '*',
})) {
  pages++;
  if (full) state.sweepCursor = next; // a long sweep resumes where the last run stopped
  if (full && !next) finished = true;
  for (const r of releases) {
    let s = sellers[r.bandUrl];
    if (!s) { s = sellers[r.bandUrl] = { name: r.seller, country: countryOfLocation(r.location), firstSeen: now, checkedAt: null, pending: [] }; found++; }
    // merch pages of labels omit the artist: remember it per album path
    if (r.artist && r.artist !== r.seller) (s.artists ||= {})[new URL(r.url).pathname] = r.artist;
    // until the seller's merch page is read, keep the release from discover as a provisional record
    if (!s.checkedAt && !s.pending.some((p) => p[0] === r.url)) s.pending.push([r.url, r.title, r.price, r.currency, r.image]);
  }
}
if (finished) { state.lastFullSweep = now; state.sweepCursor = null; }
console.log(`bandcamp discover: ${pages} pages (${full ? 'full' : 'newest'}), ${found} new sellers, ${Object.keys(sellers).length} known`);

// 2. merch pages, oldest visit first
const queue = Object.entries(sellers)
  .filter(([, s]) => s.status !== 'dead')
  .sort(([, a], [, b]) => (a.checkedAt || '').localeCompare(b.checkedAt || ''))
  .slice(0, Number(process.env.BANDCAMP_MERCH) || bc.merchPerRun);
let visited = 0;
await pool(queue, bc.concurrency, async ([url, s]) => {
  if (Date.now() > deadline) return;
  const res = await get(`${url}/merch`, { retries: 3 });
  if (res.ok) {
    const items = parseMerch(await res.text());
    s.items = items.map((i) => [i.path, i.title, i.price, i.currency, i.image, i.available ? 1 : 0]);
    s.checkedAt = now;
    s.fails = 0;
    delete s.pending;
  } else {
    await res.body?.cancel?.();
    s.fails = (s.fails || 0) + 1;
    if (res.status === 404 || s.fails >= 3) s.status = 'dead';
  }
  if (++visited % 500 === 0) console.log(`bandcamp merch: ${visited}/${queue.length}`);
  await sleep(bc.delayMs);
});

// 3. records
const out = ndjsonWriter(OUT + '.tmp');
let records = 0;
for (const [url, s] of Object.entries(sellers)) {
  if (s.status === 'dead') continue;
  const base = { shop: 'bandcamp.com', seller: s.name, sellerCountry: s.country || null, vendor: s.name, type: 'Bandcamp', updated: null };
  if (s.items) {
    for (const [p, title, price, currency, image, available] of s.items) {
      if (!available) continue;
      const artist = s.artists?.[p];
      const full = artist && !title.toLowerCase().includes(artist.toLowerCase()) ? `${artist} – ${title}` : title;
      out.write({ ...base, title: full, price, currency, image, path: url + p });
      records++;
    }
  } else {
    for (const [itemUrl, title, price, currency, image] of s.pending || []) {
      out.write({ ...base, title, price, currency, image, path: itemUrl });
      records++;
    }
  }
}
await out.close();
fs.renameSync(OUT + '.tmp', OUT);
fs.writeFileSync(STATE, zlib.gzipSync(JSON.stringify(state)));
console.log(`bandcamp done: ${visited} merch pages, ${records} records from ${Object.keys(sellers).length} sellers in ${Math.round((Date.now() - started) / 60000)} min`);
