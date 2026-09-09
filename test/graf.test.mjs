import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tara } from '../cekirdek/tarama.mjs';
import { zenginlestir, grupla, komsuluk, budale, fark } from '../cekirdek/graf.mjs';
import { ornekDepoKur } from '../araclar/ornek-depo.mjs';

const kok = ornekDepoKur();
const graf = zenginlestir(tara(kok));

test('dairesel bagimlilik bulunur', () => {
  assert.equal(graf.olcumler.dongu, 1);
  const a = graf.dugumler.find(d => d.kimlik === 'src/dongu/a.ts');
  const b = graf.dugumler.find(d => d.kimlik === 'src/dongu/b.ts');
  assert.equal(a.dongu, b.dongu);
  assert.notEqual(a.dongu, null);
});

test('cagrilma sayisi dogru', () => {
  const gunluk = graf.dugumler.find(d => d.kimlik === 'src/gunluk.ts');
  assert.equal(gunluk.gelenSayisi, 3);
  assert.equal(gunluk.gidenSayisi, 0);
});

test('gruplama klasore gore toplar', () => {
  const toplu = grupla(graf);
  const siparis = toplu.dugumler.find(d => d.ad === 'src/siparis');
  assert.ok(siparis);
  assert.equal(siparis.uyeSayisi, 2);
  assert.equal(toplu.kenarlar.some(k => k.kaynak === k.hedef), false);
});

test('komsuluk yaricapi sinirlar', () => {
  const alt = komsuluk(graf, 'src/gunluk.ts', 1);
  assert.ok(alt.dugumler.length >= 4);
  assert.ok(alt.dugumler.every(d => d.kimlik === 'src/gunluk.ts' ||
    graf.kenarlar.some(k => (k.kaynak === d.kimlik && k.hedef === 'src/gunluk.ts') ||
      (k.hedef === d.kimlik && k.kaynak === 'src/gunluk.ts'))));
});

test('budama en bagli dugumleri korur', () => {
  const budanmis = budale(graf, 4);
  assert.equal(budanmis.dugumler.length, 4);
  assert.ok(budanmis.dugumler.some(d => d.kimlik === 'src/gunluk.ts'));
  const kalan = new Set(budanmis.dugumler.map(d => d.kimlik));
  assert.ok(budanmis.kenarlar.every(k => kalan.has(k.kaynak) && kalan.has(k.hedef)));
});

test('fark eklenen ve silinen dugumleri ayirir', () => {
  const eski = { dugumler: graf.dugumler.slice(1), kenarlar: [] };
  const d = fark(eski, { dugumler: graf.dugumler, kenarlar: [] });
  assert.equal(d.eklenenDugum.length, 1);
  assert.equal(d.silinenDugum.length, 0);
});
