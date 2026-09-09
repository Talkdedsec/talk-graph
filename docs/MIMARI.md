# Mimari

[English](ARCHITECTURE.md)

Beş aşama; her biri bağımlılığı olmayan düz bir ES modülü, iki veri şekliyle birbirine bağlı.

```
depo ──► tarama ──► graf ──► gecmis ──► yerlesim ──► cizim ──► tek HTML dosyası
```

## Veri şekilleri

**Graf** — `tarama` üretir, `graf` ve `gecmis` zenginleştirir:

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

`kimlik` depoya göreli POSIX yoludur: makineden makineye değişmez, iki tarama arasında
karşılaştırılabilir. Dış paketler `dis:<ad>` önekini alır.

**Yerleşim** — `yerlesim` üretir, `cizim` seri hale getirir: aynı düğümler artı
`x, y, genislik, yukseklik, katman`; kenarlar artı `noktalar` ve SVG `yol`; grup kutuları,
tuval dikdörtgeni ve kesişme sayısı.

## 1. Tarama — `cekirdek/tarama.mjs`

İki geçiş. Birincisi ağacı gezer (derleme ve vendor klasörlerini atlar), her dosyayı bir kez
okur ve dile göre çalışan çıkarıcıyı koşturur; çıkarıcı import metinlerini satır numarasıyla
ve dışa açılan simgeleri döndürür. Aynı okuma sırasında ikinci geçişin ihtiyaç duyduğu
dizinler kurulur: klasör dizini, C# namespace dizini ve `go.mod`'dan modül yolu.

İkinci geçiş her import'u bu dizinlere karşı çözer:

| dil | çözümleme |
|---|---|
| TS/JS | göreli yol + uzantı ve `index` denemesi, sonra `tsconfig` `paths` takma adları |
| Python | `.` ile başlayan import dosyaya göreli, diğerleri köke göre; `__init__.py` yedeği |
| Go | `go.mod` modül öneki atılır, kalan klasöre eşlenir — paket import'u o paketteki her dosyaya kenar olur |
| Rust | `crate::`/`self::`/`super::` yürütülüp `x.rs`, `x/mod.rs` ya da klasöre bağlanır |
| C# | `using` namespace dizininde aranır |
| Lua | noktalı require yolu dosyaya eşlenir |

Çözülemeyen ve göreli olmayan her şey dış paket düğümü olur; hiçbir bağımlılık sessizce
düşmez. Aynı çiftteki tekrarlı kenarlar `agirlik` taşıyan tek kenara iner.

## 2. Model — `cekirdek/graf.mjs`

Komşuluk, fan-in/out ve **yinelemeli** Tarjan ile döngü tespiti (özyinelemeli biçim gerçek
depolarda yığını taşırıyor). Döngü hem düğüme hem kenara işaretlenir; `döngüler` düğmesinin
izole ettiği şey bu.

Görünümleri üç şekillendirici besler: `grupla` düğümleri seçilen derinlikteki klasöre toplar,
`komsuluk` verilen yarıçapta komşuluğu çıkarır, `budale` çizim bütçesi aşıldığında en bağlı
düğümleri tutar. `fark` iki taramayı karşılaştırır: eklenen, silinen, boyu değişen düğümler ve
eklenen/silinen kenarlar.

## 3. Geçmiş — `cekirdek/gecmis.mjs`

Tek bir `git log --numstat --since=<n>.days` çağrısı; yol başına değişiklik sayısı, değişen
satır, son dokunma ve ayrı yazar sayısına ayrıştırılır. Yeniden adlandırma (`a => b`) yeni yola
katlanır. Hedef git deposu değilse aşama atlanır ve harita onsuz üretilir.

## 4. Yerleşim — `cekirdek/yerlesim.mjs`

Katmanlı (Sugiyama tarzı) hat:

1. **Döngü kırma** — yinelemeli DFS geri kenarları işaretler ve yerleşim boyunca ters çevirir;
   çizim anında gerçek yönüne döner.
2. **Katman atama** — döngüsüz graf üzerinde en uzun yol.
3. **Sanal zincir** — `enFazlaAciklik` (3) katmandan fazlasını aşan kenar zincir *almaz*.
   Çizimi okunur tutan karar budur: yoğun graflarda her uzun kenara zincir açmak katman
   yüksekliğini binlerce piksel şişiriyor, kesişmeyi de peşinden sürüklüyor. Uzun kenarlar
   bunun yerine bezier eğrisi olarak çizilir. 76 dosyalık Go deposunda ölçülen etki:
   **1092 → 61 kesişme**.
4. **Sıralama** — medyan sezgiseli, aşağı/yukarı dönüşümlü taramalar, eşitlik grup adına göre
   bozulur ki aynı klasördekiler yan yana düşsün. Kesişme naif O(n²) tarama ile değil Fenwick
   ağacıyla sayılır.
5. **Koordinat** — katman başına ağırlık merkezine çekme, ardından ileri/geri ayrıştırma
   geçişi, 16 tur, sonunda genel normalleştirme. Sanal düğümler gerçeklerden daha sıkı aralıklı.
6. **Yönlendirme** — zincir noktalarından geçen ortogonal çoklu çizgi, köşeler karesel
   parçalarla yuvarlanır; uzun kenarlar mesafeyle ölçeklenen kontrol noktalı kübik bezier alır.
7. **Grup kutusu** — bir klasör, sınırlayıcı dikdörtgeni içinde yabancı düğüm yoksa kutu alır;
   böylece dağınık klasörler yanıltıcı çerçeve üretmez.

## 5. Çizim — `cekirdek/cizim.mjs` + `kanvas/`

`cizim`, `kanvas/stil.css` ve `kanvas/motor.js` dosyalarını tek bir HTML belgesine gömer ve
yerleşimi JSON olarak yerleştirir. `<`, U+2028 ve U+2029 kaçırılır; hiçbir yol ya da simge adı
veri bloğundan çıkamaz. Sonuç ağdan hiçbir şey yüklemez — CI işi çıktıda `<script src=` ve
`<link href=` arayarak bunu doğrular.

`motor.js` SVG sahnesini önceden üretilmiş biçimde taşımak yerine çalışma anında kurar; düğümü
sürüklenebilir ve görünümü düzenlenebilir yapan şey bu. Gezinme, komşu vurgulu seçim, yol ve
simge araması, detay paneli, mini harita, ısı katmanı, tema, konum dışa aktarma ve PNG/SVG
dışa aktarma ondadır. Dışa aktarmada SVG klonlanır, çözülmüş tema değişkenleri `:root` bloğu ve
bir zemin dikdörtgeni olarak enjekte edilir, sonra seri hale getirilir.

## Test

`test/ornek-kur.mjs` geçici dizine küçük bir örnek depo yazar — bir döngü, ortak bir yardımcı,
çözülemeyen bir import, bir Python paketi ve bir test dosyası. Testler çözümlemeyi, graf
ölçümlerini, yerleşim değişmezlerini (katman içinde çakışma yok, her düğüm tuvalin içinde, her
kenarın geçerli yolu var) ve üretilen HTML'in gerçekten kendine yettiğini doğrular.
