const MODUL = '<modul>';

function kapsayanBul(simgeler, satir) {
  let bulunan = null;
  for (const s of simgeler) {
    if (s.satir <= satir) bulunan = s;
    else break;
  }
  return bulunan;
}

function klasorAl(kimlik) {
  const i = kimlik.lastIndexOf('/');
  return i === -1 ? '.' : kimlik.slice(0, i);
}

export function simgeGrafi(graf, secenekler = {}) {
  const dosyalar = graf.dugumler.filter(d => !d.dis && d.kullanimlar);
  const dugumler = new Map();
  const hamKenarlar = [];

  const dosyaSimgeleri = new Map();
  const paketSimgeleri = new Map();

  for (const dosya of dosyalar) {
    const sirali = [...(dosya.simgeler || [])].sort((a, b) => a.satir - b.satir);
    const adlar = new Map();
    for (const s of sirali) if (!adlar.has(s.ad)) adlar.set(s.ad, s);
    dosyaSimgeleri.set(dosya.kimlik, { sirali, adlar, dosya });

    const paket = klasorAl(dosya.kimlik);
    if (!paketSimgeleri.has(paket)) paketSimgeleri.set(paket, new Map());
    const paketHarita = paketSimgeleri.get(paket);
    for (const s of sirali) {
      if (!paketHarita.has(s.ad)) paketHarita.set(s.ad, dosya.kimlik + '#' + s.ad);
    }

    for (const s of sirali) {
      const kimlik = dosya.kimlik + '#' + s.ad;
      if (dugumler.has(kimlik)) continue;
      dugumler.set(kimlik, {
        kimlik,
        ad: s.ad,
        yol: dosya.yol + ':' + s.satir,
        dosya: dosya.kimlik,
        dil: dosya.dil,
        tur: s.tur,
        sahip: s.sahip || null,
        disa: !!s.disa,
        satir: s.satir,
        satirSayisi: 0,
        degisiklik: dosya.degisiklik || 0,
        sonDokunma: dosya.sonDokunma || 0,
        simgeler: [],
        dis: false
      });
    }
  }

  const modulDugumuKur = dosyaKimlik => {
    const kimlik = dosyaKimlik + '#' + MODUL;
    if (!dugumler.has(kimlik)) {
      const kayit = dosyaSimgeleri.get(dosyaKimlik);
      const dosya = kayit && kayit.dosya;
      dugumler.set(kimlik, {
        kimlik,
        ad: dosyaKimlik.split('/').pop(),
        yol: dosyaKimlik,
        dosya: dosyaKimlik,
        dil: dosya ? dosya.dil : '',
        tur: 'modul',
        disa: true,
        satir: 1,
        satirSayisi: dosya ? dosya.satirSayisi : 0,
        degisiklik: dosya ? dosya.degisiklik || 0 : 0,
        simgeler: [],
        dis: false
      });
    }
    return kimlik;
  };

  const hedeflerdeAra = (hedefDosyalar, ad) => {
    for (const h of hedefDosyalar) {
      const kayit = dosyaSimgeleri.get(h);
      if (kayit && kayit.adlar.has(ad)) return h + '#' + ad;
    }
    return null;
  };

  for (const dosya of dosyalar) {
    const kendi = dosyaSimgeleri.get(dosya.kimlik);
    const ithal = dosya.ithal || Object.create(null);
    const paket = paketSimgeleri.get(klasorAl(dosya.kimlik));
    const ithalVar = ad => Object.prototype.hasOwnProperty.call(ithal, ad);
    const ithalAl = ad => {
      const v = ithal[ad];
      return Array.isArray(v) ? v : [v];
    };

    for (const s of kendi.sirali) {
      if (!s.sahip) continue;
      const tipKimlik = paket && paket.get(s.sahip);
      if (!tipKimlik) continue;
      const uyeKimlik = dosya.kimlik + '#' + s.ad;
      if (tipKimlik === uyeKimlik) continue;
      hamKenarlar.push({ kaynak: tipKimlik, hedef: uyeKimlik, tur: 'icerir', satir: s.satir });
    }

    for (const kullanim of dosya.kullanimlar) {
      const kapsayan = kapsayanBul(kendi.sirali, kullanim.satir);
      const kaynakKimlik = kapsayan
        ? dosya.kimlik + '#' + kapsayan.ad
        : modulDugumuKur(dosya.kimlik);

      let hedefKimlik = null;
      let tur = 'cagri';

      if (kullanim.nitelik) {
        tur = kullanim.cagri ? 'cagri' : 'referans';
        if (ithalVar(kullanim.nitelik)) {
          const hedefDosyalar = ithalAl(kullanim.nitelik);
          hedefKimlik = hedeflerdeAra(hedefDosyalar, kullanim.ad);
          if (!hedefKimlik && kullanim.cagri && dosyaSimgeleri.has(hedefDosyalar[0])) {
            hedefKimlik = modulDugumuKur(hedefDosyalar[0]);
          }
        } else if (kullanim.cagri && paket && paket.has(kullanim.ad)) {
          hedefKimlik = paket.get(kullanim.ad);
          tur = 'metot';
        }
      } else {
        const yerel = kendi.adlar.get(kullanim.ad);
        if (yerel) {
          if (yerel.satir === kullanim.satir) continue;
          if (!kullanim.cagri || kullanim.ad.length < 3) continue;
          hedefKimlik = dosya.kimlik + '#' + yerel.ad;
        } else if (ithalVar(kullanim.ad)) {
          const hedefDosyalar = ithalAl(kullanim.ad);
          hedefKimlik = hedeflerdeAra(hedefDosyalar, kullanim.ad)
            || (dosyaSimgeleri.has(hedefDosyalar[0]) ? modulDugumuKur(hedefDosyalar[0]) : null);
        } else if (kullanim.cagri && paket && paket.has(kullanim.ad) && kullanim.ad.length >= 3) {
          hedefKimlik = paket.get(kullanim.ad);
        }
      }

      if (!hedefKimlik || hedefKimlik === kaynakKimlik) continue;
      hamKenarlar.push({ kaynak: kaynakKimlik, hedef: hedefKimlik, tur, satir: kullanim.satir });
    }
  }

  const benzersiz = new Map();
  for (const k of hamKenarlar) {
    if (!dugumler.has(k.kaynak) || !dugumler.has(k.hedef)) continue;
    const anahtar = k.kaynak + '>' + k.hedef;
    const v = benzersiz.get(anahtar);
    if (v) { v.agirlik++; continue; }
    benzersiz.set(anahtar, { ...k, agirlik: 1 });
  }

  const bagli = new Set();
  for (const k of benzersiz.values()) { bagli.add(k.kaynak); bagli.add(k.hedef); }
  const tut = secenekler.hepsi
    ? [...dugumler.values()]
    : [...dugumler.values()].filter(d => bagli.has(d.kimlik) || d.disa);

  return {
    ...graf,
    dugumler: tut,
    kenarlar: [...benzersiz.values()],
    simgeGrafi: true,
    kapsam: {
      dosya: dosyalar.length,
      simge: dugumler.size,
      cizilen: tut.length
    }
  };
}
