# talk-graph — durum

Başlangıç: 9 Eylül 2026. Sıfırdan yazıldı, dış bağımlılık yok, kod tamamen bize ait.
Depo: `Talkdedsec/talk-graph` (PRIVATE, origin). Sürüm: v0.2.0. CI: ubuntu+windows × node 20/22/24, yeşil.
Belgeler iki dilli: README.md (EN) + README.tr.md, docs/ARCHITECTURE.md + docs/MIMARI.md.

## Neden

archify (kurulu skill) 5 sabit tipte, elle JSON yazdıran, kodla bağı olmayan, düzenlenemeyen
diyagramlar üretiyordu. talk-graph girdiyi deponun kendisinden alır ve harita gezilebilir/düzenlenebilir.

İncelenip devralınan fikirler: archify'dan çoklu dışa aktarma biçimi ve akış animasyonu;
graphify'dan `anlat` / `yol` / topluluk kümeleme + sağlık denetimi. İkisi de sıfırdan,
bağımlılıksız ve Türkçe yazıldı; hiçbir kod ya da isim kopyalanmadı.

## Bitti

- Tarayıcı: TS/JS (tsconfig paths), Python, Go (go.mod), Rust, C#, Lua, Ruby, PHP, Java
- Graf katmanı: fan-in/out, Tarjan döngü tespiti, klasör gruplama, budama, iki tarama arası fark
- Yerleşim motoru: döngü kırma, katman atama, sanal zincir, medyan sıralama + BIT kesişme sayımı,
  koordinat ataması, ortogonal yönlendirme + uzun kenarlar için bezier
- Çizim: tek dosyalık HTML (rixor 48 KB), koyu/açık tema, mini harita, arama, detay paneli,
  düğüm sürükleme + konum dışa aktarma, PNG/SVG dışa aktarma, döngü vurgulama, akış animasyonu
- CLI: ciz / tara / anlat / yol / denetle / kume / disaaktar / fark / izle, hepsinde --json
- 11 tema (gece, gunduz, kagit, murekkep, terminal, bakir, buz, mor, orman, kontrast, gazete),
  harita içinde menü + t/Shift+t, `--tema` ile açılış teması
- Çözümleme: rol + Martin kararsızlığı, en kısa import zinciri, sağlık raporu,
  Louvain modülerlik kümeleme (`--gruplama topluluk` ile çizime bağlı)
- Dışa aktarma: dot, graphml, csv, mermaid, json
- 30 test, CI 6 iş matrisinde yeşil

Ölçüm (9 Eyl): huntx 76 dosya 625 bağ → 37 düğüm 8 katman **61 kesişme**, 42 ms.
rixor 193 dosya 1039 bağ → 10 düğüm 5 katman 24 kesişme, 392 ms.

## Sıradaki

- Simge seviyesi graf (dosya değil fonksiyon/sınıf düğümleri)
- Çağrı kenarları (şu an sadece import/using bağları var)
- Kanvas düzenleme: kenar ekleme/silme, düğüm yeniden adlandırma, spec'e geri yazma
- `tg izle` ile canlı tazeleme sırasında görünüm durumunu koruma

## Kırmızı çizgiler

- Dış bağımlılık eklenmez; Node stdlib yeterli.
- Çıktıda ve kodda başka ürün/marka adı geçmez.
- Türkçe isimlendirme sürdürülür.
