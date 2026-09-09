# talk-graph

[![ci](https://github.com/Talkdedsec/talk-graph/actions/workflows/ci.yml/badge.svg)](https://github.com/Talkdedsec/talk-graph/actions/workflows/ci.yml)

**English** · [Türkçe](README.tr.md)

Turns a codebase into a navigable, single-file architecture map. No hand-written diagram
specs: the input is the repository itself.

```bash
node bin/tg.mjs C:\path\to\project
```

The generated `cikti/project.html` is one self-contained file — no runtime dependencies,
no CDN, no build step. Share it as-is.

![Dependency map, dark theme](docs/gorsel/harita-koyu.png)

## Why

Diagram tools ask you to write the diagram. This one reads it. Every node is a real file or
package, every edge a real import resolved to a real target, and every node links back to the
line of code it came from.

## Install

Node 20 or newer. Nothing else.

```bash
git clone git@github.com:Talkdedsec/talk-graph.git
cd talk-graph
node --test
```

Optionally link the CLI as `tg`:

```bash
npm link
tg ./my-project
```

## Commands

```
tg <path>                       build the map and open it
tg ciz <path> [options]         build the map
tg tara <path> --cikti g.json   dump the raw graph
tg fark <old.json> <new.json>   diff two scans
tg izle <path>                  rebuild on file change
```

## Options

| flag | effect |
|---|---|
| `--gorunum grup\|dosya` | package level (default) or file level |
| `--derinlik <n>` | grouping path depth (default 2) |
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
| `t` | switch theme |
| `a` | flow animation |
| click a node | callers, dependencies, exported symbols |
| `editörde aç` | open that file in VS Code |
| drag a node | move it; `kaydet` exports positions, `--konum` restores them |
| `döngüler` | isolate circular dependencies |
| `değişim` | colour nodes by git change count |
| `png` / `svg` | export the map |

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
| render | `cekirdek/cizim.mjs` + `kanvas/` | single-file HTML with an inline SVG scene and its viewer |

Long edges skip the virtual-node chain and are drawn as curves instead, which is what keeps
crossings low: on a 76-file Go repository the package map lands at 61 crossings in 42 ms.

## Measurements

| repository | files | edges | drawn | layers | crossings | time |
|---|---|---|---|---|---|---|
| Go, 76 files | 76 | 625 | 37 | 8 | 61 | 42 ms |
| Next.js, 193 files | 193 | 1039 | 10 | 5 | 24 | 392 ms |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — how the pipeline is put together
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Licence

Proprietary. All rights reserved — see [LICENSE](LICENSE).
