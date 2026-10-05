function xmlKacir(metin) {
  return String(metin)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function dotKacir(metin) {
  return String(metin).replace(/"/g, '\\"');
}

export function dot(graf) {
  const satirlar = ['digraph talkgraph {', '  rankdir=LR;', '  node [shape=box, style=rounded, fontname="Segoe UI"];'];
  for (const d of graf.dugumler) {
    const stil = d.dis ? ', style="rounded,dashed"' : '';
    satirlar.push(`  "${dotKacir(d.kimlik)}" [label="${dotKacir(d.ad)}"${stil}];`);
  }
  for (const k of graf.kenarlar) {
    const stil = k.dongude ? ' [color="orangered"]' : (k.tur === 'dis-bagimlilik' ? ' [style=dashed]' : '');
    satirlar.push(`  "${dotKacir(k.kaynak)}" -> "${dotKacir(k.hedef)}"${stil};`);
  }
  satirlar.push('}');
  return satirlar.join('\n') + '\n';
}

export function graphml(graf) {
  const satirlar = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
    '  <key id="ad" for="node" attr.name="ad" attr.type="string"/>',
    '  <key id="yol" for="node" attr.name="yol" attr.type="string"/>',
    '  <key id="dil" for="node" attr.name="dil" attr.type="string"/>',
    '  <key id="satir" for="node" attr.name="satirSayisi" attr.type="int"/>',
    '  <key id="degisiklik" for="node" attr.name="degisiklik" attr.type="int"/>',
    '  <key id="tur" for="edge" attr.name="tur" attr.type="string"/>',
    '  <key id="agirlik" for="edge" attr.name="agirlik" attr.type="int"/>',
    '  <graph id="talkgraph" edgedefault="directed">'
  ];
  for (const d of graf.dugumler) {
    satirlar.push(`    <node id="${xmlKacir(d.kimlik)}">`);
    satirlar.push(`      <data key="ad">${xmlKacir(d.ad)}</data>`);
    satirlar.push(`      <data key="yol">${xmlKacir(d.yol)}</data>`);
    satirlar.push(`      <data key="dil">${xmlKacir(d.dil)}</data>`);
    satirlar.push(`      <data key="satir">${d.satirSayisi || 0}</data>`);
    satirlar.push(`      <data key="degisiklik">${d.degisiklik || 0}</data>`);
    satirlar.push('    </node>');
  }
  graf.kenarlar.forEach((k, i) => {
    satirlar.push(`    <edge id="e${i}" source="${xmlKacir(k.kaynak)}" target="${xmlKacir(k.hedef)}">`);
    satirlar.push(`      <data key="tur">${xmlKacir(k.tur)}</data>`);
    satirlar.push(`      <data key="agirlik">${k.agirlik || 1}</data>`);
    satirlar.push('    </edge>');
  });
  satirlar.push('  </graph>', '</graphml>');
  return satirlar.join('\n') + '\n';
}

export function csv(graf) {
  const alan = v => {
    const m = String(v ?? '');
    return /[",\n]/.test(m) ? '"' + m.replace(/"/g, '""') + '"' : m;
  };
  const satirlar = ['kaynak,hedef,tur,satir,agirlik,dongude'];
  for (const k of graf.kenarlar) {
    satirlar.push([k.kaynak, k.hedef, k.tur, k.satir || '', k.agirlik || 1, k.dongude ? 1 : 0].map(alan).join(','));
  }
  return satirlar.join('\n') + '\n';
}

export function mermaid(graf) {
  const kimlikler = new Map();
  graf.dugumler.forEach((d, i) => kimlikler.set(d.kimlik, 'n' + i));
  const satirlar = ['flowchart LR'];
  for (const d of graf.dugumler) {
    const etiket = d.ad.replace(/[["\]]/g, '');
    satirlar.push(`  ${kimlikler.get(d.kimlik)}["${etiket}"]`);
  }
  for (const k of graf.kenarlar) {
    const a = kimlikler.get(k.kaynak), b = kimlikler.get(k.hedef);
    if (!a || !b) continue;
    satirlar.push(`  ${a} ${k.tur === 'dis-bagimlilik' ? '-.->' : '-->'} ${b}`);
  }
  return satirlar.join('\n') + '\n';
}

export const bicimler = { dot, graphml, csv, mermaid, json: graf => JSON.stringify(graf, null, 2) };
export const uzantilar = { dot: '.dot', graphml: '.graphml', csv: '.csv', mermaid: '.mmd', json: '.json' };
