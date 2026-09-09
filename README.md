# talk-graph

[![ci](https://github.com/Talkdedsec/talk-graph/actions/workflows/ci.yml/badge.svg)](https://github.com/Talkdedsec/talk-graph/actions/workflows/ci.yml)

**English** · [Türkçe](README.tr.md)

Turns a codebase into a navigable, single-file architecture map. No hand-written diagram
specs: the input is the repository itself.

**[Open the live demo →](https://talkdedsec.github.io/talk-graph/)** — this repository, mapped by itself.

```bash
npx talk-graph ./my-project
```

The generated `cikti/my-project.html` is one self-contained file — no runtime dependencies,
no CDN, no build step. Share it as-is.

Commands and flags work in **English and Turkish**: `tg draw` and `tg ciz` are the same command,
`--view symbol` and `--gorunum simge` the same flag. Output follows your locale, or `--lang`.

![Dependency map, dark theme](docs/gorsel/harita-koyu.png)

## Why

Diagram tools ask you to write the diagram. This one reads it. Every node is a real file or
package, every edge a real import resolved to a real target, and every node links back to the
line of code it came from.

![Symbol view: functions and the calls between them](docs/gorsel/harita-simge.png)

## Three levels

| level | node | edge |
|---|---|---|
| `--gorunum grup` | package / folder | imports between them |
| `--gorunum dosya` | file | resolved import |
| `--gorunum simge` | function, class, type | call or use, with the line that makes it |

Symbol level resolves named imports and qualified calls (`scope.Load()`, `pkg::fn()`) to the
symbol they name, so a node is a function, method or type and an edge is a call. Group boxes
become files. Clicking a symbol opens the file at its line.

| edge | means |
|---|---|
| `cagri` | one symbol calls another |
| `referans` | one symbol names another without calling it |
| `metot` | a call resolved inside the same package |
| `icerir` | a type contains a method |

Covers TypeScript/JavaScript, Python, Go, Rust, C# and Java. On a 76-file Go repository it
extracts 547 symbols and 1261 edges, and the most connected nodes it reports are the ones a
reader would name by hand: `finding.Finding`, `cli.Execute`, `fetch.Client`, `scope.Scope`.

## Install

Node 20 or newer. Nothing else.

```bash
npx talk-graph ./my-project          # no install
npm install -g talk-graph && tg .    # or install the tg command
```

From source:

```bash
git clone https://github.com/Talkdedsec/talk-graph.git
cd talk-graph
node --test
node bin/tg.mjs ./my-project
```

## Commands

```
tg <path>                        build the map and open it
tg ciz <path> [options]          build the map
tg tara <path> --cikti g.json    dump the raw graph
tg anlat <path> <search>         explain one node: role, callers, dependencies
tg yol <path> <a> <b>            shortest chain between two nodes
tg denetle <path>                health report: cycles, god nodes, risky files
tg kume <path>                   find communities by connectivity, compare to folders
tg disaaktar <path> --bicim dot  dot | graphml | csv | mermaid | json
tg fark <old.json> <new.json>    diff two scans
tg izle <path>                   rebuild on file change
```

### What the analysis commands answer

```bash
tg anlat ./api order.ts     # who calls this, what it pulls in, is it in a cycle
tg yol ./api route.ts db.ts # the exact import chain that connects them, with line numbers
tg denetle ./api            # cycles, over-connected nodes, files that change and are depended on
tg kume ./api               # modules the code actually has, versus the folders it claims
```

### English ↔ Turkish

| English | Türkçe | | English | Türkçe |
|---|---|---|---|---|
| `draw` | `ciz` | | `--view` | `--gorunum` |
| `scan` | `tara` | | `--out` | `--cikti` |
| `explain` | `anlat` | | `--depth` | `--derinlik` |
| `path` | `yol` | | `--grouping` | `--gruplama` |
| `audit` | `denetle` | | `--focus` | `--odak` |
| `cluster` | `kume` | | `--radius` | `--cevre` |
| `export` | `disaaktar` | | `--max` | `--enfazla` |
| `diff` | `fark` | | `--direction` | `--yon` |
| `watch` | `izle` | | `--theme` | `--tema` |
| `group` / `file` / `symbol` | `grup` / `dosya` / `simge` | | `--external` | `--dis` |
| `folder` / `community` | `klasor` / `topluluk` | | `--no-tests` | `--testyok` |
| `right` / `down` | `sag` / `asagi` | | `--no-history` | `--gecmisyok` |
| | | | `--positions` | `--konum` |
| | | | `--all` | `--hepsi` |
| | | | `--no-open` | `--acma` |
| | | | `--lang` | `--dil` |

## Options

| flag | effect |
|---|---|
| `--gorunum grup\|dosya\|simge` | package level (default), file level, or symbol level |
| `--hepsi` | in symbol view, draw unconnected symbols too |
| `--derinlik <n>` | grouping path depth (default 2) |
| `--gruplama klasor\|topluluk` | group by folder, or by what the code actually connects |
| `--tema <ad>` | starting theme, see [Themes](docs/TEMALAR.md) |
| `--odak <path fragment>` | draw only that node's neighbourhood |
| `--cevre <n>` | focus radius (default 1) |
| `--enfazla <n>` | max nodes drawn (default 120) |
| `--yon sag\|asagi` | flow direction |
| `--dis` | include external packages (excluded by default) |
| `--testyok` | drop test files |
| `--gun <n>` | git history window in days (default 180) |
| `--gecmisyok` | skip the git history layer |
| `--konum <file>` | restore saved node positions |
| `--cikti <file>` | output path |

## In the map

| action | effect |
|---|---|
| drag / wheel | pan and zoom |
| `f` | fit to screen |
| `/` | search files, folders and symbols |
| `t` / `Shift+t` | next / previous theme (11 of them) |
| `a` | flow animation |
| click a node | callers, dependencies, exported symbols |
| `editörde aç` | open that file in VS Code |
| drag a node | move it; `kaydet` exports positions, `--konum` restores them |
| `döngüler` | isolate circular dependencies |
| `değişim` | colour nodes by git change count |
| `png` / `svg` | export the map |
| `g` | group / edge-type filter panel |
| `1` · `2` · `3` | zoom in · out · fit |
| `c` | isolate circular dependencies |
| `?` | shortcut list |
| hover an edge | source → target and the line that makes it |

Each node is tinted by the group it belongs to, the panel on the left lists those groups with
their counts and switches them off one by one, and the counter in the toolbar reports what is
left on screen. Zoom out and only the landmarks keep their labels.

![Selected node with callers and history](docs/gorsel/harita-detay.png)

![Selected node, light theme](docs/gorsel/harita-acik.png)

## Languages

TypeScript/JavaScript (including `tsconfig` path aliases), Python, Go (module path from
`go.mod`), Rust (`crate::` and `mod`), C# (namespace index), Lua, Ruby, PHP, Java.

Unresolved imports become external package nodes instead of being dropped.

## How it works

| stage | file | job |
|---|---|---|
| scan | `cekirdek/tarama.mjs` | walk files, extract imports and symbols per language, resolve targets to real files |
| model | `cekirdek/graf.mjs` | fan-in/out, cycles (Tarjan), folder grouping, pruning, scan diff |
| history | `cekirdek/gecmis.mjs` | change count, last touch and author count per file from `git log` |
| layout | `cekirdek/yerlesim.mjs` | layered layout: cycle breaking, layer assignment, median ordering, coordinate assignment, orthogonal routing |
| analysis | `cekirdek/analiz.mjs` | node search, explanation, shortest path, health report, modularity clustering |
| export | `cekirdek/disaaktar.mjs` | dot, graphml, csv, mermaid, json |
| render | `cekirdek/cizim.mjs` + `kanvas/` | single-file HTML with an inline SVG scene and its viewer |

Long edges skip the virtual-node chain and are drawn as curves instead, which is what keeps
crossings low: on a 76-file Go repository the package map lands at 61 crossings in 42 ms.

## Measurements

| repository | files | edges | drawn | layers | crossings | time |
|---|---|---|---|---|---|---|
| Go, 76 files | 76 | 625 | 37 | 8 | 61 | 42 ms |
| Go, symbol level | 547 symbols | 1261 | 150 | 10 | 6474 | 0.1 s |
| Next.js, 193 files | 193 | 1039 | 9 | 4 | 2 | 0.4 s |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — how the pipeline is put together
- [Themes](docs/TEMALAR.md) — the eleven built-in themes and how to add one
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Commercial licence](COMMERCIAL.md) — when you need one, and how to get it

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE) — free for any noncommercial use: personal work,
research, teaching, charities, government. Selling it or running it inside a commercial
service needs a separate licence: talkdedsec@proton.me.
