# talk-graph — durum

Başlangıç: 9 Eylül 2026. Sıfırdan yazıldı, dış bağımlılık yok, kod tamamen bize ait.
Depo: `Talkdedsec/talk-graph` (PRIVATE, origin). Sürüm: v0.7.0. Lisans: PolyForm Noncommercial 1.0.0. CI: ubuntu+windows × node 20/22/24, yeşil.
Belgeler iki dilli: README.md (EN) + README.tr.md, docs/ARCHITECTURE.md + docs/MIMARI.md.

## Neden

Elimizdeki diyagram araçları sabit tiplerde, elle JSON yazdıran, kodla bağı olmayan ve
düzenlenemeyen çıktılar üretiyordu. talk-graph girdiyi deponun kendisinden alır ve harita gezilebilir/düzenlenebilir.

İncelenen benzer araçlardan devralınan fikirler: çoklu dışa aktarma biçimi, akış animasyonu,
düğüm açıklama / en kısa yol / topluluk kümeleme + sağlık denetimi. Hepsi sıfırdan ve
bağımlılıksız yazıldı; hiçbir kod ya da isim kopyalanmadı.

## Bitti

- Tarayıcı: TS/JS (tsconfig paths), Python, Go (go.mod), Rust, C#, Lua, Ruby, PHP, Java
- Graf katmanı: fan-in/out, Tarjan döngü tespiti, klasör gruplama, budama, iki tarama arası fark
- Yerleşim motoru: döngü kırma, katman atama, sanal zincir, medyan sıralama + BIT kesişme sayımı,
  koordinat ataması, ortogonal yönlendirme + uzun kenarlar için bezier
- Çizim: tek dosyalık HTML (orta boy bir Next.js deposunda 48 KB), koyu/açık tema, mini harita, arama, detay paneli,
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

Ölçüm (9 Eyl): 76 dosyalık Go deposu, 625 bağ → 37 düğüm, 8 katman, **61 kesişme**, 42 ms.
193 dosyalık Next.js deposu, 1039 bağ → 9 düğüm, 4 katman, 2 kesişme, 0.4 s.

## Kıyas ölçümü (9 Eyl, 76 dosyalık Go deposu)

Aynı depoda karşılaştırdığımız araç 628 düğüm / 1704 kenar çıkarıyordu (bunun 548'i Go simgesi,
58'i markdown başlığı, 464 kenarı dosya→simge içerme bağı); talk-graph 350 düğüm / 277 kenar ile
geride kalıyordu — Go'da nitelikli çağrılar çözülmüyordu. Düzeltmeden sonra **547 simge / 1261 kenar** (cagri 877, referans 205, metot 125,
icerir 54). Kalan fark ağırlıkla o aracın dosya→simge `contains` kenarları (464) ve markdown
düğümleri; ikisi de bizde grup kutusu ve ayrı kapsam olarak duruyor.

Bizim önde olduğumuz yer yerleşim: karşılaştırdığımız aracın çıktısı force-directed kıl yumağı,
yön okunmuyor.
Bizimki katmanlı + ortogonal + ölçülmüş kesişme. Kıl yumağıyla yarışılmaz, oraya gidilmez.

Arayüz kıyası (v0.5.0 sonrası): karşılaştırdığımız araçta topluluk onay listesi ve düğüm bilgisi
vardı, bizde yoktu — alındı ve genişletildi (grup + bağ türü filtresi, canlı sayaç, gruba göre
renk). Bizde olup onda olmayanlar: tema seti, mini harita, git ısı katmanı, düğüm sürükleme,
editöre sıçrama, yakınlığa göre ayrıntı, kenar ipucu, kısayol penceresi, PNG/SVG dışa aktarma.

## Yayına hazırlık denetimi (9 Eyl)

Geçen: sızan kişisel yol yok, gizli değer yok, sıfır bağımlılık, 39 test, CI 6 iş matrisinde
yeşil, hatalı girdi düzgün hata veriyor, çıktı ağa çıkmıyor (CI doğruluyor).
Kapatılan: lisans (PolyForm Noncommercial), ekran görüntülerindeki özel depo sızıntısı (hepsi
talk-graph'ın kendisinden yeniden üretildi), bayat ölçüm tabloları.
Kapatılan (2. tur): CLI ve arayüz iki dilli, npm paketi hazır (50.7 KB, 17 dosya),
Pages demo workflow'u yazıldı, COMMERCIAL.md ve CODE_OF_CONDUCT.md eklendi.
Tamamlandı: depo PUBLIC, Pages demosu canlı (talkdedsec.github.io/talk-graph),
npm'de `@talkdedsec/talk-graph@0.7.0` yayında, `npx` ile çalıştığı temiz dizinde doğrulandı.
npm hesabında 2FA passkey ile açıldı (TOTP seçeneği yok, sadece security key/passkey).
Sonraki sürümler için `.github/workflows/yayin.yml` var: etiket atılınca OIDC ile yayınlar,
ama önce npm'de paket ayarlarından **trusted publisher** olarak bu depo+workflow tanıtılmalı.

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
