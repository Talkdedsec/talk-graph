import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const buradaki = dirname(fileURLToPath(import.meta.url));
const kanvas = join(buradaki, '..', 'kanvas');

function kacir(metin) {
  return String(metin).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TERS = String.fromCharCode(92);
const SATIR_AYIRICI = [String.fromCharCode(0x2028), String.fromCharCode(0x2029)];

function guvenliJson(nesne) {
  let metin = JSON.stringify(nesne).split('<').join(TERS + 'u003c');
  for (const ayirici of SATIR_AYIRICI) {
    metin = metin.split(ayirici).join(TERS + 'u' + ayirici.charCodeAt(0).toString(16));
  }
  return metin;
}

export function htmlUret(yerlesim, graf, secenekler = {}) {
  const stil = readFileSync(join(kanvas, 'stil.css'), 'utf8');
  const motor = readFileSync(join(kanvas, 'motor.js'), 'utf8');
  const o = graf.olcumler || {};
  const baslik = secenekler.baslik || graf.ad || 'harita';

  const veri = {
    yerlesim: {
      dugumler: yerlesim.dugumler.map(d => ({
        kimlik: d.kimlik, ad: d.ad, yol: d.yol, dil: d.dil, dis: !!d.dis,
        x: Math.round(d.x), y: Math.round(d.y),
        genislik: Math.round(d.genislik), yukseklik: Math.round(d.yukseklik),
        satirSayisi: d.satirSayisi || 0, uyeSayisi: d.uyeSayisi || 0,
        degisiklik: d.degisiklik || 0, sonDokunma: d.sonDokunma || 0,
        dosya: d.dosya || '', satir: d.satir || 0, tur: d.tur || '',
        yazarSayisi: d.yazarSayisi || 0,
        simgeler: (d.simgeler || []).slice(0, 14)
      })),
      kenarlar: yerlesim.kenarlar.map(k => ({
        kaynak: k.kaynak, hedef: k.hedef, tur: k.tur, satir: k.satir || 0,
        agirlik: k.agirlik || 1, dongude: !!k.dongude, uzun: !!k.uzun, yol: k.yol,
        noktalar: k.noktalar.map(n => ({ x: Math.round(n.x), y: Math.round(n.y) }))
      })),
      gruplar: yerlesim.gruplar.map(g => ({
        ad: g.ad, x: Math.round(g.x), y: Math.round(g.y),
        genislik: Math.round(g.genislik), yukseklik: Math.round(g.yukseklik), uyeSayisi: g.uyeSayisi
      })),
      tuval: {
        x: Math.round(yerlesim.tuval.x), y: Math.round(yerlesim.tuval.y),
        genislik: Math.round(yerlesim.tuval.genislik), yukseklik: Math.round(yerlesim.tuval.yukseklik)
      }
    },
    meta: {
      ad: baslik,
      kok: (graf.kok || '').replace(/\\/g, '/'),
      gorunum: secenekler.gorunum || 'grup',
      tarandi: graf.tarandi,
      kesisme: yerlesim.kesisme,
      katman: yerlesim.katmanSayisi,
      gecmisEnFazla: Math.max(0, ...yerlesim.dugumler.map(d => d.degisiklik || 0))
    }
  };

  const olcumSatiri = [
    `<b>${o.icDugum ?? veri.yerlesim.dugumler.length}</b> düğüm`,
    `<b>${o.kenar ?? veri.yerlesim.kenarlar.length}</b> bağ`,
    o.dongu ? `<b>${o.dongu}</b> döngü` : null,
    o.disPaket ? `<b>${o.disPaket}</b> dış paket` : null,
    o.yalniz ? `<b>${o.yalniz}</b> yalnız` : null
  ].filter(Boolean).join('  ·  ');

  return `<!doctype html>
<html lang="tr" data-tema="${secenekler.tema || 'gece'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${kacir(baslik)} · talk-graph</title>
<style>${stil}</style>
</head>
<body>
<svg id="tuval" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="izgara" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="var(--cizgi)" opacity=".5"/>
    </pattern>
  </defs>
  <rect class="zemin-desen" x="-20000" y="-20000" width="60000" height="60000" fill="url(#izgara)" opacity=".5"/>
  <g id="sahne">
    <g id="kat-grup"></g>
    <g id="kat-kenar"></g>
    <g id="kat-dugum"></g>
  </g>
</svg>

<div class="panel" id="ust">
  <div class="ad">${kacir(baslik)} <span>· ${kacir({ grup: 'paket görünümü', dosya: 'dosya görünümü', simge: 'simge görünümü' }[veri.meta.gorunum] || 'harita')}</span></div>
  <div class="olcum">${olcumSatiri}</div>
  <div class="bosluk"></div>
  <input id="ara" type="search" placeholder="ara  /  →  dosya, klasör, simge" autocomplete="off">
  <button class="dugme" id="sigdir-dugme" title="f">sığdır</button>
  <button class="dugme" id="tema-dugme" title="t">tema</button>
</div>

<div class="panel" id="tema-menu"></div>

<div class="panel" id="sonuc"></div>
<div class="panel" id="detay"></div>

<div class="panel" id="alt">
  <button class="dugme" id="akis-dugme" title="a">akış</button>
  <button class="dugme" id="dongu-dugme">döngüler</button>
  <button class="dugme" id="isi-dugme">değişim</button>
  <button class="dugme" id="dis-dugme">dış paketler</button>
  <button class="dugme" id="png-dugme">png</button>
  <button class="dugme" id="svg-dugme">svg</button>
  <button class="dugme" id="kaydet-dugme">kaydet</button>
  <span class="ipucu">sürükle · tekerlek yakınlaştırır · düğümü taşı</span>
</div>

<div id="kucukharita"></div>
<div id="bildirim"></div>

<script>window.TG_VERI = ${guvenliJson(veri)};
window.TG_STIL = ${guvenliJson(stil)};</script>
<script>${motor}</script>
</body>
</html>`;
}
