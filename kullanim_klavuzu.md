# GYM // OPS — Kullanım Kılavuzu

Bu doküman, **gym-frontend** operatör panelinin kurulumunu, ekran ekran kullanımını ve `gym-backend` Spring Boot servisi ile entegrasyonunu açıklar. Hedef kitle: Yönetici (ADMIN), Resepsiyon (CLERK) ve Tekniker (REPAIRMAN) rolündeki personel ile uygulamayı kuracak yazılımcı ekibi.

---

## 1. Hızlı Başlangıç

### 1.1. Gereksinimler
- **Node.js** ≥ 20 (geliştirme `node 25` ile yapıldı)
- **npm** ≥ 10
- Modern bir tarayıcı (Chrome, Firefox, Edge, Safari) — mock servis worker (MSW) kullanıldığı için tarayıcı zorunludur, sunucu tarafı render yoktur.

### 1.2. Kurulum

Terminalden `gym-frontend/` klasörüne gir ve bağımlılıkları yükle:

```bash
cd gym-frontend
npm install
```

### 1.3. Geliştirme Modunu Başlatma

```bash
npm run dev
```

Vite, projeyi `http://localhost:5173` adresinde açar. Tarayıcıda bu adresi ziyaret et.

### 1.4. Production Build

```bash
npm run build       # dist/ klasörüne derler
npm run preview     # build edilen dosyaları lokal olarak servis eder
```

---

## 2. Demo Erişim Hesapları

Aynı hesaplar **iki modda da** geçerlidir:
- **Mock mode** — `src/mocks/seed.ts` belleğinden geliyor.
- **Real backend** — `gym-backend/DataStarter.java` fresh H2 DB'ye `gym.seed.demo=true` (varsayılan) iken yüklüyor.

| ID  | İsim Soyisim       | Rol        | Şifre             | Gizli Kelime |
| --- | ------------------ | ---------- | ----------------- | ------------ |
| 1   | Ronnie Coleman     | ADMIN      | `password123ytu`  | `ytu`        |
| 2   | Mert Güler         | ADMIN      | `Demo123!`        | `demo`       |
| 3   | Ayşe Demir         | CLERK      | `Demo123!`        | `demo`       |
| 4   | Hakan Çelik        | CLERK      | `Demo123!`        | `demo`       |
| 5   | İsmail Kara        | REPAIRMAN  | `Demo123!`        | `demo`       |
| 6   | Burak Yıldız       | REPAIRMAN  | `Demo123!`        | `demo`       |

Login ekranında her rol için bir adet hızlı erişim kartı bulunur (1, 3, 5 numaralı hesaplar). Tıklayınca alanlar otomatik dolar, sadece "Giriş Yap" demek yeterli.

---

## 3. Roller ve Yetki Matrisi

Her rol kendi sorumluluk alanı dışındaki sayfaları **göremez** (sol menüde gizlenir). Yetkisiz bir endpoint çağrılırsa backend `403 forbidden` döner ve mock API aynı davranışı simüle eder.

| Modül                | ADMIN | CLERK | REPAIRMAN |
| -------------------- | :---: | :---: | :-------: |
| Pano (Dashboard)     |   ✔   |   ✔   |     ✔     |
| Üyeler               |   ✔   |   ✔   |     —     |
| Sağlık Raporları     |   ✔   |   ✔   |     —     |
| Abonelikler          |   ✔   |   ✔   |     —     |
| Tarifeler (Liste)    |   ✔   |   ✔   |     —     |
| Tarife Oluşturma     |   ✔   |   —   |     —     |
| Makineler            |   ✔   |   —   |     ✔     |
| Makine Oluşturma     |   ✔   |   —   |     —     |
| Bakım & Onarım       |   ✔   |   —   |     ✔     |
| İstatistikler        |   ✔   |   —   |     —     |
| Personel             |   ✔   |   —   |     —     |

---

## 4. Arayüz Genel Bakış

### 4.1. Sol Kenar Çubuğu (Sidebar)

Her menü öğesinin sağında bir kısayol numarası vardır (`1`–`9`). Klavye odaklı kullanım için referans olur. Alttaki "Daralt" düğmesi sidebar'ı 72px ikon-modu / 232px etiket-modu arasında geçirir; tercih kalıcıdır.

### 4.2. Üst Bar (Topbar)

- **Breadcrumb (sol):** Mevcut konum hiyerarşisini `Pano / Modül / Detay` formatında gösterir.
- **Canlı Saat (orta-sağ):** Türkiye saati, ay-gün ve haftanın günü ile birlikte saniye saniye akar.
- **Bildirim ikonu:** Şu an statik (geliştirilebilir alan).
- **Profil çipi (sağ):** İsim, ID ve rol etiketi. Tıklayınca açılan menüden "Personel Yönetimi" (sadece ADMIN için aktif) veya "Çıkış Yap" seçilir.

### 4.3. Tasarım Dili

- Arka plan: `--ink` jet siyah.
- Vurgu: `--volt` elektrik sarısı (yalnızca CTA'lar, anahtar metrikler, aktif sekme).
- Durum sinyalleri: `--lime` (aktif), `--amber` (uyarı), `--scarlet` (kritik).
- Tipografi: **Big Shoulders Display** (başlıklar, sayılar), **Familjen Grotesk** (gövde), **JetBrains Mono** (rakam, kod, ID).

---

## 5. Modül Modül Kullanım

### 5.1. Pano (Dashboard)
Yol: `/`

Salonun nabzını tek ekranda verir.

- **Stat Hero kartları (üst sıra):** Aktif üye, onay bekleyen rapor, süresi dolan rapor, haftalık gelir. Sayılar yüklenirken animasyonla yukarı sayar.
- **Canlı Aktivite (sol blok):** Son 30 sistem hareketi (abonelik satışı, rapor onayı, bakım, vb.). Her satır kim yaptı + ne kadar önce bilgisini gösterir.
- **7 Günlük Performans (sağ üst):** Gelir vs gider halka grafik + dağılım listesi. Net karın gelirin oranı yüzde olarak halkayı doldurur.
- **Ekipman Durumu:** İlk 5 makine için bakım yüzdesi ilerleme çubuğu, durum etiketi. Tıklayınca makine detayına gider.
- **Açık Onarımlar:** Henüz tamamlanmamış onarım kayıtlarının kompakt listesi.
- **Hızlı Aksiyon kartları (alt sıra):** Yeni Üye, Rapor Kontrol, Abonelik Sat, Bakım Kaydı kısayolları. Bekleyen iş varsa kart sarıya boyanır.

### 5.2. Üyeler
Yol: `/customers`

Üye listesi tek tabloda, gerçek zamanlı arama ve durum filtreleri ile.

**Liste:**
- **Arama kutusu:** İsim, telefon veya kayıt numarası bazlı arama.
- **Durum filtre çipleri:** Tümü / Aktif / Beklemede / Süresi Dolmuş / Askıda. Yanındaki rakam o durumdaki kayıt sayısı.
- **Tablo sütunları:** Kayıt no (`0001` formatlı), isim+avatar, telefon, durum çipi, sağlık raporu durumu, abonelik durumu, sağ-ok ile detay.
- **CSV butonu:** Demo amaçlı bir toast mesajı verir; gerçek dışa aktarım eklenebilir.

**Yeni Üye:**
"Yeni Üye" butonu modal açar. İsim/Soyisim/Telefon. **Telefon 11 haneli ve `0` ile başlamalıdır.** Hatalar form üstünde inline gösterilir.

**Detay sayfası (`/customers/:id`):**
- Avatar + isim hero alanı, durum etiketi, telefon, kayıt tarihi.
- "Düzenle" ve "Abonelik Sat" aksiyonları.
- **Sağlık Raporu State Machine:** 3 adımlı görsel akış — Yüklendi → Onaylandı → Geçerli. Mevcut adım sarı yanıp söner.
- **Aktif Abonelik kartı:** Plan adı, kalan gün, ücret, başlangıç-bitiş, varsa saat aralığı. "İptal Et" butonu (kırmızı).
- **Geçmiş Satın Alımlar:** Tüm abonelik satın alım kayıtları, en yenisi üstte.

### 5.3. Sağlık Raporları
Yol: `/health-reports`

Salonun sağlık-uyum durumunu özetleyen merkezi sayfa.

- **Üst stat:** Geçerli rapor sayısı, onay bekleyen sayısı, süresi dolan sayısı.
- **Süresi Dolmuş Raporlar tablosu:** Yenilenmesi gereken üyeler. Her satırın "aksiyon →" linki üye detayına gider.
- **Onay Bekleyenler tablosu:** PDF yüklenmiş ama henüz personel tarafından onaylanmamış kayıtlar.
- **Süreç Hatırlatması (alt blok):** 3 adımlı lifecycle açıklaması.

**Rapor yükleme akışı (Üye detayında):**
1. "PDF Yükle" butonuna bas, dosya seç (sadece `application/pdf` kabul edilir).
2. Backend yüklendiği bildirilince durum **UPLOADED** olur, sarı uyarı kartı görünür.
3. "Belgeyi Görüntüle" linki yeni sekmede PDF'i açar.
4. "Onayla" düğmesi modal açar, geçerlilik bitiş tarihi (`gg/aa/yyyy`) istenir. Genelde rapor tarihi + 6 ay.
5. Onay sonrası durum **VERIFIED** olur, üye **ACTIVE** statüsüne döner.
6. Bitiş tarihi geçtiğinde gece çalışan zamanlanmış görev raporu **EXPIRED**, üyeyi **PENDING** yapar.

### 5.4. Abonelikler
Yol: `/subscriptions`

Aktif aboneliklerin tablosu + yenileme bekleyenler.

- **Üst stat:** Aktif üyelik sayısı, saat sınırlı sayısı, süresi dolan sayısı.
- **Aktif Abonelikler tablosu:** Üye, tarife adı (+ ücret/çarpan), saat aralığı (saat sınırlı ise sarı çip), bitiş tarihi, kalan gün. ≤ 7 gün kalmışsa kırmızı vurgu.
- **Yenileme Bekleyenler:** Aboneliği biten üyeler — gelir fırsatı.

**Satın Alım Sihirbazı (3 Adım):**
Üye detayındaki "Abonelik Sat" düğmesi ile açılır.

1. **Tarife seç** — Tüm aktif tarifelerin görsel kart-grid'inden birini seç. Saat sınırlı tarifeler (Sabah Kuşu, Gece Vardiyası) otomatik olarak `isTimeLimited=true` ve uygun saat aralığını dolar.
2. **Plan ayarla** — Günlük süre (8–30 arası), aylık periyot (1, 2, 3, 6 veya 12 ay), saat sınırlama isteğe bağlı toggle. Toggle açıldığında başlangıç/bitiş saati seçilir.
3. **Onay** — Toplam ücret = `tarife × ay sayısı`. "Satışı Tamamla" düğmesi servisi çağırır, başarılı olunca toast bildirimi gösterilir.

### 5.5. Tarifeler
Yol: `/charge-profiles`

Üyelik tarifeleri kart-grid görünümünde.

- **Tarife kartı:** Başlık, açıklama, ücret (büyük volt sarı rakamla), çarpan (rate), net birim ücret. İndirimli/premium etiketi otomatik (rate < 1 → indirim, rate > 1 → ek).
- **Sadece ADMIN** "Yeni Tarife" oluşturabilir. CLERK düzenleyip silebilir.
- **Editor modal:** Başlık + Açıklama (textarea) + Çarpan + Ücret. Canlı önizleme satırı: `Ücret × Rate = Net Birim`.

### 5.6. Makineler
Yol: `/machines`

Salondaki ekipmanın görsel grid envanteri.

- **Stat üst sıra:** Toplam, Çalışıyor, Dikkat (bakım yaklaşan + onarımda).
- **Makine kartı:** Üst yarıda makine ikonu/görseli, durum etiketi sağ üstte, makine ID sol altta. Alt yarıda ilerleme halkası (bakım kalan yüzde) + sonraki bakıma kalan gün.
- **Kart tıklayınca** detay sayfasına gider.

**Detay sayfası (`/machines/:id`):**
- Hero görsel, isim, son bakım, periyot.
- **Bakım Durumu paneli:** Büyük ilerleme halkası, kalan gün, "Bakım Kaydı" + "Onarıma Al" düğmeleri.
- **Maliyet özeti:** Toplam bakım maliyeti + toplam onarım maliyeti.
- **Bakım Geçmişi / Onarım Geçmişi sekmeleri:** Tüm kayıtlar zaman damgası, personel adı, maliyet ve durum etiketi ile listelenir.

**Yeni Makine Oluşturma (sadece ADMIN):**
İsim (max 200 krk) + Son bakım tarihi (`gg/aa/yyyy`) + Bakım periyodu (1–128 ay) + opsiyonel görsel. Form altındaki "// sonraki bakım" satırı son bakım tarihi + periyot ile sonraki bakım tarihini canlı hesaplar.

**Bakım Kaydı:** Maliyet + yapılan işlem açıklaması. Kaydedilince makine son bakım tarihi bugüne çekilir, durum **OPERATIONAL**'a döner.

**Onarıma Alma:** Arıza açıklaması + tahmini maliyet + tahmini gün. Kaydedilince makine durumu **UNDER_REPAIR** olur. "Onarımı Bitir" düğmesi onarım kaydını tamamlar, makineyi yeniden **OPERATIONAL** yapar.

### 5.7. Bakım & Onarım
Yol: `/operations`

Makine bazlı değil, tüm operasyonel kayıtlar tek merkezde.

- **Stat üst sıra:** Açık onarım, toplam onarım, onarım gideri, bakım gideri.
- **Sekmeler:**
  - **Açık Onarımlar** — devam eden işler.
  - **Tüm Onarımlar** — geçmiş + güncel.
  - **Bakım Geçmişi** — tüm bakım kayıtları.
- **Hızlı Aksiyon (alt blok):** İlk 8 makineye doğrudan tek-tıkla erişim.

### 5.8. İstatistikler
Yol: `/statistics` (sadece ADMIN)

Finansal performans dashboard'u.

- **Tarih aralığı çubuğu:** Başlangıç + Bitiş manuel girilebilir veya 7 / 30 / 90 / 365 gün hızlı butonlarıyla seçilir.
- **4 büyük metrik:** Brüt Gelir, Bakım Maliyeti, Onarım Maliyeti, Net Kar (margin yüzdesi delta olarak).
- **Gelir Akışı (area chart):** Günlük gelir + bakım + onarım çizgi alanları.
- **Dağılım (bar chart):** Yatay 3 bar — gelir vs bakım vs onarım.
- **KPI strip:** Satılan abonelik adedi, kar marjı, ortalama abonelik bedeli, toplam gider.

Tarih formatı kuralı: `gg/aa/yyyy` (örn: `01/05/2025`). Hatalı tarih girilirse alan üstünde inline hata mesajı çıkar.

### 5.9. Personel
Yol: `/staff` (sadece ADMIN)

Sistemi kullanan operatörlerin kart grid'i.

- **Üst stat:** Yönetici / Resepsiyon / Tekniker sayıları.
- **Filtre çipleri** ve isim/ID arama.
- **Personel kartı:** Avatar (volt rengi), isim, ID, kayıt tarihi, rol çipi.

**Yeni Personel oluşturma:**
- Rol seçimi (ADMIN / CLERK / REPAIRMAN).
- İsim + Soyisim.
- Şifre — gerçek zamanlı güç göstergesi (5 segment): Çok zayıf → Zayıf → Orta → İyi → Güçlü.
- **Şifre kuralları (zorunlu):** 8–31 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter, **boşluk içeremez**.
- Gizli kelime (Backup Secret) — şifre sıfırlamada kullanılır, personele bildirilmelidir.

---

## 6. Validasyon Kuralları (Form Hataları)

Tüm formlar backend kuralları ile birebir aynı validasyonu kullanır.

### 6.1. Tarih (`@ValidDate`)
- Format: `gg/aa/yyyy` (10 karakter tam)
- Yıl `19xx` veya `20xx` olmalı
- Geçersiz: `25-05-2023`, `25/05/23`, `30/02/2023` (Şubat 30'u olmaz), `00/13/2023`
- Artık yıl Şubat 29'u kabul edilir (örn: `29/02/2024` ✔, `29/02/2023` ✘)

### 6.2. Şifre (`@ValidPassword`)
- 8 ≤ uzunluk ≤ 31
- En az 1 büyük harf (`A-Z`)
- En az 1 küçük harf (`a-z`)
- En az 1 rakam (`0-9`)
- En az 1 özel karakter (`!@#$%^&*()_+-=[]{};':"\|,.<>/?`)
- **Boşluk içeremez** (Space yasak)

### 6.3. Telefon
- Tam **11 hane** rakam
- **`0` ile başlamak zorunda**
- Regex: `^[0][0-9]{10}$`
- Geçerli: `05554443322` · Geçersiz: `5554443322`, `905554443322`

### 6.4. Enum
- Backend enum değerleri büyük harf duyarlıdır: `ADMIN`, `CLERK`, `REPAIRMAN`, `ACTIVE`, vb.

---

## 7. Klavye Kısayolları

- **`1`–`9`** — Sidebar menü öğelerine atlama (rol bazlı)
- **`Esc`** — Açık modal'ı kapatır
- **`Tab` / `Shift+Tab`** — Form alanları arasında gezinti

---

## 8. Mock vs Gerçek Backend Modu

Panel iki modda çalışır:

| Mod                | Açıklama                                                           | Veri Kaynağı                  |
| ------------------ | ------------------------------------------------------------------ | ----------------------------- |
| **Real backend**   | Vite dev sunucusu `/api` çağrılarını `localhost:8080`'a proxy'ler  | `gym-backend` Spring Boot DB |
| **Mock backend**   | MSW (Mock Service Worker) tarayıcıda `/api` isteklerini yakalar    | `src/mocks/seed.ts` belleği  |

Varsayılan: **real backend**. `gym-frontend/.env.local`:

```
VITE_USE_MOCK=false
VITE_API_TARGET=http://localhost:8080
```

### 8.1. Real Backend Akışı

1. Backend'i başlat:
   ```bash
   cd ../gym-backend
   ./mvnw spring-boot:run    # 8080
   ```
   `application.properties`'te `gym.seed.demo=true` (varsayılan) ise fresh DB'de tam mock veri otomatik yüklenir: 6 personel, 6 tarife, 22 üye, 12 makine, bakım/onarım/abonelik geçmişi.

2. Frontend'i başlat:
   ```bash
   cd gym-frontend
   npm run dev    # 5173
   ```
   Tarayıcı konsolunda `[gym-ops] gerçek backend modunda — /api proxy üzerinden` görünür.

3. `http://localhost:5173` → ID `1`, şifre `password123ytu` ile giriş.

### 8.2. Mock Mode'a Dönüş

Geliştirme sırasında backend'i çalıştırmadan tüm panel akışlarını test etmek için:

```bash
# .env.local içinde
VITE_USE_MOCK=true
```

Ya da `.env.local`'i tamamen sil. `npm run dev`'i yeniden başlat. Konsola `[gym-ops] mock backend (MSW) aktif` düşer. Mock veri sayfayı her yenilediğinde sıfırlanır (kalıcı değil).

### 8.3. CORS ve Cookie
- Vite proxy'si tarayıcıya her şeyi `localhost:5173` gibi gösterir → CORS sorunu yaşanmaz, `USER_SESSION` cookie sorunsuz akar.
- Production'da statik dosyalar backend ile aynı origin altında servis edilmeli (örn. nginx reverse proxy) ya da `VITE_API_BASE` tam URL ile ayarlanıp backend'in `WebSecurityConfig`'ine CORS izni eklenmelidir.
- Backend `Secure` flag'i set etmediği için lokal HTTP üzerinde sorunsuz çalışır; production'da HTTPS + `Secure` flag önerilir.

### 8.4. Backend Yanıt Şekilleri ve Normalizer'lar

Backend DTO'ları frontend'in beklediğinden farklı alan isimleri ve enum değerleri kullanır (örn. `userRole` vs `userType`, `customerStatus: VERIFIED` vs `status: ACTIVE`). UI'nın değişmemesi için tüm GET çağrılarının çıktısı `src/lib/normalize.ts` içindeki adapter'lardan geçer.

Tam alan/enum eşleştirmeleri için `things_done.md` Bölüm 17'ye bak.

### 8.5. Backend'de Bulunmayan Endpoint'ler

Dashboard'un kullandığı global aktivite/onarım/bakım toplama endpoint'leri (örn. `/api/activity`) sadece MSW mock'unda vardır. Real backend modunda:
- `listAllRepairs()` ve `listAllMaintenance()` her makinenin alt-endpoint'lerini birleştirerek aynı listeyi üretir.
- `listActivity()` boş döner — dashboard'da "Canlı Aktivite" boş görünür, başka bir hata olmaz.

---

## 9. Sık Karşılaşılan Durumlar

| Durum                                              | Çözüm                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| Login ekranında "Geçersiz kimlik veya şifre"       | Bölüm 2'deki demo hesaplara bak; ID rakam, şifre büyük/küçük duyarlı        |
| Mock veri sıfırlanması istendi                     | Mock mode'da: tarayıcı yenileme yeter (bellek tabanlı). Real backend'de: backend'i durdur, `gym-backend/database/data.mv.db`'yi sil, yeniden başlat |
| `npm run dev` 5173 portunda başlamıyor             | `lsof -i:5173` ile o portu tutan süreç bul, sonlandır                       |
| Sayfa açılmıyor, beyaz ekran                       | DevTools console'a bak; mock mode için MSW worker yüklendi mi, real backend için 8080 portu erişilebilir mi kontrol et |
| Real backend'de tüm istekler 401                   | Cookie ata-edilmemiş olabilir; tekrar login ol. Vite proxy doğru çalışıyorsa cookie sorunsuz akar |
| Real backend "customer_not_found" hatası           | Boş veritabanı + `gym.seed.demo=false` kombinasyonu. `application.properties`'i kontrol et |
| PDF yüklerken "Sadece PDF kabul edilir" hatası     | Dosya MIME tipi `application/pdf` olmalı; .pdf uzantısı yetmez              |
| Tarih hatası "Format: gg/aa/yyyy"                  | `25/05/2025` formatı; tireli (`-`) ya da kısa yıl (`23`) kabul edilmez       |
| Dashboard'da "Canlı Aktivite" boş                  | Real backend modunda normaldir — `/api/activity` endpoint'i sadece mock'ta var |

---

## 10. Sürüm

- **v1.1** — 2026-05-10 — Gerçek `gym-backend` Spring Boot servisi ile uçtan uca entegrasyon. Vite `/api` proxy + koşullu MSW + response normalizer'lar + 404→[] handling. Backend tarafı: `/api/auth/me` eklendi, `ValidDateConstraint` regex'i tamir edildi, `RepairServiceImpl` self-assignment bug'ı düzeltildi, `Maintenance/Repair.maintainer` ilişkileri `@OneToOne`'dan `@ManyToOne`'a çekildi, `DataStarter` tam demo seed (6 personel + 22 üye + 6 tarife + 12 makine + bakım/onarım/abonelik geçmişi) yapacak şekilde genişletildi.
- **v1.0** — 2026-05-10 — Tüm modüller (Auth, Üye, Sağlık, Tarife, Abonelik, Makine, Bakım, Onarım, İstatistik, Personel) hazır. Mock backend (MSW) ile bağımsız çalışıyor.
- Tasarım dokümanı: `../docs/superpowers/specs/2026-05-10-gym-operator-panel-design.md`
- Backend referansı: `../gym-backend/frontend_endpoint_guide.md`
- Backend yapılanlar: `../gym-backend/things_done.md` Bölüm 8
