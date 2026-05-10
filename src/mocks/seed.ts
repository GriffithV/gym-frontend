// Deterministic seed data shaped to match the gym backend's domain model.
// Used by MSW handlers; mutations update this in-memory store.

import type {
  ActivityItem,
  ChargeProfileResponse,
  CustomerHealthReportResponse,
  CustomerResponse,
  MachineResponse,
  MaintenanceResponse,
  RepairResponse,
  SubscriptionPurchaseResponse,
  SubscriptionResponse,
  UserResponse,
} from "@/types/dto";

function isoMinusDays(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function ddmmyyyyMinusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function ddmmyyyyPlusDays(days: number): string {
  return ddmmyyyyMinusDays(-days);
}

export const db = {
  users: [
    {
      id: 1,
      name: "Ronnie",
      surName: "Coleman",
      userType: "ADMIN",
      createdAt: isoMinusDays(180),
    },
    {
      id: 2,
      name: "Mert",
      surName: "Güler",
      userType: "ADMIN",
      createdAt: isoMinusDays(120),
    },
    {
      id: 3,
      name: "Ayşe",
      surName: "Demir",
      userType: "CLERK",
      createdAt: isoMinusDays(60),
    },
    {
      id: 4,
      name: "Hakan",
      surName: "Çelik",
      userType: "CLERK",
      createdAt: isoMinusDays(45),
    },
    {
      id: 5,
      name: "İsmail",
      surName: "Kara",
      userType: "REPAIRMAN",
      createdAt: isoMinusDays(90),
    },
    {
      id: 6,
      name: "Burak",
      surName: "Yıldız",
      userType: "REPAIRMAN",
      createdAt: isoMinusDays(30),
    },
  ] as (UserResponse & { password: string; backupSecret: string })[],

  customers: [] as CustomerResponse[],
  healthReports: new Map<number, CustomerHealthReportResponse & { fileBlob?: Blob }>(),
  chargeProfiles: [] as ChargeProfileResponse[],
  subscriptions: new Map<number, SubscriptionResponse>(),
  purchases: [] as SubscriptionPurchaseResponse[],
  machines: [] as MachineResponse[],
  machineImages: new Map<number, Blob>(),
  maintenance: [] as MaintenanceResponse[],
  repairs: [] as RepairResponse[],
  activity: [] as ActivityItem[],
  sessions: new Map<string, { userId: number; expiresAt: number }>(),
  nextId: {
    user: 7,
    customer: 1,
    charge: 1,
    purchase: 1,
    machine: 1,
    maintenance: 1,
    repair: 1,
    activity: 1,
  },
};

// ---- Seed user passwords/secrets ----
db.users[0].password = "password123ytu";
db.users[0].backupSecret = "ytu";
for (let i = 1; i < db.users.length; i++) {
  db.users[i].password = "Demo123!";
  db.users[i].backupSecret = "demo";
}

// ---- Seed customers ----
const customerSeed: Array<[string, string, string, CustomerResponse["status"], number]> = [
  ["Mehmet", "Akın", "05551234567", "ACTIVE", 200],
  ["Zeynep", "Yıldız", "05552345678", "ACTIVE", 175],
  ["Ali", "Yılmaz", "05553456789", "ACTIVE", 150],
  ["Fatma", "Şahin", "05554567890", "PENDING", 130],
  ["Hasan", "Öztürk", "05555678901", "ACTIVE", 120],
  ["Elif", "Kaya", "05556789012", "EXPIRED", 110],
  ["Mustafa", "Aydın", "05557890123", "ACTIVE", 95],
  ["Ayşe", "Çetin", "05558901234", "PENDING", 80],
  ["Emre", "Polat", "05559012345", "ACTIVE", 70],
  ["Selin", "Arslan", "05550123456", "SUSPENDED", 60],
  ["Cem", "Erdoğan", "05554440011", "ACTIVE", 50],
  ["Deniz", "Korkmaz", "05554440022", "ACTIVE", 45],
  ["Pelin", "Avcı", "05554440033", "PENDING", 30],
  ["Onur", "Ergin", "05554440044", "ACTIVE", 28],
  ["Berk", "Türk", "05554440055", "ACTIVE", 22],
  ["Sena", "Aksoy", "05554440066", "ACTIVE", 18],
  ["Doruk", "Kurt", "05554440077", "EXPIRED", 14],
  ["İrem", "Yalçın", "05554440088", "ACTIVE", 12],
  ["Tolga", "Bakır", "05554440099", "ACTIVE", 9],
  ["Ece", "Doğan", "05554440100", "PENDING", 5],
  ["Kaan", "Şimşek", "05554440111", "ACTIVE", 3],
  ["Lara", "Erol", "05554440122", "ACTIVE", 2],
];

for (const [name, surName, phone, status, ago] of customerSeed) {
  const id = db.nextId.customer++;
  db.customers.push({
    id,
    name,
    surName,
    phoneNumber: phone,
    status,
    createdAt: isoMinusDays(ago),
    hasHealthReport: status === "ACTIVE" || status === "EXPIRED",
    hasActiveSubscription: status === "ACTIVE",
  });

  // Health report for those who have one
  if (status === "ACTIVE") {
    db.healthReports.set(id, {
      customerId: id,
      customerName: `${name} ${surName}`,
      status: "VERIFIED",
      uploadedAt: isoMinusDays(ago - 1),
      verifiedAt: isoMinusDays(ago - 2),
      endDate: ddmmyyyyPlusDays(180 - Math.min(ago, 100)),
      fileName: `saglik_${id}.pdf`,
    });
  } else if (status === "EXPIRED") {
    db.healthReports.set(id, {
      customerId: id,
      customerName: `${name} ${surName}`,
      status: "EXPIRED",
      uploadedAt: isoMinusDays(ago - 1),
      verifiedAt: isoMinusDays(ago - 2),
      endDate: ddmmyyyyMinusDays(5),
      fileName: `saglik_${id}.pdf`,
    });
  } else if (status === "PENDING") {
    db.healthReports.set(id, {
      customerId: id,
      customerName: `${name} ${surName}`,
      status: "UPLOADED",
      uploadedAt: isoMinusDays(2),
      fileName: `saglik_${id}.pdf`,
    });
  }
}

// ---- Charge profiles ----
const profileSeed = [
  ["Aylık Standart", "Standart üyelik planı", 1.0, 1500],
  ["Aylık Öğrenci", "Öğrenci indirimli plan (öğrenci belgesi gerekli)", 0.7, 1050],
  ["Yıllık Premium", "12 ay önden ödemeli, %15 indirim", 0.85, 15300],
  ["Sabah Kuşu", "Sadece 06:00-12:00 arası geçerli", 0.6, 900],
  ["Gece Vardiyası", "20:00-23:00 arası özel tarife", 0.65, 975],
  ["VIP Sınırsız", "Tüm hizmetler dahil VIP plan", 1.5, 2250],
];
for (const [title, info, rate, cost] of profileSeed) {
  db.chargeProfiles.push({
    id: db.nextId.charge++,
    title: title as string,
    info: info as string,
    chargeRate: rate as number,
    chargeCost: cost as number,
  });
}

// ---- Subscriptions for active customers ----
for (const c of db.customers) {
  if (c.status === "ACTIVE") {
    const profile = db.chargeProfiles[Math.floor(Math.random() * 4)];
    const days = profile.title.includes("Yıllık") ? 30 : 30;
    const months = profile.title.includes("Yıllık") ? 12 : 1;
    const startDays = Math.floor(Math.random() * 25) + 1;
    const isTimeLimited = profile.title.includes("Sabah") || profile.title.includes("Gece");
    const purchase: SubscriptionPurchaseResponse = {
      id: db.nextId.purchase++,
      customerId: c.id,
      title: profile.title,
      subscriptionDays: days,
      subscriptionMonthPeriod: months,
      chargeRate: profile.chargeRate,
      chargeCost: profile.chargeCost,
      isTimeLimited,
      startHour: profile.title.includes("Sabah") ? 6 : profile.title.includes("Gece") ? 20 : undefined,
      endHour: profile.title.includes("Sabah") ? 12 : profile.title.includes("Gece") ? 23 : undefined,
      startDate: ddmmyyyyMinusDays(startDays),
      endDate: ddmmyyyyPlusDays(days * months - startDays),
      isCompleted: false,
    };
    db.purchases.push(purchase);
    db.subscriptions.set(c.id, {
      customerId: c.id,
      status: "ACTIVE",
      currentPurchaseId: purchase.id,
      endDate: purchase.endDate,
      isTimeLimited,
      startHour: purchase.startHour,
      endHour: purchase.endHour,
    });
  } else if (c.status === "EXPIRED") {
    db.subscriptions.set(c.id, { customerId: c.id, status: "EXPIRED" });
  } else {
    db.subscriptions.set(c.id, { customerId: c.id, status: "NONE" });
  }
}

// Add a few historical purchases for the first few customers
for (let i = 0; i < 8; i++) {
  const c = db.customers[i];
  for (let j = 1; j <= 2; j++) {
    const profile = db.chargeProfiles[(i + j) % db.chargeProfiles.length];
    const start = 30 * j + 30;
    db.purchases.push({
      id: db.nextId.purchase++,
      customerId: c.id,
      title: profile.title,
      subscriptionDays: 30,
      subscriptionMonthPeriod: 1,
      chargeRate: profile.chargeRate,
      chargeCost: profile.chargeCost,
      isTimeLimited: false,
      startDate: ddmmyyyyMinusDays(start),
      endDate: ddmmyyyyMinusDays(start - 30),
      isCompleted: true,
    });
  }
}

// ---- Machines ----
const machineSeed: Array<[string, MachineResponse["status"], number, number]> = [
  ["Koşu Bandı M-04", "OPERATIONAL", 6, 80],
  ["Eliptik Bisiklet E-02", "OPERATIONAL", 6, 60],
  ["Kondisyon Bisikleti C-07", "MAINTENANCE_DUE", 4, 145],
  ["Smith Machine S-01", "OPERATIONAL", 12, 200],
  ["Leg Press L-03", "MAINTENANCE_DUE", 6, 175],
  ["Lat Pulldown L-05", "OPERATIONAL", 6, 30],
  ["Pec Deck P-02", "UNDER_REPAIR", 6, 250],
  ["Cable Crossover X-01", "OPERATIONAL", 12, 90],
  ["Dumbbell Rack D-01", "OPERATIONAL", 24, 365],
  ["Squat Rack R-02", "OPERATIONAL", 12, 120],
  ["Rowing Machine W-01", "MAINTENANCE_DUE", 4, 130],
  ["Hack Squat H-01", "UNDER_REPAIR", 6, 220],
];
for (const [name, status, period, lastDays] of machineSeed) {
  db.machines.push({
    id: db.nextId.machine++,
    name,
    lastMaintenanceDate: ddmmyyyyMinusDays(lastDays),
    maintenanceMonthlyPeriod: period,
    status,
    imageUrl: undefined,
  });
}

// ---- Maintenance log ----
const maintNotes = [
  "Yağlama ve kayış kontrolü yapıldı",
  "Motor temizliği ve filtre değişimi",
  "Elektronik panel kalibrasyonu",
  "Cıvatalar sıkıldı, yatak değişimi",
  "Kablo değişimi ve gres yağlama",
  "Ekran tamiri ve hız kalibrasyonu",
  "Genel temizlik ve gres",
  "Vibrasyon emici tamiri",
];
for (const m of db.machines) {
  for (let i = 0; i < (Math.floor(Math.random() * 3) + 1); i++) {
    db.maintenance.push({
      id: db.nextId.maintenance++,
      machineId: m.id,
      cost: 200 + Math.floor(Math.random() * 1500),
      info: maintNotes[Math.floor(Math.random() * maintNotes.length)],
      performedAt: isoMinusDays(20 + i * 30 + Math.floor(Math.random() * 15)),
      performedBy: "İsmail Kara",
    });
  }
}

// ---- Repairs ----
const repairSeed: Array<[string, number, number, boolean, number]> = [
  ["Motor arızası, motor değişimi gerekti", 7, 7500, true, 60],
  ["Ekran arızalı, yedek parça beklendi", 5, 1800, true, 25],
  ["Pec Deck pim sistemi tamiri", 4, 2500, false, 3],
  ["Hack Squat ray sistemi yenileme", 10, 4200, false, 8],
];
const repairMachineIds = [3, 6, 7, 12];
for (let i = 0; i < repairSeed.length; i++) {
  const [info, days, cost, completed, ago] = repairSeed[i];
  const mid = repairMachineIds[i];
  const m = db.machines.find((mm) => mm.id === mid);
  db.repairs.push({
    id: db.nextId.repair++,
    machineId: mid,
    machineName: m?.name,
    cost,
    info,
    estimatedReturnDays: days,
    isCompleted: completed,
    startedAt: isoMinusDays(ago),
    completedAt: completed ? isoMinusDays(ago - days) : undefined,
  });
}

// ---- Activity feed ----
const activitySeed: ActivityItem[] = [
  { id: db.nextId.activity++, kind: "subscription_purchased", message: "Lara Erol — Aylık Standart abonelik aldı", actor: "Ayşe Demir", at: isoMinusDays(0, 2) },
  { id: db.nextId.activity++, kind: "report_verified", message: "Tolga Bakır — sağlık raporu onaylandı", actor: "Hakan Çelik", at: isoMinusDays(0, 4) },
  { id: db.nextId.activity++, kind: "repair_started", message: "Hack Squat H-01 — onarıma alındı", actor: "İsmail Kara", at: isoMinusDays(0, 6) },
  { id: db.nextId.activity++, kind: "customer_registered", message: "Kaan Şimşek sisteme kaydedildi", actor: "Ayşe Demir", at: isoMinusDays(0, 8) },
  { id: db.nextId.activity++, kind: "maintenance_logged", message: "Koşu Bandı M-04 — bakım tamamlandı", actor: "İsmail Kara", at: isoMinusDays(0, 12) },
  { id: db.nextId.activity++, kind: "subscription_purchased", message: "Ece Doğan — Aylık Öğrenci abonelik aldı", actor: "Hakan Çelik", at: isoMinusDays(1, 0) },
  { id: db.nextId.activity++, kind: "report_uploaded", message: "Sena Aksoy — sağlık raporu yüklendi", actor: "Ayşe Demir", at: isoMinusDays(1, 4) },
  { id: db.nextId.activity++, kind: "repair_completed", message: "Pec Deck P-02 — onarımı tamamlandı", actor: "Burak Yıldız", at: isoMinusDays(1, 8) },
  { id: db.nextId.activity++, kind: "report_expired", message: "Doruk Kurt — sağlık raporu süresi doldu", actor: "Sistem", at: isoMinusDays(2, 0) },
  { id: db.nextId.activity++, kind: "user_login", message: "Ronnie Coleman giriş yaptı", actor: "Ronnie Coleman", at: isoMinusDays(2, 6) },
];
db.activity.push(...activitySeed);

// Helper to log new activity
export function logActivity(item: Omit<ActivityItem, "id" | "at">) {
  db.activity.unshift({
    id: db.nextId.activity++,
    at: new Date().toISOString(),
    ...item,
  });
}
