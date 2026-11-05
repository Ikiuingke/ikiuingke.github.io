import { ndjsonReader } from '../lib/json.js';
import { loadShops, loadState } from '../lib/shops.js';
import { displayTitle } from '../lib/text.js';

/**
 * Load crawled products and order them for ranking:
 * shops interleaved round-robin (no shop floods the top), newest first within a shop.
 */
export async function loadCatalog(productFiles) {
  const state = loadState();
  const shops = new Map(loadShops().map((s) => [s.id, { ...s, state: state[s.id] || {} }]));
  const byShop = new Map();
  const bySeller = new Map();
  for (const file of productFiles) {
    for await (const p of ndjsonReader(file)) {
      if (!shops.has(p.shop) || shops.get(p.shop).disabled || !p.title) continue;
      const record = { ...p, title: displayTitle(p.title, p.vendor) };
      if (!byShop.has(p.shop)) byShop.set(p.shop, []);
      byShop.get(p.shop).push(record);
      // marketplaces (Bandcamp) interleave per seller, like separate shops
      const key = p.seller ? `${p.shop}/${p.seller}` : p.shop;
      if (!bySeller.has(key)) bySeller.set(key, []);
      bySeller.get(key).push(record);
    }
  }
  for (const list of bySeller.values()) list.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  const queues = [...bySeller.values()].sort((a, b) => b.length - a.length);
  const docs = [];
  for (let i = 0; queues.some((q) => i < q.length); i++) {
    for (const q of queues) if (i < q.length) docs.push(q[i]);
  }
  return { docs, shops, byShop };
}
