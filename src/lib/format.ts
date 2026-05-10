// Domain-specific formatters. Backend dates are dd/MM/yyyy strings.

export function formatTRY(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPhone(raw: string): string {
  // 05554443322 -> 0555 444 33 22
  if (!raw) return "";
  const d = raw.replace(/\D/g, "").padStart(11, "0").slice(0, 11);
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}

// ---- Date utils for the dd/MM/yyyy backend format ----
export function parseBackendDate(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(d.getTime()) ? null : d;
}

export function toBackendDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function todayBackend(): string {
  return toBackendDate(new Date());
}

const TR_MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export function formatDateLong(s?: string | null): string {
  const d = parseBackendDate(s ?? "");
  if (!d) return "—";
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(s?: string | null): string {
  return s ?? "—";
}

export function daysFromNow(s?: string | null): number | null {
  const d = parseBackendDate(s ?? "");
  if (!d) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function relativeTimeFromIso(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}sn önce`;
  if (sec < 3600) return `${Math.floor(sec / 60)}dk önce`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}sa önce`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}g önce`;
  return formatDateLong(toBackendDate(d));
}

export function formatHourRange(start?: number, end?: number): string {
  if (start == null || end == null) return "—";
  const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `${fmt(start)}–${fmt(end)}`;
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    ACTIVE: "Aktif",
    PENDING: "Beklemede",
    SUSPENDED: "Askıda",
    EXPIRED: "Süresi Doldu",
    CANCELLED: "İptal",
    NONE: "Yok",
    UPLOADED: "Yüklendi",
    VERIFIED: "Onaylı",
    MISSING: "Eksik",
    OPERATIONAL: "Çalışıyor",
    MAINTENANCE_DUE: "Bakım Yaklaştı",
    UNDER_REPAIR: "Onarımda",
    RETIRED: "Kullanım Dışı",
  };
  return map[s] ?? s;
}

export function roleLabel(r: string): string {
  const map: Record<string, string> = {
    ADMIN: "Yönetici",
    CLERK: "Resepsiyon",
    REPAIRMAN: "Tekniker",
  };
  return map[r] ?? r;
}
