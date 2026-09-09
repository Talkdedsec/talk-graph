import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tara } from '../cekirdek/tarama.mjs';
import { zenginlestir } from '../cekirdek/graf.mjs';
import { dugumBul, anlat, enKisaYol, denetle, topluluklar } from '../cekirdek/analiz.mjs';
import { bicimler } from '../cekirdek/disaaktar.mjs';
import { ornekDepoKur } from '../araclar/ornek-depo.mjs';

const kok = ornekDepoKur();
const graf = zenginlestir(tara(kok));

test('arama tam dosya adini test dosyasinin onune koyar', () => {
  const sonuc = dugumBul(graf, 'index.ts');
  assert.equal(sonuc[0].dugum.kimlik, 'src/index.ts');
});

test('anlat rolu ve kararsizligi hesaplar', () => {
  const testsiz = zenginlestir(tara(kok, { testYok: true }));
  const giris = anlat(testsiz, 'src/index.ts');
  assert.equal(giris.rol, 'giris noktasi');
  assert.equal(giris.kararsizlik, 1);
  assert.equal(anlat(graf, 'src/index.ts').rol, 'ara katman');

  const yaprak = anlat(graf, 'src/gunluk.ts');
  assert.equal(yaprak.rol, 'yaprak / yardimci');
  assert.equal(yaprak.cagiranlar.length, 3);
  assert.ok(yaprak.cagiranlar.every(c => c.satir > 0));
});

test('anlat dongudeki dugumu isaretler', () => {
  assert.equal(anlat(graf, 'src/dongu/a.ts').dongude, true);
  assert.equal(anlat(graf, 'src/gunluk.ts').dongude, false);
});

test('en kisa yol zinciri dogru siralar', () => {
  const adimlar = enKisaYol(graf, 'src/index.ts', 'src/siparis/dogrula.ts');
  assert.equal(adimlar.length, 2);
  assert.equal(adimlar[0].kaynak, 'src/index.ts');
  assert.equal(adimlar[adimlar.length - 1].hedef, 'src/siparis/dogrula.ts');
});

test('ters yonde yol yok, yonsuz aramada var', () => {
  assert.equal(enKisaYol(graf, 'src/gunluk.ts', 'src/index.ts'), null);
  assert.ok(enKisaYol(graf, 'src/gunluk.ts', 'src/index.ts', { yonlu: false }));
});

test('denetim dongu ve uyari uretir', () => {
  const rapor = denetle(graf);
  assert.equal(rapor.donguler.length, 1);
  assert.equal(rapor.donguler[0].length, 2);
  assert.ok(rapor.uyarilar.some(u => u.includes('dairesel')));
  assert.ok(rapor.enUzunZincir.length >= 3);
});

test('topluluk bolumleri butun dugumleri kapsar ve ayriktir', () => {
  const kumeler = topluluklar(graf);
  const tumUyeler = kumeler.flatMap(k => k.uyeler);
  const icSayisi = graf.dugumler.filter(d => !d.dis).length;
  assert.equal(new Set(tumUyeler).size, tumUyeler.length);
  assert.ok(tumUyeler.length <= icSayisi);
  assert.ok(kumeler.every(k => k.boyut === k.uyeler.length));
});

test('dot ciktisi her dugum ve kenari tasir', () => {
  const metin = bicimler.dot(graf);
  assert.match(metin, /^digraph talkgraph \{/);
  assert.equal((metin.match(/->/g) || []).length, graf.kenarlar.length);
  for (const d of graf.dugumler) assert.ok(metin.includes(`"${d.kimlik}"`), d.kimlik + ' dot ciktisinda yok');
});

test('graphml gecerli sayida dugum ve kenar dugumu uretir', () => {
  const metin = bicimler.graphml(graf);
  assert.equal((metin.match(/<node /g) || []).length, graf.dugumler.length);
  assert.equal((metin.match(/<edge /g) || []).length, graf.kenarlar.length);
  assert.ok(!/<node id="[^"]*[<>&]/.test(metin));
});

test('csv basligi ve satir sayisi tutar', () => {
  const satirlar = bicimler.csv(graf).trim().split('\n');
  assert.equal(satirlar[0], 'kaynak,hedef,tur,satir,agirlik,dongude');
  assert.equal(satirlar.length - 1, graf.kenarlar.length);
});

test('gecersiz secenek degerleri CLI tarafindan reddedilir', async () => {
  const { execFileSync } = await import('node:child_process');
  const kos = (...arg) => {
    try {
      execFileSync(process.execPath, ['bin/tg.mjs', ...arg], { encoding: 'utf8', stdio: 'pipe' });
      return { kod: 0, hata: '' };
    } catch (e) {
      return { kod: e.status, hata: String(e.stderr || '') };
    }
  };
  const yanlisGorunum = kos('ciz', '.', '--gorunum', 'sacma', '--acma');
  assert.equal(yanlisGorunum.kod, 1);
  assert.match(yanlisGorunum.hata, /gecerli: grup, dosya, simge/);

  const yokYol = kos('ciz', './boyle-bir-klasor-yok', '--acma');
  assert.equal(yokYol.kod, 1);
  assert.match(yokYol.hata, /yol bulunamadi/);

  const yanlisSayi = kos('ciz', '.', '--enfazla', 'cok', '--acma');
  assert.equal(yanlisSayi.kod, 1);
  assert.match(yanlisSayi.hata, /bir sayi olmali/);
});

test('mermaid ciktisi flowchart olarak baslar', () => {
  const metin = bicimler.mermaid(graf);
  assert.match(metin, /^flowchart LR/);
  assert.ok(!metin.includes('["["'));
});
