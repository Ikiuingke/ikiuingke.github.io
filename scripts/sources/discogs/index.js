import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { config } from '../../lib/config.js';
import { GENERATED } from '../../lib/paths.js';
import { ndjsonWriter } from '../../lib/json.js';
import { loadShops, loadState } from '../../lib/shops.js';
import { keepProduct } from '../../platforms/filter.js';
import { discogsClient, inventory, toRecord } from './inventory.js';

/**
 * Independent shops that sell their stock through a Discogs seller account
 * (and have no Shopify/WooCommerce catalog we read): read that inventory with the
 * official Discogs API. Sellers are refreshed in rotation, oldest first, within
 * `maxMinutes` per run. Output: generated/products-discogs.ndjson.gz.
 */
const dc = config.discogs;
const STATE = path.join(GENERATED, 'discogs-state.json.gz');
const OUT = path.join(GENERATED, 'products-discogs.ndjson.gz');
const started = Date.now();
const deadline = started + (Number(process.env.DISCOGS_MINUTES) || dc.maxMinutes) * 60_000;
const now = new Date().toISOString();

const shopState = loadState();
const saved = fs.existsSync(STATE) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(STATE))) : { sellers: {} };
const shops = loadShops()
  .filter((s) => !s.disabled)
  .map((s) => ({ id: s.id, seller: s.discogsSeller || shopState[s.id]?.discogsSeller, status: shopState[s.id]?.status }))
  // only shops whose own catalog we can't read, so records are not listed twice
  .filter((s) => s.seller && s.status === 'listed');

const request = discogsClient();
const queue = [...shops].sort((a, b) => (saved.sellers[a.seller]?.checkedAt || '').localeCompare(saved.sellers[b.seller]?.checkedAt || ''));
let refreshed = 0;
for (const shop of queue) {
  if (Date.now() > deadline) break;
  const prev = saved.sellers[shop.seller];
  if (prev?.checkedAt && Date.now() - Date.parse(prev.checkedAt) < dc.refreshDays * 864e5 && prev.complete) continue;
  const items = [];
  let complete = true;
  for await (const listings of inventory(request, shop.seller, dc.maxPagesPerSeller)) {
    for (const l of listings) {
      const r = toRecord(l);
      if (r.title && keepProduct(r.title, `${r.title} ${r.type || ''}`, false)) items.push(r);
    }
    if (Date.now() > deadline) { complete = false; break; }
  }
  // keep a partial read only if it found more than we had
  if (complete || items.length > (prev?.items?.length || 0)) {
    saved.sellers[shop.seller] = { shop: shop.id, checkedAt: now, complete, items };
    refreshed++;
    console.log(shop.id, shop.seller, items.length, complete ? '' : '(partial)');
  }
}

const active = new Map(shops.map((s) => [s.seller, s.id]));
const out = ndjsonWriter(OUT + '.tmp');
let records = 0;
for (const [seller, s] of Object.entries(saved.sellers)) {
  if (!active.has(seller)) continue;
  for (const r of s.items) { out.write({ shop: active.get(seller), ...r }); records++; }
}
await out.close();
fs.renameSync(OUT + '.tmp', OUT);
fs.writeFileSync(STATE, zlib.gzipSync(JSON.stringify(saved)));
console.log(`discogs done: ${refreshed} sellers refreshed, ${records} records from ${active.size} shops in ${Math.round((Date.now() - started) / 60000)} min`);
