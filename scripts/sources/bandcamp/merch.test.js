import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMerch } from './merch.js';

const html = `<li data-item-id="1"
  class="merch-grid-item"><a href="/album/nosr-005-c-fe-approaching-the-gaz-giant"><div class="art"><img src="/img/43.gif" data-original="https://f4.bcbits.com/img/1_37.jpg" alt="" class=" lazy"/></div>
  <p class="title">No Suit Records 005 - C/Fe - Approaching The Gaz Giant &ndash; 12&quot; - 147 copies</p></a>
  <div class="merchtype secondaryText">Vinyl </div><p class="price "><span class="price">€6</span><span class="currency">EUR</span></p></li>
<li data-item-id="2" class="merch-grid-item"><a href="/album/sold"><p class="title">Old one &ndash; 12&quot;</p></a>
  <div class="merchtype secondaryText">Vinyl</div><p class="price sold-out"> Sold Out </p></li>
<li data-item-id="3" class="merch-grid-item"><a href="/merch/shirt"><p class="title">Logo shirt</p></a><div class="merchtype secondaryText">T-Shirt/Apparel</div></li>`;

test('parseMerch keeps physical music items with price and stock', () => {
  const items = parseMerch(html);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    path: '/album/nosr-005-c-fe-approaching-the-gaz-giant',
    title: 'No Suit Records 005 - C/Fe - Approaching The Gaz Giant',
    format: 'Vinyl', price: 600, currency: 'EUR', image: '//f4.bcbits.com/img/1_37.jpg', available: true,
  });
  assert.equal(items[1].available, false);
});
