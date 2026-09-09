# Changelog · Değişim defteri

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/lang/tr/).

## [0.6.0] — 2026-09-09

### Changed · Degisen

- **Licence: PolyForm Noncommercial 1.0.0.** Free for any noncommercial purpose — personal work,
  research, teaching, charities, government. Selling it or running it inside a commercial
  service needs a separate licence from the copyright holder.
  *Lisans: ticari olmayan her kullanim serbest, satis ve ticari hizmet ayri lisans ister.*
- **Every screenshot is now the tool mapping itself.** The previous images came from a private
  repository and exposed its internal package names; all 16 were regenerated from this
  repository, which also makes them reproducible by anyone who clones it.
  *Butun ekran goruntuleri araci kendi haritasini cizerken alindi; onceki gorseller ozel bir
  deponun ic yapisini gosteriyordu.*

[0.6.0]: https://github.com/Talkdedsec/talk-graph/releases/tag/v0.6.0

## [0.5.1] — 2026-09-09

### Fixed · Duzeltilen

- **Bad input failed silently.** A missing path, a directory with no source files and an invalid
  flag value all produced an empty map and exit code 0. Each now names the problem, lists the
  valid values or supported extensions, and exits 1.
  *Hatali girdi sessizce bos harita uretiyordu; artik sorunu adiyla soyleyip 1 ile cikiyor.*
- The measurement tables in both READMEs were stale after the external-package default changed;
  refreshed and a symbol-level row added.
  *Iki README'deki olcum tablosu bayatti, tazelendi.*

[0.5.1]: https://github.com/Talkdedsec/talk-graph/releases/tag/v0.5.1

## [0.5.0] — 2026-09-09

### Added · Eklenen

- **Group and edge-type filter panel (`g`)** — every group listed with its colour and count,
  switched off one at a time, with a live counter of what is still on screen.
  *Grup ve bag turu suzgec paneli; her grup rengi ve sayisiyla, ekranda kalani sayan gostergeyle.*
- **Colour by group** — each node carries the colour of the group it belongs to, so clusters are
  visible without reading a single label.
  *Gruba gore renk; kumeler tek etiket okumadan gorunuyor.*
- **Detail by zoom** — below 0.5 only the most connected nodes keep their labels and they grow;
  below 0.24 the map reads as coloured blocks with landmark names.
  *Yakinliga gore ayrinti; uzaklasinca yalniz isaret taslari etiketini koruyor.*
- **Edge tooltip** — hovering an edge shows source → target, its relation type and the line.
  *Kenar ipucu: kaynak, hedef, iliski turu ve satir.*
- **Shortcut overlay (`?`)** and the new keys `g`, `c`, `1`, `2`, `3`.
- Fit now accounts for the open panels instead of hiding the map behind them.
  *Sigdirma acik panelleri hesaba katiyor.*

[0.5.0]: https://github.com/Talkdedsec/talk-graph/releases/tag/v0.5.0

## [0.4.0] — 2026-09-09

### Changed · Degisen

- **Symbol level now covers Go, Rust, C# and Java.** Qualified calls (`scope.Load()`,
  `pkg::fn()`, `Ns.Method()`) resolve through the import's bound name to the symbol in the
  target package, Go methods carry their receiver type, C# members are extracted, and a call
  that resolves inside the caller's own package is kept as a `metot` edge.
  *Simge seviyesi Go, Rust, C# ve Java'yi da kapsiyor; nitelikli cagrilar hedef paketteki
  simgeye cozuluyor.*
  Measured on a 76-file Go repository: **350 → 547 symbols, 277 → 1261 edges**, and the top
  nodes become `finding.Finding`, `cli.Execute`, `fetch.Client`, `scope.Scope`.
- **Two more relation types** — `referans` (named without being called) and `icerir` (a type
  contains a method), drawn distinctly.
  *Iki yeni iliski turu: referans ve icerir.*

### Fixed · Duzeltilen

- A package name mentioned in a qualified expression no longer produced a spurious edge to the
  package's module node; the qualifier is now consumed by the qualified match.
  *Nitelikli ifadedeki paket adi artik sahte modul kenari uretmiyor.*

[0.4.0]: https://github.com/Talkdedsec/talk-graph/releases/tag/v0.4.0

## [0.3.0] — 2026-09-09

### Added · Eklenen

- **Symbol level (`--gorunum simge`)** — nodes are functions, classes and types; edges are calls
  and uses carrying the line that makes them. Named imports resolve to the symbol they name,
  group boxes become files, and clicking a symbol opens the file at its line. Covers
  TypeScript/JavaScript and Python; other languages keep file nodes.
  *Simge seviyesi — dugumler fonksiyon/sinif/tip, kenarlar cagri; adlandirilmis import'lar
  isaret ettikleri simgeye cozulur, grup kutulari dosyaya doner.*
- **Column wrapping** — a layer with more than 26 nodes reflows into side-by-side columns
  instead of one endless vertical stack. On this repository's own symbol map that turns a
  6500-pixel column into a map that fits the screen.
  *Sutun sarmasi — 26'dan fazla dugumlu katman yan yana sutunlara akitilir.*
- **View state survives a refresh** — zoom, pan and the selected node are kept per map in
  `sessionStorage`, so `tg izle` regenerating the file no longer loses your place.
  *Gorunum durumu tazelemeden sagkalir; `tg izle` sonrasi yerini kaybetmezsin.*
- `--hepsi` draws unconnected symbols too.
- 7 more tests (37 total): import binding, call edges, symbol metadata, and a wrapping
  invariant asserting no two nodes overlap after reflow.

[0.3.0]: https://github.com/Talkdedsec/talk-graph/releases/tag/v0.3.0

## [0.2.0] — 2026-09-09

### Added · Eklenen

- **Eleven themes** — gece, gunduz, kagit, murekkep, terminal, bakir, buz, mor, orman, kontrast,
  gazete. `--tema` picks the starting one, the `tema` menu and `t` / `Shift+t` switch inside the
  map, the choice is remembered per browser, and export follows the theme on screen.
  *On bir tema; `--tema` ile acilis, harita icinde menu ve `t` ile gecis, tarayici basina hatirlanir.*
- **`tg anlat`** — explains one node: role inferred from degree shape, Martin instability, cycle
  membership, callers and dependencies with import line numbers, exported symbols.
  *Bir dugumu aciklar: rol, kararsizlik, dongu uyeligi, cagiranlar ve bagimliliklar.*
- **`tg yol`** — shortest import chain between two nodes, `--yonsuz` for the undirected question.
  *Iki dugum arasindaki en kisa import zinciri.*
- **`tg denetle`** — health report: cycles, nodes above three times the median degree, fragile
  nodes, longest acyclic chain, files that both change often and are depended on, orphans.
  *Saglik raporu: donguler, tanri dugumler, kirilganlar, en uzun zincir, riskli dosyalar, yalnizlar.*
- **`tg kume`** — modularity clustering (Louvain local moving) reporting each community with the
  folders it spans; `--gruplama topluluk` draws communities instead of folders.
  *Modulerlik kumeleme; `--gruplama topluluk` klasor yerine toplulugu cizer.*
- **`tg disaaktar`** — DOT, GraphML, CSV, Mermaid and JSON output.
- `--json` on every analysis command, for piping into other tools.
- 11 more tests (30 total) covering search ranking, roles, path finding, health report,
  community partition integrity and every export format.

[0.2.0]: https://github.com/Talkdedsec/talk-graph/releases/tag/v0.2.0

## [0.1.0] — 2026-09-09

First working version. İlk çalışan sürüm.

### Added · Eklenen

- **Scanner** — import and symbol extraction for TypeScript/JavaScript (`tsconfig` path
  aliases), Python, Go (`go.mod` module path), Rust (`crate::` / `mod`), C# (namespace index),
  Lua, Ruby, PHP, Java. Unresolved specifiers become external package nodes.
  *Tarayıcı — sayılan diller için import ve simge çıkarımı; çözülemeyen import dış paket düğümü olur.*
- **Graph layer** — fan-in/out, circular dependency detection (Tarjan, iterative), folder
  grouping, degree-weighted pruning, neighbourhood extraction, diff between two scans.
  *Graf katmanı — fan-in/out, döngü tespiti, klasör gruplama, budama, komşuluk, tarama farkı.*
- **History layer** — per-file change count, last touch and author count from `git log`,
  surfaced as an optional heat overlay.
  *Geçmiş katmanı — dosya başına değişiklik, son dokunma ve yazar sayısı; isteğe bağlı ısı katmanı.*
- **Layout engine** — cycle breaking, layer assignment, virtual chains for medium spans,
  median ordering with Fenwick-tree crossing counting, iterative coordinate assignment,
  orthogonal routing with rounded corners, bezier routing for long edges, group boxes.
  *Yerleşim motoru — döngü kırma, katman atama, medyan sıralama, koordinat ataması, ortogonal
  ve eğrisel yönlendirme, grup kutuları.*
- **Renderer** — one self-contained HTML file: dark/light themes, pan/zoom, minimap, search
  over files and symbols, detail panel with callers and dependencies, VS Code jump, node
  dragging with position export, cycle isolation, flow animation, PNG/SVG export.
  *Çizim — tek dosyalık HTML: iki tema, mini harita, arama, detay paneli, VS Code sıçraması,
  düğüm sürükleme, döngü izolasyonu, akış animasyonu, PNG/SVG dışa aktarma.*
- **CLI** — `ciz`, `tara`, `fark`, `izle` with 12 flags.
- 19 tests covering resolution, graph metrics, layout invariants and output self-containment.
  *Çözümleme, graf ölçümleri, yerleşim değişmezleri ve çıktının kendine yeterliliği için 19 test.*

### Measured · Ölçülen

| repository | files | edges | drawn | crossings | time |
|---|---|---|---|---|---|
| Go, 76 files | 76 | 625 | 37 | 61 | 42 ms |
| Next.js, 193 files | 193 | 1039 | 10 | 24 | 392 ms |

[0.1.0]: https://github.com/Talkdedsec/talk-graph/releases/tag/v0.1.0
