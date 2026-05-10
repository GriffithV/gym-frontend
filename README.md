# GYM // OPS — Operatör Paneli

Spring Boot tabanlı `gym-backend` için React + Vite + TypeScript ile geliştirilmiş yönetim paneli. "Stadium Light" estetiği — koyu jet siyah üzerine elektrik sarısı, condensed display tipografi.

## Çalıştırma

```bash
npm install              # bağımlılıklar
npm run dev              # http://localhost:5173
npm run build            # production build (dist/)
npm run preview          # build'i lokal olarak servis et
```

Panel iki modda çalışır:

- **Real backend (varsayılan):** `gym-backend` Spring Boot servisi 8080 portunda çalışırken Vite, `/api` çağrılarını proxy'ler. Veriler kalıcıdır (H2 dosya tabanlı).
- **Mock backend (geliştirme rahatlığı):** MSW (Mock Service Worker) `/api` isteklerini tarayıcıda yakalar, `src/mocks/seed.ts` üzerinden cevap verir. Backend'siz tek başına çalışır.

`.env.local` dosyası varsayılan olarak gerçek backend'e işaret eder:

```
VITE_USE_MOCK=false
VITE_API_TARGET=http://localhost:8080
```

Mock'a dönmek için `VITE_USE_MOCK=true` yap (ya da `.env.local`'i sil) ve `npm run dev`'i yeniden başlat. Tarayıcı konsolunda `[gym-ops] mock backend (MSW) aktif` veya `[gym-ops] gerçek backend modunda — /api proxy üzerinden` mesajı seçili modu doğrular.

## Demo Erişimi

Aynı 6 hesap her iki modda da geçerli (gerçek backend'de `gym.seed.demo=true` ile yüklenir):

| ID  | İsim Soyisim   | Rol        | Şifre             | Gizli Kelime |
| --- | -------------- | ---------- | ----------------- | ------------ |
| 1   | Ronnie Coleman | ADMIN      | `password123ytu`  | `ytu`        |
| 2   | Mert Güler     | ADMIN      | `Demo123!`        | `demo`       |
| 3   | Ayşe Demir     | CLERK      | `Demo123!`        | `demo`       |
| 4   | Hakan Çelik    | CLERK      | `Demo123!`        | `demo`       |
| 5   | İsmail Kara    | REPAIRMAN  | `Demo123!`        | `demo`       |
| 6   | Burak Yıldız   | REPAIRMAN  | `Demo123!`        | `demo`       |

Login sayfasındaki demo kart butonlarına tıklayınca form alanları otomatik dolar.

## Backend'i Çalıştırma

```bash
cd ../gym-backend
./mvnw spring-boot:run    # http://localhost:8080
```

`gym.seed.demo=true` (varsayılan) iken fresh H2 veritabanı **22 üye + 6 tarife + 12 makine + bakım/onarım/abonelik geçmişi** ile dolu olarak gelir. Üretim ortamı için `application.properties`'te bu değeri `false` yaparsan sadece tek admin hesabı seed edilir.

Mevcut DB'yi sıfırlamak için: backend'i durdur, `gym-backend/database/data.mv.db` dosyasını sil, yeniden başlat.

## Production Build

`vite.config.ts`'deki proxy sadece dev sunucusunda çalışır. Production'da statik dosyalar backend ile aynı origin altında servis edilmeli (örn. nginx reverse proxy) ya da `VITE_API_BASE` tam URL ile ayarlanıp backend'in CORS ayarlarına frontend origin'i eklenmelidir.

## Klasör Yapısı

```
src/
  app/                     route'lar (her özellik kendi klasöründe)
    auth/                  Login, PasswordReset
    dashboard/             Pano
    customers/             Üye liste/detay
    health-reports/        Sağlık raporları
    subscriptions/         Abonelik liste + satın alım wizard
    charge-profiles/       Tarifeler (CRUD)
    machines/              Makine grid + detay
    operations/            Bakım & Onarım merkezi
    statistics/            İstatistik analizi
    staff/                 Personel yönetimi
  components/
    ui/                    Button, Input, Card, Badge, Modal, Table, ...
    layout/                Sidebar, Topbar, Shell
  lib/
    api.ts                 35+ endpoint metodu, 404→[] handling
    normalize.ts           backend DTO → frontend shape adapter (alan + enum eşleştirme)
    queries.ts             React Query key sabitleri
    format.ts              TRY/tarih/telefon formatlayıcı
    validate.ts            form validasyonları (backend kuralları ile birebir)
  mocks/                   MSW handlers + seed data (mock mode için)
  store/                   zustand (auth + ui)
  types/dto.ts             frontend DTO type'ları
  styles/                  CSS tokens (tailwind.config.js içinde)
```

## Tasarım Sistemi

- **Renkler:** `--ink` (jet black), `--volt` (electric yellow), `--lime` / `--amber` / `--scarlet` durum sinyalleri.
- **Tipografi:** Display *Big Shoulders Display* + Body *Familjen Grotesk* + Mono *JetBrains Mono*.
- **Ritim:** 4-pt baseline, slash-divider (`//`) ve hairline rule yapısal eleman.
- **Hareket:** Stat hero count-up (mount), card stagger reveal, voltage-flicker hover, scan-line atmosphere.

Tasarım dökümanı: `../docs/superpowers/specs/2026-05-10-gym-operator-panel-design.md`.
