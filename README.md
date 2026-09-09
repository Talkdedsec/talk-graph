# talk-graph

Kod tabanını tarar, bağımlılık grafiğini çıkarır ve tek dosyalık, gezilebilir bir HTML mimari haritası üretir.
Elle JSON yazmak yok: girdi deponun kendisi.

```
node bin/tg.mjs C:\yol\projem
```

Üretilen `cikti/projem.html` tek dosyadır — dış bağımlılığı yok, olduğu gibi paylaşılır.

## Komutlar

```
tg <yol>                        haritayı üret ve tarayıcıda aç
tg ciz <yol> [seçenekler]       harita üret
tg tara <yol> --cikti g.json    ham grafı kaydet
tg fark <eski.json> <yeni.json> iki tarama arasındaki değişim
tg izle <yol>                   dosya değiştikçe haritayı tazele
```

## Seçenekler

| bayrak | işi |
|---|---|
| `--gorunum grup\|dosya` | paket seviyesi (varsayılan) ya da dosya seviyesi |
| `--derinlik <n>` | grup yolu derinliği (varsayılan 2) |
| `--odak <yol parçası>` | o düğümün komşuluğunu çiz |
| `--cevre <n>` | odak yarıçapı (varsayılan 1) |
| `--enfazla <n>` | çizilecek en fazla düğüm (varsayılan 120) |
| `--yon sag\|asagi` | akış yönü |
| `--dis` | dış paketleri de çiz (varsayılan dışarıda) |
| `--konum <dosya>` | kaydedilmiş düğüm konumlarını uygula |
| `--cikti <dosya>` | çıktı yolu |

## Haritada

- sürükle / tekerlek: gezinme, `f` sığdır, `/` arama, `t` tema, `a` akış animasyonu
- düğüme tıkla: çağıranlar, bağımlılıklar, simgeler; `editörde aç` VS Code'da dosyayı açar
- düğümü sürükle, `kaydet` ile konumları `.konum.json` olarak dışa aktar, sonraki üretimde `--konum` ile geri yükle
- `png` / `svg`: haritayı dışa aktar
- `döngüler`: dairesel bağımlılıkları izole eder

## Desteklenen diller

TypeScript/JavaScript (tsconfig `paths` takma adları dahil), Python, Go (go.mod modül yolu),
Rust (`crate::`/`mod`), C# (namespace), Lua, Ruby, PHP, Java.

## Nasıl çalışır

1. `cekirdek/tarama.mjs` — dosyaları gezer, dile göre import/simge çıkarır, hedefleri gerçek dosyalara çözer
2. `cekirdek/graf.mjs` — fan-in/out, döngü (Tarjan), gruplama, budama, iki tarama arası fark
3. `cekirdek/yerlesim.mjs` — katmanlı yerleşim: döngü kırma, katman atama, medyan sıralama, koordinat ataması, ortogonal yönlendirme
4. `cekirdek/cizim.mjs` + `kanvas/` — tek dosyalık HTML, gömülü SVG sahnesi ve gezinme motoru

Bağımlılık yok, Node 20+ yeter.
