# Gym Frontend - Yapılanlar Özeti (Things Done)

Bu doküman, **gym-frontend** operatör panelinde geliştirilmiş olan özellikleri, kullanılan teknolojileri ve ekran-ekran yapılan işleri modül bazında özetler. `gym-backend/things_done.md` dosyası ile birlikte okunduğunda, sistemin uçtan uca neyi nasıl yaptığı görülür.

## 0. Teknoloji Yığını

- **React 19** + **Vite 8** + **TypeScript** — modern SPA çatısı.
- **Tailwind CSS 3** — özel "Stadium Light" tema değişkenleri ile.
- **TanStack Query (React Query) 5** — sunucu state yönetimi, cache invalidation.
- **Zustand 5** — auth ve UI tercihi gibi global client state.
- **React Router 7** — declarative routing.
- **MSW (Mock Service Worker) 2** — geliştirme modunda gerçek `/api` çağrılarını yakalayan tam-uyumlu mock backend.
- **Framer Motion 12** — sayfa giriş animasyonları, stagger reveal, modal geçişleri.
- **Recharts 3** — istatistik sayfasındaki area + bar grafikleri.
- **Lucide React** — temiz, çizgi-bazlı ikon sistemi.
- **date-fns / clsx** — yardımcı kütüphaneler.

## 1. Tasarım Sistemi (Stadium Light)

- **Renk tokenları:** `--ink`, `--carbon`, `--steel`, `--rule`, `--mute`, `--bone`, `--volt` (elektrik sarısı), `--lime`, `--amber`, `--scarlet`. Tüm renkler Tailwind'in `theme.extend.colors` üzerinden type-safe kullanılabilir.
- **Tipografi:** **Big Shoulders Display** (display/başlık), **Familjen Grotesk** (gövde), **JetBrains Mono** (rakam, kod, ID). Google Fonts üzerinden yüklenir.
- **Hareket:** `voltage-flicker` (1.4s neon-yanıp sönme), `pulse-soft` (durum noktaları), `scan` (taramalı atmosfer), `blink` (cursor) keyframe'leri.
- **Atmosfer:** `bg-grid-faint` faint mesh, `bg-noise` SVG-tabanlı grain overlay, `corner-cuts` clip-path köşeli kesim hizmeti.
- **Custom CSS:** Scrollbar (volt seçim, koyu thumb), `::selection` (volt sarı), focus halkası volt sarısı.
- **Dosyalar:** `tailwind.config.js`, `src/index.css`.

## 2. UI Bileşen Kütüphanesi

Tüm form, tablo, kart, modal ve durum bileşenleri kendi tasarım sistemimizden türetildi. Kullanıma hazır primitives:

- **Button** — 5 varyant (volt, solid, outline, ghost, danger), 3 boyut (sm/md/lg), loading state.
- **Input / Textarea / Select** — etiket, hint, error, prefix/suffix slot, focus halkası volt.
- **Card** + **CardHeader** — gövdeli/iskelet düzeni, marker + alt başlık + sağ aksiyon.
- **Badge** + **StatusBadge** + **RoleBadge** — durum ve rol için anlamsal renk haritası.
- **Modal** — Framer Motion ile fade+slide animasyonlu, ESC ile kapanan, body scroll lock'lu.
- **Table** ailesi (THead, TBody, Th, Tr, Td, EmptyRow) — hover satır vurgusu, mono kolonlar.
- **ProgressRing** + **ProgressBar** — bakım yüzdesi, abonelik yüzdesi için.
- **StatHero** — büyük rakam + delta + ikon + count-up animasyonu.
- **Tabs** — alt çizgili volt-vurgu, sayaç çipli sekmeler.
- **EmptyState** + **LoadingState** — boş/yükleniyor görünümleri.
- **Toast** + **Toaster** — zustand-tabanlı global toast queue, 4 ton (success/warn/error/info).
- **PageHeader** — sayfa eyebrow + dev başlık + sağ aksiyon kalıbı.
- **Logo** + **Sidebar** + **Topbar** + **Shell** — uygulama iskeleti.

## 3. Yönlendirme ve Erişim Kontrolü

- React Router 7 ile dosya-bazlı route'lar yerine `App.tsx` içinde merkezi tanımlı route ağacı.
- **Public rotalar:** `/login`, `/password-reset`.
- **Korumalı rotalar:** `Shell` layout altında (`/`, `/customers`, `/customers/:id`, `/health-reports`, `/subscriptions`, `/charge-profiles`, `/machines`, `/machines/:id`, `/operations`, `/statistics`, `/staff`).
- **Shell** kontrolü: zustand `useAuth` store'undan kullanıcı yoksa `/login`'e yönlendirir; `from` state'i ile login sonrası dönüş hedefi tutulur.
- **Sidebar** rol bazlı menü filtreler (`hasRole`/role kontrolü), kullanıcının yetkisi yoksa öğe gizlenir.

## 4. Mock Backend (MSW)

Geliştirme modunda gerçek backend olmadan tam çalışır bir ortam.

- **`src/mocks/seed.ts`** — deterministik tohum veri:
  - 6 personel (1 ADMIN+ekstra, 2 CLERK, 2 REPAIRMAN)
  - 22 üye (farklı durumlar: ACTIVE, PENDING, EXPIRED, SUSPENDED)
  - 6 tarife (Standart, Öğrenci, Yıllık Premium, Sabah Kuşu, Gece Vardiyası, VIP)
  - Aktif üyeler için abonelik ve rastgele 8 kişiye 2'şer geçmiş satın alım
  - 12 makine (koşu bandı, eliptik, smith, leg press, vb.) farklı durumlarda
  - Her makineye 1–3 bakım kaydı, 4 onarım kaydı (2 tamam, 2 açık)
  - 10 başlangıç aktivite (giriş, satın alım, rapor, bakım, onarım vs.)

- **`src/mocks/handlers.ts`** — Spring Boot endpoint'lerinin **birebir aynası**:
  - **`POST /api/auth/login`** — kullanıcı/şifre eşleşirse 24 saatlik mock token üretir, `USER_SESSION` cookie'sini `HttpOnly+Lax` set eder.
  - **`POST /api/auth/logout`** — cookie sıfırlar.
  - **`GET /api/auth/me`** — frontend yardımcısı; mevcut session'ı çözüp kullanıcı objesi döner.
  - **`/api/user/*`** — Kayıt (ADMIN), şifre sıfırlama (public + backupSecret), tekil/liste getirme.
  - **`/api/customer/*`** — CRUD + sağlık raporu alt rotaları (yükleme, indirme, onaylama, süresi dolmuş listesi).
  - **`/api/charge-profile/*`** — Tarife CRUD.
  - **`/api/subscription/*`** — Initialize, purchase, cancel, last, all, durum.
  - **`/api/machine/*`** — Multipart create, image, list/detay.
  - **`/api/machine/{id}/maintenance/*`** — Bakım kayıtları.
  - **`/api/machine/{id}/repair/*`** — Onarım kayıtları + complete.
  - **UI yardımcı endpoint'ler:** `/api/repair/all`, `/api/maintenance/all`, `/api/activity` — backend'de yok, sadece dashboard/operasyon ekranları için mock'ta sunulur.
  - **`/api/statistics`** — Tarih aralığını parse eder, gelir/bakım/onarım/net kar + günlük seri hesaplar.

- Her endpoint **rol kontrolü** yapar (`requireRole`), eksik yetkide `403 forbidden` döner. Mutasyonlar kalıcı olmaz, sayfa yenilenince seed verisi geri gelir.

## 5. API İstemcisi ve Validasyonlar

- **`src/lib/api.ts`** — `fetch` tabanlı ince sarmalayıcı. `credentials: "include"` ile cookie iletir, `HttpError` sınıfı backend'in `{ message, details }` formatını korur. 35'ten fazla endpoint için type-safe metotlar.
- **`src/lib/queries.ts`** — Tüm React Query key'lerinin merkezi sabitleri (`qk.customers()`, `qk.machine(id)` vb.), invalidation tutarlılığı için.
- **`src/lib/validate.ts`** — Backend kurallarının frontend ikizi:
  - `@ValidDate` — `gg/aa/yyyy`, 10 karakter, 19xx/20xx, artık yıl bilinçli
  - `@ValidPassword` — 8–31 karakter, büyük/küçük/rakam/özel, boşluk yok
  - Telefon — `^[0][0-9]{10}$`
  - `passwordStrength` — 5 segment güç göstergesi
- **`src/lib/format.ts`** — TRY para formatı, telefon formatı, tarih parse/format (`dd/MM/yyyy` ↔ `Date`), göreli zaman ("3dk önce"), saat aralığı, durum/rol Türkçe etiketleri.
- **`src/types/dto.ts`** — Backend DTO'larının TypeScript ikizi: `LoginRequest`, `CustomerResponse`, `SubscriptionPurchaseRequest`, `StatisticsResponse`, `ActivityItem`, vb.

## 6. Kimlik Doğrulama

### 6.1. Login (`/login`)
- İki kolonlu özel layout: solda marka paneli (animasyonlu volt halo, hero başlık, mini istatistikler), sağda form.
- Kullanıcı ID + şifre ile `POST /api/auth/login` çağırır, başarıda `/api/auth/me` ile rol bilgisini çeker, zustand store'a yazar.
- "Demo Erişimi" panelinde 3 hesap için tek tık otomatik dolum.
- Şifre alanı `type="password"`, `autocomplete` doğru ayarlandı.
- Hata durumunda inline mesaj ("Geçersiz kimlik veya şifre").

### 6.2. Şifre Sıfırlama (`/password-reset`)
- ID + Gizli Kelime (`backupSecret`) + yeni şifre.
- Yeni şifre alanının altında **canlı 5 segment güç göstergesi** + etiket.
- Backend hatasını ayrıştırır: `invalid_password` → şifre alanı, diğer → secret/id alanı.
- Başarıda büyük "Şifre sıfırlandı" başarı ekranı + login'e dönüş.

### 6.3. Session ve State
- `useAuth` zustand store'u kullanıcıyı `localStorage`'da `gym-ops-auth` anahtarıyla persist eder, sayfa yenilense bile oturum sürer.
- `Shell` layout'u `isHydrated` flag'i bekler, hydration tamamlanmadan yönlendirme yapmaz.
- `Topbar` profil çipi → "Çıkış Yap" → `/api/auth/logout` çağrısı + store sıfırlama + `/login` redirect.

## 7. Pano (Dashboard)

- **Üst hero başlık** + canlı sinyal (yeşil yanıp sönen nokta).
- **4 Stat Hero kartı:** aktif üye, onay bekleyen, süresi dolan, haftalık gelir. Sayılar mount'ta cubic-ease ile animasyonla yukarı sayar (`StatHero` bileşeni).
- **Canlı Aktivite akışı** (sol blok): Son 30 sistem hareketi `/api/activity` üzerinden, her satır kim+ne kadar önce, ikon ve renk durumu kaydın türüne göre.
- **7 Günlük Performans (sağ üst):** İçinde halka grafik + gelir/bakım/onarım/net dökümü, halka net kar oranını yansıtır.
- **Ekipman Durumu kartı:** İlk 5 makine satır satır, her satırda ilerleme çubuğu (bakım yüzdesi) + durum etiketi. Tıklanınca detaya gider.
- **Açık Onarımlar:** Henüz tamamlanmamış onarım kayıtlarının kompakt listesi (varsa).
- **Hızlı Aksiyon kartları:** 4 kısayol (Yeni Üye, Rapor Kontrol, Abonelik Sat, Bakım Kaydı). Bekleyen iş varsa volt sarısına vurgulanır.
- Tüm veri React Query üzerinden cache'lenir, mutasyonlar otomatik invalidate eder.

## 8. Üye Yönetimi

### 8.1. Liste (`/customers`)
- Gerçek zamanlı arama (isim/telefon/ID), durum filtre çipleri (sayaçlı), CSV demo butonu.
- Tablo satırlarına tıklayınca detay sayfasına gider, hover'da ok ileri kayar.
- Avatar (isim+soyisim baş harfleri), durum çipi, sağlık raporu çipi, abonelik çipi.

### 8.2. Yeni Üye Modalı
- Backend regex'iyle birebir uyumlu telefon validasyonu (11 hane + 0 prefix).
- Başarıda toast bildirimi + otomatik detay sayfasına yönlendirme.

### 8.3. Detay (`/customers/:id`)
- Hero (volt arka planlı baş harf avatar) + isim + durum etiketi + telefon + kayıt tarihi.
- "Düzenle" modalı (telefon ve isim güncelleme).
- "Abonelik Sat" → `PurchaseWizard` (Bölüm 10).
- **Sağlık Raporu State Machine** (Bölüm 9).
- **Aktif Abonelik kartı** — kalan gün, ücret, tarih aralığı, saat sınırlı ise saat aralığı, "İptal Et" düğmesi (kırmızı, onay diyaloğu ile).
- **Geçmiş Satın Alımlar** — kronolojik liste (yeniden eskiye), her kayıt için tarife adı, tarih aralığı, ücret, çarpan.

## 9. Sağlık Raporu Yaşam Döngüsü

### 9.1. Üye Detay sayfasındaki State Machine
- 3 adımlı görsel akış (`Yüklendi → Onaylandı → Geçerli/Süresi Doldu`). Mevcut adım volt sarı + nabız animasyonu, tamamlananlar lime yeşili, hatalar scarlet kırmızı.

### 9.2. Yükleme akışı
- "PDF Yükle" düğmesi gizli `<input type="file">`'ı tetikler.
- Sadece `application/pdf` MIME tipi kabul edilir (frontend ön-kontrol).
- Multipart form-data olarak `POST /api/customer/{id}/health_report` ile gönderilir.
- Yükleme sonrası kart sarı uyarıya döner ("Onay bekliyor"), belge görüntüleme linki ve "Onayla" düğmesi görünür.

### 9.3. Onaylama akışı
- "Onayla" düğmesi modal açar, geçerlilik bitiş tarihi (`gg/aa/yyyy`) sorulur, varsayılan: bugün + 6 ay.
- `validateDate` ön-kontrol, hata varsa inline gösterim.
- Başarıda kart yeşile döner, kalan gün sayısı ve bitiş tarihi gösterilir, üye otomatik **ACTIVE** olur.

### 9.4. Süresi dolma
- Kart kırmızıya döner, "Yeni Rapor Yükle" düğmesi sunulur.

### 9.5. Sağlık Raporları sayfası (`/health-reports`)
- 3 stat (Geçerli / Onay Bekleyen / Süresi Dolan).
- İki paralel tablo: Süresi Dolmuş + Onay Bekleyenler, her satır üye detayına link.
- Alt blokta sağlık raporu yaşam döngüsü hatırlatma kartı (3 adımlı süreç açıklaması).

## 10. Abonelik ve Tarifeler

### 10.1. Tarifeler (`/charge-profiles`)
- Kart-grid (responsive 1/2/3 kolon), her kartta:
  - "Tarife · 01" gibi mono ID
  - İndirim/premium otomatik etiket (rate < 1 / > 1)
  - Başlık + açıklama
  - Volt sarı büyük ücret + çarpan ve net birim
  - Hover ile aksiyon düğmeleri (Düzenle / Sil)
- ADMIN dışında kimse oluşturamaz, CLERK düzenleyip silebilir.
- Editor modalında **canlı önizleme satırı**: `Ücret × Rate = Net Birim`.

### 10.2. Aboneliklerde Genel Görünüm (`/subscriptions`)
- 3 stat (Aktif / Saat Sınırlı / Süresi Dolan).
- Aktif abonelikler tablosu: üye + tarife + saat aralığı + bitiş + kalan gün.
- 7 gün veya az kalmışsa kalan gün scarlet'e döner.
- Yenileme bekleyenler bloğu altta, yenile linki ile detay sayfasına yönlendirir.

### 10.3. Satın Alım Sihirbazı (`PurchaseWizard`)
3 adımlı modal, AnimatePresence ile slide geçişleri:

1. **Tarife seç** — Tarife kart-grid, seçili kart volt çerçeveli + onay rozetli. Saat sınırlı tarifeler (Sabah/Gece) seçilince `isTimeLimited` ve uygun saat aralığı otomatik dolar.
2. **Plan ayarla** — Günlük süre (8–30 input), aylık periyot (1/2/3/6/12 select), saat sınırlı toggle. Toggle açıldığında 24 saatlik başlangıç/bitiş select'leri animasyonla açılır; bitiş seçenekleri başlangıçtan büyük olmak zorunda.
3. **Onay** — Volt sarı vurgulu özet kartı (toplam ücret büyük rakamla), 6 satırlık özet (gün/ay/çarpan/aylık ücret/saat aralığı). "Satışı Tamamla" düğmesi backend'i çağırır.

Her adım ileri/geri butonlarıyla yönetilir. Üst kısımda ilerleme çubuğu (tamamlanan adımlar yeşil, mevcut volt, gelecek gri). Form mutasyonu sonrası tüm ilgili cache'ler invalidate edilir.

## 11. Makine ve Operasyon Yönetimi

### 11.1. Makine Listesi (`/machines`)
- Kart grid (1/2/3/4 kolon responsive), her kartta:
  - Üst yarı: makine ikonu + grid arka plan + durum etiketi sağ üstte + makine kodu sol altta
  - Alt yarı: ProgressRing (bakım yüzdesi) + sonraki bakıma kalan gün + son bakım tarihi
- Hover'da kart volt çerçeveye döner, ok ileri kayar.

### 11.2. Yeni Makine (sadece ADMIN)
- İsim (max 200), son bakım tarihi (`@ValidDate`), bakım periyodu (1–128 ay).
- Opsiyonel görsel yükleme (multipart, `request` JSON + `file` parça olarak).
- Form altında canlı sonraki bakım tarihi önizlemesi.

### 11.3. Makine Detay (`/machines/:id`)
- Hero görsel kart (üst) + bakım durumu paneli (sağ).
- Bakım Durumu paneli: 104px büyük halka, kalan gün, "Bakım Kaydı" + "Onarıma Al" / "Onarımı Bitir" düğmeleri.
- 2 maliyet özeti kartı (toplam bakım maliyeti + toplam onarım maliyeti).
- Sekmeli geçmiş: Bakım Geçmişi / Onarım Geçmişi. Her kayıt zaman damgası, kim yaptı, açıklama, maliyet.

### 11.4. Bakım Kaydı Modalı
- Maliyet (₺) + yapılan işlem açıklaması (textarea).
- Backend kaydını oluşturur, makine son bakım tarihini bugüne çeker, `MAINTENANCE_DUE` ise `OPERATIONAL`'a döner.

### 11.5. Onarım Modalı
- Arıza açıklaması + tahmini maliyet + tahmini gün.
- Onay sonrası makine `UNDER_REPAIR` olur, scarlet renkli durum.
- "Onarımı Bitir" düğmesi açık onarımı tamamlar, makineyi `OPERATIONAL`'a döndürür.

### 11.6. Bakım & Onarım Merkezi (`/operations`)
- Tüm makinelerin operasyonel kayıtlarının birleşik görünümü.
- 4 üst stat: açık onarım, toplam onarım, onarım gideri, bakım gideri.
- 3 sekme: Açık Onarımlar / Tüm Onarımlar / Bakım Geçmişi.
- Alt blokta ilk 8 makineye hızlı aksiyon kartları.

## 12. İstatistikler (`/statistics`)

Sadece ADMIN erişebilir.

- **Tarih aralığı çubuğu:** Manuel `gg/aa/yyyy` girişi + hızlı butonlar (7/30/90/365 gün) + "Uygula".
- Validasyonlar `@ValidDate` ile birebir.
- **4 büyük metrik:** Brüt gelir (volt), bakım maliyeti (amber), onarım maliyeti (scarlet), net kar (margin yüzdesi delta olarak gösterilir).
- **Gelir Akışı (Recharts AreaChart):** Günlük seri, gelir + bakım + onarım çizgi alanları, volt gradient dolgu.
  - Tooltip dark + mono + uppercase, volt etiketli tarih, TRY formatlı değer.
  - `CartesianGrid` hairline (3 3 dashed), eksen tickleri mono + mute renkli.
- **Dağılım (BarChart yatay):** 3 bar — gelir vs bakım vs onarım, her bir kendi rengiyle.
- **KPI strip:** Satılan abonelik, kar marjı, ortalama abonelik bedeli, toplam gider.
- Backend `StatisticsResponse` içinde `daily` array'i de döner; mock backend tarih aralığını gün-gün çizer.

## 13. Personel Yönetimi (`/staff`)

Sadece ADMIN erişebilir.

- 3 üst stat (Yönetici / Resepsiyon / Tekniker).
- Filtre çipleri ve isim/ID arama.
- Personel kart grid (3 kolon), her kart:
  - Volt arka planlı avatar (baş harfler)
  - Rol çipi sağ üstte
  - İsim + ID + kayıt tarihi (mono)
  - Alt çubukta rol bağlamlı not ("// resepsiyon · aktif")
- **Yeni Personel Modalı:**
  - Rol seçimi (3 seçenek, her birinin yetki açıklaması)
  - İsim + soyisim
  - Şifre — `@ValidPassword` regex'iyle birebir, 5 segment güç göstergesi (canlı), etiket güncellenir
  - Gizli kelime (`backupSecret`) — şifre sıfırlamada kullanılır
- Başarıda yeni ID toast'ta gösterilir.

## 14. Bildirim (Toast) Sistemi

- `useToast` zustand store'u, 4 ton (success/warn/error/info), her birinin kendi ikonu ve sol kenar şerit rengi.
- 4.5 saniye sonra otomatik dismiss; manuel "×" ile de kapanabilir.
- AnimatePresence + layout animation ile yumuşak ekleme/çıkarma.
- Başarılı işlemler, hatalar, ve bilgilendirmeler tutarlı bir şekilde gösterilir.

## 15. Geliştirme Deneyimi

- **`@/`** path alias `src/` için (`vite.config.ts` + `tsconfig.app.json`).
- **TypeScript** strict mode, `noUnusedLocals` kapalı (geliştirme rahatlığı).
- **ESLint** + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`.
- **Vite HMR** sub-saniye yenileme, MSW worker dahil.
- **Production build** ~905KB JS (gzip 267KB), 26KB CSS (gzip 6KB) — single bundle, ileride code-splitting eklenebilir.

## 16. Doğrulama ve Kalite Garantileri

- `npx tsc --noEmit` temiz (tüm 13 sayfa + 12 UI bileşeni + servisler tip uyumlu).
- `npm run build` başarılı.
- Tüm rotalar dev sunucuda 200 OK.
- Backend `frontend_endpoint_guide.md` ile birebir uyumlu DTO ve endpoint imzaları.
- Mock backend gerçek backend'in **tüm** endpoint'lerini cover ediyor — production'a geçiş için tek değişiklik `.env.local` + main.tsx içindeki MSW bloğu.

## 17. Gerçek Backend Entegrasyonu (2026-05-10)

Mock-mode'a ek olarak panel **gerçek Spring Boot backend'i** ile uçtan uca çalışacak şekilde bağlandı. Mock'a dönüş tek env değişkeni mesafede.

### 17.1. Vite Dev Sunucusu Proxy
- `vite.config.ts`'e `/api` proxy eklendi. `VITE_USE_MOCK !== "false"` iken proxy kapalı (MSW yakalar), aksi halde `VITE_API_TARGET` (varsayılan `http://localhost:8080`) hedefine yönlendirir.
- `cookieDomainRewrite: "localhost"` ile `USER_SESSION` cookie'si tarayıcıya doğru ata-edilir; CORS engeli yaşanmaz çünkü tarayıcı her şeyi `localhost:5173` gibi görür.
- `.env.local` örneği `VITE_USE_MOCK=false` ve `VITE_API_TARGET=http://localhost:8080` ile geliyor.

### 17.2. Koşullu MSW Boot
- `src/main.tsx` artık `import.meta.env.DEV && VITE_USE_MOCK !== "false"` durumunda MSW worker'ı başlatır. Aksi halde tarayıcı konsoluna `[gym-ops] gerçek backend modunda — /api proxy üzerinden` mesajı düşer.

### 17.3. Yanıt Normalizer'ları (`src/lib/normalize.ts`)
Backend DTO'larındaki alan isimleri ve enum değerleri frontend'in bekledikleriyle birebir aynı değil. Tüm GET çağrılarının çıktısı bu modülden geçirilerek **UI'nın değişmesine gerek kalmadan** uyumlu hale getiriliyor.

**Alan adı eşleştirmeleri:**
- `userRole` ↔ `userType`
- `accountCreationDate` ↔ `createdAt`
- `customerStatus` ↔ `status`
- `isActiveSubscriber` ↔ `hasActiveSubscription`
- `customerHealthReportStatus` ↔ `status`
- `revisionDate` ↔ `uploadedAt` / `verifiedAt`
- `machineStatus` ↔ `status`
- `creationDate` (Maintenance) ↔ `performedAt`
- `maintainerId` ↔ `performedBy` (UI tarafında `#<id>` şeklinde)
- `sentDate` / `completeDay` ↔ `startedAt` / `completedAt`
- `lastSubscriptionStartDate` (Subscription) bilgi olarak korunuyor; UI `endDate`'i göstermeyi tercih ediyor
- `monthlyCost` / `totalCost` (SubscriptionPurchase) → `chargeRate` ve `chargeCost` türetiliyor

**Enum eşleştirmeleri:**
| Alan              | Backend                              | Frontend                                |
| ----------------- | ------------------------------------ | --------------------------------------- |
| Customer          | `VERIFIED` / `PENDING` / `BLACKLIST` | `ACTIVE` / `PENDING` / `SUSPENDED`      |
| Machine           | `AVAILABLE` / `ON_REPAIR_SERVICE`    | `OPERATIONAL` / `UNDER_REPAIR`          |
| Subscription      | `NO_PURCHASE_YET` / `CANCELED` / `SUSPENDED` | `NONE` / `CANCELLED` / `PENDING`        |
| Health report     | `PENDING`                            | `UPLOADED` (UI'da "yüklendi/onay bekliyor") |

### 17.4. 404 → Boş Liste Davranışı
Spring Boot tarafında bazı koleksiyon endpoint'leri (`/api/customer`, `/api/user`, `/api/charge-profile/charge-profile`, `/api/machine`, `/api/customer/{id}/health_report` vb.) liste boşsa `404 *_not_found` döner. `api.ts` içinde `listOrEmpty()` yardımcısı, listing endpoint'leri için 404'ü `[]` olarak ele alır — UI'da hata değil sadece "kayıt yok" boş durumu gösterilir.

### 17.5. Backend'de Bulunmayan UI Endpoint'leri için Fallback
Dashboard `/api/repair/all`, `/api/maintenance/all`, `/api/activity` gibi global toplama endpoint'leri kullanır; bunlar sadece MSW mock'unda var. `api.ts` bu çağrılar için **per-machine fallback** uygular: ana endpoint 404 dönerse tüm makineleri dolaşıp her birinin onarım/bakım listesini birleştirir. `/api/activity` yoksa boş array döner — dashboard yine çalışır, sadece "Canlı Aktivite" boş kalır.

### 17.6. Yapılan Backend İyileştirmeleri
Frontend'i bağlarken backend'de fark edilen ve düzeltilen sorunlar (detayları için `gym-backend/things_done.md` Bölüm 8):
- `GET /api/auth/me` endpoint'i eklendi.
- `ValidDateConstraint` regex'i hiç bir tarihi kabul etmiyordu — temizlendi.
- `RepairServiceImpl` üç metotta `setEstimatedReturnDays(response.get...)` self-assignment yapıyordu — entity'den okumak için düzeltildi.
- `Maintenance.maintainer` ve `Repair.maintainer` `@OneToOne` → `@ManyToOne` (unique constraint kaldırıldı).
- `DataStarter` genişletildi: `gym.seed.demo=true` ile fresh DB'ye 6 personel + 22 üye + 6 tarife + 12 makine + bakım/onarım/abonelik geçmişi yükleniyor.

### 17.7. Mod Değiştirme
- **Mock mode (geliştirme rahatlığı):** `gym-frontend/.env.local`'de `VITE_USE_MOCK=true`, dev sunucuyu yeniden başlat.
- **Real backend mode (varsayılan):** `VITE_USE_MOCK=false` veya `.env.local`'i sil. `gym-backend` 8080 portunda çalışır olmalı.

## 17. Mimari Özet

```
gym-frontend/
├── src/
│   ├── app/                      # her özellik kendi route klasöründe
│   │   ├── auth/{Login,PasswordReset}.tsx
│   │   ├── dashboard/Dashboard.tsx
│   │   ├── customers/{CustomersList,CustomerDetail}.tsx
│   │   ├── health-reports/HealthReports.tsx
│   │   ├── subscriptions/{Subscriptions,PurchaseWizard}.tsx
│   │   ├── charge-profiles/ChargeProfiles.tsx
│   │   ├── machines/{Machines,MachineDetail}.tsx
│   │   ├── operations/Operations.tsx
│   │   ├── statistics/Statistics.tsx
│   │   └── staff/Staff.tsx
│   ├── components/
│   │   ├── ui/                   # 11 UI primitive
│   │   └── layout/               # Sidebar, Topbar, Shell, Logo
│   ├── lib/
│   │   ├── api.ts                # 35+ endpoint metodu, 404→[] handling, fallback'ler
│   │   ├── normalize.ts          # backend DTO → frontend shape adapter + enum mapping
│   │   ├── queries.ts            # React Query key'leri
│   │   ├── format.ts             # TRY/tarih/telefon formatlayıcı
│   │   ├── validate.ts           # Form validasyonları
│   │   └── cn.ts                 # className utility
│   ├── mocks/
│   │   ├── browser.ts            # MSW setup
│   │   ├── handlers.ts           # tüm /api/* mock handlerlar
│   │   └── seed.ts               # deterministik tohum veri
│   ├── store/
│   │   ├── auth.ts               # zustand persist'li auth store
│   │   └── ui.ts                 # sidebar collapsed gibi UI tercihi
│   ├── types/dto.ts              # frontend DTO type'ları
│   ├── App.tsx                   # router + provider'lar
│   ├── main.tsx                  # koşullu MSW boot + render
│   └── index.css                 # Tailwind + tokens + custom CSS
├── tailwind.config.js            # tema değişkenleri
├── vite.config.ts                # @ alias, dev port, /api → 8080 proxy
├── .env.local                    # VITE_USE_MOCK, VITE_API_TARGET (real backend default)
├── kullanim_klavuzu.md           # operatör kılavuzu (Türkçe)
├── things_done.md                # bu doküman
└── README.md                     # geliştirici hızlı başlangıç
```

---

**Sonuç:** `gym-backend` Spring Boot servisinin sunduğu tüm yetenekler için uçtan uca, üretim kalitesinde, role-aware, kendi tasarım dili olan, **hem mock backend ile bağımsız hem de gerçek backend ile uçtan uca** çalışabilen, tek bir ortam değişkeniyle iki mod arasında geçiş yapılabilen modern bir operatör paneli.
