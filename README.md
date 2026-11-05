# Vinyl Finder

Search engine for vinyl records in stock at independent record shops worldwide:
https://vinyl-finder.gitlab.io (formerly lpepfinder).

Everything runs on free GitLab CI and GitLab Pages: no server, no database, no paid service.

```
data/shops/*.json ──▶ refresh (CI schedule) ──▶ generated/ ──▶ pages (CI) ──▶ GitLab Pages
                      discover  OSM shops         shops-state.json   search index  dist/
                      check     every shop        products.ndjson.gz Astro site
                      crawl     Shopify / Woo
```

## How it works

1. **Shops** are curated in `data/shops/<host>.json`, one file per shop ([schema](data/schemas/shop.schema.json)).
2. **Discover** (`npm run discover`, monthly): finds record shops with a website on OpenStreetMap,
   checks them, and keeps those whose catalog we can read.
3. **Check** (`npm run check`): for every shop, is it up, does robots.txt allow us, which platform is it,
   does it still sell records? Dead, moved, duplicated, non-music and blocked shops are excluded automatically.
   Results: `generated/shops-state.json`, shown on `/status/`.
4. **Crawl** (`npm run crawl`): reads public catalogs (Shopify `products.json`, WooCommerce Store API),
   keeps in-stock records, one request at a time per shop. Output: `generated/products.ndjson.gz`.
5. **Build** (`npm run build`): writes a static, sharded search index to `public/search/` and builds the
   Astro site (search, shops by country, shop pages, artist pages, sitemap) into `dist/`.

Search runs in the browser: `<vf-search>` downloads only the index shards for the words you type.

## Commands

```sh
npm install
npm run check      # check all shops (or: npm run check -- <host part>)
npm run crawl      # crawl catalogs (CRAWL_LIMIT=20 for a quick local test)
npm run discover   # find new shops on OpenStreetMap (-- --write saves them to data/shops)
npm run build      # validate data, build index and site into dist/
npm run dev        # Astro dev server
npm test
```

## Editing data

- **Add a shop**: add `data/shops/<host>.json` with at least `{ "url": "https://host" }`, or open an issue
  with the "shop" template. The weekly check fills in name, platform and country.
- **Remove a shop** (owner request): set `"disabled": true`. Shops can also block `VinylFinderBot` in robots.txt.
- **Texts and translations**: `data/i18n/<lang>.json`. **Settings**: `data/config.json`
  (crawl limits, product filters, SEO thresholds, ads and analytics IDs).

## CI

- `refresh` runs on pipeline schedules (and on manual/API pipelines with `REFRESH=1`; add `DISCOVER=1` to
  also look for new shops). It downloads the previous `generated/` data so shops that fail keep their records.
- `pages` runs on `main` and deploys `dist/`. It refuses to deploy when there is no crawl data yet.

Schedules (CI/CD → Schedules): the 1st of the month with `DISCOVER=1`, and the 15th, both at 03:00 UTC.
A crawl takes about an hour, which keeps the project inside the free 400 CI minutes per month.

## Layout

```
data/        shops, config, i18n, schemas (CMS-editable JSON)
scripts/     Node pipeline: check, crawl, discover, index, data validation
src/         Astro site: pages, layouts, components (vf-* custom elements), search client
public/      static files (favicon, verification); public/search is generated
```

Web code follows the classless style: semantic HTML and `vf-*` custom elements, state in attributes,
CSS variables, all strings in `data/i18n`.
