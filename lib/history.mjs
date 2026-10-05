import { execFileSync } from 'node:child_process';

export function gecmisiOku(kok, gunSayisi = 180) {
  let ham;
  try {
    ham = execFileSync('git', [
      '-C', kok, 'log', `--since=${gunSayisi}.days`, '--numstat',
      '--no-merges', '--pretty=format:@%H|%at|%an'
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }

  const kayit = new Map();
  let zaman = 0, yazar = '';
  for (const satir of ham.split('\n')) {
    if (satir.startsWith('@')) {
      const p = satir.slice(1).split('|');
      zaman = Number(p[1]) * 1000;
      yazar = p[2] || '';
      continue;
    }
    if (!satir.trim()) continue;
    const [eklenen, silinen, yol] = satir.split('\t');
    if (!yol) continue;
    const temiz = yol.includes('=>') ? yol.replace(/.*=>\s*/, '').replace(/[{}]/g, '') : yol;
    const v = kayit.get(temiz) || { degisiklik: 0, satir: 0, sonDokunma: 0, yazarlar: new Set() };
    v.degisiklik++;
    v.satir += (Number(eklenen) || 0) + (Number(silinen) || 0);
    v.sonDokunma = Math.max(v.sonDokunma, zaman);
    if (yazar) v.yazarlar.add(yazar);
    kayit.set(temiz, v);
  }

  const sonuc = new Map();
  for (const [yol, v] of kayit) {
    sonuc.set(yol, {
      degisiklik: v.degisiklik,
      degisenSatir: v.satir,
      sonDokunma: v.sonDokunma,
      yazarSayisi: v.yazarlar.size
    });
  }
  return sonuc;
}

export function gecmisiIsle(graf, gunSayisi) {
  const gecmis = gecmisiOku(graf.kok, gunSayisi);
  if (!gecmis) return graf;
  let enFazla = 0;
  for (const d of graf.dugumler) {
    if (d.dis) continue;
    const g = gecmis.get(d.yol);
    if (!g) continue;
    d.degisiklik = g.degisiklik;
    d.degisenSatir = g.degisenSatir;
    d.sonDokunma = g.sonDokunma;
    d.yazarSayisi = g.yazarSayisi;
    enFazla = Math.max(enFazla, g.degisiklik);
  }
  graf.gecmisEnFazla = enFazla;
  return graf;
}
