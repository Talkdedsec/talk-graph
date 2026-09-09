# Security · Güvenlik

## English

### What the tool touches

`talk-graph` reads source files under the path you give it and, unless `--gecmisyok` is passed,
runs `git log` in that directory. It writes only to the output path. It makes no network
requests, and the generated HTML loads nothing from the network either.

### What ends up in the output

The generated HTML embeds file paths, exported symbol names, import line numbers, the absolute
repository root (used by the `editörde aç` button) and, when git history is read, change counts
and author counts. **It does not embed file contents.** Even so, treat a map of a private
repository as you would treat its directory listing: sharing the HTML shares the structure.

Pass `--gecmisyok` to leave author and change data out entirely.

### Untrusted repositories

Scanning is read-only and nothing from a scanned repository is executed. Extracted strings are
JSON-escaped before being embedded (`<`, U+2028, U+2029), so a file path or symbol name cannot
break out of the data block into script context. If you find a way to make it, report it.

### Reporting

Report vulnerabilities privately to **talkdedsec@proton.me**, not through public issues.
Include a reproduction and the affected version. Expect an initial reply within 72 hours.

### Supported versions

The `main` branch is the only supported version.

## Türkçe

### Araç neye dokunur

`talk-graph` verdiğin yolun altındaki kaynak dosyaları okur ve `--gecmisyok` verilmediyse o
dizinde `git log` çalıştırır. Yalnızca çıktı yoluna yazar. Ağ isteği yapmaz; üretilen HTML de
ağdan hiçbir şey yüklemez.

### Çıktıda ne bulunur

Üretilen HTML dosya yollarını, dışa açılan simge adlarını, import satır numaralarını, deponun
mutlak kök yolunu (`editörde aç` düğmesi için) ve git geçmişi okunduysa değişiklik ve yazar
sayılarını gömer. **Dosya içeriği gömülmez.** Yine de özel bir deponun haritasını o deponun
dizin listesi gibi düşün: HTML'i paylaşmak yapıyı paylaşmaktır.

Yazar ve değişiklik verisi hiç çıkmasın istiyorsan `--gecmisyok` kullan.

### Güvenilmeyen depolar

Tarama salt okunurdur; taranan depodan hiçbir şey çalıştırılmaz. Çıkarılan metinler gömülmeden
önce JSON kaçışından geçer (`<`, U+2028, U+2029), yani bir dosya yolu ya da simge adı veri
bloğundan çıkıp script bağlamına geçemez. Geçirmenin bir yolunu bulursan bildir.

### Bildirim

Açıkları herkese açık issue yerine **talkdedsec@proton.me** adresine özel olarak bildir.
Yeniden üretim adımlarını ve etkilenen sürümü ekle. İlk yanıt 72 saat içinde gelir.

### Desteklenen sürümler

Yalnız `main` dalı desteklenir.
