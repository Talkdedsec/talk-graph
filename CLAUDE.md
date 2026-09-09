# talk-graph

Durum, karar ve sıradaki işler: `DEVAM.md`.

```
node bin/tg.mjs <yol>            harita üret
node bin/tg.mjs ciz <yol> --acma tarayıcı açmadan üret
node --test test/                testler
```

## Kırmızı çizgiler
- Dış bağımlılık yok (Node stdlib). package.json'a paket eklenmez.
- Çıktıda ve kodda başka ürün/marka adı geçmez.
- Türkçe isimlendirme; `data`, `result`, `handleX` gibi jenerik adlar yok.
