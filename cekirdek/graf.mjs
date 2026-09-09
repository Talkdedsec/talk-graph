export function komsulukKur(graf) {
  const giden = new Map(), gelen = new Map();
  for (const d of graf.dugumler) { giden.set(d.kimlik, []); gelen.set(d.kimlik, []); }
  for (const k of graf.kenarlar) {
    giden.get(k.kaynak)?.push(k);
    gelen.get(k.hedef)?.push(k);
  }
  return { giden, gelen };
}

function gucluBilesenler(dugumKimlikleri, giden) {
  const indeks = new Map(), dusuk = new Map(), yiginda = new Set();
  const yigin = [];
  const bilesenler = [];
  let sayac = 0;

  for (const baslangic of dugumKimlikleri) {
    if (indeks.has(baslangic)) continue;
    const is = [{ dugum: baslangic, i: 0 }];
    indeks.set(baslangic, sayac); dusuk.set(baslangic, sayac); sayac++;
    yigin.push(baslangic); yiginda.add(baslangic);

    while (is.length) {
      const cerceve = is[is.length - 1];
      const kenarlar = giden.get(cerceve.dugum) || [];
      if (cerceve.i < kenarlar.length) {
        const komsu = kenarlar[cerceve.i++].hedef;
        if (!indeks.has(komsu)) {
          indeks.set(komsu, sayac); dusuk.set(komsu, sayac); sayac++;
          yigin.push(komsu); yiginda.add(komsu);
          is.push({ dugum: komsu, i: 0 });
        } else if (yiginda.has(komsu)) {
          dusuk.set(cerceve.dugum, Math.min(dusuk.get(cerceve.dugum), indeks.get(komsu)));
        }
        continue;
      }
      is.pop();
      if (is.length) {
        const ust = is[is.length - 1].dugum;
        dusuk.set(ust, Math.min(dusuk.get(ust), dusuk.get(cerceve.dugum)));
      }
      if (dusuk.get(cerceve.dugum) === indeks.get(cerceve.dugum)) {
        const bilesen = [];
        let d;
        do { d = yigin.pop(); yiginda.delete(d); bilesen.push(d); } while (d !== cerceve.dugum);
        if (bilesen.length > 1) bilesenler.push(bilesen);
      }
    }
  }
  return bilesenler;
}

function grupAdi(yol, seviye) {
  const parcalar = yol.split('/');
  if (parcalar.length <= 1) return '(kok)';
  return parcalar.slice(0, Math.min(seviye, parcalar.length - 1)).join('/');
}

export function zenginlestir(graf, secenekler = {}) {
  const grupSeviyesi = secenekler.grupSeviyesi ?? 2;
  const { giden, gelen } = komsulukKur(graf);

  for (const d of graf.dugumler) {
    d.gidenSayisi = (giden.get(d.kimlik) || []).length;
    d.gelenSayisi = (gelen.get(d.kimlik) || []).length;
    d.grup = d.dis ? 'dis-bagimlilik' : grupAdi(d.yol, grupSeviyesi);
  }

  const icKimlikler = graf.dugumler.filter(d => !d.dis).map(d => d.kimlik);
  const icKume = new Set(icKimlikler);
  const icGiden = new Map();
  for (const k of icKimlikler) icGiden.set(k, (giden.get(k) || []).filter(e => icKume.has(e.hedef)));
  const bilesenler = gucluBilesenler(icKimlikler, icGiden);

  const dongudekiler = new Map();
  bilesenler.forEach((b, i) => b.forEach(k => dongudekiler.set(k, i)));
  for (const d of graf.dugumler) d.dongu = dongudekiler.has(d.kimlik) ? dongudekiler.get(d.kimlik) : null;
  for (const k of graf.kenarlar) {
    k.dongude = dongudekiler.has(k.kaynak) && dongudekiler.get(k.kaynak) === dongudekiler.get(k.hedef);
  }

  graf.olcumler = {
    dugum: graf.dugumler.length,
    icDugum: icKimlikler.length,
    disPaket: graf.dugumler.length - icKimlikler.length,
    kenar: graf.kenarlar.length,
    dongu: bilesenler.length,
    donguBoyutlari: bilesenler.map(b => b.length).sort((a, b) => b - a).slice(0, 5),
    yalniz: graf.dugumler.filter(d => !d.dis && !d.gidenSayisi && !d.gelenSayisi).length,
    enCokCagrilan: [...graf.dugumler].filter(d => !d.dis)
      .sort((a, b) => b.gelenSayisi - a.gelenSayisi).slice(0, 5)
      .map(d => ({ yol: d.yol, gelen: d.gelenSayisi })),
    toplamSatir: graf.dugumler.reduce((t, d) => t + (d.satirSayisi || 0), 0)
  };
  return graf;
}

export function grupla(graf) {
  const gruplar = new Map();
  for (const d of graf.dugumler) {
    if (!gruplar.has(d.grup)) gruplar.set(d.grup, { kimlik: 'grup:' + d.grup, ad: d.grup, uyeler: [], dis: d.dis });
    gruplar.get(d.grup).uyeler.push(d.kimlik);
  }
  const kenarlar = new Map();
  const grupBul = new Map(graf.dugumler.map(d => [d.kimlik, 'grup:' + d.grup]));
  for (const k of graf.kenarlar) {
    const a = grupBul.get(k.kaynak), b = grupBul.get(k.hedef);
    if (!a || !b || a === b) continue;
    const anahtar = a + '>' + b;
    const v = kenarlar.get(anahtar);
    if (v) { v.agirlik += k.agirlik || 1; continue; }
    kenarlar.set(anahtar, { kaynak: a, hedef: b, tur: k.tur, agirlik: k.agirlik || 1 });
  }
  return {
    ...graf,
    dugumler: [...gruplar.values()].map(g => ({
      kimlik: g.kimlik,
      ad: g.ad,
      yol: g.ad,
      dil: g.dis ? 'dis' : 'grup',
      dis: g.dis,
      uyeSayisi: g.uyeler.length,
      uyeler: g.uyeler,
      simgeler: []
    })),
    kenarlar: [...kenarlar.values()],
    toplu: true
  };
}

export function komsuluk(graf, merkez, derinlik = 1) {
  const { giden, gelen } = komsulukKur(graf);
  const secili = new Set([merkez]);
  let sinir = [merkez];
  for (let i = 0; i < derinlik; i++) {
    const yeni = [];
    for (const d of sinir) {
      for (const k of giden.get(d) || []) if (!secili.has(k.hedef)) { secili.add(k.hedef); yeni.push(k.hedef); }
      for (const k of gelen.get(d) || []) if (!secili.has(k.kaynak)) { secili.add(k.kaynak); yeni.push(k.kaynak); }
    }
    sinir = yeni;
  }
  return {
    ...graf,
    dugumler: graf.dugumler.filter(d => secili.has(d.kimlik)),
    kenarlar: graf.kenarlar.filter(k => secili.has(k.kaynak) && secili.has(k.hedef))
  };
}

export function budale(graf, enFazlaDugum) {
  if (graf.dugumler.length <= enFazlaDugum) return graf;
  const puan = d => (d.gelenSayisi || 0) * 2 + (d.gidenSayisi || 0) + (d.uyeSayisi || 0);
  const kalan = [...graf.dugumler].sort((a, b) => puan(b) - puan(a)).slice(0, enFazlaDugum);
  const kume = new Set(kalan.map(d => d.kimlik));
  return {
    ...graf,
    dugumler: kalan,
    kenarlar: graf.kenarlar.filter(k => kume.has(k.kaynak) && kume.has(k.hedef)),
    budandi: graf.dugumler.length - kalan.length
  };
}

export function fark(eski, yeni) {
  const eskiD = new Map(eski.dugumler.map(d => [d.kimlik, d]));
  const yeniD = new Map(yeni.dugumler.map(d => [d.kimlik, d]));
  const eskiK = new Set(eski.kenarlar.map(k => k.kaynak + '>' + k.hedef));
  const yeniK = new Set(yeni.kenarlar.map(k => k.kaynak + '>' + k.hedef));
  return {
    eklenenDugum: [...yeniD.keys()].filter(k => !eskiD.has(k)),
    silinenDugum: [...eskiD.keys()].filter(k => !yeniD.has(k)),
    degisenDugum: [...yeniD.keys()].filter(k => eskiD.has(k) && eskiD.get(k).satirSayisi !== yeniD.get(k).satirSayisi),
    eklenenKenar: [...yeniK].filter(k => !eskiK.has(k)),
    silinenKenar: [...eskiK].filter(k => !yeniK.has(k))
  };
}
