#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, watch } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { tara } from '../cekirdek/tarama.mjs';
import { zenginlestir, grupla, komsuluk, budale, fark } from '../cekirdek/graf.mjs';
import { yerlesimKur } from '../cekirdek/yerlesim.mjs';
import { htmlUret } from '../cekirdek/cizim.mjs';
import { gecmisiIsle } from '../cekirdek/gecmis.mjs';
import { dugumBul, anlat, enKisaYol, denetle, topluluklar } from '../cekirdek/analiz.mjs';
import { bicimler, uzantilar } from '../cekirdek/disaaktar.mjs';

const KULLANIM = `talk-graph — kod tabanindan canli mimari haritasi

  tg <yol>                         haritayi uret ve ac
  tg ciz <yol> [secenekler]        harita uret
  tg tara <yol> --cikti g.json     ham grafi kaydet
  tg anlat <yol> <arama>           bir dugumu acikla: rol, cagiranlar, bagimliliklar
  tg yol <yol> <a> <b>             iki dugum arasindaki en kisa zinciri bul
  tg denetle <yol>                 saglik raporu: donguler, tanri dugumler, riskli dosyalar
  tg kume <yol>                    baglantiya gore topluluk bul, klasorlerle karsilastir
  tg disaaktar <yol> --bicim dot   dot | graphml | csv | mermaid | json
  tg fark <eski.json> <yeni.json>  iki tarama arasindaki degisim
  tg izle <yol>                    dosya degistikce haritayi tazele

secenekler
  --cikti <dosya>       html/json cikti yolu (varsayilan cikti/<ad>.html)
  --gorunum grup|dosya  paket seviyesi (varsayilan) veya dosya seviyesi
  --derinlik <n>        grup yolu derinligi (varsayilan 2)
  --gruplama klasor|topluluk  gruplari klasore gore mi baglantiya gore mi kur
  --odak <yol parcasi>  o dugumun komsulugunu ciz
  --cevre <n>           odak yaricapi (varsayilan 1)
  --enfazla <n>         cizilecek en fazla dugum (varsayilan 120)
  --yon sag|asagi       akis yonu (varsayilan sag)
  --tema <ad>           acilis temasi: gece gunduz kagit murekkep terminal
                        bakir buz mor orman kontrast gazete
  --dis                 dis paketleri de ciz (varsayilan disarida)
  --testyok             test dosyalarini disla
  --gun <n>             git gecmisi penceresi, gun (varsayilan 180)
  --gecmisyok           git gecmisi katmanini okuma
  --konum <dosya>       kaydedilmis dugum konumlarini uygula
  --json                cozumleme komutlarinin ciktisini JSON ver
  --acma                uretince tarayicida acma
`;

const IMLER = ['dis', 'acma', 'testyok', 'gecmisyok', 'json', 'yonsuz'];

function secenekleriAyikla(argv) {
  const s = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { s._.push(a); continue; }
    const ad = a.slice(2);
    if (IMLER.includes(ad)) { s[ad] = true; continue; }
    s[ad] = argv[++i];
  }
  return s;
}

function tarayiciyaGonder(yol) {
  const komut = process.platform === 'win32' ? 'cmd' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  const arg = process.platform === 'win32' ? ['/c', 'start', '', yol] : [yol];
  spawn(komut, arg, { detached: true, stdio: 'ignore' }).unref();
}

function grafHazirla(kaynak, s) {
  const ayar = { grupSeviyesi: Number(s.derinlik) || 2 };
  const ham = (kaynak.endsWith('.json') && existsSync(kaynak))
    ? JSON.parse(readFileSync(kaynak, 'utf8'))
    : tara(kaynak, { testYok: !!s.testyok });
  const graf = zenginlestir(ham, ayar);
  return s.gecmisyok ? graf : gecmisiIsle(graf, Number(s.gun) || 180);
}

function disPaketleriAt(graf) {
  const icKume = new Set(graf.dugumler.filter(d => !d.dis).map(d => d.kimlik));
  return {
    ...graf,
    dugumler: graf.dugumler.filter(d => !d.dis),
    kenarlar: graf.kenarlar.filter(k => icKume.has(k.kaynak) && icKume.has(k.hedef))
  };
}

function topluluklaGrupla(graf) {
  const kumeler = topluluklar(graf);
  const yolBul = new Map(graf.dugumler.map(d => [d.yol, d]));
  kumeler.forEach((k, i) => {
    const ad = 'topluluk ' + (i + 1);
    for (const yol of k.uyeler) {
      const d = yolBul.get(yol);
      if (d) d.grup = ad;
    }
  });
  return graf;
}

function gorunumHazirla(graf, s) {
  let calisma = s.dis ? graf : disPaketleriAt(graf);
  if (s.gruplama === 'topluluk') calisma = topluluklaGrupla(calisma);
  if (s.odak) {
    const bulunan = dugumBul(calisma, s.odak)[0];
    if (!bulunan) { console.error('odak bulunamadi: ' + s.odak); process.exit(1); }
    return { graf: komsuluk(calisma, bulunan.dugum.kimlik, Number(s.cevre) || 1), gorunum: 'dosya' };
  }
  const gorunum = s.gorunum || 'grup';
  if (gorunum === 'grup') calisma = grupla(calisma);
  return { graf: budale(calisma, Number(s.enfazla) || 120), gorunum };
}

function ciz(kaynak, s) {
  const t0 = Date.now();
  const graf = grafHazirla(kaynak, s);
  const { graf: gorunumGrafi, gorunum } = gorunumHazirla(graf, s);
  const yerlesim = yerlesimKur(gorunumGrafi, { yon: s.yon || 'sag' });

  if (s.konum && existsSync(s.konum)) {
    const kayitli = JSON.parse(readFileSync(s.konum, 'utf8'));
    const harita = new Map(kayitli.dugumler.map(d => [d.kimlik, d]));
    for (const d of yerlesim.dugumler) {
      const k = harita.get(d.kimlik);
      if (k) { d.x = k.x; d.y = k.y; }
    }
  }

  const ad = basename(resolve(kaynak).replace(/\.json$/, ''));
  const cikti = resolve(s.cikti || join('cikti', ad + '.html'));
  mkdirSync(dirname(cikti), { recursive: true });
  writeFileSync(cikti, htmlUret(yerlesim, graf, { baslik: ad, gorunum, tema: s.tema }), 'utf8');

  const o = graf.olcumler;
  console.log(`${ad}: ${o.icDugum} dosya, ${o.kenar} bag, ${o.dongu} dongu`);
  console.log(`cizim: ${yerlesim.dugumler.length} dugum, ${yerlesim.katmanSayisi} katman, ${yerlesim.kesisme} kesisme`);
  console.log(`${cikti}  (${Date.now() - t0} ms)`);
  return cikti;
}

function tekDugumSec(graf, terim) {
  const adaylar = dugumBul(graf, terim);
  if (!adaylar.length) {
    console.error(`eslesme yok: ${terim}`);
    process.exit(1);
  }
  if (adaylar.length > 1 && adaylar[0].puan === adaylar[1].puan) {
    const esitler = adaylar.filter(a => a.puan === adaylar[0].puan);
    console.error(`"${terim}" icin ${esitler.length} esit eslesme, secilen: ${adaylar[0].dugum.yol}`);
    console.error('  digerleri: ' + esitler.slice(1, 5).map(a => a.dugum.yol).join(', '));
  }
  return adaylar[0].dugum;
}

function yaz(nesne, s, metinYazici) {
  if (s.json) { console.log(JSON.stringify(nesne, null, 2)); return; }
  metinYazici(nesne);
}

const argv = process.argv.slice(2);
if (!argv.length || argv[0] === '--yardim' || argv[0] === '-h') {
  console.log(KULLANIM);
  process.exit(0);
}

const bilinen = ['ciz', 'tara', 'fark', 'izle', 'anlat', 'yol', 'denetle', 'kume', 'disaaktar'];
const komut = bilinen.includes(argv[0]) ? argv.shift() : 'ciz';
const s = secenekleriAyikla(argv);
const hedef = s._[0] || '.';

if (komut === 'tara') {
  const graf = grafHazirla(hedef, s);
  const cikti = resolve(s.cikti || join('cikti', basename(resolve(hedef)) + '.graf.json'));
  mkdirSync(dirname(cikti), { recursive: true });
  writeFileSync(cikti, JSON.stringify(graf, null, 2), 'utf8');
  console.log(`${graf.olcumler.icDugum} dosya, ${graf.olcumler.kenar} bag -> ${cikti}`);

} else if (komut === 'anlat') {
  const graf = grafHazirla(hedef, s);
  const dugum = tekDugumSec(graf, s._[1] || '');
  const sonuc = anlat(graf, dugum.kimlik);
  yaz(sonuc, s, a => {
    console.log(`${a.dugum.yol}  [${a.dugum.dil}${a.dugum.satirSayisi ? ', ' + a.dugum.satirSayisi + ' satir' : ''}]`);
    console.log(`rol: ${a.rol}   kararsizlik: ${a.kararsizlik}${a.dongude ? '   DONGUDE' : ''}`);
    if (a.dugum.degisiklik) console.log(`gecmis: ${a.dugum.degisiklik} degisiklik, ${a.dugum.yazarSayisi} yazar`);
    console.log(`\ncagiranlar (${a.cagiranlar.length})`);
    for (const c of a.cagiranlar.slice(0, 20)) console.log(`  ${c.yol}${c.satir ? ':' + c.satir : ''}`);
    console.log(`\nbagimliliklar (${a.bagimliliklar.length})`);
    for (const c of a.bagimliliklar.slice(0, 20)) console.log(`  ${c.yol}${c.dis ? '  (dis)' : ''}${c.satir ? ':' + c.satir : ''}`);
    if (a.simgeler.length) {
      console.log(`\nsimgeler (${a.simgeler.length})`);
      console.log('  ' + a.simgeler.map(x => x.ad).join(', '));
    }
  });

} else if (komut === 'yol') {
  const graf = grafHazirla(hedef, s);
  const a = tekDugumSec(graf, s._[1] || '');
  const b = tekDugumSec(graf, s._[2] || '');
  const adimlar = enKisaYol(graf, a.kimlik, b.kimlik, { yonlu: !s.yonsuz });
  if (!adimlar) {
    console.log(`${a.yol} -> ${b.yol}: yol yok${s.yonsuz ? '' : ' (yonsuz denemek icin --yonsuz)'}`);
    process.exit(0);
  }
  yaz({ baslangic: a.yol, bitis: b.yol, adimlar }, s, () => {
    console.log(`${a.yol}  ->  ${b.yol}   (${adimlar.length} adim)`);
    const ad = k => graf.dugumler.find(x => x.kimlik === k)?.yol || k;
    for (const adim of adimlar) {
      console.log(`  ${ad(adim.kaynak)} ${adim.ileri ? '->' : '<-'} ${ad(adim.hedef)}${adim.satir ? '  :' + adim.satir : ''}`);
    }
  });

} else if (komut === 'denetle') {
  const graf = disPaketleriAt(grafHazirla(hedef, s));
  const rapor = denetle(graf);
  yaz(rapor, s, r => {
    const o = r.olcumler;
    console.log(`${o.icDugum} dosya, ${o.kenar} bag, ${o.toplamSatir} satir\n`);
    if (r.uyarilar.length) { console.log('uyarilar'); for (const u of r.uyarilar) console.log('  ! ' + u); console.log(); }
    if (r.donguler.length) {
      console.log(`dairesel bagimlilik (${r.donguler.length} kume)`);
      for (const d of r.donguler.slice(0, 5)) console.log('  ' + d.slice(0, 6).join(' -> ') + (d.length > 6 ? ' ...' : ''));
      console.log();
    }
    if (r.tanriDugumler.length) {
      console.log('en bagli dugumler');
      for (const d of r.tanriDugumler) console.log(`  ${d.yol}  <-${d.gelen} ->${d.giden}`);
      console.log();
    }
    if (r.kirilganlar.length) {
      console.log('hem cagrilan hem cok baglanan (kirilgan)');
      for (const d of r.kirilganlar) console.log(`  ${d.yol}  kararsizlik ${d.kararsizlik}  <-${d.gelen} ->${d.giden}`);
      console.log();
    }
    if (r.cokDegisenler.length) {
      console.log('en cok degisenler');
      for (const d of r.cokDegisenler) console.log(`  ${d.yol}  ${d.degisiklik} degisiklik  <-${d.gelen}`);
      console.log();
    }
    if (r.enUzunZincir.length) console.log(`en uzun bagimlilik zinciri: ${r.enUzunZincir.length} adim\n  ` + r.enUzunZincir.join('\n  ') + '\n');
    if (r.yalnizlar.length) console.log('yalniz dosyalar\n  ' + r.yalnizlar.join('\n  '));
  });

} else if (komut === 'kume') {
  const graf = disPaketleriAt(grafHazirla(hedef, s));
  const kumeler = topluluklar(graf);
  yaz(kumeler, s, liste => {
    console.log(`${liste.length} topluluk\n`);
    for (const k of liste.slice(0, 12)) {
      const dagilim = k.klasorSayisi > 1 ? `${k.klasorSayisi} klasore dagilmis` : 'tek klasor';
      console.log(`${k.boyut} dosya, ${dagilim}: ${k.klasorler.slice(0, 4).join(', ')}`);
      for (const u of k.uyeler.slice(0, 6)) console.log('    ' + u);
      if (k.uyeler.length > 6) console.log(`    ... ${k.uyeler.length - 6} dosya daha`);
      console.log();
    }
  });

} else if (komut === 'disaaktar') {
  const bicim = s.bicim || 'json';
  if (!bicimler[bicim]) {
    console.error('bilinmeyen bicim: ' + bicim + '  (dot, graphml, csv, mermaid, json)');
    process.exit(1);
  }
  const tumu = grafHazirla(hedef, s);
  const graf = s.dis ? tumu : disPaketleriAt(tumu);
  const kaynak = (s.gorunum || 'dosya') === 'grup' ? grupla(graf) : graf;
  const ad = basename(resolve(hedef));
  const cikti = resolve(s.cikti || join('cikti', ad + uzantilar[bicim]));
  mkdirSync(dirname(cikti), { recursive: true });
  writeFileSync(cikti, bicimler[bicim](kaynak), 'utf8');
  console.log(`${kaynak.dugumler.length} dugum, ${kaynak.kenarlar.length} bag -> ${cikti}`);

} else if (komut === 'fark') {
  const a = JSON.parse(readFileSync(s._[0], 'utf8'));
  const b = JSON.parse(readFileSync(s._[1], 'utf8'));
  const d = fark(a, b);
  yaz(d, s, () => {
    console.log(`+${d.eklenenDugum.length} dosya  -${d.silinenDugum.length} dosya  ~${d.degisenDugum.length} degisti`);
    console.log(`+${d.eklenenKenar.length} bag  -${d.silinenKenar.length} bag`);
    for (const k of d.eklenenDugum.slice(0, 15)) console.log('  + ' + k);
    for (const k of d.silinenDugum.slice(0, 15)) console.log('  - ' + k);
  });

} else if (komut === 'izle') {
  const cikti = ciz(hedef, { ...s, acma: true });
  if (!s.acma) tarayiciyaGonder(cikti);
  console.log('izleniyor, cikmak icin Ctrl+C');
  let zaman = null;
  watch(resolve(hedef), { recursive: true }, (_, dosya) => {
    if (!dosya || /node_modules|\.git|cikti/.test(dosya)) return;
    clearTimeout(zaman);
    zaman = setTimeout(() => {
      try { ciz(hedef, { ...s, acma: true }); } catch (e) { console.error('tazeleme hatasi: ' + e.message); }
    }, 400);
  });

} else {
  const cikti = ciz(hedef, s);
  if (!s.acma) tarayiciyaGonder(cikti);
}
