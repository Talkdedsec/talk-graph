import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tara } from '../cekirdek/tarama.mjs';
import { zenginlestir } from '../cekirdek/graf.mjs';
import { simgeGrafi } from '../cekirdek/simge.mjs';
import { yerlesimKur } from '../cekirdek/yerlesim.mjs';
import { ornekDepoKur } from '../araclar/ornek-depo.mjs';

const kok = ornekDepoKur();
const dosyaGrafi = tara(kok, { simge: true });
const simgeler = zenginlestir(simgeGrafi(dosyaGrafi, { hepsi: true }));
const kimlikler = new Set(simgeler.dugumler.map(d => d.kimlik));

test('ice aktarilan adlar kaynak dosyaya baglanir', () => {
  const dosya = dosyaGrafi.dugumler.find(d => d.kimlik === 'src/siparis/olustur.ts');
  assert.equal(dosya.ithal.dogrula, 'src/siparis/dogrula.ts');
  assert.equal(dosya.ithal.kayit, 'src/gunluk.ts');
});

test('cagri kenari simgeden simgeye kurulur', () => {
  assert.ok(kimlikler.has('src/siparis/olustur.ts#siparisOlustur'));
  assert.ok(kimlikler.has('src/siparis/dogrula.ts#dogrula'));
  const kenar = simgeler.kenarlar.find(k =>
    k.kaynak === 'src/siparis/olustur.ts#siparisOlustur' && k.hedef === 'src/siparis/dogrula.ts#dogrula');
  assert.ok(kenar, 'siparisOlustur -> dogrula cagri kenari yok');
  assert.equal(kenar.tur, 'cagri');
  assert.ok(kenar.satir > 0);
});

test('simge dugumu dosyasini ve satirini tasir', () => {
  const d = simgeler.dugumler.find(x => x.kimlik === 'src/siparis/dogrula.ts#dogrula');
  assert.equal(d.dosya, 'src/siparis/dogrula.ts');
  assert.ok(d.satir > 0);
  assert.equal(d.tur, 'function');
  assert.equal(d.disa, true);
});

test('dosya ici dairesel cagri simge seviyesinde de gorunur', () => {
  const ileri = simgeler.kenarlar.some(k => k.kaynak.includes('dongu/a.ts') && k.hedef.includes('dongu/b.ts'));
  const geri = simgeler.kenarlar.some(k => k.kaynak.includes('dongu/b.ts') && k.hedef.includes('dongu/a.ts'));
  assert.ok(ileri && geri, 'iki yonlu cagri kenarlari eksik');
});

test('nokta ile erisilen ad kendi simgesine baglanmaz', () => {
  assert.equal(simgeler.kenarlar.some(k => k.hedef.endsWith('#log')), false);
});

test('kapsam sayilari tutarli', () => {
  assert.equal(simgeler.kapsam.cizilen, simgeler.dugumler.length);
  assert.ok(simgeler.kapsam.simge >= simgeler.kapsam.cizilen);
  assert.ok(simgeler.kapsam.dosya > 0);
});

test('sutun sarmasi kalabalik katmani boler ve cakisma birakmaz', () => {
  const cok = { dugumler: [], kenarlar: [] };
  for (let i = 0; i < 90; i++) {
    cok.dugumler.push({ kimlik: 'd' + i, ad: 'dugum' + i, yol: 'd' + i, dil: 'ts', simgeler: [] });
  }
  cok.dugumler.push({ kimlik: 'merkez', ad: 'merkez', yol: 'merkez', dil: 'ts', simgeler: [] });
  for (let i = 0; i < 90; i++) cok.kenarlar.push({ kaynak: 'd' + i, hedef: 'merkez', tur: 'cagri', agirlik: 1 });

  const yerlesim = yerlesimKur(zenginlestir(cok));
  const ilkKatman = yerlesim.dugumler.filter(d => d.katman === 0);
  const sutunlar = new Set(ilkKatman.map(d => Math.round(d.x)));
  assert.ok(sutunlar.size >= 4, 'kalabalik katman sutunlara bolunmedi: ' + sutunlar.size);
  assert.ok(yerlesim.tuval.yukseklik < 3000, 'tuval hala cok uzun: ' + yerlesim.tuval.yukseklik);

  for (const a of yerlesim.dugumler) {
    for (const b of yerlesim.dugumler) {
      if (a === b) continue;
      const cakisma = a.x < b.x + b.genislik && b.x < a.x + a.genislik &&
        a.y < b.y + b.yukseklik && b.y < a.y + a.yukseklik;
      assert.equal(cakisma, false, `${a.kimlik} ile ${b.kimlik} cakisiyor`);
    }
  }
});
