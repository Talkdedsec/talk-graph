import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tara, testDosyasiMi } from '../cekirdek/tarama.mjs';
import { ornekDepoKur } from './ornek-kur.mjs';

const kok = ornekDepoKur();

test('goreli ice aktarim gercek dosyaya cozulur', () => {
  const graf = tara(kok);
  const kenar = graf.kenarlar.find(k => k.kaynak === 'src/index.ts' && k.hedef === 'src/siparis/olustur.ts');
  assert.ok(kenar, 'index -> siparis/olustur kenari yok');
  assert.equal(kenar.tur, 'ice-aktarim');
});

test('cozulemeyen ice aktarim dis paket olur', () => {
  const graf = tara(kok);
  const react = graf.dugumler.find(d => d.kimlik === 'dis:react');
  assert.ok(react, 'react dis dugumu yok');
  assert.equal(react.dis, true);
});

test('python nokta yollu ice aktarim cozulur', () => {
  const graf = tara(kok);
  const kenar = graf.kenarlar.find(k => k.kaynak === 'arac/olcum.py' && k.hedef === 'arac/yardim.py');
  assert.ok(kenar, 'python kenari cozulmedi');
});

test('disa aktarilan simgeler toplanir', () => {
  const graf = tara(kok);
  const gunluk = graf.dugumler.find(d => d.kimlik === 'src/gunluk.ts');
  assert.ok(gunluk.simgeler.some(s => s.ad === 'kayit'));
});

test('ayni ceyalt tekrarli ice aktarim tek kenarda toplanir', () => {
  const graf = tara(kok);
  const ikizler = graf.kenarlar.filter(k => k.kaynak === 'src/siparis/olustur.ts' && k.hedef === 'src/gunluk.ts');
  assert.equal(ikizler.length, 1);
});

test('test dosyalari istege bagli dislanir', () => {
  assert.equal(testDosyasiMi('src/index.test.ts'), true);
  assert.equal(testDosyasiMi('src/index.ts'), false);
  const graf = tara(kok, { testYok: true });
  assert.equal(graf.dugumler.some(d => d.kimlik === 'src/index.test.ts'), false);
});

test('kendine bagimlilik kenari uretilmez', () => {
  const graf = tara(kok);
  assert.equal(graf.kenarlar.some(k => k.kaynak === k.hedef), false);
});
