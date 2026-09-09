# talk-graph

[English](README.md) · **Türkçe**

Kod tabanını gezilebilir, tek dosyalık bir mimari haritaya çevirir. Elle diyagram yazmak yok:
girdi deponun kendisi.

```bash
node bin/tg.mjs C:\yol\projem
```

Üretilen `cikti/projem.html` tek başına çalışan tek dosyadır — dış bağımlılık yok, CDN yok,
derleme adımı yok. Olduğu gibi paylaşılır.

![Bağımlılık haritası, koyu tema](docs/gorsel/harita-koyu.png)

## Neden

Diyagram araçları diyagramı sana yazdırır. Bu onu okur. Her düğüm gerçek bir dosya ya da paket,
her kenar gerçek bir dosyaya çözülmüş gerçek bir import, ve her düğüm geldiği kod satırına
geri bağlanır.

## Kurulum

Node 20 ve üstü. Başka bir şey gerekmez.

```bash
git clone git@github.com:Talkdedsec/talk-graph.git
cd talk-graph
node --test
```

CLI'yi `tg` olarak bağlamak istersen:

```bash
npm link
tg ./projem
```

## Komutlar

```
tg <yol>                        haritayı üret ve aç
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
| `--odak <yol parçası>` | yalnız o düğümün komşuluğunu çiz |
| `--cevre <n>` | odak yarıçapı (varsayılan 1) |
| `--enfazla <n>` | çizilecek en fazla düğüm (varsayılan 120) |
| `--yon sag\|asagi` | akış yönü |
| `--dis` | dış paketleri de çiz (varsayılan dışarıda) |
| `--testyok` | test dosyalarını dışla |
| `--gun <n>` | git geçmişi penceresi, gün (varsayılan 180) |
| `--gecmisyok` | git geçmişi katmanını okuma |
| `--konum <dosya>` | kaydedilmiş düğüm konumlarını geri yükle |
| `--cikti <dosya>` | çıktı yolu |

## Haritada

| hareket | sonuç |
|---|---|
| sürükle / tekerlek | gezinme ve yakınlaştırma |
| `f` | ekrana sığdır |
| `/` | dosya, klasör ve simge araması |
| `t` | tema değiştir |
| `a` | akış animasyonu |
| düğüme tıkla | çağıranlar, bağımlılıklar, dışa açılan simgeler |
| `editörde aç` | dosyayı VS Code'da açar |
| düğümü sürükle | taşı; `kaydet` konumları dışa aktarır, `--konum` geri yükler |
| `döngüler` | dairesel bağımlılıkları izole eder |
| `değişim` | düğümleri git değişiklik sayısına göre renklendirir |
| `png` / `svg` | haritayı dışa aktarır |

![Seçili düğüm, açık tema](docs/gorsel/harita-acik.png)

## Diller

TypeScript/JavaScript (`tsconfig` takma adları dahil), Python, Go (`go.mod` modül yolu),
Rust (`crate::` ve `mod`), C# (namespace dizini), Lua, Ruby, PHP, Java.

Çözülemeyen import'lar atılmaz, dış paket düğümü olur.

## Nasıl çalışır

| aşama | dosya | işi |
|---|---|---|
| tarama | `cekirdek/tarama.mjs` | dosyaları gezer, dile göre import ve simge çıkarır, hedefi gerçek dosyaya çözer |
| model | `cekirdek/graf.mjs` | fan-in/out, döngü (Tarjan), klasör gruplama, budama, tarama farkı |
| geçmiş | `cekirdek/gecmis.mjs` | `git log`'dan dosya başına değişiklik sayısı, son dokunma, yazar sayısı |
| yerleşim | `cekirdek/yerlesim.mjs` | katmanlı yerleşim: döngü kırma, katman atama, medyan sıralama, koordinat ataması, ortogonal yönlendirme |
| çizim | `cekirdek/cizim.mjs` + `kanvas/` | gömülü SVG sahnesi ve gezgini olan tek dosyalık HTML |

Uzun kenarlar sanal düğüm zincirine girmez, eğri olarak çizilir; kesişmeyi düşük tutan şey bu:
76 dosyalık Go deposunda paket haritası 42 ms'de 61 kesişmeye iniyor.

## Ölçüm

| depo | dosya | bağ | çizilen | katman | kesişme | süre |
|---|---|---|---|---|---|---|
| Go, 76 dosya | 76 | 625 | 37 | 8 | 61 | 42 ms |
| Next.js, 193 dosya | 193 | 1039 | 10 | 5 | 24 | 392 ms |

## Belgeler

- [Mimari](docs/MIMARI.md) — hattın nasıl kurulduğu
- [Değişim defteri](CHANGELOG.md)
- [Katkı](CONTRIBUTING.md)
- [Güvenlik](SECURITY.md)

## Lisans

Özel mülk. Tüm hakları saklıdır — [LICENSE](LICENSE).
