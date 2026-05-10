// Mirrors of the Spring Boot backend DTOs.
// Source of truth: gym-backend/frontend_endpoint_guide.md

export type UserRole = "ADMIN" | "CLERK" | "REPAIRMAN";

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  message: string;
  details?: Record<string, string>;
}

// ---------- Auth ----------
export interface LoginRequest {
  id: number;
  password: string;
}

// ---------- Users / Staff ----------
export interface UserRegisterRequest {
  userType: UserRole;
  password: string;
  name: string;
  surName: string;
  backupSecret: string;
}

export interface UserResponse {
  id: number;
  name: string;
  surName: string;
  userType: UserRole;
  createdAt?: string;
}

// ---------- Customers ----------
export type CustomerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED";

export interface CustomerRegisterRequest {
  name: string;
  surName: string;
  phoneNumber: string; // ^[0][0-9]{10}$
}

export interface CustomerResponse {
  id: number;
  name: string;
  surName: string;
  phoneNumber: string;
  status: CustomerStatus;
  createdAt: string;
  hasHealthReport?: boolean;
  hasActiveSubscription?: boolean;
}

// ---------- Health reports ----------
export type CustomerHealthReportStatus =
  | "UPLOADED"
  | "VERIFIED"
  | "EXPIRED"
  | "MISSING";

export interface CustomerHealthReportResponse {
  customerId: number;
  customerName?: string;
  status: CustomerHealthReportStatus;
  uploadedAt?: string;
  verifiedAt?: string;
  endDate?: string; // dd/MM/yyyy
  fileName?: string;
}

// ---------- Charge profiles ----------
export interface ChargeProfileCreateRequest {
  title: string;
  info: string;
  chargeRate: number;
  chargeCost: number;
}

export interface ChargeProfileResponse {
  id: number;
  title: string;
  info: string;
  chargeRate: number;
  chargeCost: number;
}

// ---------- Subscriptions ----------
export type SubscriptionStatus =
  | "NONE"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PENDING";

export interface SubscriptionResponse {
  customerId: number;
  status: SubscriptionStatus;
  currentPurchaseId?: number;
  endDate?: string; // dd/MM/yyyy
  isTimeLimited?: boolean;
  startHour?: number;
  endHour?: number;
}

export interface SubscriptionPurchaseRequest {
  title: string;
  subscriptionDays: number; // 8..30
  subscriptionMonthPeriod: number; // >= 1
  chargeRate: number;
  chargeCost: number;
  isTimeLimited: boolean;
  startHour?: number;
  endHour?: number;
}

export interface SubscriptionPurchaseResponse {
  id: number;
  customerId: number;
  title: string;
  subscriptionDays: number;
  subscriptionMonthPeriod: number;
  chargeRate: number;
  chargeCost: number;
  isTimeLimited: boolean;
  startHour?: number;
  endHour?: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

// ---------- Machines ----------
export type MachineStatus = "OPERATIONAL" | "MAINTENANCE_DUE" | "UNDER_REPAIR" | "RETIRED";

export interface MachineCreateRequest {
  name: string;
  lastMaintenanceDate: string; // dd/MM/yyyy
  maintenanceMonthlyPeriod: number;
}

export interface MachineResponse {
  id: number;
  name: string;
  lastMaintenanceDate: string;
  maintenanceMonthlyPeriod: number;
  status: MachineStatus;
  imageUrl?: string;
}

// ---------- Maintenance ----------
export interface MaintenanceCreateRequest {
  cost: number;
  info: string;
}

export interface MaintenanceResponse {
  id: number;
  machineId: number;
  cost: number;
  info: string;
  performedAt: string;
  performedBy?: string;
}

// ---------- Repairs ----------
export interface RepairCreateRequest {
  cost: number;
  info: string;
  estimatedReturnDays: number;
  isCompleted: boolean;
}

export interface RepairResponse {
  id: number;
  machineId: number;
  machineName?: string;
  cost: number;
  info: string;
  estimatedReturnDays: number;
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
}

// ---------- Statistics ----------
export interface StatisticsResponse {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalMaintenanceCost: number;
  totalRepairCost: number;
  netProfit: number;
  subscriptionsSold: number;
  daily?: Array<{
    date: string;
    revenue: number;
    maintenance: number;
    repair: number;
  }>;
}

// ---------- Activity feed (UI-side) ----------
export type ActivityKind =
  | "subscription_purchased"
  | "customer_registered"
  | "report_uploaded"
  | "report_verified"
  | "report_expired"
  | "maintenance_logged"
  | "repair_started"
  | "repair_completed"
  | "user_login";

export interface ActivityItem {
  id: number;
  kind: ActivityKind;
  message: string;
  actor: string;
  at: string;
}
