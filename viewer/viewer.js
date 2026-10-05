const AS = 'http://www.w3.org/2000/svg';
const veri = window.TG_VERI;
const dugumler = veri.yerlesim.dugumler;
const kenarlar = veri.yerlesim.kenarlar;
const gruplar = veri.yerlesim.gruplar || [];
const dugumHarita = new Map(dugumler.map(d => [d.kimlik, d]));
const yazi = veri.meta.metin || {};
const KENAR_ETIKETI = yazi.kenar || {};

function grupTonu(ad) {
  let h = 0;
  for (let i = 0; i < ad.length; i++) h = (h * 31 + ad.charCodeAt(i)) >>> 0;
  return (h % 12) * 30 + ((h >> 8) % 14);
}

const grupRenkleri = new Map();
function grupRengi(ad) {
  if (!ad) return 'var(--cizgi-guclu)';
  if (!grupRenkleri.has(ad)) grupRenkleri.set(ad, `hsl(${grupTonu(ad)} 64% 58%)`);
  return grupRenkleri.get(ad);
}

const DIL_RENGI = {
  ts: '#4c9aff', js: '#f2c744', python: '#5cc8a8', rust: '#ff8a5c',
  csharp: '#a77cff', go: '#4fd4e0', lua: '#5c7cff', ruby: '#ff5c6c',
  php: '#8c8cff', java: '#ffa04c', grup: '#7c5cff', dis: '#646e7c'
};

const tuval = document.getElementById('tuval');
const sahne = document.getElementById('sahne');
const katmanGrup = document.getElementById('kat-grup');
const katmanKenar = document.getElementById('kat-kenar');
const katmanDugum = document.getElementById('kat-dugum');

let gorunum = { x: 0, y: 0, olcek: 1 };
let secili = null;
let odakli = false;
let disGoster = true;
const dugumOge = new Map();
const kenarOge = new Map();
const komsular = new Map();

for (const d of dugumler) komsular.set(d.kimlik, { giden: [], gelen: [] });
for (const k of kenarlar) {
  komsular.get(k.kaynak)?.giden.push(k);
  komsular.get(k.hedef)?.gelen.push(k);
}

const dereceler = dugumler
  .map(d => (komsular.get(d.kimlik)?.gelen.length || 0) + (komsular.get(d.kimlik)?.giden.length || 0))
  .sort((a, b) => a - b);
const onemEsigi = Math.max(3, dereceler[Math.floor(dereceler.length * 0.85)] || 3);

function ogeKur(ad, ozellikler = {}, ebeveyn = null) {
  const o = document.createElementNS(AS, ad);
  for (const [k, v] of Object.entries(ozellikler)) o.setAttribute(k, v);
  if (ebeveyn) ebeveyn.appendChild(o);
  return o;
}

function kisalt(metin, enFazla) {
  return metin.length <= enFazla ? metin : metin.slice(0, enFazla - 1) + '…';
}

function gruplariCiz() {
  for (const g of gruplar) {
    ogeKur('rect', { class: 'grup-kutu', x: g.x, y: g.y, width: g.genislik, height: g.yukseklik }, katmanGrup);
    const e = ogeKur('text', { class: 'grup-etiket', x: g.x + 14, y: g.y + 17 }, katmanGrup);
    e.textContent = g.ad + '  ·  ' + g.uyeSayisi;
  }
}

function okUcu(kenar) {
  const n = kenar.noktalar;
  if (n.length < 2) return null;
  const son = n[n.length - 1], onceki = n[n.length - 2];
  const aci = Math.atan2(son.y - onceki.y, son.x - onceki.x) * 180 / Math.PI;
  return { x: son.x, y: son.y, aci };
}

function kenarlariCiz() {
  for (const k of kenarlar) {
    const g = ogeKur('g', { class: 'kenar-grup' }, katmanKenar);
    const yol = ogeKur('path', {
      class: 'kenar ' + k.tur + (k.dongude ? ' dongude' : '') + (k.uzun ? ' uzun' : ''),
      d: k.yol,
      'stroke-width': Math.min(3, 1.1 + Math.log2((k.agirlik || 1) + 1) * 0.4)
    }, g);
    ogeKur('path', { class: 'akis', d: k.yol }, g);
    const uc = okUcu(k);
    if (uc) {
      ogeKur('path', {
        class: 'kenar-ok' + (k.dongude ? ' dongude' : ''),
        d: 'M 0 0 L -9.5 -4 L -9.5 4 Z',
        transform: `translate(${uc.x} ${uc.y}) rotate(${uc.aci})`
      }, g);
    }
    kenarOge.set(k, { grup: g, yol, ok: g.querySelector('.kenar-ok') });
  }
}

function dugumleriCiz() {
  for (const d of dugumler) {
    const g = ogeKur('g', {
      class: 'dugum' + (d.dis ? ' dis' : ''),
      transform: `translate(${d.x} ${d.y})`,
      'data-kimlik': d.kimlik
    }, katmanDugum);
    const govde = ogeKur('rect', {
      class: 'govde', x: 0, y: 0, width: d.genislik, height: d.yukseklik, rx: 9
    }, g);
    const derecePayi = Math.min(1, ((komsular.get(d.kimlik)?.gelen.length || 0) +
      (komsular.get(d.kimlik)?.giden.length || 0)) / Math.max(6, onemEsigi * 2));
    if (derecePayi > 0.15) govde.setAttribute('stroke-width', (1 + derecePayi * 2.2).toFixed(2));
    ogeKur('rect', {
      class: 'serit', x: 0, y: 0, width: 3.5, height: d.yukseklik, rx: 2,
      fill: d.grup ? grupRengi(d.grup) : (DIL_RENGI[d.dil] || 'var(--cizgi-guclu)')
    }, g);
    if (d.degisiklik) {
      ogeKur('rect', {
        class: 'isi', x: 0, y: 0, width: d.genislik, height: d.yukseklik, rx: 9,
        fill: isiRengi(d.degisiklik), opacity: 0
      }, g);
    }
    const baslik = ogeKur('text', { class: 'baslik', x: 14, y: d.uyeSayisi || d.yol !== d.ad ? 20 : 27 }, g);
    baslik.textContent = kisalt(d.ad || d.kimlik, Math.floor((d.genislik - 30) / 7.1));
    const altMetin = d.uyeSayisi ? d.uyeSayisi + ' dosya' : (d.yol !== d.ad ? d.yol : '');
    if (altMetin) {
      const alt = ogeKur('text', { class: 'alt', x: 14, y: 34 }, g);
      alt.textContent = kisalt(altMetin, Math.floor((d.genislik - 30) / 5.9));
    }
    const bag = komsular.get(d.kimlik);
    if (((bag?.gelen.length || 0) + (bag?.giden.length || 0)) >= onemEsigi) g.classList.add('onemli');
    const derece = (bag?.gelen.length || 0);
    if (derece > 0) {
      const r = ogeKur('text', { class: 'rozet', x: d.genislik - 12, y: 17, 'text-anchor': 'end' }, g);
      r.textContent = '←' + derece;
    }
    g.addEventListener('pointerdown', e => dugumTutma(e, d, g));
    g.addEventListener('click', e => { e.stopPropagation(); if (!surukleniyorDugum) sec(d.kimlik); });
    dugumOge.set(d.kimlik, g);
  }
}

function isiRengi(degisiklik) {
  const enFazla = veri.meta.gecmisEnFazla || 1;
  const oran = Math.min(1, Math.log2(degisiklik + 1) / Math.log2(enFazla + 1));
  const ton = 210 - oran * 210;
  return `hsl(${ton} 78% 56%)`;
}

function isiDegistir() {
  const dugme = document.getElementById('isi-dugme');
  if (!veri.meta.gecmisEnFazla) { bildir(yazi.b_gecmisYok); return; }
  const acik = dugme.classList.toggle('acik');
  document.body.classList.toggle('isi-acik', acik);
  bildir(acik ? yazi.b_isiAcik : yazi.b_isiKapali);
}

const DURUM_ANAHTARI = 'tg-durum:' + veri.meta.ad + ':' + veri.meta.gorunum;

function durumuYaz() {
  clearTimeout(durumuYaz.zaman);
  durumuYaz.zaman = setTimeout(() => {
    try {
      sessionStorage.setItem(DURUM_ANAHTARI, JSON.stringify({
        gorunum, secili, dugumSayisi: dugumler.length
      }));
    } catch {}
  }, 250);
}

function durumuOku() {
  try {
    const ham = sessionStorage.getItem(DURUM_ANAHTARI);
    if (!ham) return null;
    const d = JSON.parse(ham);
    return d && d.gorunum && Number.isFinite(d.gorunum.olcek) ? d : null;
  } catch { return null; }
}

function ayrintiSeviyesi() {
  const o = gorunum.olcek;
  document.body.classList.toggle('uzak', o < 0.5);
  document.body.classList.toggle('cok-uzak', o < 0.24);
}

function gorunumUygula() {
  sahne.setAttribute('transform', `translate(${gorunum.x} ${gorunum.y}) scale(${gorunum.olcek})`);
  ayrintiSeviyesi();
  kucukHaritaGuncelle();
  durumuYaz();
}

function sigdir(hedefKutu) {
  const kutu = hedefKutu || veri.yerlesim.tuval;
  const yanAcik = document.getElementById('yan')?.classList.contains('acik');
  const solBosluk = yanAcik ? 266 : 24;
  const sagBosluk = document.getElementById('detay')?.style.display === 'block' ? 348 : 24;
  const ustBosluk = 62, altBosluk = 58;
  const g = tuval.clientWidth - solBosluk - sagBosluk;
  const y = tuval.clientHeight - ustBosluk - altBosluk;
  const olcek = Math.min(g / kutu.genislik, y / kutu.yukseklik, 1.6);
  gorunum.olcek = olcek;
  gorunum.x = solBosluk + g / 2 - (kutu.x + kutu.genislik / 2) * olcek;
  gorunum.y = ustBosluk + y / 2 - (kutu.y + kutu.yukseklik / 2) * olcek;
  gorunumUygula();
}

let suruklemeBaslangic = null;
tuval.addEventListener('pointerdown', e => {
  if (e.target.closest('.dugum')) return;
  suruklemeBaslangic = { x: e.clientX, y: e.clientY, gx: gorunum.x, gy: gorunum.y };
  tuval.classList.add('suruklenir');
  tuval.setPointerCapture(e.pointerId);
});
tuval.addEventListener('pointermove', e => {
  if (!suruklemeBaslangic) return;
  gorunum.x = suruklemeBaslangic.gx + (e.clientX - suruklemeBaslangic.x);
  gorunum.y = suruklemeBaslangic.gy + (e.clientY - suruklemeBaslangic.y);
  gorunumUygula();
});
tuval.addEventListener('pointerup', e => {
  suruklemeBaslangic = null;
  tuval.classList.remove('suruklenir');
  try { tuval.releasePointerCapture(e.pointerId); } catch {}
});
tuval.addEventListener('click', e => { if (!e.target.closest('.dugum')) sec(null); });

tuval.addEventListener('wheel', e => {
  e.preventDefault();
  const carpan = Math.exp(-e.deltaY * 0.0016);
  const yeni = Math.max(0.06, Math.min(4, gorunum.olcek * carpan));
  const oran = yeni / gorunum.olcek;
  gorunum.x = e.clientX - (e.clientX - gorunum.x) * oran;
  gorunum.y = e.clientY - (e.clientY - gorunum.y) * oran;
  gorunum.olcek = yeni;
  gorunumUygula();
}, { passive: false });

let surukleniyorDugum = null;
function dugumTutma(olay, dugum, oge) {
  if (olay.button !== 0) return;
  olay.stopPropagation();
  const baslangic = { x: olay.clientX, y: olay.clientY, dx: dugum.x, dy: dugum.y };
  let hareketEtti = false;
  const hareket = e => {
    const kaymaX = (e.clientX - baslangic.x) / gorunum.olcek;
    const kaymaY = (e.clientY - baslangic.y) / gorunum.olcek;
    if (Math.abs(kaymaX) + Math.abs(kaymaY) > 2) hareketEtti = true;
    dugum.x = baslangic.dx + kaymaX;
    dugum.y = baslangic.dy + kaymaY;
    oge.setAttribute('transform', `translate(${dugum.x} ${dugum.y})`);
    kenarlariYenidenCiz(dugum.kimlik);
  };
  const birak = e => {
    window.removeEventListener('pointermove', hareket);
    window.removeEventListener('pointerup', birak);
    surukleniyorDugum = null;
    if (hareketEtti) { degistiIsareti = true; bildir(yazi.b_konum); }
    setTimeout(() => { surukleniyorDugum = null; }, 0);
  };
  surukleniyorDugum = dugum.kimlik;
  window.addEventListener('pointermove', hareket);
  window.addEventListener('pointerup', birak);
}

let degistiIsareti = false;

function kenarYoluHesapla(k) {
  const a = dugumHarita.get(k.kaynak), b = dugumHarita.get(k.hedef);
  if (!a || !b) return k.yol;
  const p1 = { x: a.x + a.genislik, y: a.y + a.yukseklik / 2 };
  const p2 = { x: b.x, y: b.y + b.yukseklik / 2 };
  const orta = (p1.x + p2.x) / 2;
  return `M ${p1.x} ${p1.y} L ${orta} ${p1.y} L ${orta} ${p2.y} L ${p2.x} ${p2.y}`;
}

function kenarlariYenidenCiz(kimlik) {
  const ilgili = [...(komsular.get(kimlik)?.giden || []), ...(komsular.get(kimlik)?.gelen || [])];
  for (const k of ilgili) {
    const oge = kenarOge.get(k);
    if (!oge) continue;
    const yeniYol = kenarYoluHesapla(k);
    oge.yol.setAttribute('d', yeniYol);
    oge.grup.querySelector('.akis')?.setAttribute('d', yeniYol);
    const b = dugumHarita.get(k.hedef);
    if (oge.ok && b) {
      oge.ok.setAttribute('transform', `translate(${b.x} ${b.y + b.yukseklik / 2}) rotate(0)`);
    }
  }
}

function sec(kimlik) {
  secili = kimlik;
  durumuYaz();
  for (const [k, oge] of dugumOge) oge.classList.toggle('secili', k === kimlik);
  if (!kimlik) {
    document.getElementById('detay').style.display = 'none';
    solgunlukTemizle();
    return;
  }
  const d = dugumHarita.get(kimlik);
  const bag = komsular.get(kimlik);
  const yakin = new Set([kimlik, ...bag.giden.map(k => k.hedef), ...bag.gelen.map(k => k.kaynak)]);
  for (const [k, oge] of dugumOge) oge.classList.toggle('solgun', !yakin.has(k));
  for (const [k, oge] of kenarOge) {
    const ilgili = k.kaynak === kimlik || k.hedef === kimlik;
    oge.yol.classList.toggle('vurgulu', ilgili);
    oge.yol.classList.toggle('solgun', !ilgili);
    oge.ok?.classList.toggle('vurgulu', ilgili);
  }
  detayGoster(d, bag);
}

function solgunlukTemizle() {
  for (const oge of dugumOge.values()) oge.classList.remove('solgun');
  for (const oge of kenarOge.values()) {
    oge.yol.classList.remove('vurgulu', 'solgun');
    oge.ok?.classList.remove('vurgulu');
  }
}

function detayGoster(d, bag) {
  const p = document.getElementById('detay');
  const simgeler = (d.simgeler || []).slice(0, 12);
  const listeYap = (kenarListesi, alan) => kenarListesi.slice(0, 14).map(k => {
    const o = dugumHarita.get(k[alan]);
    return `<li data-git="${k[alan]}">${o ? o.ad : k[alan]}<span class="tur"> ${k.satir ? ':' + k.satir : ''}</span></li>`;
  }).join('') || `<li class="tur">${yazi.yok}</li>`;

  p.innerHTML = `
    <h2>${d.ad || d.kimlik}</h2>
    <div class="yol">${d.tur ? d.tur + ' · ' : ''}${d.yol || ''}</div>
    <div class="kutucuk">
      <div><b>${bag.gelen.length}</b><span>${yazi.cagiran}</span></div>
      <div><b>${bag.giden.length}</b><span>${yazi.bagimlilik}</span></div>
      <div><b>${d.satirSayisi || d.uyeSayisi || 0}</b><span>${d.uyeSayisi ? yazi.dosya : yazi.satir}</span></div>
    </div>
    ${d.degisiklik ? `<div class="kutucuk"><div><b>${d.degisiklik}</b><span>${yazi.degisiklikPencere}</span></div><div><b>${d.yazarSayisi || '-'}</b><span>${yazi.yazar}</span></div><div><b>${d.sonDokunma ? Math.round((Date.now() - d.sonDokunma) / 86400000) : '-'}</b><span>${yazi.gunOnce}</span></div></div>` : ''}
    ${simgeler.length ? `<h3>${yazi.simgeler}</h3><ul>${simgeler.map(s => `<li>${s.ad}<span class="tur"> ${s.tur}</span></li>`).join('')}</ul>` : ''}
    <h3>${yazi.kullananlar}</h3><ul>${listeYap(bag.gelen, 'kaynak')}</ul>
    <h3>${yazi.kullandiklari}</h3><ul>${listeYap(bag.giden, 'hedef')}</ul>
    <div class="eylem">
      ${d.dis ? '' : `<button class="dugme" id="editorde">${yazi.editorde}</button>`}
      <button class="dugme" id="odakla">${yazi.odakla}</button>
    </div>`;
  p.style.display = 'block';
  p.querySelectorAll('li[data-git]').forEach(li => {
    li.addEventListener('click', () => { sec(li.dataset.git); dugumeGit(li.dataset.git); });
  });
  p.querySelector('#editorde')?.addEventListener('click', () => {
    const tam = (veri.meta.kok + '/' + d.yol).replace(/\\/g, '/');
    window.location.href = 'vscode://file/' + tam;
  });
  p.querySelector('#odakla')?.addEventListener('click', () => dugumeGit(d.kimlik, true));
}

function dugumeGit(kimlik, yakinlas) {
  const d = dugumHarita.get(kimlik);
  if (!d) return;
  const olcek = yakinlas ? Math.max(gorunum.olcek, 0.9) : gorunum.olcek;
  gorunum.olcek = olcek;
  gorunum.x = tuval.clientWidth / 2 - (d.x + d.genislik / 2) * olcek;
  gorunum.y = tuval.clientHeight / 2 - (d.y + d.yukseklik / 2) * olcek;
  gorunumUygula();
}

const araKutu = document.getElementById('ara');
const sonucKutu = document.getElementById('sonuc');
let sonuclar = [], etkinSonuc = 0;

araKutu.addEventListener('input', () => {
  const q = araKutu.value.trim().toLowerCase();
  if (!q) { sonucKutu.style.display = 'none'; solgunlukTemizle(); return; }
  sonuclar = dugumler
    .map(d => ({ d, puan: eslesme(d, q) }))
    .filter(x => x.puan > 0)
    .sort((a, b) => b.puan - a.puan)
    .slice(0, 40);
  etkinSonuc = 0;
  sonucKutu.innerHTML = sonuclar.map((x, i) =>
    `<div class="satir ${i === 0 ? 'etkin' : ''}" data-kimlik="${x.d.kimlik}">${x.d.ad}<div class="y">${x.d.yol}</div></div>`
  ).join('') || `<div class="satir y">${yazi.eslesmeYok}</div>`;
  sonucKutu.style.display = 'block';
  sonucKutu.querySelectorAll('.satir[data-kimlik]').forEach(s => {
    s.addEventListener('click', () => { sec(s.dataset.kimlik); dugumeGit(s.dataset.kimlik, true); sonucKutu.style.display = 'none'; });
  });
  const bulunan = new Set(sonuclar.map(x => x.d.kimlik));
  for (const [k, oge] of dugumOge) oge.classList.toggle('solgun', !bulunan.has(k));
});

function eslesme(d, q) {
  const ad = (d.ad || '').toLowerCase(), yol = (d.yol || '').toLowerCase();
  if (ad === q) return 100;
  if (ad.startsWith(q)) return 80;
  if (ad.includes(q)) return 60;
  if (yol.includes(q)) return 40;
  if ((d.simgeler || []).some(s => s.ad.toLowerCase().includes(q))) return 30;
  return 0;
}

araKutu.addEventListener('keydown', e => {
  if (e.key === 'Escape') { araKutu.value = ''; araKutu.blur(); sonucKutu.style.display = 'none'; solgunlukTemizle(); return; }
  if (!sonuclar.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    etkinSonuc = (etkinSonuc + (e.key === 'ArrowDown' ? 1 : -1) + sonuclar.length) % sonuclar.length;
    sonucKutu.querySelectorAll('.satir').forEach((s, i) => s.classList.toggle('etkin', i === etkinSonuc));
  }
  if (e.key === 'Enter') {
    const hedef = sonuclar[etkinSonuc];
    if (hedef) { sec(hedef.d.kimlik); dugumeGit(hedef.d.kimlik, true); sonucKutu.style.display = 'none'; }
  }
});

document.addEventListener('keydown', e => {
  if (e.target === araKutu) return;
  if (e.key === '/') { e.preventDefault(); araKutu.focus(); }
  if (e.key === 'f') sigdir();
  if (e.key === 'Escape') { sec(null); }
  if (e.key === 't') temaSirala(e.shiftKey ? -1 : 1);
  if (e.key === 'a') akisDegistir();
});

const TEMALAR = [
  { kimlik: 'gece', ad: 'Gece' },
  { kimlik: 'gunduz', ad: 'Gunduz' },
  { kimlik: 'kagit', ad: 'Kagit' },
  { kimlik: 'murekkep', ad: 'Murekkep' },
  { kimlik: 'terminal', ad: 'Terminal' },
  { kimlik: 'bakir', ad: 'Bakir' },
  { kimlik: 'buz', ad: 'Buz' },
  { kimlik: 'mor', ad: 'Mor' },
  { kimlik: 'orman', ad: 'Orman' },
  { kimlik: 'kontrast', ad: 'Kontrast' },
  { kimlik: 'gazete', ad: 'Gazete' }
];

function temaUygula(kimlik) {
  document.documentElement.dataset.tema = kimlik;
  try { localStorage.setItem('tg-tema', kimlik); } catch {}
  temaMenusunuTazele();
}

function temaMenusunuTazele() {
  const etkin = document.documentElement.dataset.tema;
  for (const oge of document.querySelectorAll('#tema-menu .tema-satir')) {
    oge.classList.toggle('etkin', oge.dataset.tema === etkin);
  }
}

function temaMenusunuKur() {
  const menu = document.getElementById('tema-menu');
  menu.innerHTML = TEMALAR.map(t => `<button class="tema-satir" data-tema="${t.kimlik}">
      <span class="ornek" data-o="${t.kimlik}"></span>${t.ad}</button>`).join('');
  for (const oge of menu.querySelectorAll('.tema-satir')) {
    oge.addEventListener('click', () => { temaUygula(oge.dataset.tema); menu.classList.remove('acik'); });
  }
  temaMenusunuTazele();
}

function temaDegistir() {
  const menu = document.getElementById('tema-menu');
  menu.classList.toggle('acik');
}

function temaSirala(adim) {
  const su = document.documentElement.dataset.tema;
  const i = Math.max(0, TEMALAR.findIndex(t => t.kimlik === su));
  temaUygula(TEMALAR[(i + adim + TEMALAR.length) % TEMALAR.length].kimlik);
  bildir(yazi.b_tema(TEMALAR[(i + adim + TEMALAR.length) % TEMALAR.length].ad));
}

function akisDegistir() {
  document.body.classList.toggle('akis-acik');
  document.getElementById('akis-dugme')?.classList.toggle('acik');
}

function disDegistir() {
  disGoster = !disGoster;
  document.getElementById('dis-dugme')?.classList.toggle('acik', !disGoster);
  for (const d of dugumler) {
    if (!d.dis) continue;
    const oge = dugumOge.get(d.kimlik);
    if (oge) oge.style.display = disGoster ? '' : 'none';
  }
  for (const [k, oge] of kenarOge) {
    const gizle = !disGoster && (dugumHarita.get(k.hedef)?.dis || dugumHarita.get(k.kaynak)?.dis);
    oge.grup.style.display = gizle ? 'none' : '';
  }
}

function dongulariVurgula() {
  const dugme = document.getElementById('dongu-dugme');
  const acik = dugme.classList.toggle('acik');
  const donguKenarlar = kenarlar.filter(k => k.dongude);
  if (!donguKenarlar.length) { bildir(yazi.b_donguYok); dugme.classList.remove('acik'); return; }
  if (!acik) { solgunlukTemizle(); return; }
  const dahil = new Set(donguKenarlar.flatMap(k => [k.kaynak, k.hedef]));
  for (const [k, oge] of dugumOge) oge.classList.toggle('solgun', !dahil.has(k));
  for (const [k, oge] of kenarOge) {
    oge.yol.classList.toggle('solgun', !k.dongude);
    oge.yol.classList.toggle('vurgulu', !!k.dongude);
  }
  bildir(yazi.b_donguKenar(donguKenarlar.length));
}

const kucukHarita = document.getElementById('kucukharita');
const khSvg = ogeKur('svg', { viewBox: `${veri.yerlesim.tuval.x} ${veri.yerlesim.tuval.y} ${veri.yerlesim.tuval.genislik} ${veri.yerlesim.tuval.yukseklik}`, preserveAspectRatio: 'xMidYMid meet' }, kucukHarita);
let khGorunum = null;
function kucukHaritaCiz() {
  for (const d of dugumler) {
    ogeKur('rect', { class: 'kh-dugum', x: d.x, y: d.y, width: d.genislik, height: d.yukseklik, rx: 6 }, khSvg);
  }
  khGorunum = ogeKur('rect', { class: 'kh-gorunum', x: 0, y: 0, width: 10, height: 10, rx: 4 }, khSvg);
}
function kucukHaritaGuncelle() {
  if (!khGorunum) return;
  const g = tuval.clientWidth / gorunum.olcek;
  const y = tuval.clientHeight / gorunum.olcek;
  khGorunum.setAttribute('x', -gorunum.x / gorunum.olcek);
  khGorunum.setAttribute('y', -gorunum.y / gorunum.olcek);
  khGorunum.setAttribute('width', g);
  khGorunum.setAttribute('height', y);
}
kucukHarita.addEventListener('click', e => {
  const kutu = kucukHarita.getBoundingClientRect();
  const t = veri.yerlesim.tuval;
  const oran = Math.min(kutu.width / t.genislik, kutu.height / t.yukseklik);
  const kaymaX = (kutu.width - t.genislik * oran) / 2;
  const kaymaY = (kutu.height - t.yukseklik * oran) / 2;
  const hedefX = t.x + (e.clientX - kutu.left - kaymaX) / oran;
  const hedefY = t.y + (e.clientY - kutu.top - kaymaY) / oran;
  gorunum.x = tuval.clientWidth / 2 - hedefX * gorunum.olcek;
  gorunum.y = tuval.clientHeight / 2 - hedefY * gorunum.olcek;
  gorunumUygula();
});

function bildir(metin) {
  const b = document.getElementById('bildirim');
  b.textContent = metin;
  b.classList.add('gorunur');
  clearTimeout(bildir.zaman);
  bildir.zaman = setTimeout(() => b.classList.remove('gorunur'), 2200);
}

function svgMetni() {
  const kopya = document.getElementById('tuval').cloneNode(true);
  const t = veri.yerlesim.tuval;
  kopya.setAttribute('viewBox', `${t.x} ${t.y} ${t.genislik} ${t.yukseklik}`);
  kopya.setAttribute('width', t.genislik);
  kopya.setAttribute('height', t.yukseklik);
  kopya.querySelector('#sahne')?.removeAttribute('transform');
  const kokStil = getComputedStyle(document.documentElement);
  const degiskenler = ['--zemin', '--zemin-2', '--yuzey', '--yuzey-ust', '--cizgi', '--cizgi-guclu',
    '--metin', '--metin-2', '--metin-3', '--vurgu', '--vurgu-2', '--uyari', '--tehlike', '--iyi']
    .map(d => `${d}:${kokStil.getPropertyValue(d).trim()}`).join(';');
  const stil = document.createElementNS(AS, 'style');
  stil.textContent = `:root{${degiskenler}}\n` + window.TG_STIL;
  kopya.insertBefore(stil, kopya.firstChild);
  const arka = document.createElementNS(AS, 'rect');
  arka.setAttribute('x', t.x); arka.setAttribute('y', t.y);
  arka.setAttribute('width', t.genislik); arka.setAttribute('height', t.yukseklik);
  arka.setAttribute('fill', kokStil.getPropertyValue('--zemin').trim());
  kopya.insertBefore(arka, stil.nextSibling);
  return new XMLSerializer().serializeToString(kopya);
}

function indir(ad, icerik, tur) {
  const bag = document.createElement('a');
  bag.href = URL.createObjectURL(new Blob([icerik], { type: tur }));
  bag.download = ad;
  bag.click();
  setTimeout(() => URL.revokeObjectURL(bag.href), 4000);
}

function svgDisaAktar() {
  indir(veri.meta.ad + '.svg', svgMetni(), 'image/svg+xml');
  bildir(yazi.b_svg);
}

function pngDisaAktar() {
  const t = veri.yerlesim.tuval;
  const olcek = Math.min(2, 4000 / Math.max(t.genislik, t.yukseklik));
  const gorsel = new Image();
  gorsel.onload = () => {
    const c = document.createElement('canvas');
    c.width = Math.round(t.genislik * olcek);
    c.height = Math.round(t.yukseklik * olcek);
    const ctx = c.getContext('2d');
    ctx.drawImage(gorsel, 0, 0, c.width, c.height);
    c.toBlob(b => {
      const bag = document.createElement('a');
      bag.href = URL.createObjectURL(b);
      bag.download = veri.meta.ad + '.png';
      bag.click();
      bildir(yazi.b_png);
    }, 'image/png');
  };
  gorsel.onerror = () => bildir(yazi.b_pngHata);
  gorsel.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMetni());
}

function konumlariKaydet() {
  const cikti = {
    ad: veri.meta.ad,
    kok: veri.meta.kok,
    uretildi: new Date().toISOString(),
    dugumler: dugumler.map(d => ({ kimlik: d.kimlik, x: Math.round(d.x), y: Math.round(d.y) }))
  };
  indir(veri.meta.ad + '.konum.json', JSON.stringify(cikti, null, 2), 'application/json');
  degistiIsareti = false;
  bildir(yazi.b_kaydedildi);
}

document.getElementById('sigdir-dugme').addEventListener('click', () => sigdir());
document.getElementById('tema-dugme').addEventListener('click', temaDegistir);
document.getElementById('akis-dugme').addEventListener('click', akisDegistir);
document.getElementById('dis-dugme').addEventListener('click', disDegistir);
document.getElementById('dongu-dugme').addEventListener('click', dongulariVurgula);
document.getElementById('isi-dugme').addEventListener('click', isiDegistir);
document.getElementById('png-dugme').addEventListener('click', pngDisaAktar);
document.getElementById('svg-dugme').addEventListener('click', svgDisaAktar);
document.getElementById('kaydet-dugme').addEventListener('click', konumlariKaydet);

window.addEventListener('beforeunload', e => {
  if (!degistiIsareti) return;
  e.preventDefault();
  e.returnValue = '';
});

try {
  const kayitli = localStorage.getItem('tg-tema');
  if (kayitli && TEMALAR.some(t => t.kimlik === kayitli)) document.documentElement.dataset.tema = kayitli;
} catch {}
temaMenusunuKur();
document.addEventListener('click', e => {
  if (!e.target.closest('#tema-menu') && !e.target.closest('#tema-dugme')) {
    document.getElementById('tema-menu').classList.remove('acik');
  }
});

gruplariCiz();
kenarlariCiz();
dugumleriCiz();
kucukHaritaCiz();
const kayitliDurum = durumuOku();
if (kayitliDurum) {
  gorunum = kayitliDurum.gorunum;
  gorunumUygula();
  if (kayitliDurum.secili && dugumHarita.has(kayitliDurum.secili)) sec(kayitliDurum.secili);
  if (kayitliDurum.dugumSayisi !== dugumler.length) bildir(yazi.b_tazelendi);
} else {
  sigdir();
}
window.addEventListener('resize', () => kucukHaritaGuncelle());

const kapaliGruplar = new Set();
const kapaliKenarTurleri = new Set();

function grupSayilari() {
  const sayim = new Map();
  for (const d of dugumler) {
    const ad = d.grup || yazi.gruplanmamis;
    sayim.set(ad, (sayim.get(ad) || 0) + 1);
  }
  return [...sayim.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}

function kenarTuruSayilari() {
  const sayim = new Map();
  for (const k of kenarlar) sayim.set(k.tur, (sayim.get(k.tur) || 0) + 1);
  return [...sayim.entries()].sort((a, b) => b[1] - a[1]);
}

function suzgeciUygula() {
  let gorunenDugum = 0, gorunenKenar = 0;
  for (const d of dugumler) {
    const gizli = kapaliGruplar.has(d.grup || yazi.gruplanmamis) || (!disGoster && d.dis);
    const oge = dugumOge.get(d.kimlik);
    if (oge) oge.style.display = gizli ? 'none' : '';
    if (!gizli) gorunenDugum++;
  }
  for (const [k, oge] of kenarOge) {
    const a = dugumHarita.get(k.kaynak), b = dugumHarita.get(k.hedef);
    const gizli = kapaliKenarTurleri.has(k.tur) ||
      !a || !b ||
      kapaliGruplar.has(a.grup || yazi.gruplanmamis) ||
      kapaliGruplar.has(b.grup || yazi.gruplanmamis) ||
      (!disGoster && (a.dis || b.dis));
    oge.grup.style.display = gizli ? 'none' : '';
    if (!gizli) gorunenKenar++;
  }
  const g = document.getElementById('gosterge');
  if (g) {
    const tumu = kapaliGruplar.size === 0 && kapaliKenarTurleri.size === 0;
    g.textContent = tumu
      ? `${dugumler.length} ${yazi.dugum} · ${kenarlar.length} ${yazi.bag}`
      : `${gorunenDugum}/${dugumler.length} ${yazi.dugum} · ${gorunenKenar}/${kenarlar.length} ${yazi.bag}`;
  }
  for (const oge of document.querySelectorAll('#grup-listesi .suzgec')) {
    oge.classList.toggle('kapali', kapaliGruplar.has(oge.dataset.grup));
  }
  for (const oge of document.querySelectorAll('#kenar-listesi .suzgec')) {
    oge.classList.toggle('kapali', kapaliKenarTurleri.has(oge.dataset.kenar));
  }
}

function yanPaneliKur() {
  const gruplar = grupSayilari();
  const grupKutu = document.getElementById('grup-listesi');
  grupKutu.innerHTML = gruplar.map(([ad, sayi]) => `
    <button class="suzgec" data-grup="${ad.replace(/"/g, '&quot;')}">
      <span class="benek" style="background:${grupRengi(ad)}"></span>
      <span class="ad" title="${ad.replace(/"/g, '&quot;')}">${ad}</span>
      <span class="sayi">${sayi}</span>
    </button>`).join('');
  for (const oge of grupKutu.querySelectorAll('.suzgec')) {
    oge.addEventListener('click', () => {
      const ad = oge.dataset.grup;
      if (kapaliGruplar.has(ad)) kapaliGruplar.delete(ad); else kapaliGruplar.add(ad);
      suzgeciUygula();
    });
  }

  const kenarKutu = document.getElementById('kenar-listesi');
  kenarKutu.innerHTML = kenarTuruSayilari().map(([tur, sayi]) => `
    <button class="suzgec" data-kenar="${tur}">
      <span class="cizgi-ornek ${tur}"></span>
      <span class="ad">${KENAR_ETIKETI[tur] || tur}</span>
      <span class="sayi">${sayi}</span>
    </button>`).join('');
  for (const oge of kenarKutu.querySelectorAll('.suzgec')) {
    oge.addEventListener('click', () => {
      const tur = oge.dataset.kenar;
      if (kapaliKenarTurleri.has(tur)) kapaliKenarTurleri.delete(tur); else kapaliKenarTurleri.add(tur);
      suzgeciUygula();
    });
  }

  document.getElementById('tumu-dugme').addEventListener('click', () => {
    if (kapaliGruplar.size || kapaliKenarTurleri.size) {
      kapaliGruplar.clear();
      kapaliKenarTurleri.clear();
    } else {
      for (const [ad] of gruplar) kapaliGruplar.add(ad);
    }
    suzgeciUygula();
  });
  suzgeciUygula();
}

function yanPaneliDegistir() {
  const acik = document.getElementById('yan').classList.toggle('acik');
  document.getElementById('yan-dugme').style.display = acik ? 'none' : '';
}

function yardimDegistir() {
  document.getElementById('yardim').classList.toggle('acik');
}

const kenarIpucu = document.createElement('div');
kenarIpucu.id = 'kenar-ipucu';
document.body.appendChild(kenarIpucu);

function kenarIpucuKur() {
  for (const [k, oge] of kenarOge) {
    const a = dugumHarita.get(k.kaynak), b = dugumHarita.get(k.hedef);
    if (!a || !b) continue;
    oge.yol.style.pointerEvents = 'stroke';
    oge.yol.addEventListener('pointerenter', e => {
      kenarIpucu.textContent = `${a.ad} → ${b.ad}  ${KENAR_ETIKETI[k.tur] || k.tur}${k.satir ? ' :' + k.satir : ''}`;
      kenarIpucu.style.left = (e.clientX + 14) + 'px';
      kenarIpucu.style.top = (e.clientY + 14) + 'px';
      kenarIpucu.classList.add('gorunur');
      oge.yol.classList.add('vurgulu');
    });
    oge.yol.addEventListener('pointerleave', () => {
      kenarIpucu.classList.remove('gorunur');
      if (!secili) oge.yol.classList.remove('vurgulu');
    });
  }
}

document.getElementById('yan-dugme').addEventListener('click', yanPaneliDegistir);
document.getElementById('yardim-dugme').addEventListener('click', yardimDegistir);
document.getElementById('yardim').addEventListener('click', yardimDegistir);

document.addEventListener('keydown', e => {
  if (e.target === araKutu) return;
  if (e.key === 'g') yanPaneliDegistir();
  if (e.key === '?') yardimDegistir();
  if (e.key === 'c') dongulariVurgula();
  if (e.key === '1' || e.key === '2') {
    const carpan = e.key === '1' ? 1.25 : 0.8;
    const merkezX = tuval.clientWidth / 2, merkezY = tuval.clientHeight / 2;
    const yeni = Math.max(0.06, Math.min(4, gorunum.olcek * carpan));
    const oran = yeni / gorunum.olcek;
    gorunum.x = merkezX - (merkezX - gorunum.x) * oran;
    gorunum.y = merkezY - (merkezY - gorunum.y) * oran;
    gorunum.olcek = yeni;
    gorunumUygula();
  }
  if (e.key === '3') sigdir();
  if (e.key === 'Escape') document.getElementById('yardim').classList.remove('acik');
});

yanPaneliKur();
kenarIpucuKur();
ayrintiSeviyesi();
