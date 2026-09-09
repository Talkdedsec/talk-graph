import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tara } from '../cekirdek/tarama.mjs';
import { zenginlestir } from '../cekirdek/graf.mjs';
import { yerlesimKur } from '../cekirdek/yerlesim.mjs';
import { htmlUret } from '../cekirdek/cizim.mjs';
import { ornekDepoKur } from './ornek-kur.mjs';

const kok = ornekDepoKur();
const graf = zenginlestir(tara(kok));
const yerlesim = yerlesimKur(graf);

test('her dugum yerlestirilir ve olculur', () => {
  assert.equal(yerlesim.dugumler.length, graf.dugumler.length);
  for (const d of yerlesim.dugumler) {
    assert.ok(Number.isFinite(d.x) && Number.isFinite(d.y), d.kimlik + ' konumsuz');
    assert.ok(d.genislik > 0 && d.yukseklik > 0);
  }
});

test('ayni katmandaki dugumler cakismaz', () => {
  const katmanlar = new Map();
  for (const d of yerlesim.dugumler) {
    if (!katmanlar.has(d.katman)) katmanlar.set(d.katman, []);
    katmanlar.get(d.katman).push(d);
  }
  for (const [katman, liste] of katmanlar) {
    liste.sort((a, b) => a.y - b.y);
    for (let i = 1; i < liste.length; i++) {
      assert.ok(liste[i].y >= liste[i - 1].y + liste[i - 1].yukseklik - 0.5,
        `katman ${katman}: ${liste[i - 1].kimlik} ile ${liste[i].kimlik} cakisiyor`);
    }
  }
});

test('her kenar cizilebilir bir yol uretir', () => {
  assert.equal(yerlesim.kenarlar.length, graf.kenarlar.length);
  for (const k of yerlesim.kenarlar) {
    assert.match(k.yol, /^M [\d.-]+ [\d.-]+/);
    assert.ok(k.noktalar.length >= 2);
  }
});

test('dairesel bagimlilik kenari isaretlenir', () => {
  assert.ok(yerlesim.kenarlar.some(k => k.dongude));
});

test('tuval tum dugumleri kapsar', () => {
  const t = yerlesim.tuval;
  for (const d of yerlesim.dugumler) {
    assert.ok(d.x >= t.x && d.y >= t.y);
    assert.ok(d.x + d.genislik <= t.x + t.genislik);
    assert.ok(d.y + d.yukseklik <= t.y + t.yukseklik);
  }
});

test('uretilen html tek dosya ve calistirilabilir veri tasir', () => {
  const html = htmlUret(yerlesim, graf, { baslik: 'ornek' });
  assert.match(html, /^<!doctype html>/);
  assert.ok(!/<script[^>]+src=/.test(html), 'dis script referansi var');
  assert.ok(!/<link[^>]+href=/.test(html), 'dis stil referansi var');
  assert.ok(html.includes('window.TG_VERI'));
  assert.ok(!html.includes('</script>' + 'x'), 'veri kacisi bozuk');
  const eslesme = html.match(/window\.TG_VERI = (.*);\n/);
  const veri = JSON.parse(eslesme[1].split('\\u003c').join('<'));
  assert.equal(veri.yerlesim.dugumler.length, yerlesim.dugumler.length);
});
