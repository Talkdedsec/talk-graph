import { komsulukKur } from './graf.mjs';

export function dugumBul(graf, terim) {
  const q = terim.toLowerCase();
  const govde = ad => ad.replace(/\.[^.]+$/, '');
  const puanla = d => {
    const ad = (d.ad || '').toLowerCase(), yol = (d.yol || '').toLowerCase();
    let puan = 0;
    if (d.kimlik.toLowerCase() === q) puan = 100;
    else if (ad === q) puan = 92;
    else if (yol === q) puan = 90;
    else if (govde(ad) === q) puan = 84;
    else if (yol.endsWith('/' + q)) puan = 78;
    else if (ad.startsWith(q)) puan = 70;
    else if (ad.includes(q)) puan = 58;
    else if (yol.includes(q)) puan = 52;
    else if ((d.simgeler || []).some(s => s.ad.toLowerCase() === q)) puan = 46;
    else if ((d.simgeler || []).some(s => s.ad.toLowerCase().includes(q))) puan = 24;
    if (puan && /(\.|_)(test|spec)\.|(^|\/)(tests?|__tests__)\//i.test(yol)) puan -= 6;
    if (puan && d.dis) puan -= 3;
    return puan;
  };
  return graf.dugumler
    .map(d => ({ dugum: d, puan: puanla(d) }))
    .filter(x => x.puan > 0)
    .sort((a, b) => b.puan - a.puan || a.dugum.yol.length - b.dugum.yol.length);
}

export function anlat(graf, kimlik) {
  const d = graf.dugumler.find(x => x.kimlik === kimlik);
  if (!d) return null;
  const { giden, gelen } = komsulukKur(graf);
  const cikan = giden.get(kimlik) || [];
  const giren = gelen.get(kimlik) || [];
  const ad = k => graf.dugumler.find(x => x.kimlik === k)?.yol || k;
  const toplam = cikan.length + giren.length;

  let rol = 'ara katman';
  if (!giren.length && cikan.length) rol = 'giris noktasi';
  else if (giren.length && !cikan.length) rol = 'yaprak / yardimci';
  else if (!toplam) rol = 'yalniz';
  else if (giren.length >= 8 && cikan.length <= 2) rol = 'paylasilan cekirdek';
  else if (cikan.length >= 8) rol = 'orkestrator';

  return {
    dugum: d,
    rol,
    kararsizlik: toplam ? Number((cikan.length / toplam).toFixed(2)) : 0,
    dongude: d.dongu !== null && d.dongu !== undefined,
    cagiranlar: giren.map(k => ({ yol: ad(k.kaynak), satir: k.satir })),
    bagimliliklar: cikan.map(k => ({ yol: ad(k.hedef), satir: k.satir, dis: k.tur === 'dis-bagimlilik' })),
    simgeler: d.simgeler || []
  };
}

export function enKisaYol(graf, a, b, secenekler = {}) {
  const yonlu = secenekler.yonlu ?? true;
  const komsu = new Map(graf.dugumler.map(d => [d.kimlik, []]));
  for (const k of graf.kenarlar) {
    komsu.get(k.kaynak)?.push({ hedef: k.hedef, kenar: k, ileri: true });
    if (!yonlu) komsu.get(k.hedef)?.push({ hedef: k.kaynak, kenar: k, ileri: false });
  }
  const onceki = new Map([[a, null]]);
  const kuyruk = [a];
  let bas = 0;
  while (bas < kuyruk.length) {
    const su = kuyruk[bas++];
    if (su === b) break;
    for (const komsuluk of komsu.get(su) || []) {
      if (onceki.has(komsuluk.hedef)) continue;
      onceki.set(komsuluk.hedef, { dugum: su, kenar: komsuluk.kenar, ileri: komsuluk.ileri });
      kuyruk.push(komsuluk.hedef);
    }
  }
  if (!onceki.has(b)) return null;
  const adimlar = [];
  let su = b;
  while (onceki.get(su)) {
    const p = onceki.get(su);
    adimlar.unshift({ kaynak: p.dugum, hedef: su, satir: p.kenar.satir, ileri: p.ileri });
    su = p.dugum;
  }
  return adimlar;
}

function enUzunZincir(graf) {
  const ic = graf.dugumler.filter(d => !d.dis);
  const kume = new Set(ic.map(d => d.kimlik));
  const giden = new Map(ic.map(d => [d.kimlik, []]));
  for (const k of graf.kenarlar) {
    if (kume.has(k.kaynak) && kume.has(k.hedef) && !k.dongude) giden.get(k.kaynak).push(k.hedef);
  }
  const bellek = new Map();
  const gez = (dugum, izlek) => {
    if (bellek.has(dugum)) return bellek.get(dugum);
    if (izlek.has(dugum)) return [];
    izlek.add(dugum);
    let enIyi = [];
    for (const h of giden.get(dugum) || []) {
      const alt = gez(h, izlek);
      if (alt.length > enIyi.length) enIyi = alt;
    }
    izlek.delete(dugum);
    const sonuc = [dugum, ...enIyi];
    bellek.set(dugum, sonuc);
    return sonuc;
  };
  let enIyi = [];
  for (const d of ic) {
    const z = gez(d.kimlik, new Set());
    if (z.length > enIyi.length) enIyi = z;
  }
  return enIyi;
}

export function denetle(graf) {
  const ic = graf.dugumler.filter(d => !d.dis);
  const dereceler = ic.map(d => (d.gelenSayisi || 0) + (d.gidenSayisi || 0)).sort((a, b) => a - b);
  const ortanca = dereceler.length ? dereceler[dereceler.length >> 1] : 0;
  const esik = Math.max(6, ortanca * 3);

  const tanri = ic.filter(d => (d.gelenSayisi + d.gidenSayisi) >= esik)
    .sort((a, b) => (b.gelenSayisi + b.gidenSayisi) - (a.gelenSayisi + a.gidenSayisi))
    .slice(0, 10)
    .map(d => ({ yol: d.yol, gelen: d.gelenSayisi, giden: d.gidenSayisi }));

  const kirilgan = ic
    .filter(d => d.gelenSayisi >= 4 && d.gidenSayisi >= 4)
    .map(d => ({
      yol: d.yol,
      gelen: d.gelenSayisi,
      giden: d.gidenSayisi,
      kararsizlik: Number((d.gidenSayisi / (d.gelenSayisi + d.gidenSayisi)).toFixed(2))
    }))
    .sort((a, b) => b.kararsizlik * b.gelen - a.kararsizlik * a.gelen)
    .slice(0, 8);

  const donguKumeleri = new Map();
  for (const d of ic) {
    if (d.dongu === null || d.dongu === undefined) continue;
    if (!donguKumeleri.has(d.dongu)) donguKumeleri.set(d.dongu, []);
    donguKumeleri.get(d.dongu).push(d.yol);
  }

  const zincir = enUzunZincir(graf);
  const cokDegisen = ic.filter(d => d.degisiklik)
    .sort((a, b) => b.degisiklik - a.degisiklik).slice(0, 8)
    .map(d => ({ yol: d.yol, degisiklik: d.degisiklik, gelen: d.gelenSayisi }));

  const uyarilar = [];
  if (donguKumeleri.size) uyarilar.push(`${donguKumeleri.size} dairesel bagimlilik kumesi`);
  if (tanri.length) uyarilar.push(`${tanri.length} dugum ortanca derecenin 3 katindan fazla bagli`);
  const yalniz = ic.filter(d => !d.gelenSayisi && !d.gidenSayisi);
  if (yalniz.length) uyarilar.push(`${yalniz.length} dosya hicbir seye bagli degil`);
  const riskli = cokDegisen.filter(d => d.gelen >= 5);
  if (riskli.length) uyarilar.push(`${riskli.length} dosya hem cok degisiyor hem cok cagriliyor`);

  return {
    olcumler: graf.olcumler,
    donguler: [...donguKumeleri.values()].sort((a, b) => b.length - a.length),
    tanriDugumler: tanri,
    kirilganlar: kirilgan,
    enUzunZincir: zincir.length > 1 ? zincir : [],
    cokDegisenler: cokDegisen,
    yalnizlar: yalniz.map(d => d.yol).slice(0, 12),
    uyarilar
  };
}

function modulerlikKumele(dugumler, agirlikliKenarlar) {
  const indeks = new Map(dugumler.map((d, i) => [d, i]));
  const n = dugumler.length;
  const komsu = Array.from({ length: n }, () => []);
  const derece = new Array(n).fill(0);
  let toplam = 0;
  for (const [a, b, w] of agirlikliKenarlar) {
    const i = indeks.get(a), j = indeks.get(b);
    if (i === undefined || j === undefined || i === j) continue;
    komsu[i].push([j, w]);
    komsu[j].push([i, w]);
    derece[i] += w;
    derece[j] += w;
    toplam += w;
  }
  if (!toplam) return dugumler.map(d => [d]);

  const iki = 2 * toplam;
  const topluluk = dugumler.map((_, i) => i);
  const toplamAgirlik = derece.slice();

  for (let tur = 0; tur < 20; tur++) {
    let degisti = false;
    for (let i = 0; i < n; i++) {
      const su = topluluk[i];
      const bag = new Map();
      for (const [j, w] of komsu[i]) bag.set(topluluk[j], (bag.get(topluluk[j]) || 0) + w);
      toplamAgirlik[su] -= derece[i];
      let enIyi = su;
      let enIyiKazanc = (bag.get(su) || 0) - toplamAgirlik[su] * derece[i] / iki;
      for (const [aday, agirlik] of bag) {
        if (aday === su) continue;
        const kazanc = agirlik - toplamAgirlik[aday] * derece[i] / iki;
        if (kazanc > enIyiKazanc + 1e-9) { enIyiKazanc = kazanc; enIyi = aday; }
      }
      toplamAgirlik[enIyi] += derece[i];
      if (enIyi !== su) { topluluk[i] = enIyi; degisti = true; }
    }
    if (!degisti) break;
  }

  const kumeler = new Map();
  for (let i = 0; i < n; i++) {
    if (!kumeler.has(topluluk[i])) kumeler.set(topluluk[i], []);
    kumeler.get(topluluk[i]).push(dugumler[i]);
  }
  return [...kumeler.values()];
}

export function topluluklar(graf) {
  const ic = graf.dugumler.filter(d => !d.dis);
  const kume = new Set(ic.map(d => d.kimlik));
  const agirlikli = graf.kenarlar
    .filter(k => kume.has(k.kaynak) && kume.has(k.hedef))
    .map(k => [k.kaynak, k.hedef, k.agirlik || 1]);
  const bolumler = modulerlikKumele(ic.map(d => d.kimlik), agirlikli);
  const kumeler = new Map();
  bolumler.forEach((uyeler, i) => kumeler.set(i, uyeler));
  const yolBul = new Map(ic.map(d => [d.kimlik, d]));
  return [...kumeler.values()]
    .filter(u => u.length > 1)
    .sort((a, b) => b.length - a.length)
    .map(uyeler => {
      const klasorler = new Set(uyeler.map(k => yolBul.get(k).grup));
      return {
        boyut: uyeler.length,
        klasorSayisi: klasorler.size,
        klasorler: [...klasorler],
        uyeler: uyeler.map(k => yolBul.get(k).yol)
      };
    });
}
