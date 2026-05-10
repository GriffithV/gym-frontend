// Adapters that map the real Spring Boot backend's DTO field names
// to the shape our UI components expect. The backend's actual response
// shapes differ from the names we adopted in src/types/dto.ts, so we
// normalize here in one place rather than scattering renames across views.

import type {
  CustomerHealthReportResponse,
  CustomerHealthReportStatus,
  CustomerResponse,
  CustomerStatus,
  MachineResponse,
  MachineStatus,
  MaintenanceResponse,
  RepairResponse,
  StatisticsResponse,
  SubscriptionPurchaseResponse,
  SubscriptionResponse,
  SubscriptionStatus,
  UserResponse,
  UserRole,
} from "@/types/dto";

// ---- Enum mapping ----
// Backend enum values differ from the names the frontend UI uses. We map at the
// boundary so views can stay declarative. Unknown values fall through unchanged.

const CUSTOMER_STATUS_MAP: Record<string, CustomerStatus> = {
  VERIFIED: "ACTIVE",
  PENDING: "PENDING",
  BLACKLIST: "SUSPENDED",
  // already-frontend-shaped values (when backend evolves):
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
};

const MACHINE_STATUS_MAP: Record<string, MachineStatus> = {
  AVAILABLE: "OPERATIONAL",
  ON_REPAIR_SERVICE: "UNDER_REPAIR",
  // pre-mapped values:
  OPERATIONAL: "OPERATIONAL",
  MAINTENANCE_DUE: "MAINTENANCE_DUE",
  UNDER_REPAIR: "UNDER_REPAIR",
  RETIRED: "RETIRED",
};

const SUBSCRIPTION_STATUS_MAP: Record<string, SubscriptionStatus> = {
  NO_PURCHASE_YET: "NONE",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELED: "CANCELLED",
  CANCELLED: "CANCELLED",
  SUSPENDED: "PENDING",
  NONE: "NONE",
  PENDING: "PENDING",
};

const HEALTH_REPORT_STATUS_MAP: Record<string, CustomerHealthReportStatus> = {
  PENDING: "UPLOADED",
  VERIFIED: "VERIFIED",
  EXPIRED: "EXPIRED",
  // pre-mapped:
  UPLOADED: "UPLOADED",
  MISSING: "MISSING",
};

// ---- Helpers ----

function isoFromBackendDateTime(s?: string | null): string | undefined {
  if (!s) return undefined;
  // Backend returns either an ISO LocalDateTime ("2026-05-09T13:42:18.123") or a dd/MM/yyyy date.
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;
  // dd/MM/yyyy → midnight ISO
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).toISOString();
  }
  return s;
}

function backendDateString(s?: string | null): string | undefined {
  if (!s) return undefined;
  // Already dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // ISO LocalDate or LocalDateTime
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

// ---- Type guards on raw backend payloads ----

interface BackendUserResponse {
  id: number;
  name: string;
  surName: string;
  accountCreationDate?: string;
  userRole?: string;
}

interface BackendCustomerResponse {
  id: number;
  name: string;
  surName: string;
  phoneNumber: string;
  customerStatus?: string;
  accountCreationDate?: string;
  isActiveSubscriber?: boolean;
}

interface BackendHealthReportResponse {
  id?: number;
  customerId?: number;
  customerHealthReportStatus?: string;
  revisionDate?: string;
  endDate?: string;
  fileName?: string;
}

interface BackendMachineResponse {
  id: number;
  name: string;
  lastMaintenanceDate?: string;
  maintenanceMonthlyPeriod?: number;
  machineStatus?: string;
}

interface BackendMaintenanceResponse {
  id: number;
  machineId: number;
  creationDate?: string;
  maintainerId?: number;
  cost?: number | string;
  info?: string;
}

interface BackendRepairResponse {
  id: number;
  machineId: number;
  sentDate?: string;
  completeDay?: string;
  maintainerId?: number;
  cost?: number | string;
  info?: string;
  estimatedReturnDays?: number;
  isCompleted?: boolean;
}

interface BackendSubscriptionResponse {
  id?: number;
  customerId?: number;
  lastSubscriptionStartDate?: string;
  endDate?: string | null;
  status?: string;
}

interface BackendSubscriptionPurchaseResponse {
  id: number;
  subscriptionId?: number;
  creationDate?: string;
  isCompleted?: boolean;
  title?: string;
  subscriptionDays?: number;
  subscriptionMonthPeriod?: number;
  monthlyCost?: number | string;
  totalCost?: number | string;
  isTimeLimited?: boolean;
  startHour?: number | null;
  endHour?: number | null;
}

interface BackendStatisticsResponse {
  startDate?: string;
  endDate?: string;
  totalRevenue?: number | string;
  maintenanceCosts?: number | string;
  repairCosts?: number | string;
}

// ---- Normalizers ----

export function normalizeUser(raw: unknown): UserResponse {
  const r = raw as BackendUserResponse;
  return {
    id: r.id,
    name: r.name ?? "",
    surName: r.surName ?? "",
    userType: (r.userRole ?? "CLERK") as UserRole,
    createdAt: isoFromBackendDateTime(r.accountCreationDate),
  };
}

export function normalizeCustomer(raw: unknown): CustomerResponse {
  const r = raw as BackendCustomerResponse;
  const rawStatus = r.customerStatus ?? "PENDING";
  return {
    id: r.id,
    name: r.name ?? "",
    surName: r.surName ?? "",
    phoneNumber: r.phoneNumber ?? "",
    status: CUSTOMER_STATUS_MAP[rawStatus] ?? (rawStatus as CustomerStatus),
    createdAt:
      isoFromBackendDateTime(r.accountCreationDate) ??
      new Date().toISOString(),
    hasActiveSubscription: r.isActiveSubscriber ?? false,
    hasHealthReport: undefined,
  };
}

export function normalizeHealthReport(
  raw: unknown,
  fallbackId?: number,
): CustomerHealthReportResponse {
  const r = raw as BackendHealthReportResponse;
  const rawStatus = r.customerHealthReportStatus ?? "MISSING";
  const status =
    HEALTH_REPORT_STATUS_MAP[rawStatus] ??
    (rawStatus as CustomerHealthReportStatus);
  return {
    customerId: r.customerId ?? fallbackId ?? 0,
    status,
    endDate: backendDateString(r.endDate ?? undefined),
    fileName: r.fileName,
    uploadedAt: isoFromBackendDateTime(r.revisionDate),
    verifiedAt:
      status === "VERIFIED" || status === "EXPIRED"
        ? isoFromBackendDateTime(r.revisionDate)
        : undefined,
  };
}

export function normalizeMachine(raw: unknown): MachineResponse {
  const r = raw as BackendMachineResponse;
  const rawStatus = r.machineStatus ?? "OPERATIONAL";
  return {
    id: r.id,
    name: r.name ?? "",
    lastMaintenanceDate: backendDateString(r.lastMaintenanceDate) ?? "",
    maintenanceMonthlyPeriod: r.maintenanceMonthlyPeriod ?? 6,
    status: MACHINE_STATUS_MAP[rawStatus] ?? (rawStatus as MachineStatus),
  };
}

export function normalizeMaintenance(raw: unknown): MaintenanceResponse {
  const r = raw as BackendMaintenanceResponse;
  return {
    id: r.id,
    machineId: r.machineId,
    cost: num(r.cost),
    info: r.info ?? "",
    performedAt:
      isoFromBackendDateTime(r.creationDate) ?? new Date().toISOString(),
    performedBy: r.maintainerId ? `#${r.maintainerId}` : undefined,
  };
}

export function normalizeRepair(raw: unknown): RepairResponse {
  const r = raw as BackendRepairResponse;
  return {
    id: r.id,
    machineId: r.machineId,
    cost: num(r.cost),
    info: r.info ?? "",
    estimatedReturnDays: r.estimatedReturnDays ?? 0,
    isCompleted: r.isCompleted ?? false,
    startedAt:
      isoFromBackendDateTime(r.sentDate) ?? new Date().toISOString(),
    completedAt: isoFromBackendDateTime(r.completeDay),
  };
}

export function normalizeSubscription(raw: unknown): SubscriptionResponse {
  const r = raw as BackendSubscriptionResponse;
  const rawStatus = r.status ?? "NONE";
  return {
    customerId: r.customerId ?? 0,
    status:
      SUBSCRIPTION_STATUS_MAP[rawStatus] ?? (rawStatus as SubscriptionStatus),
    endDate: backendDateString(r.endDate ?? undefined),
  };
}

export function normalizePurchase(
  raw: unknown,
  customerId?: number,
): SubscriptionPurchaseResponse {
  const r = raw as BackendSubscriptionPurchaseResponse;
  const totalCost = num(r.totalCost ?? r.monthlyCost);
  const monthlyCost = num(r.monthlyCost ?? r.totalCost);
  // Best-effort: backend doesn't carry start/end dates on the purchase row,
  // we display creationDate as start and leave end blank — UI handles "—".
  const startDate = backendDateString(r.creationDate);
  return {
    id: r.id,
    customerId: customerId ?? 0,
    title: r.title ?? "",
    subscriptionDays: r.subscriptionDays ?? 30,
    subscriptionMonthPeriod: r.subscriptionMonthPeriod ?? 1,
    chargeRate:
      monthlyCost > 0 && totalCost > 0
        ? totalCost / (monthlyCost * (r.subscriptionMonthPeriod ?? 1))
        : 1,
    chargeCost: monthlyCost,
    isTimeLimited: r.isTimeLimited ?? false,
    startHour: r.startHour ?? undefined,
    endHour: r.endHour ?? undefined,
    startDate: startDate ?? "",
    endDate: "",
    isCompleted: r.isCompleted ?? false,
  };
}

export function normalizeStatistics(
  raw: unknown,
  start: string,
  end: string,
): StatisticsResponse {
  const r = raw as BackendStatisticsResponse;
  const totalRevenue = num(r.totalRevenue);
  const totalMaintenanceCost = num(r.maintenanceCosts);
  const totalRepairCost = num(r.repairCosts);
  return {
    startDate: r.startDate ?? start,
    endDate: r.endDate ?? end,
    totalRevenue,
    totalMaintenanceCost,
    totalRepairCost,
    netProfit: totalRevenue - totalMaintenanceCost - totalRepairCost,
    subscriptionsSold: 0, // backend doesn't report this — left at 0
    daily: undefined,
  };
}
