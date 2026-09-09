import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, extname, resolve, sep } from 'node:path';

const ATLANAN_KLASOR = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'target', 'bin', 'obj',
  '.next', '.nuxt', '.svelte-kit', '__pycache__', '.venv', 'venv', 'vendor',
  'coverage', '.turbo', '.cache', 'cikti', 'graphify-out'
]);

const DILLER = {
  '.ts': 'ts', '.tsx': 'ts', '.mts': 'ts', '.cts': 'ts',
  '.js': 'js', '.jsx': 'js', '.mjs': 'js', '.cjs': 'js',
  '.py': 'python', '.rs': 'rust', '.cs': 'csharp', '.go': 'go',
  '.lua': 'lua', '.rb': 'ruby', '.php': 'php', '.java': 'java',
  '.vue': 'js', '.svelte': 'js'
};

const JS_UZANTILAR = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.vue', '.svelte'];

function* dosyalariGez(kok, mevcut = kok, derinlik = 0) {
  if (derinlik > 12) return;
  let girdiler;
  try { girdiler = readdirSync(mevcut, { withFileTypes: true }); } catch { return; }
  for (const g of girdiler) {
    if (g.name.startsWith('.')) continue;
    const tam = join(mevcut, g.name);
    if (g.isDirectory()) {
      if (ATLANAN_KLASOR.has(g.name)) continue;
      yield* dosyalariGez(kok, tam, derinlik + 1);
    } else if (g.isFile() && DILLER[extname(g.name).toLowerCase()]) {
      yield tam;
    }
  }
}

function satirBul(icerik, indeks) {
  let n = 1;
  for (let i = 0; i < indeks && i < icerik.length; i++) if (icerik[i] === '\n') n++;
  return n;
}

const cikarici = {
  js(icerik) {
    const baglar = [], simgeler = [];
    const kaliplar = [
      /\bimport\s+(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']/g,
      /\bexport\s+(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/g,
      /\brequire\(\s*["']([^"']+)["']\s*\)/g,
      /\bimport\(\s*["']([^"']+)["']\s*\)/g
    ];
    for (const k of kaliplar) {
      let m;
      while ((m = k.exec(icerik))) baglar.push({ hedef: m[1], satir: satirBul(icerik, m.index) });
    }
    const simgeKalip = /\bexport\s+(?:default\s+)?(?:async\s+)?(function|class|const|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
    let s;
    while ((s = simgeKalip.exec(icerik))) simgeler.push({ ad: s[2], tur: s[1], satir: satirBul(icerik, s.index) });
    return { baglar, simgeler };
  },
  python(icerik) {
    const baglar = [], simgeler = [];
    const kalip = /^\s*(?:from\s+([.\w]+)\s+import|import\s+([.\w]+))/gm;
    let m;
    while ((m = kalip.exec(icerik))) baglar.push({ hedef: m[1] || m[2], satir: satirBul(icerik, m.index) });
    const sk = /^\s*(?:async\s+)?(def|class)\s+([A-Za-z_]\w*)/gm;
    let s;
    while ((s = sk.exec(icerik))) simgeler.push({ ad: s[2], tur: s[1], satir: satirBul(icerik, s.index) });
    return { baglar, simgeler };
  },
  rust(icerik) {
    const baglar = [], simgeler = [];
    const kalip = /^\s*(?:pub\s+)?(?:use\s+([\w:]+)|mod\s+(\w+)\s*;)/gm;
    let m;
    while ((m = kalip.exec(icerik))) baglar.push({ hedef: m[1] || m[2], satir: satirBul(icerik, m.index) });
    const sk = /^\s*(?:pub(?:\([\w:]+\))?\s+)?(fn|struct|enum|trait|impl)\s+(\w+)/gm;
    let s;
    while ((s = sk.exec(icerik))) simgeler.push({ ad: s[2], tur: s[1], satir: satirBul(icerik, s.index) });
    return { baglar, simgeler };
  },
  csharp(icerik) {
    const baglar = [], simgeler = [];
    const kalip = /^\s*using\s+(?:static\s+)?([\w.]+)\s*;/gm;
    let m;
    while ((m = kalip.exec(icerik))) baglar.push({ hedef: m[1], satir: satirBul(icerik, m.index) });
    const sk = /^\s*(?:public|internal|private|protected)?\s*(?:sealed\s+|static\s+|abstract\s+|partial\s+)*(class|interface|record|struct|enum)\s+(\w+)/gm;
    let s;
    while ((s = sk.exec(icerik))) simgeler.push({ ad: s[2], tur: s[1], satir: satirBul(icerik, s.index) });
    return { baglar, simgeler };
  },
  go(icerik) {
    const baglar = [], simgeler = [];
    const blok = /import\s*\(([\s\S]*?)\)/g;
    let b;
    while ((b = blok.exec(icerik))) {
      for (const satir of b[1].split('\n')) {
        const m = satir.match(/"([^"]+)"/);
        if (m) baglar.push({ hedef: m[1], satir: satirBul(icerik, b.index) });
      }
    }
    const tek = /^\s*import\s+(?:\w+\s+)?"([^"]+)"/gm;
    let t;
    while ((t = tek.exec(icerik))) baglar.push({ hedef: t[1], satir: satirBul(icerik, t.index) });
    const sk = /^\s*func\s+(?:\([^)]*\)\s*)?(\w+)|^\s*type\s+(\w+)/gm;
    let s;
    while ((s = sk.exec(icerik))) simgeler.push({ ad: s[1] || s[2], tur: s[1] ? 'func' : 'type', satir: satirBul(icerik, s.index) });
    return { baglar, simgeler };
  },
  lua(icerik) {
    const baglar = [], simgeler = [];
    const kalip = /\brequire\s*\(?\s*["']([^"']+)["']/g;
    let m;
    while ((m = kalip.exec(icerik))) baglar.push({ hedef: m[1], satir: satirBul(icerik, m.index) });
    const sk = /^\s*(?:local\s+)?function\s+([\w.:]+)/gm;
    let s;
    while ((s = sk.exec(icerik))) simgeler.push({ ad: s[1], tur: 'function', satir: satirBul(icerik, s.index) });
    return { baglar, simgeler };
  }
};
cikarici.ts = cikarici.js;
cikarici.ruby = cikarici.python;
cikarici.php = cikarici.js;
cikarici.java = cikarici.csharp;

function dosyaAra(temel, dosyaKumesi) {
  if (dosyaKumesi.has(temel)) return temel;
  for (const u of JS_UZANTILAR) if (dosyaKumesi.has(temel + u)) return temel + u;
  for (const u of JS_UZANTILAR) {
    const i = join(temel, 'index' + u);
    if (dosyaKumesi.has(i)) return i;
  }
  return null;
}

function jsCozumle(kaynakDosya, spec, kok, dosyaKumesi, takmaAdlar) {
  if (spec.startsWith('.')) return dosyaAra(resolve(dirname(kaynakDosya), spec), dosyaKumesi);
  for (const [onek, karsilik] of Object.entries(takmaAdlar)) {
    if (spec === onek || spec.startsWith(onek + '/')) {
      const kalan = spec.slice(onek.length).replace(/^\//, '');
      const bulundu = dosyaAra(resolve(kok, karsilik, kalan), dosyaKumesi);
      if (bulundu) return bulundu;
    }
  }
  return null;
}

function pythonCozumle(kaynakDosya, spec, kok, dosyaKumesi) {
  const parcalar = spec.replace(/^\.+/, '').split('.').filter(Boolean);
  if (!parcalar.length) return null;
  const temel = spec.startsWith('.') ? dirname(kaynakDosya) : kok;
  const aday = join(temel, ...parcalar);
  if (dosyaKumesi.has(aday + '.py')) return aday + '.py';
  const init = join(aday, '__init__.py');
  return dosyaKumesi.has(init) ? init : null;
}

function goModulunuOku(kok) {
  const yol = join(kok, 'go.mod');
  if (!existsSync(yol)) return null;
  try {
    const m = readFileSync(yol, 'utf8').match(/^\s*module\s+(\S+)/m);
    return m ? m[1] : null;
  } catch { return null; }
}

function goCozumle(spec, kok, goModulu, klasorIndeksi) {
  if (!goModulu) return null;
  if (spec !== goModulu && !spec.startsWith(goModulu + '/')) return null;
  const goreli = spec.slice(goModulu.length).replace(/^\//, '');
  return klasorIndeksi.get(goreli || '.') || null;
}

function rustCozumle(kaynakKimlik, spec, klasorIndeksi, dosyaKimlikleri) {
  const temiz = spec.replace(/^::/, '');
  const parcalar = temiz.split('::').filter(Boolean);
  if (!parcalar.length) return null;
  const adaylar = [];
  if (parcalar[0] === 'crate' || parcalar[0] === 'self' || parcalar[0] === 'super') {
    const kalan = parcalar.slice(1);
    if (parcalar[0] === 'crate') {
      adaylar.push('src/' + kalan.join('/'));
      for (let i = kalan.length - 1; i > 0; i--) adaylar.push('src/' + kalan.slice(0, i).join('/'));
    } else {
      const klasor = kaynakKimlik.split('/').slice(0, -1).join('/');
      adaylar.push((klasor ? klasor + '/' : '') + kalan.join('/'));
    }
  } else {
    const klasor = kaynakKimlik.split('/').slice(0, -1).join('/');
    adaylar.push((klasor ? klasor + '/' : '') + parcalar[0]);
    adaylar.push('src/' + parcalar[0]);
  }
  for (const aday of adaylar) {
    if (dosyaKimlikleri.has(aday + '.rs')) return [aday + '.rs'];
    if (dosyaKimlikleri.has(aday + '/mod.rs')) return [aday + '/mod.rs'];
    const klasorDosyalari = klasorIndeksi.get(aday);
    if (klasorDosyalari) return klasorDosyalari;
  }
  return null;
}

function paketAdi(spec) {
  const parcalar = spec.split('/');
  if (spec.startsWith('@')) return parcalar.slice(0, 2).join('/');
  if (parcalar[0].includes('.') && parcalar.length >= 3) return parcalar.slice(0, 3).join('/');
  if (parcalar.length > 1) return parcalar[0];
  return parcalar[0].split('.')[0];
}

function takmaAdlariOku(kok) {
  const adlar = {};
  for (const ad of ['tsconfig.json', 'jsconfig.json']) {
    const yol = join(kok, ad);
    if (!existsSync(yol)) continue;
    try {
      const ham = readFileSync(yol, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const conf = JSON.parse(ham);
      const temelUrl = conf.compilerOptions?.baseUrl || '.';
      for (const [desen, hedefler] of Object.entries(conf.compilerOptions?.paths || {})) {
        if (!hedefler.length) continue;
        adlar[desen.replace(/\/\*$/, '')] = join(temelUrl, hedefler[0].replace(/\/\*$/, ''));
      }
    } catch {}
  }
  if (!Object.keys(adlar).length && existsSync(join(kok, 'src'))) adlar['@'] = 'src';
  return adlar;
}

export function kimlikUret(kok, dosya) {
  return relative(kok, dosya).split(sep).join('/');
}

export function tara(kokYolu, secenekler = {}) {
  const kok = resolve(kokYolu);
  const enFazla = secenekler.enFazlaDosya ?? 4000;
  const dosyalar = [];
  for (const d of dosyalariGez(kok)) {
    dosyalar.push(d);
    if (dosyalar.length >= enFazla) break;
  }
  const kume = new Set(dosyalar);
  const takmaAdlar = takmaAdlariOku(kok);

  const dugumler = new Map();
  const hamKenarlar = [];
  const disPaketler = new Map();
  const cozulecek = [];
  const klasorIndeksi = new Map();
  const adAlaniIndeksi = new Map();
  const dosyaKimlikleri = new Set();
  const goModulu = goModulunuOku(kok);

  for (const dosya of dosyalar) {
    const dil = DILLER[extname(dosya).toLowerCase()];
    let icerik;
    try { icerik = readFileSync(dosya, 'utf8'); } catch { continue; }
    if (icerik.length > 800000) continue;
    const kimlik = kimlikUret(kok, dosya);
    const { baglar, simgeler } = (cikarici[dil] || cikarici.js)(icerik);
    dugumler.set(kimlik, {
      kimlik,
      ad: dosya.split(sep).pop(),
      yol: kimlik,
      dil,
      satirSayisi: icerik.split('\n').length,
      simgeler: simgeler.slice(0, 40),
      dis: false
    });
    dosyaKimlikleri.add(kimlik);
    const klasor = kimlik.split('/').slice(0, -1).join('/') || '.';
    if (!klasorIndeksi.has(klasor)) klasorIndeksi.set(klasor, []);
    klasorIndeksi.get(klasor).push(kimlik);
    if (dil === 'csharp') {
      const ad = icerik.match(/^\s*namespace\s+([\w.]+)/m);
      if (ad) {
        if (!adAlaniIndeksi.has(ad[1])) adAlaniIndeksi.set(ad[1], []);
        adAlaniIndeksi.get(ad[1]).push(kimlik);
      }
    }
    cozulecek.push({ dosya, kimlik, dil, baglar });
  }

  for (const { dosya, kimlik, dil, baglar } of cozulecek) {
    for (const bag of baglar) {
      let hedefler = null;
      if (dil === 'js' || dil === 'ts') {
        const bulunan = jsCozumle(dosya, bag.hedef, kok, kume, takmaAdlar);
        if (bulunan) hedefler = [kimlikUret(kok, bulunan)];
      } else if (dil === 'python') {
        const bulunan = pythonCozumle(dosya, bag.hedef, kok, kume);
        if (bulunan) hedefler = [kimlikUret(kok, bulunan)];
      } else if (dil === 'go') {
        hedefler = goCozumle(bag.hedef, kok, goModulu, klasorIndeksi);
      } else if (dil === 'rust') {
        hedefler = rustCozumle(kimlik, bag.hedef, klasorIndeksi, dosyaKimlikleri);
      } else if (dil === 'csharp') {
        hedefler = adAlaniIndeksi.get(bag.hedef) || null;
      } else if (dil === 'lua') {
        const aday = bag.hedef.replace(/\./g, '/');
        if (dosyaKimlikleri.has(aday + '.lua')) hedefler = [aday + '.lua'];
      }
      if (hedefler && hedefler.length) {
        for (const h of hedefler) {
          if (h === kimlik) continue;
          hamKenarlar.push({ kaynak: kimlik, hedef: h, tur: 'ice-aktarim', satir: bag.satir });
        }
      } else if (!bag.hedef.startsWith('.')) {
        const paket = paketAdi(bag.hedef);
        if (!paket || paket.length < 2) continue;
        const pk = 'dis:' + paket;
        if (!disPaketler.has(pk)) {
          disPaketler.set(pk, { kimlik: pk, ad: paket, yol: paket, dil: 'dis', dis: true, satirSayisi: 0, simgeler: [] });
        }
        hamKenarlar.push({ kaynak: kimlik, hedef: pk, tur: 'dis-bagimlilik', satir: bag.satir });
      }
    }
  }

  for (const [k, v] of disPaketler) dugumler.set(k, v);

  const gecerli = new Set(dugumler.keys());
  const benzersiz = new Map();
  for (const k of hamKenarlar) {
    if (!gecerli.has(k.kaynak) || !gecerli.has(k.hedef) || k.kaynak === k.hedef) continue;
    const anahtar = k.kaynak + '>' + k.hedef;
    const v = benzersiz.get(anahtar);
    if (v) { v.agirlik++; continue; }
    benzersiz.set(anahtar, { ...k, agirlik: 1 });
  }

  return {
    kok,
    ad: kok.split(sep).pop(),
    dugumler: [...dugumler.values()],
    kenarlar: [...benzersiz.values()],
    tarandi: new Date().toISOString(),
    dosyaSayisi: dosyalar.length
  };
}
