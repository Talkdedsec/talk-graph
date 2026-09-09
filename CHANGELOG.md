# Changelog · Değişim defteri

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/lang/tr/).

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
