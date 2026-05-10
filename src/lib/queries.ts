// Centralized React Query keys for consistent cache invalidation.

export const qk = {
  customers: () => ["customers"] as const,
  customer: (id: number) => ["customer", id] as const,
  healthReport: (id: number) => ["healthReport", id] as const,
  healthReportsExpired: () => ["healthReports", "expired"] as const,
  chargeProfiles: () => ["chargeProfiles"] as const,
  chargeProfile: (id: number) => ["chargeProfile", id] as const,
  subscription: (customerId: number) => ["subscription", customerId] as const,
  purchases: (customerId: number) => ["purchases", customerId] as const,
  machines: () => ["machines"] as const,
  machine: (id: number) => ["machine", id] as const,
  maintenance: (machineId: number) => ["maintenance", machineId] as const,
  repairs: (machineId: number) => ["repairs", machineId] as const,
  allRepairs: () => ["repairs", "all"] as const,
  allMaintenance: () => ["maintenance", "all"] as const,
  staff: () => ["staff"] as const,
  activity: () => ["activity"] as const,
  statistics: (start: string, end: string) =>
    ["statistics", start, end] as const,
} as const;
