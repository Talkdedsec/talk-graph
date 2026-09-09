# talk-graph — durum

Başlangıç: 9 Eylül 2026. Sıfırdan yazıldı, dış bağımlılık yok, kod tamamen bize ait.
Depo: `Talkdedsec/talk-graph` (PRIVATE, origin). Sürüm: v0.4.0. CI: ubuntu+windows × node 20/22/24, yeşil.
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
- Simge seviyesi graf: fonksiyon/sınıf düğümleri, çağrı kenarları, dosya grup kutuları
  (TS/JS + Python; import bağlama + kapsayan bildirim + çağrı biçimi süzgeci)
- Sütun sarması: 26'dan kalabalık katman yan yana sütunlara akıtılır
- Görünüm durumu sessionStorage'da; tazeleme yeri kaybetmiyor
- 37 test, CI 6 iş matrisinde yeşil

Ölçüm (9 Eyl): huntx 76 dosya 625 bağ → 37 düğüm 8 katman **61 kesişme**, 42 ms.
rixor 193 dosya 1039 bağ → 10 düğüm 5 katman 24 kesişme, 392 ms.

## Kıyas ölçümü (9 Eyl, huntx üzerinde)

Aynı depoda graphify 628 düğüm / 1704 kenar (calls 635, references 551, contains 464, method 54)
çıkarıyordu; talk-graph 350 düğüm / 277 kenar ile geride kalıyordu — Go'da nitelikli çağrılar
çözülmüyordu. Düzeltmeden sonra **547 simge / 1261 kenar** (cagri 877, referans 205, metot 125,
icerir 54). Kalan fark ağırlıkla graphify'ın dosya→simge `contains` kenarları (464) ve markdown
düğümleri; ikisi de bizde grup kutusu ve ayrı kapsam olarak duruyor.

Bizim önde olduğumuz yer yerleşim: graphify'ın çıktısı force-directed kıl yumağı, yön okunmuyor.
Bizimki katmanlı + ortogonal + ölçülmüş kesişme. Kıl yumağıyla yarışılmaz, oraya gidilmez.

## Sıradaki

- `contains` kenarı: dosya→simge hiyerarşisi (grup kutusuna alternatif, opsiyonel)
- Markdown/doküman düğümleri (`--belge`): başlık düğümleri + kod referansları
- Artımlı tarama: sadece değişen dosyayı yeniden çıkar (`tg izle` şu an tümünü tarıyor)

- `tg izle` ile tarayıcıyı kendiliğinden tazeleme (küçük yerel sunucu + sürüm damgası)

- Kanvas düzenleme: kenar ekleme/silme, düğüm yeniden adlandırma, spec'e geri yazma

## Kırmızı çizgiler

- Dış bağımlılık eklenmez; Node stdlib yeterli.
- Çıktıda ve kodda başka ürün/marka adı geçmez.
- Türkçe isimlendirme sürdürülür.
