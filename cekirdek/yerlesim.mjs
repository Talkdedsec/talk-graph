const VARSAYILAN = {
  yon: 'sag',
  katmanAraligi: 150,
  dugumAraligi: 26,
  sanalAraligi: 9,
  dugumYuksekligi: 46,
  enAzGenislik: 130,
  enFazlaGenislik: 300,
  karakterGenisligi: 7.6,
  yatayDolgu: 26,
  grupDolgusu: 22,
  siralamaTuru: 8,
  enFazlaAciklik: 3
};

function kavisliYol(noktalar, yatay) {
  const a = noktalar[0], b = noktalar[noktalar.length - 1];
  const mesafe = yatay ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y);
  const kuvvet = Math.min(320, Math.max(60, mesafe * 0.42));
  return yatay
    ? `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${(a.x + kuvvet).toFixed(1)} ${a.y.toFixed(1)}, ${(b.x - kuvvet).toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
    : `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${a.x.toFixed(1)} ${(a.y + kuvvet).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - kuvvet).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

function genislikHesapla(dugum, ay) {
  const etiket = dugum.ad || dugum.kimlik;
  const alt = dugum.uyeSayisi ? String(dugum.uyeSayisi) + ' dosya' : (dugum.yol !== etiket ? dugum.yol : '');
  const enUzun = Math.max(etiket.length, Math.min(alt.length, 30));
  return Math.max(ay.enAzGenislik, Math.min(ay.enFazlaGenislik, enUzun * ay.karakterGenisligi + ay.yatayDolgu * 2));
}

function dongulariKir(dugumler, kenarlar) {
  const giden = new Map(dugumler.map(d => [d.kimlik, []]));
  for (const k of kenarlar) giden.get(k.kaynak)?.push(k);
  const durum = new Map();
  const tersCevrilen = new Set();

  for (const kok of dugumler.map(d => d.kimlik)) {
    if (durum.get(kok)) continue;
    const yigin = [{ dugum: kok, i: 0 }];
    durum.set(kok, 1);
    while (yigin.length) {
      const c = yigin[yigin.length - 1];
      const liste = giden.get(c.dugum) || [];
      if (c.i < liste.length) {
        const kenar = liste[c.i++];
        const d = durum.get(kenar.hedef);
        if (d === 1) { tersCevrilen.add(kenar); continue; }
        if (!d) { durum.set(kenar.hedef, 1); yigin.push({ dugum: kenar.hedef, i: 0 }); }
        continue;
      }
      durum.set(c.dugum, 2);
      yigin.pop();
    }
  }

  const calisma = kenarlar.map(k => tersCevrilen.has(k)
    ? { ...k, kaynak: k.hedef, hedef: k.kaynak, tersCevrildi: true }
    : { ...k, tersCevrildi: false });
  return calisma;
}

function katmanAta(dugumler, kenarlar) {
  const gelenSayisi = new Map(dugumler.map(d => [d.kimlik, 0]));
  const giden = new Map(dugumler.map(d => [d.kimlik, []]));
  for (const k of kenarlar) {
    giden.get(k.kaynak)?.push(k.hedef);
    gelenSayisi.set(k.hedef, (gelenSayisi.get(k.hedef) || 0) + 1);
  }
  const katman = new Map(dugumler.map(d => [d.kimlik, 0]));
  const kuyruk = dugumler.filter(d => !gelenSayisi.get(d.kimlik)).map(d => d.kimlik);
  const kalan = new Map(gelenSayisi);
  let bas = 0;
  while (bas < kuyruk.length) {
    const d = kuyruk[bas++];
    for (const h of giden.get(d) || []) {
      katman.set(h, Math.max(katman.get(h), katman.get(d) + 1));
      kalan.set(h, kalan.get(h) - 1);
      if (kalan.get(h) === 0) kuyruk.push(h);
    }
  }
  for (const d of dugumler) if (!katman.has(d.kimlik)) katman.set(d.kimlik, 0);
  return katman;
}

function sanalZincirKur(dugumler, kenarlar, katman, enFazlaAciklik) {
  const tumDugumler = dugumler.map(d => ({ ...d }));
  const parcalar = [];
  let sayac = 0;
  for (const kenar of kenarlar) {
    const a = katman.get(kenar.kaynak), b = katman.get(kenar.hedef);
    if (b - a <= 1) { parcalar.push({ kenar, zincir: [kenar.kaynak, kenar.hedef] }); continue; }
    if (b - a > enFazlaAciklik) { parcalar.push({ kenar, zincir: [kenar.kaynak, kenar.hedef], uzun: true }); continue; }
    const zincir = [kenar.kaynak];
    for (let k = a + 1; k < b; k++) {
      const kimlik = 'sanal:' + (sayac++);
      tumDugumler.push({ kimlik, sanal: true, ad: '', genislik: 1, kaynakKenar: kenar });
      katman.set(kimlik, k);
      zincir.push(kimlik);
    }
    zincir.push(kenar.hedef);
    parcalar.push({ kenar, zincir });
  }
  return { tumDugumler, parcalar };
}

function katmanlaraBol(dugumler, katman) {
  const katmanlar = [];
  for (const d of dugumler) {
    const k = katman.get(d.kimlik) || 0;
    (katmanlar[k] ||= []).push(d);
  }
  for (let i = 0; i < katmanlar.length; i++) katmanlar[i] ||= [];
  return katmanlar;
}

function kesismeSay(ustSira, altSira, baglar) {
  const ustYer = new Map(ustSira.map((d, i) => [d.kimlik, i]));
  const altYer = new Map(altSira.map((d, i) => [d.kimlik, i]));
  const ciftler = [];
  for (const [a, b] of baglar) {
    if (ustYer.has(a) && altYer.has(b)) ciftler.push([ustYer.get(a), altYer.get(b)]);
  }
  ciftler.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const boyut = altSira.length + 1;
  const agac = new Array(boyut + 1).fill(0);
  const ekle = i => { for (let j = i + 1; j <= boyut; j += j & -j) agac[j]++; };
  const topla = i => { let t = 0; for (let j = i + 1; j > 0; j -= j & -j) t += agac[j]; return t; };
  let kesisme = 0, sayilan = 0;
  for (const [, alt] of ciftler) {
    kesisme += sayilan - topla(alt);
    ekle(alt);
    sayilan++;
  }
  return kesisme;
}

function sirala(katmanlar, parcalar, ay) {
  const ustKomsu = new Map(), altKomsu = new Map();
  const baglar = [];
  for (const p of parcalar) {
    for (let i = 0; i < p.zincir.length - 1; i++) {
      const a = p.zincir[i], b = p.zincir[i + 1];
      baglar.push([a, b]);
      (altKomsu.get(a) || altKomsu.set(a, []).get(a)).push(b);
      (ustKomsu.get(b) || ustKomsu.set(b, []).get(b)).push(a);
    }
  }

  const medyan = (dugum, komsuHarita, yerHarita) => {
    const komsular = (komsuHarita.get(dugum.kimlik) || []).map(k => yerHarita.get(k)).filter(v => v !== undefined);
    if (!komsular.length) return -1;
    komsular.sort((a, b) => a - b);
    const orta = komsular.length >> 1;
    return komsular.length % 2 ? komsular[orta] : (komsular[orta - 1] + komsular[orta]) / 2;
  };

  const yerHaritasi = katmanlar.map(kat => new Map(kat.map((d, i) => [d.kimlik, i])));

  for (let tur = 0; tur < ay.siralamaTuru; tur++) {
    const asagi = tur % 2 === 0;
    const sira = asagi ? [...katmanlar.keys()] : [...katmanlar.keys()].reverse();
    for (const i of sira) {
      const kaynakYer = asagi ? yerHaritasi[i - 1] : yerHaritasi[i + 1];
      if (!kaynakYer) continue;
      const komsuHarita = asagi ? ustKomsu : altKomsu;
      katmanlar[i] = [...katmanlar[i]]
        .map((d, sirasi) => ({ d, sirasi, m: medyan(d, komsuHarita, kaynakYer) }))
        .sort((a, b) => {
          if (a.m === -1 && b.m === -1) return a.sirasi - b.sirasi;
          if (a.m === -1) return -1;
          if (b.m === -1) return 1;
          if (a.m !== b.m) return a.m - b.m;
          const ga = a.d.grup || '', gb = b.d.grup || '';
          return ga < gb ? -1 : ga > gb ? 1 : a.sirasi - b.sirasi;
        })
        .map(x => x.d);
      yerHaritasi[i] = new Map(katmanlar[i].map((d, j) => [d.kimlik, j]));
    }
  }

  let kesisme = 0;
  for (let i = 0; i + 1 < katmanlar.length; i++) kesisme += kesismeSay(katmanlar[i], katmanlar[i + 1], baglar);
  return { katmanlar, kesisme, ustKomsu, altKomsu };
}

function eksenAta(katmanlar, ustKomsu, altKomsu, ay) {
  const konum = new Map();
  const boyut = new Map();
  for (const kat of katmanlar) {
    for (const d of kat) {
      boyut.set(d.kimlik, d.sanal ? 2 : ay.dugumYuksekligi);
    }
  }

  for (const kat of katmanlar) {
    let imlec = 0;
    for (const d of kat) {
      konum.set(d.kimlik, imlec + boyut.get(d.kimlik) / 2);
      imlec += boyut.get(d.kimlik) + (d.sanal ? ay.sanalAraligi : ay.dugumAraligi);
    }
  }

  const ortalama = (kimlik, harita) => {
    const komsular = (harita.get(kimlik) || []).map(k => konum.get(k)).filter(v => v !== undefined);
    if (!komsular.length) return null;
    return komsular.reduce((t, v) => t + v, 0) / komsular.length;
  };

  const bosluk = (a, b) => boyut.get(a.kimlik) / 2 + boyut.get(b.kimlik) / 2 +
    ((a.sanal && b.sanal) ? ay.sanalAraligi : ay.dugumAraligi);

  const yerlestir = (kat, istek) => {
    const yer = kat.map((d, j) => (istek[j] === null ? konum.get(d.kimlik) : istek[j]));
    for (let tekrar = 0; tekrar < 3; tekrar++) {
      for (let j = 1; j < kat.length; j++) {
        const enAz = yer[j - 1] + bosluk(kat[j - 1], kat[j]);
        if (yer[j] < enAz) yer[j] = enAz;
      }
      for (let j = kat.length - 2; j >= 0; j--) {
        const enFazla = yer[j + 1] - bosluk(kat[j], kat[j + 1]);
        if (yer[j] > enFazla && (istek[j] === null || yer[j] > istek[j])) yer[j] = enFazla;
      }
    }
    for (let j = 1; j < kat.length; j++) {
      const enAz = yer[j - 1] + bosluk(kat[j - 1], kat[j]);
      if (yer[j] < enAz) yer[j] = enAz;
    }
    kat.forEach((d, j) => konum.set(d.kimlik, yer[j]));
  };

  for (let tur = 0; tur < 16; tur++) {
    const asagi = tur % 2 === 0;
    const sira = asagi ? [...katmanlar.keys()] : [...katmanlar.keys()].reverse();
    for (const i of sira) {
      const kat = katmanlar[i];
      if (!kat.length) continue;
      const istek = kat.map(d => ortalama(d.kimlik, asagi ? ustKomsu : altKomsu));
      yerlestir(kat, istek);
    }
  }

  let enKucuk = Infinity;
  for (const kat of katmanlar) for (const d of kat) enKucuk = Math.min(enKucuk, konum.get(d.kimlik) - boyut.get(d.kimlik) / 2);
  if (Number.isFinite(enKucuk)) {
    for (const kat of katmanlar) for (const d of kat) konum.set(d.kimlik, konum.get(d.kimlik) - enKucuk);
  }
  return { konum, boyut };
}

function ortogonalYol(noktalar, yatay) {
  if (noktalar.length < 2) return '';
  const p = [];
  for (let i = 0; i < noktalar.length; i++) {
    const a = noktalar[i];
    if (i === 0) { p.push(['M', a.x, a.y]); continue; }
    const o = noktalar[i - 1];
    if (yatay) {
      const orta = (o.x + a.x) / 2;
      if (Math.abs(o.y - a.y) < 0.5) p.push(['L', a.x, a.y]);
      else { p.push(['L', orta, o.y]); p.push(['L', orta, a.y]); p.push(['L', a.x, a.y]); }
    } else {
      const orta = (o.y + a.y) / 2;
      if (Math.abs(o.x - a.x) < 0.5) p.push(['L', a.x, a.y]);
      else { p.push(['L', o.x, orta]); p.push(['L', a.x, orta]); p.push(['L', a.x, a.y]); }
    }
  }
  return yuvarlatilmisYol(p);
}

function yuvarlatilmisYol(komutlar, yaricap = 9) {
  const nokta = komutlar.map(k => ({ x: k[1], y: k[2] }));
  if (nokta.length < 3) return `M ${nokta.map(n => `${n.x.toFixed(1)} ${n.y.toFixed(1)}`).join(' L ')}`;
  let d = `M ${nokta[0].x.toFixed(1)} ${nokta[0].y.toFixed(1)}`;
  for (let i = 1; i < nokta.length - 1; i++) {
    const o = nokta[i - 1], m = nokta[i], s = nokta[i + 1];
    const u1 = uzunluk(o, m), u2 = uzunluk(m, s);
    const r = Math.min(yaricap, u1 / 2, u2 / 2);
    if (r < 1) { d += ` L ${m.x.toFixed(1)} ${m.y.toFixed(1)}`; continue; }
    const a = kaydir(m, o, r), b = kaydir(m, s, r);
    d += ` L ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${m.x.toFixed(1)} ${m.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const son = nokta[nokta.length - 1];
  d += ` L ${son.x.toFixed(1)} ${son.y.toFixed(1)}`;
  return d;
}

function uzunluk(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
function kaydir(kaynak, yon, mesafe) {
  const u = uzunluk(kaynak, yon) || 1;
  return { x: kaynak.x + (yon.x - kaynak.x) * mesafe / u, y: kaynak.y + (yon.y - kaynak.y) * mesafe / u };
}

export function yerlesimKur(graf, secenekler = {}) {
  const ay = { ...VARSAYILAN, ...secenekler };
  const yatay = ay.yon === 'sag' || ay.yon === 'sol';
  const dugumler = graf.dugumler.map(d => ({ ...d, genislik: genislikHesapla(d, ay) }));
  const kenarlar = dongulariKir(dugumler, graf.kenarlar);
  const katman = katmanAta(dugumler, kenarlar);
  const { tumDugumler, parcalar } = sanalZincirKur(dugumler, kenarlar, katman, ay.enFazlaAciklik);
  const katmanlar = katmanlaraBol(tumDugumler, katman);
  const { katmanlar: sirali, kesisme, ustKomsu, altKomsu } = sirala(katmanlar, parcalar, ay);
  const { konum, boyut } = eksenAta(sirali, ustKomsu, altKomsu, ay);

  const katmanGenislikleri = sirali.map(kat => Math.max(ay.enAzGenislik, ...kat.map(d => d.genislik || 0)));
  const katmanBaslangic = [];
  let imlec = 0;
  for (let i = 0; i < sirali.length; i++) {
    katmanBaslangic[i] = imlec;
    imlec += katmanGenislikleri[i] + ay.katmanAraligi;
  }

  const yerlesik = new Map();
  for (let i = 0; i < sirali.length; i++) {
    for (const d of sirali[i]) {
      const uzunEksen = katmanBaslangic[i];
      const kisaEksen = konum.get(d.kimlik) - boyut.get(d.kimlik) / 2;
      const kutu = yatay
        ? { x: uzunEksen, y: kisaEksen, genislik: d.sanal ? 2 : d.genislik, yukseklik: boyut.get(d.kimlik) }
        : { x: kisaEksen, y: uzunEksen, genislik: boyut.get(d.kimlik), yukseklik: d.sanal ? 2 : ay.dugumYuksekligi };
      if (!yatay && !d.sanal) { kutu.x = konum.get(d.kimlik) - d.genislik / 2; kutu.genislik = d.genislik; }
      yerlesik.set(d.kimlik, { ...d, ...kutu, katman: i });
    }
  }

  const cizilenKenarlar = [];
  for (const p of parcalar) {
    const noktalar = p.zincir.map((kimlik, i) => {
      const y = yerlesik.get(kimlik);
      if (!y) return null;
      if (i === 0) return yatay ? { x: y.x + y.genislik, y: y.y + y.yukseklik / 2 } : { x: y.x + y.genislik / 2, y: y.y + y.yukseklik };
      if (i === p.zincir.length - 1) return yatay ? { x: y.x, y: y.y + y.yukseklik / 2 } : { x: y.x + y.genislik / 2, y: y.y };
      return { x: y.x + y.genislik / 2, y: y.y + y.yukseklik / 2 };
    }).filter(Boolean);
    if (noktalar.length < 2) continue;
    const ozgun = p.kenar.tersCevrildi
      ? { ...p.kenar, kaynak: p.kenar.hedef, hedef: p.kenar.kaynak }
      : p.kenar;
    const sirali = p.kenar.tersCevrildi ? [...noktalar].reverse() : noktalar;
    cizilenKenarlar.push({
      ...ozgun,
      noktalar: sirali,
      yol: p.uzun ? kavisliYol(sirali, yatay) : ortogonalYol(sirali, yatay),
      uzun: !!p.uzun,
      geriKenar: p.kenar.tersCevrildi
    });
  }

  const gercekDugumler = [...yerlesik.values()].filter(d => !d.sanal);
  const enSag = Math.max(...gercekDugumler.map(d => d.x + d.genislik), 100);
  const enAlt = Math.max(...gercekDugumler.map(d => d.y + d.yukseklik), 100);
  const enSol = Math.min(...gercekDugumler.map(d => d.x), 0);
  const enUst = Math.min(...gercekDugumler.map(d => d.y), 0);

  return {
    dugumler: gercekDugumler,
    kenarlar: cizilenKenarlar,
    gruplar: grupKutulari(gercekDugumler, ay),
    kesisme,
    katmanSayisi: sirali.length,
    tuval: { x: enSol - 40, y: enUst - 40, genislik: enSag - enSol + 80, yukseklik: enAlt - enUst + 80 }
  };
}

function grupKutulari(dugumler, ay) {
  const gruplar = new Map();
  for (const d of dugumler) {
    if (!d.grup) continue;
    if (!gruplar.has(d.grup)) gruplar.set(d.grup, []);
    gruplar.get(d.grup).push(d);
  }
  const kutular = [];
  for (const [ad, uyeler] of gruplar) {
    if (uyeler.length < 2) continue;
    const x = Math.min(...uyeler.map(d => d.x)) - ay.grupDolgusu;
    const y = Math.min(...uyeler.map(d => d.y)) - ay.grupDolgusu - 14;
    const sag = Math.max(...uyeler.map(d => d.x + d.genislik)) + ay.grupDolgusu;
    const alt = Math.max(...uyeler.map(d => d.y + d.yukseklik)) + ay.grupDolgusu;
    const uyeKumesi = new Set(uyeler.map(d => d.kimlik));
    const yabanci = dugumler.some(d => !uyeKumesi.has(d.kimlik) &&
      d.x + d.genislik > x && d.x < sag && d.y + d.yukseklik > y && d.y < alt);
    if (yabanci) continue;
    kutular.push({ ad, x, y, genislik: sag - x, yukseklik: alt - y, uyeSayisi: uyeler.length });
  }
  return kutular.sort((a, b) => b.genislik * b.yukseklik - a.genislik * a.yukseklik);
}
