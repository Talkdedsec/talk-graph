#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync, watch } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { tara } from '../cekirdek/tarama.mjs';
import { zenginlestir, grupla, komsuluk, budale, fark } from '../cekirdek/graf.mjs';
import { yerlesimKur } from '../cekirdek/yerlesim.mjs';
import { htmlUret } from '../cekirdek/cizim.mjs';
import { gecmisiIsle } from '../cekirdek/gecmis.mjs';
import { simgeGrafi } from '../cekirdek/simge.mjs';
import { dugumBul, anlat, enKisaYol, denetle, topluluklar } from '../cekirdek/analiz.mjs';
import { bicimler, uzantilar } from '../cekirdek/disaaktar.mjs';
import { dilSec, metinler } from '../cekirdek/dil.mjs';

const UZANTILAR = '.ts .tsx .js .jsx .mjs .cjs .py .go .rs .cs .lua .rb .php .java .vue .svelte';

const KOMUTLAR = {
  ciz: 'ciz', draw: 'ciz',
  tara: 'tara', scan: 'tara',
  anlat: 'anlat', explain: 'anlat',
  yol: 'yol', path: 'yol',
  denetle: 'denetle', audit: 'denetle',
  kume: 'kume', cluster: 'kume',
  disaaktar: 'disaaktar', export: 'disaaktar',
  fark: 'fark', diff: 'fark',
  izle: 'izle', watch: 'izle'
};

const BAYRAKLAR = {
  cikti: 'cikti', out: 'cikti', output: 'cikti',
  gorunum: 'gorunum', view: 'gorunum',
  derinlik: 'derinlik', depth: 'derinlik',
  gruplama: 'gruplama', grouping: 'gruplama',
  odak: 'odak', focus: 'odak',
  cevre: 'cevre', radius: 'cevre',
  enfazla: 'enfazla', max: 'enfazla',
  yon: 'yon', direction: 'yon',
  tema: 'tema', theme: 'tema',
  dis: 'dis', external: 'dis',
  testyok: 'testyok', 'no-tests': 'testyok',
  gun: 'gun', days: 'gun',
  gecmisyok: 'gecmisyok', 'no-history': 'gecmisyok',
  konum: 'konum', positions: 'konum',
  hepsi: 'hepsi', all: 'hepsi',
  bicim: 'bicim', format: 'bicim',
  yonsuz: 'yonsuz', undirected: 'yonsuz',
  json: 'json',
  acma: 'acma', 'no-open': 'acma',
  dil: 'dil', lang: 'dil'
};

const DEGERLER = {
  gorunum: { grup: 'grup', group: 'grup', dosya: 'dosya', file: 'dosya', simge: 'simge', symbol: 'simge' },
  yon: { sag: 'sag', right: 'sag', asagi: 'asagi', down: 'asagi' },
  gruplama: { klasor: 'klasor', folder: 'klasor', topluluk: 'topluluk', community: 'topluluk' }
};

const IMLER = new Set(['dis', 'acma', 'testyok', 'gecmisyok', 'json', 'yonsuz', 'hepsi']);
const SAYILAR = ['derinlik', 'cevre', 'enfazla', 'gun'];
const TEMALAR = ['gece', 'gunduz', 'kagit', 'murekkep', 'terminal', 'bakir', 'buz', 'mor', 'orman', 'kontrast', 'gazete'];

function yardim(m) {
  const satir = (sol, sag) => '  ' + sol.padEnd(34) + sag;
  return `talk-graph — ${m.kullanim}

${m.komutlar}
${satir('tg <yol|path>', m.k_ciz)}
${satir('tg ciz | draw <yol>', m.k_ciz)}
${satir('tg tara | scan <yol>', m.k_tara)}
${satir('tg anlat | explain <yol> <ad>', m.k_anlat)}
${satir('tg yol | path <yol> <a> <b>', m.k_yol)}
${satir('tg denetle | audit <yol>', m.k_denetle)}
${satir('tg kume | cluster <yol>', m.k_kume)}
${satir('tg disaaktar | export <yol>', m.k_disaaktar)}
${satir('tg fark | diff <a.json> <b.json>', m.k_fark)}
${satir('tg izle | watch <yol>', m.k_izle)}

${m.secenekler}
${satir('--cikti | --out <dosya>', m.s_cikti)}
${satir('--gorunum | --view <...>', m.s_gorunum)}
${satir('    grup|group  dosya|file  simge|symbol', '')}
${satir('--derinlik | --depth <n>', m.s_derinlik)}
${satir('--gruplama | --grouping <...>', m.s_gruplama)}
${satir('    klasor|folder  topluluk|community', '')}
${satir('--odak | --focus <ad>', m.s_odak)}
${satir('--cevre | --radius <n>', m.s_cevre)}
${satir('--enfazla | --max <n>', m.s_enfazla)}
${satir('--yon | --direction <...>', m.s_yon)}
${satir('    sag|right  asagi|down', '')}
${satir('--tema | --theme <ad>', m.s_tema)}
${satir('    ' + TEMALAR.join(' '), '')}
${satir('--dis | --external', m.s_dis)}
${satir('--testyok | --no-tests', m.s_testyok)}
${satir('--gun | --days <n>', m.s_gun)}
${satir('--gecmisyok | --no-history', m.s_gecmisyok)}
${satir('--konum | --positions <dosya>', m.s_konum)}
${satir('--hepsi | --all', m.s_hepsi)}
${satir('--json', m.s_json)}
${satir('--acma | --no-open', m.s_acma)}
${satir('--dil | --lang <tr|en>', m.s_dil)}
`;
}

function secenekleriAyikla(argv) {
  const s = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const ham = argv[i];
    if (!ham.startsWith('--')) { s._.push(ham); continue; }
    const yazilan = ham.slice(2);
    const ad = BAYRAKLAR[yazilan];
    if (!ad) { s.__bilinmeyen = yazilan; continue; }
    if (IMLER.has(ad)) { s[ad] = true; continue; }
    s[ad] = argv[++i];
  }
  return s;
}

function secenekleriDogrula(s, m) {
  if (s.__bilinmeyen) {
    console.error(m.hata_bayrak(s.__bilinmeyen));
    console.error(m.hata_gecerli(Object.keys(BAYRAKLAR).map(x => '--' + x).join(' ')));
    process.exit(1);
  }
  for (const [ad, harita] of Object.entries(DEGERLER)) {
    if (!s[ad]) continue;
    const cozulen = harita[s[ad]];
    if (!cozulen) {
      console.error(m.hata_deger(ad, s[ad]));
      console.error(m.hata_gecerli(Object.keys(harita).join(', ')));
      process.exit(1);
    }
    s[ad] = cozulen;
  }
  if (s.tema && !TEMALAR.includes(s.tema)) {
    console.error(m.hata_deger('tema', s.tema));
    console.error(m.hata_gecerli(TEMALAR.join(', ')));
    process.exit(1);
  }
  if (s.bicim && !bicimler[s.bicim]) {
    console.error(m.hata_bicim(Object.keys(bicimler).join(', ')));
    process.exit(1);
  }
  for (const sayisal of SAYILAR) {
    if (s[sayisal] !== undefined && !Number.isFinite(Number(s[sayisal]))) {
      console.error(m.hata_sayi(sayisal, s[sayisal]));
      process.exit(1);
    }
  }
}

function hedefiDogrula(yol, m) {
  if (yol.endsWith('.json')) {
    if (existsSync(yol)) return;
    console.error(m.hata_graf(yol));
    process.exit(1);
  }
  if (!existsSync(yol)) { console.error(m.hata_yol(resolve(yol))); process.exit(1); }
  if (!statSync(yol).isDirectory()) { console.error(m.hata_klasor(resolve(yol))); process.exit(1); }
}

function tarayiciyaGonder(yol) {
  const komut = process.platform === 'win32' ? 'cmd' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  const arg = process.platform === 'win32' ? ['/c', 'start', '', yol] : [yol];
  spawn(komut, arg, { detached: true, stdio: 'ignore' }).unref();
}

function grafHazirla(kaynak, s, m) {
  const ayar = { grupSeviyesi: Number(s.derinlik) || 2 };
  const simgeMi = s.gorunum === 'simge';
  const ham = (kaynak.endsWith('.json') && existsSync(kaynak))
    ? JSON.parse(readFileSync(kaynak, 'utf8'))
    : tara(kaynak, { testYok: !!s.testyok, simge: simgeMi });
  if (!ham.dugumler.length) {
    console.error(m.hata_kaynak(resolve(kaynak)));
    console.error(m.hata_uzanti(UZANTILAR));
    process.exit(1);
  }
  let graf = zenginlestir(ham, ayar);
  if (!s.gecmisyok) graf = gecmisiIsle(graf, Number(s.gun) || 180);
  if (!simgeMi) return graf;
  const simgeler = zenginlestir(simgeGrafi(graf, { hepsi: !!s.hepsi }), ayar);
  for (const d of simgeler.dugumler) d.grup = d.dosya;
  return simgeler;
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

function gorunumHazirla(graf, s, m) {
  let calisma = s.dis ? graf : disPaketleriAt(graf);
  if (s.gruplama === 'topluluk') calisma = topluluklaGrupla(calisma);
  if (s.odak) {
    const bulunan = dugumBul(calisma, s.odak)[0];
    if (!bulunan) { console.error(m.hata_odak(s.odak)); process.exit(1); }
    return { graf: komsuluk(calisma, bulunan.dugum.kimlik, Number(s.cevre) || 1), gorunum: 'dosya' };
  }
  const gorunum = s.gorunum || 'grup';
  if (gorunum === 'grup') calisma = grupla(calisma);
  return { graf: budale(calisma, Number(s.enfazla) || 120), gorunum };
}

function ciz(kaynak, s, m, dil) {
  const t0 = Date.now();
  const graf = grafHazirla(kaynak, s, m);
  const { graf: gorunumGrafi, gorunum } = gorunumHazirla(graf, s, m);
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
  writeFileSync(cikti, htmlUret(yerlesim, graf, { baslik: ad, gorunum, tema: s.tema, dil }), 'utf8');

  const o = graf.olcumler;
  console.log(`${ad}: ` + m.ozet_graf(o.icDugum, o.kenar, o.dongu));
  console.log(m.ozet_cizim(yerlesim.dugumler.length, yerlesim.katmanSayisi, yerlesim.kesisme));
  console.log(`${cikti}  (${Date.now() - t0} ms)`);
  return cikti;
}

function tekDugumSec(graf, terim, m) {
  const adaylar = dugumBul(graf, terim);
  if (!adaylar.length) { console.error(m.hata_eslesme(terim)); process.exit(1); }
  if (adaylar.length > 1 && adaylar[0].puan === adaylar[1].puan) {
    const esitler = adaylar.filter(a => a.puan === adaylar[0].puan);
    console.error(m.esit_eslesme(esitler.length, terim, adaylar[0].dugum.yol));
    console.error(m.digerleri(esitler.slice(1, 5).map(a => a.dugum.yol).join(', ')));
  }
  return adaylar[0].dugum;
}

function yaz(nesne, s, yazici) {
  if (s.json) { console.log(JSON.stringify(nesne, null, 2)); return; }
  yazici(nesne);
}

const argv = process.argv.slice(2);
const dilYeri = argv.findIndex(a => a === '--dil' || a === '--lang');
const dil = dilSec(dilYeri === -1 ? undefined : argv[dilYeri + 1]);
const m = metinler(dil);

if (!argv.length || ['--yardim', '--help', '-h'].includes(argv[0])) {
  console.log(yardim(m));
  process.exit(0);
}

const komut = KOMUTLAR[argv[0]] ? KOMUTLAR[argv.shift()] : 'ciz';
const s = secenekleriAyikla(argv);
const hedef = s._[0] || '.';
secenekleriDogrula(s, m);
if (komut !== 'fark') hedefiDogrula(hedef, m);

if (komut === 'tara') {
  const graf = grafHazirla(hedef, s, m);
  const cikti = resolve(s.cikti || join('cikti', basename(resolve(hedef)) + '.graf.json'));
  mkdirSync(dirname(cikti), { recursive: true });
  writeFileSync(cikti, JSON.stringify(graf, null, 2), 'utf8');
  console.log(m.ozet_tara(graf.olcumler.icDugum, graf.olcumler.kenar, cikti));

} else if (komut === 'anlat') {
  const graf = grafHazirla(hedef, s, m);
  const dugum = tekDugumSec(graf, s._[1] || '', m);
  yaz(anlat(graf, dugum.kimlik), s, a => {
    console.log(`${a.dugum.yol}  [${a.dugum.dil}${a.dugum.satirSayisi ? ', ' + a.dugum.satirSayisi : ''}]`);
    console.log(`${m.rol}: ${m.roller[a.rol] || a.rol}   ${m.kararsizlik}: ${a.kararsizlik}${a.dongude ? '   ' + m.dongude : ''}`);
    if (a.dugum.degisiklik) console.log(m.gecmis(a.dugum.degisiklik, a.dugum.yazarSayisi));
    console.log(`\n${m.cagiranlar} (${a.cagiranlar.length})`);
    for (const c of a.cagiranlar.slice(0, 20)) console.log(`  ${c.yol}${c.satir ? ':' + c.satir : ''}`);
    console.log(`\n${m.bagimliliklar} (${a.bagimliliklar.length})`);
    for (const c of a.bagimliliklar.slice(0, 20)) console.log(`  ${c.yol}${c.dis ? '  (' + m.dis + ')' : ''}${c.satir ? ':' + c.satir : ''}`);
    if (a.simgeler.length) {
      console.log(`\n${m.simgeler} (${a.simgeler.length})`);
      console.log('  ' + a.simgeler.map(x => x.ad).join(', '));
    }
  });

} else if (komut === 'yol') {
  const graf = grafHazirla(hedef, s, m);
  const a = tekDugumSec(graf, s._[1] || '', m);
  const b = tekDugumSec(graf, s._[2] || '', m);
  const adimlar = enKisaYol(graf, a.kimlik, b.kimlik, { yonlu: !s.yonsuz });
  if (!adimlar) {
    console.log(m.yol_yok(a.yol, b.yol) + (s.yonsuz ? '' : m.yonsuz_ipucu));
    process.exit(0);
  }
  yaz({ baslangic: a.yol, bitis: b.yol, adimlar }, s, () => {
    console.log(`${a.yol}  ->  ${b.yol}   (${adimlar.length} ${m.adim})`);
    const ad = k => graf.dugumler.find(x => x.kimlik === k)?.yol || k;
    for (const adim of adimlar) {
      console.log(`  ${ad(adim.kaynak)} ${adim.ileri ? '->' : '<-'} ${ad(adim.hedef)}${adim.satir ? '  :' + adim.satir : ''}`);
    }
  });

} else if (komut === 'denetle') {
  const graf = disPaketleriAt(grafHazirla(hedef, s, m));
  yaz(denetle(graf, m), s, r => {
    const o = r.olcumler;
    console.log(m.r_ozet(o.icDugum, o.kenar, o.toplamSatir) + '\n');
    if (r.uyarilar.length) { console.log(m.r_uyarilar); for (const u of r.uyarilar) console.log('  ! ' + u); console.log(); }
    if (r.donguler.length) {
      console.log(m.r_dongu(r.donguler.length));
      for (const d of r.donguler.slice(0, 5)) console.log('  ' + d.slice(0, 6).join(' -> ') + (d.length > 6 ? ' ...' : ''));
      console.log();
    }
    if (r.tanriDugumler.length) {
      console.log(m.r_tanri);
      for (const d of r.tanriDugumler) console.log(`  ${d.yol}  <-${d.gelen} ->${d.giden}`);
      console.log();
    }
    if (r.kirilganlar.length) {
      console.log(m.r_kirilgan);
      for (const d of r.kirilganlar) console.log(`  ${d.yol}  ${m.kararsizlik} ${d.kararsizlik}  <-${d.gelen} ->${d.giden}`);
      console.log();
    }
    if (r.cokDegisenler.length) {
      console.log(m.r_degisen);
      for (const d of r.cokDegisenler) console.log(`  ${d.yol}  ${d.degisiklik}  <-${d.gelen}`);
      console.log();
    }
    if (r.enUzunZincir.length) console.log(m.r_zincir(r.enUzunZincir.length) + '\n  ' + r.enUzunZincir.join('\n  ') + '\n');
    if (r.yalnizlar.length) console.log(m.r_yalniz + '\n  ' + r.yalnizlar.join('\n  '));
  });

} else if (komut === 'kume') {
  const graf = disPaketleriAt(grafHazirla(hedef, s, m));
  yaz(topluluklar(graf), s, liste => {
    console.log(m.r_topluluk(liste.length) + '\n');
    for (const k of liste.slice(0, 12)) {
      const dagilim = k.klasorSayisi > 1 ? m.r_klasore(k.klasorSayisi) : m.r_tek_klasor;
      console.log(`${k.boyut} · ${dagilim}: ${k.klasorler.slice(0, 4).join(', ')}`);
      for (const u of k.uyeler.slice(0, 6)) console.log('    ' + u);
      if (k.uyeler.length > 6) console.log(m.r_daha(k.uyeler.length - 6));
      console.log();
    }
  });

} else if (komut === 'disaaktar') {
  const bicim = s.bicim || 'json';
  const tumu = grafHazirla(hedef, s, m);
  const graf = s.dis ? tumu : disPaketleriAt(tumu);
  const kaynak = s.gorunum === 'grup' ? grupla(graf) : graf;
  const cikti = resolve(s.cikti || join('cikti', basename(resolve(hedef)) + uzantilar[bicim]));
  mkdirSync(dirname(cikti), { recursive: true });
  writeFileSync(cikti, bicimler[bicim](kaynak), 'utf8');
  console.log(m.ozet_disaaktar(kaynak.dugumler.length, kaynak.kenarlar.length, cikti));

} else if (komut === 'fark') {
  const a = JSON.parse(readFileSync(s._[0], 'utf8'));
  const b = JSON.parse(readFileSync(s._[1], 'utf8'));
  const d = fark(a, b);
  yaz(d, s, () => {
    console.log(m.f_ozet(d.eklenenDugum.length, d.silinenDugum.length, d.degisenDugum.length));
    console.log(m.f_kenar(d.eklenenKenar.length, d.silinenKenar.length));
    for (const k of d.eklenenDugum.slice(0, 15)) console.log('  + ' + k);
    for (const k of d.silinenDugum.slice(0, 15)) console.log('  - ' + k);
  });

} else if (komut === 'izle') {
  const cikti = ciz(hedef, { ...s, acma: true }, m, dil);
  if (!s.acma) tarayiciyaGonder(cikti);
  console.log(m.izleniyor);
  let zaman = null;
  watch(resolve(hedef), { recursive: true }, (_, dosya) => {
    if (!dosya || /node_modules|\.git|cikti/.test(dosya)) return;
    clearTimeout(zaman);
    zaman = setTimeout(() => {
      try { ciz(hedef, { ...s, acma: true }, m, dil); } catch (e) { console.error(m.tazeleme_hatasi(e.message)); }
    }, 400);
  });

} else {
  const cikti = ciz(hedef, s, m, dil);
  if (!s.acma) tarayiciyaGonder(cikti);
}
