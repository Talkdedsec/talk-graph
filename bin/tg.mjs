#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, watch } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { tara } from '../cekirdek/tarama.mjs';
import { zenginlestir, grupla, komsuluk, budale, fark } from '../cekirdek/graf.mjs';
import { yerlesimKur } from '../cekirdek/yerlesim.mjs';
import { htmlUret } from '../cekirdek/cizim.mjs';

const KULLANIM = `talk-graph — kod tabanindan canli mimari haritasi

  tg <yol>                        haritayi uret ve ac
  tg ciz <yol> [secenekler]       harita uret
  tg tara <yol> --cikti g.json    ham grafi kaydet
  tg fark <eski.json> <yeni.json> iki tarama arasindaki degisim
  tg izle <yol>                   dosya degistikce haritayi tazele

secenekler
  --cikti <dosya>       html/json cikti yolu (varsayilan cikti/<ad>.html)
  --gorunum grup|dosya  paket seviyesi (varsayilan) veya dosya seviyesi
  --derinlik <n>        grup yolu derinligi (varsayilan 2)
  --odak <yol parcasi>  o dugumun komsulugunu ciz
  --cevre <n>           odak yaricapi (varsayilan 1)
  --enfazla <n>         cizilecek en fazla dugum (varsayilan 120)
  --yon sag|asagi       akis yonu (varsayilan sag)
  --dis                 dis paketleri de ciz (varsayilan disarida)
  --konum <dosya>       kaydedilmis dugum konumlarini uygula
  --acma                uretince tarayicida acma
`;

function secenekleriAyikla(argv) {
  const s = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { s._.push(a); continue; }
    const ad = a.slice(2);
    if (['dis', 'acma'].includes(ad)) { s[ad] = true; continue; }
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
  if (kaynak.endsWith('.json') && existsSync(kaynak)) {
    return zenginlestir(JSON.parse(readFileSync(kaynak, 'utf8')), { grupSeviyesi: Number(s.derinlik) || 2 });
  }
  return zenginlestir(tara(kaynak), { grupSeviyesi: Number(s.derinlik) || 2 });
}

function gorunumHazirla(graf, s) {
  let calisma = graf;
  if (!s.dis) {
    const icKume = new Set(calisma.dugumler.filter(d => !d.dis).map(d => d.kimlik));
    calisma = {
      ...calisma,
      dugumler: calisma.dugumler.filter(d => !d.dis),
      kenarlar: calisma.kenarlar.filter(k => icKume.has(k.kaynak) && icKume.has(k.hedef))
    };
  }
  if (s.odak) {
    const hedef = calisma.dugumler.find(d => d.kimlik === s.odak)
      || calisma.dugumler.find(d => d.yol && d.yol.includes(s.odak));
    if (!hedef) { console.error('odak bulunamadi: ' + s.odak); process.exit(1); }
    calisma = komsuluk(calisma, hedef.kimlik, Number(s.cevre) || 1);
    return { graf: calisma, gorunum: 'dosya' };
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
  writeFileSync(cikti, htmlUret(yerlesim, { ...graf, olcumler: graf.olcumler }, { baslik: ad, gorunum }), 'utf8');

  const o = graf.olcumler;
  console.log(`${ad}: ${o.icDugum} dosya, ${o.kenar} bag, ${o.dongu} dongu`);
  console.log(`cizim: ${yerlesim.dugumler.length} dugum, ${yerlesim.katmanSayisi} katman, ${yerlesim.kesisme} kesisme`);
  console.log(`${cikti}  (${Date.now() - t0} ms)`);
  return cikti;
}

const argv = process.argv.slice(2);
if (!argv.length || argv[0] === '--yardim' || argv[0] === '-h') {
  console.log(KULLANIM);
  process.exit(0);
}

const bilinen = ['ciz', 'tara', 'fark', 'izle'];
const komut = bilinen.includes(argv[0]) ? argv.shift() : 'ciz';
const s = secenekleriAyikla(argv);
const hedef = s._[0] || '.';

if (komut === 'tara') {
  const graf = zenginlestir(tara(hedef), { grupSeviyesi: Number(s.derinlik) || 2 });
  const cikti = resolve(s.cikti || join('cikti', basename(resolve(hedef)) + '.graf.json'));
  mkdirSync(dirname(cikti), { recursive: true });
  writeFileSync(cikti, JSON.stringify(graf, null, 2), 'utf8');
  console.log(`${graf.olcumler.icDugum} dosya, ${graf.olcumler.kenar} bag -> ${cikti}`);
} else if (komut === 'fark') {
  const a = JSON.parse(readFileSync(s._[0], 'utf8'));
  const b = JSON.parse(readFileSync(s._[1], 'utf8'));
  const d = fark(a, b);
  console.log(`+${d.eklenenDugum.length} dosya  -${d.silinenDugum.length} dosya  ~${d.degisenDugum.length} degisti`);
  console.log(`+${d.eklenenKenar.length} bag  -${d.silinenKenar.length} bag`);
  for (const k of d.eklenenDugum.slice(0, 15)) console.log('  + ' + k);
  for (const k of d.silinenDugum.slice(0, 15)) console.log('  - ' + k);
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
