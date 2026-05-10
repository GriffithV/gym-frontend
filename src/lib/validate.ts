// Validation rules from backend (frontend_endpoint_guide.md).

const PASSWORD_RE =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,31}$/;

export interface ValidationFinding {
  ok: boolean;
  reason?: string;
}

export function validatePassword(value: string): ValidationFinding {
  if (!value) return { ok: false, reason: "Şifre gerekli" };
  if (/\s/.test(value)) return { ok: false, reason: "Boşluk içeremez" };
  if (value.length < 8) return { ok: false, reason: "En az 8 karakter olmalı" };
  if (value.length > 31) return { ok: false, reason: "En fazla 31 karakter olmalı" };
  if (!/[A-Z]/.test(value)) return { ok: false, reason: "En az 1 büyük harf" };
  if (!/[a-z]/.test(value)) return { ok: false, reason: "En az 1 küçük harf" };
  if (!/\d/.test(value)) return { ok: false, reason: "En az 1 rakam" };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(value))
    return { ok: false, reason: "En az 1 özel karakter" };
  if (!PASSWORD_RE.test(value)) return { ok: false, reason: "Geçersiz format" };
  return { ok: true };
}

export function passwordStrength(value: string): {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
} {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(value)) score++;
  const labels = ["Yok", "Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
  return { score: score as 0 | 1 | 2 | 3 | 4 | 5, label: labels[score] };
}

export function validatePhone(value: string): ValidationFinding {
  const cleaned = value.replace(/\s/g, "");
  if (!/^\d{11}$/.test(cleaned))
    return { ok: false, reason: "Telefon 11 haneli olmalı" };
  if (!/^0/.test(cleaned))
    return { ok: false, reason: "Telefon 0 ile başlamalı" };
  return { ok: true };
}

const DATE_RE = /^(\d{2})\/(\d{2})\/(19|20)\d{2}$/;

export function validateDate(value: string): ValidationFinding {
  if (!value) return { ok: false, reason: "Tarih gerekli" };
  if (value.length !== 10)
    return { ok: false, reason: "10 karakter olmalı (gg/aa/yyyy)" };
  if (!DATE_RE.test(value)) return { ok: false, reason: "Format: gg/aa/yyyy" };
  const [, dd, mm, yyPrefix] = DATE_RE.exec(value)!;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(value.slice(6, 10));
  if (month < 1 || month > 12) return { ok: false, reason: "Geçersiz ay" };
  const daysInMonth = [
    31,
    isLeap(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (day < 1 || day > daysInMonth[month - 1])
    return { ok: false, reason: "Geçersiz gün" };
  if (yyPrefix !== "19" && yyPrefix !== "20")
    return { ok: false, reason: "Yıl 19xx veya 20xx olmalı" };
  return { ok: true };
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function validateName(v: string): ValidationFinding {
  if (!v.trim()) return { ok: false, reason: "Gerekli" };
  if (v.length < 2) return { ok: false, reason: "En az 2 karakter" };
  return { ok: true };
}

export function validateRange(
  v: number,
  min: number,
  max: number,
): ValidationFinding {
  if (Number.isNaN(v)) return { ok: false, reason: "Sayı girin" };
  if (v < min) return { ok: false, reason: `En az ${min}` };
  if (v > max) return { ok: false, reason: `En fazla ${max}` };
  return { ok: true };
}
