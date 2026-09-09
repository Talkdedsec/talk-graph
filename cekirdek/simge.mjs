const MODUL = '<modul>';

function kapsayanBul(simgeler, satir) {
  let bulunan = null;
  for (const s of simgeler) {
    if (s.satir <= satir) bulunan = s;
    else break;
  }
  return bulunan;
}

export function simgeGrafi(graf, secenekler = {}) {
  const dosyalar = graf.dugumler.filter(d => !d.dis && d.kullanimlar);
  const dugumler = new Map();
  const hamKenarlar = [];

  const dosyaSimgeleri = new Map();
  for (const dosya of dosyalar) {
    const sirali = [...(dosya.simgeler || [])].sort((a, b) => a.satir - b.satir);
    dosyaSimgeleri.set(dosya.kimlik, {
      sirali,
      adlar: new Map(sirali.map(s => [s.ad, s]))
    });
    for (const s of sirali) {
      const kimlik = dosya.kimlik + '#' + s.ad;
      dugumler.set(kimlik, {
        kimlik,
        ad: s.ad,
        yol: dosya.yol + ':' + s.satir,
        dosya: dosya.kimlik,
        dil: dosya.dil,
        tur: s.tur,
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
      const dosya = dosyalar.find(d => d.kimlik === dosyaKimlik);
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

  for (const dosya of dosyalar) {
    const kendi = dosyaSimgeleri.get(dosya.kimlik);
    const ithal = dosya.ithal || Object.create(null);
    for (const kullanim of dosya.kullanimlar) {
      const kapsayan = kapsayanBul(kendi.sirali, kullanim.satir);
      const kaynakKimlik = kapsayan
        ? dosya.kimlik + '#' + kapsayan.ad
        : modulDugumuKur(dosya.kimlik);

      const yerel = kendi.adlar.get(kullanim.ad);
      if (yerel) {
        if (yerel.satir === kullanim.satir) continue;
        if (!kullanim.cagri || kullanim.ad.length < 3) continue;
        const hedef = dosya.kimlik + '#' + yerel.ad;
        if (hedef === kaynakKimlik) continue;
        hamKenarlar.push({ kaynak: kaynakKimlik, hedef, tur: 'cagri', satir: kullanim.satir });
        continue;
      }

      const hedefDosya = Object.prototype.hasOwnProperty.call(ithal, kullanim.ad) ? ithal[kullanim.ad] : null;
      if (!hedefDosya) continue;
      const hedefSimgeler = dosyaSimgeleri.get(hedefDosya);
      const hedefKimlik = hedefSimgeler && hedefSimgeler.adlar.has(kullanim.ad)
        ? hedefDosya + '#' + kullanim.ad
        : modulDugumuKur(hedefDosya);
      if (hedefKimlik === kaynakKimlik) continue;
      hamKenarlar.push({ kaynak: kaynakKimlik, hedef: hedefKimlik, tur: 'cagri', satir: kullanim.satir });
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
