import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DOSYALAR = {
  'src/index.ts': `import { siparisOlustur } from './siparis/olustur';\nimport { kayit } from './gunluk';\nexport function baslat() { return siparisOlustur(); }\n`,
  'src/gunluk.ts': `export const kayit = (m: string) => console.log(m);\n`,
  'src/siparis/olustur.ts': `import { kayit } from '../gunluk';\nimport { dogrula } from './dogrula';\nimport React from 'react';\nexport function siparisOlustur() { return dogrula(); }\n`,
  'src/siparis/dogrula.ts': `import { kayit } from '../gunluk';\nexport function dogrula() { return true; }\n`,
  'src/dongu/a.ts': `import { b } from './b';\nexport const a = () => b();\n`,
  'src/dongu/b.ts': `import { a } from './a';\nexport const b = () => a();\n`,
  'src/index.test.ts': `import { baslat } from './index';\ntest('baslar', () => baslat());\n`,
  'arac/olcum.py': `from arac.yardim import topla\ndef olc():\n    return topla()\n`,
  'arac/yardim.py': `def topla():\n    return 1\n`
};

export function ornekDepoKur() {
  const kok = mkdtempSync(join(tmpdir(), 'tg-ornek-'));
  for (const [yol, icerik] of Object.entries(DOSYALAR)) {
    const tam = join(kok, yol);
    mkdirSync(join(tam, '..'), { recursive: true });
    writeFileSync(tam, icerik, 'utf8');
  }
  writeFileSync(join(kok, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['src/*'] } } }), 'utf8');
  return kok;
}
