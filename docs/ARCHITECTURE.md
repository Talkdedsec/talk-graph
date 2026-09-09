# Architecture

[Türkçe](MIMARI.md)

Seven stages, each a plain ES module with no dependencies, connected by two data shapes.

```
repository ──► tarama ──► graf ──► gecmis ──► yerlesim ──► cizim ──► one HTML file
                 scan     model    history     layout      render
                            └──► analiz / disaaktar ──► report, dot, graphml, csv, mermaid
```

## Data shapes

**Graph** — what `tarama` produces and `graf`/`gecmis` enrich:

```js
{
  kok, ad, tarandi, dosyaSayisi,
  dugumler: [{ kimlik, ad, yol, dil, satirSayisi, simgeler, dis,
               gelenSayisi, gidenSayisi, grup, dongu,
               degisiklik, sonDokunma, yazarSayisi }],
  kenarlar: [{ kaynak, hedef, tur, satir, agirlik, dongude }],
  olcumler: { icDugum, disPaket, kenar, dongu, yalniz, enCokCagrilan, toplamSatir }
}
```

`kimlik` is the repo-relative POSIX path, so it is stable across machines and comparable
between two scans. External packages use the `dis:<name>` prefix.

**Layout** — what `yerlesim` produces and `cizim` serialises: the same nodes plus
`x, y, genislik, yukseklik, katman`, edges plus `noktalar` and an SVG path `yol`, group boxes,
a canvas rect and the crossing count.

## 1. Scan — `cekirdek/tarama.mjs`

Two passes. The first walks the tree (skipping build and vendor directories), reads each file
once, and runs a per-language extractor that returns import specifiers with their line numbers
and exported symbols. While reading it also builds the indexes the second pass needs: a
directory index, a C# namespace index and the Go module path from `go.mod`.

The second pass resolves each specifier against those indexes:

| language | resolution |
|---|---|
| TS/JS | relative path with extension and `index` probing, then `tsconfig` `paths` aliases |
| Python | dotted path relative to the file for `.`-prefixed imports, otherwise to the root; `__init__.py` fallback |
| Go | strip the `go.mod` module prefix, map the remainder to a directory — a package import becomes an edge to every file in that package |
| Rust | `crate::`/`self::`/`super::` walked to `x.rs`, `x/mod.rs` or the directory |
| C# | `using` matched against the namespace index |
| Lua | dotted require path mapped to a file |

Anything that stays unresolved and is not relative becomes an external package node, so a
dependency is never silently dropped. Parallel edges collapse into one carrying `agirlik`.

## 2. Model — `cekirdek/graf.mjs`

Adjacency, fan-in/out, and circular dependency detection with an **iterative** Tarjan (the
recursive form blows the stack on real repositories). Cycles are recorded on both nodes and
edges, which is what the `döngüler` button isolates.

Three reshaping functions feed the views: `grupla` collapses nodes to their folder at a chosen
depth, `komsuluk` extracts a neighbourhood of a given radius, `budale` keeps the
highest-degree nodes when a graph exceeds the draw budget. `fark` compares two scans and
reports added, removed and resized nodes plus added and removed edges.

## 3. History — `cekirdek/gecmis.mjs`

One `git log --numstat --since=<n>.days` call, parsed into change count, changed lines, last
touch and distinct author count per path. Renames (`a => b`) are folded onto the new path.
If the target is not a git repository the stage is skipped and the map is built without it.

## 4. Layout — `cekirdek/yerlesim.mjs`

A layered (Sugiyama-style) pipeline:

1. **Cycle breaking** — iterative DFS marks back edges and reverses them for the duration of
   the layout, restoring their true direction at render time.
2. **Layer assignment** — longest-path over the acyclic graph.
3. **Virtual chains** — an edge spanning more than `enFazlaAciklik` (3) layers does *not* get a
   chain. This is the decision that keeps the drawing readable: on dense graphs, chains for
   every long edge inflate layer height by thousands of pixels and drag crossings with them.
   Long edges are drawn as bezier curves instead. Measured effect on a 76-file Go repository:
   **1092 → 61 crossings**.
4. **Ordering** — median heuristic, alternating down/up sweeps, ties broken by group so folder
   mates end up adjacent. Crossings are counted with a Fenwick tree, not the naive O(n²) pair
   scan.
5. **Coordinates** — barycentre pull per layer followed by a forward/backward separation pass,
   repeated 16 times, then a global normalisation. Virtual nodes get a tighter spacing than
   real ones.
6. **Routing** — orthogonal polylines through the chain points, corners rounded with quadratic
   segments; long edges get a cubic bezier whose control offset scales with distance.
7. **Group boxes** — a folder gets a box only if its bounding rectangle contains no foreign
   node, so scattered folders produce no misleading frame.

## 5. Render — `cekirdek/cizim.mjs` + `kanvas/`

`cizim` inlines `kanvas/stil.css` and `kanvas/motor.js` into one HTML document and embeds the
layout as JSON. `<`, U+2028 and U+2029 are escaped so no path or symbol name can escape the
data block. The result loads nothing from the network — the CI job asserts this by grepping the
output for `<script src=` and `<link href=`.

`motor.js` builds the SVG scene at runtime rather than shipping pre-rendered markup, which is
what makes nodes draggable and the view editable. It owns pan/zoom, selection with neighbour
highlighting, search over paths and symbols, the detail panel, the minimap, the heat overlay,
theme switching, position export and PNG/SVG export. For export it clones the SVG, injects the
resolved theme variables as a `:root` block and a background rect, then serialises.

## 6. Analysis — `cekirdek/analiz.mjs`

Search scores an exact identifier above a filename above a stem above a path fragment, with a
penalty for test files, so `finding` resolves to `finding.go` rather than `finding_test.go`.

`anlat` classifies a node's role from its degree shape — entry point, leaf, shared core,
orchestrator, middle layer — and reports Martin instability (`out / (in + out)`), cycle
membership, callers and dependencies with line numbers.

`enKisaYol` is a BFS over the directed graph, optionally undirected, returning each hop with the
import line that makes it.

`denetle` reports cycles, nodes wired above three times the median degree, fragile nodes (high
fan-in *and* high fan-out), the longest acyclic dependency chain, files that both change often
and are depended on, and orphans.

`topluluklar` runs modularity optimisation (Louvain's local-moving phase, weighted by edge
multiplicity) and reports each community with the folders it spans — a community crossing many
folders is a module the directory tree does not admit to. `--gruplama topluluk` draws those
communities instead of folders.

## 7. Export — `cekirdek/disaaktar.mjs`

DOT, GraphML, CSV, Mermaid and raw JSON, all escaped for their format. `--gorunum grup` exports
the collapsed package graph instead of the file graph.

## Testing

`araclar/ornek-depo.mjs` writes a small fixture repository into a temp directory — a cycle, a
shared utility, an unresolvable import, a Python package and a test file — and the suites assert
resolution, graph metrics, layout invariants (no overlap within a layer, every node inside the
canvas, every edge with a valid path) and that the produced HTML is genuinely self-contained.
