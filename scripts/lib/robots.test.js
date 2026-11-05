import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots } from './robots.js';

test('robots.txt: blocks under the former bot name still apply', () => {
  const r = parseRobots('User-agent: VinylFinderBot\nDisallow: /');
  assert.equal(r.allowed('/products.json'), false);
});

test('robots.txt: specific bot group wins over *', () => {
  const r = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: LPEPFinderBot\nAllow: /\nCrawl-delay: 5');
  assert.equal(r.allowed('/products.json'), true);
  assert.equal(r.crawlDelay, 5);
});

test('robots.txt: longest match decides', () => {
  const r = parseRobots('User-agent: *\nDisallow: /wp-json/\nAllow: /wp-json/wc/store/');
  assert.equal(r.allowed('/wp-json/wc/store/v1/products'), true);
  assert.equal(r.allowed('/wp-json/wp/v2/users'), false);
});
