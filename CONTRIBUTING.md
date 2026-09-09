# Contributing · Katkı

## English

### Ground rules

1. **No dependencies.** Node's standard library is the whole toolbox. A pull request that adds
   anything to `package.json` dependencies will be rejected — if a library seems necessary, open
   an issue explaining why the standard library cannot do it.
2. **No third-party names.** The generated HTML, the CLI output and the source carry this
   project's identity only.
3. **Turkish identifiers.** Functions, variables and files are named in Turkish, in the language
   of the problem (`kenarlariYenidenCiz`, `dongulariKir`), never `data`, `result` or `handleX`.
4. **No explanatory comments.** If a constraint cannot be read from the code, one line is enough.

### Workflow

```bash
node --test "test/*.test.mjs"      # must be green before you push
node bin/tg.mjs . --acma           # generate a map of this repo itself
```

Every change to `cekirdek/` needs a test. Layout changes must not regress the crossing count on
the two repositories listed in the README measurement table — state the before/after numbers in
the pull request.

### Commit messages

Natural length: one line for a small change, a body for a large one. No emoji, no `feat:`
prefix requirement, one language per message.

## Türkçe

### Kurallar

1. **Bağımlılık yok.** Node'un standart kütüphanesi bütün alet çantasıdır. `package.json`
   bağımlılıklarına ekleme yapan PR reddedilir — kütüphane şart görünüyorsa, standart
   kütüphanenin neden yetmediğini anlatan bir issue aç.
2. **Başka marka adı yok.** Üretilen HTML, CLI çıktısı ve kaynak yalnız bu projenin kimliğini
   taşır.
3. **Türkçe isimlendirme.** Fonksiyon, değişken ve dosyalar işin dilinde Türkçe adlandırılır
   (`kenarlariYenidenCiz`, `dongulariKir`); `data`, `result`, `handleX` yok.
4. **Açıklama yorumu yok.** Kodun gösteremediği bir kısıt varsa tek satır yeter.

### Akış

```bash
node --test "test/*.test.mjs"      # push öncesi yeşil olmalı
node bin/tg.mjs . --acma           # bu deponun kendi haritasını üret
```

`cekirdek/` altındaki her değişiklik test ister. Yerleşim değişiklikleri README ölçüm
tablosundaki iki depoda kesişme sayısını kötüleştirmemeli — PR'da önce/sonra sayısını yaz.

### Commit mesajı

Doğal uzunluk: küçük değişiklik tek satır, büyüğü gövdeli. Emoji yok, `feat:` zorunluluğu yok,
tek mesaj tek dilde.
