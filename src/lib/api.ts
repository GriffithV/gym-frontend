// Thin fetch wrapper over the Spring Boot /api contract.
// In dev with VITE_USE_MOCK !== "false", MSW intercepts requests in-browser.
// In real-backend mode, requests pass through Vite's /api proxy to localhost:8080.

import type {
  ActivityItem,
  ApiError,
  ApiResponse,
  ChargeProfileCreateRequest,
  ChargeProfileResponse,
  CustomerHealthReportResponse,
  CustomerRegisterRequest,
  CustomerResponse,
  LoginRequest,
  MachineCreateRequest,
  MachineResponse,
  MaintenanceCreateRequest,
  MaintenanceResponse,
  RepairCreateRequest,
  RepairResponse,
  StatisticsResponse,
  SubscriptionPurchaseRequest,
  SubscriptionPurchaseResponse,
  SubscriptionResponse,
  UserRegisterRequest,
  UserResponse,
} from "@/types/dto";
import {
  normalizeCustomer,
  normalizeHealthReport,
  normalizeMachine,
  normalizeMaintenance,
  normalizePurchase,
  normalizeRepair,
  normalizeStatistics,
  normalizeSubscription,
  normalizeUser,
} from "./normalize";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

class HttpError extends Error {
  status: number;
  payload: ApiError;
  constructor(status: number, payload: ApiError) {
    super(payload.message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let payload: ApiError;
    try {
      payload = await res.json();
    } catch {
      payload = { message: `http_${res.status}` };
    }
    throw new HttpError(res.status, payload);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json")) return (await res.blob()) as unknown as T;
  return (await res.json()) as T;
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

// Real backend throws 404 when a list is empty (e.g. user_not_found,
// customer_not_found). For collection endpoints, treat 404 as []
// instead of bubbling up an error to the UI.
async function listOrEmpty<T>(p: Promise<T[]>): Promise<T[]> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return [];
    throw e;
  }
}

export { HttpError };

export const api = {
  // ----- Auth -----
  login: (body: LoginRequest) =>
    request<ApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => request<ApiResponse>("/auth/logout", { method: "POST" }),
  me: async (): Promise<UserResponse> =>
    normalizeUser(await request<unknown>("/auth/me")),

  // ----- Users / staff -----
  registerUser: (body: UserRegisterRequest) =>
    request<{ id: number }>("/user/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  passwordReset: (params: {
    id: number;
    backupSecret: string;
    newPassword: string;
  }) =>
    request<ApiResponse>(
      `/user/password-reset?id=${params.id}&backupSecret=${encodeURIComponent(
        params.backupSecret,
      )}&newPassword=${encodeURIComponent(params.newPassword)}`,
      { method: "POST" },
    ),
  getUser: async (id: number): Promise<UserResponse> =>
    normalizeUser(await request<unknown>(`/user/${id}`)),
  listUsers: async (): Promise<UserResponse[]> => {
    const list = await listOrEmpty(request<unknown[]>("/user"));
    return list.map(normalizeUser);
  },

  // ----- Customers -----
  registerCustomer: async (
    body: CustomerRegisterRequest,
  ): Promise<CustomerResponse> => {
    const r = await request<unknown>("/customer/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return normalizeCustomer(r);
  },
  updateCustomer: async (
    id: number,
    body: CustomerRegisterRequest,
  ): Promise<CustomerResponse> => {
    const r = await request<unknown>(`/customer/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return normalizeCustomer(r);
  },
  getCustomer: async (id: number): Promise<CustomerResponse> =>
    normalizeCustomer(await request<unknown>(`/customer/${id}`)),
  listCustomers: async (): Promise<CustomerResponse[]> => {
    const list = await listOrEmpty(request<unknown[]>("/customer"));
    return list.map(normalizeCustomer);
  },

  // ----- Health reports -----
  uploadHealthReport: async (id: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${BASE}/customer/${id}/health_report`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const payload = (await res
        .json()
        .catch(() => ({ message: "upload_failed" }))) as ApiError;
      throw new HttpError(res.status, payload);
    }
    return (await res.json()) as ApiResponse;
  },
  getHealthReport: async (
    id: number,
  ): Promise<CustomerHealthReportResponse> => {
    try {
      const r = await request<unknown>(`/customer/${id}/health_report`);
      return normalizeHealthReport(r, id);
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) {
        return { customerId: id, status: "MISSING" };
      }
      throw e;
    }
  },
  verifyHealthReport: (id: number, revisionDate: string) =>
    request<ApiResponse>(
      `/customer/${id}/health_report/verify?revisionDate=${encodeURIComponent(
        revisionDate,
      )}`,
      { method: "PUT" },
    ),
  listExpiredHealthReports: async (): Promise<CustomerHealthReportResponse[]> => {
    const list = await listOrEmpty(
      request<unknown[]>("/customer/health_report"),
    );
    return list.map((r) => normalizeHealthReport(r));
  },

  // ----- Charge profiles -----
  createChargeProfile: (body: ChargeProfileCreateRequest) =>
    request<ChargeProfileResponse>("/charge-profile/create", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateChargeProfile: (id: number, body: ChargeProfileCreateRequest) =>
    request<ChargeProfileResponse>(`/charge-profile/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteChargeProfile: (id: number) =>
    request<ApiResponse>(`/charge-profile/${id}`, { method: "DELETE" }),
  getChargeProfile: (id: number) =>
    request<ChargeProfileResponse>(`/charge-profile/${id}`),
  listChargeProfiles: (): Promise<ChargeProfileResponse[]> =>
    listOrEmpty(
      request<ChargeProfileResponse[]>("/charge-profile/charge-profile"),
    ),

  // ----- Subscriptions -----
  initSubscription: (customerId: number) =>
    request<ApiResponse>(`/subscription/${customerId}/initialize`, {
      method: "POST",
    }),
  purchaseSubscription: async (
    customerId: number,
    body: SubscriptionPurchaseRequest,
  ): Promise<SubscriptionPurchaseResponse> => {
    const r = await request<unknown>(
      `/subscription/${customerId}/purchase/create`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return normalizePurchase(r, customerId);
  },
  cancelSubscription: (customerId: number) =>
    request<ApiResponse>(`/subscription/${customerId}`, { method: "PUT" }),
  getSubscription: async (
    customerId: number,
  ): Promise<SubscriptionResponse> => {
    try {
      const r = await request<unknown>(`/subscription/${customerId}`);
      const normalized = normalizeSubscription(r);
      // Real backend may not return customerId — fill it in.
      if (!normalized.customerId) normalized.customerId = customerId;
      return normalized;
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) {
        return { customerId, status: "NONE" };
      }
      throw e;
    }
  },
  getLastPurchase: async (
    customerId: number,
  ): Promise<SubscriptionPurchaseResponse | null> => {
    try {
      const r = await request<unknown>(`/subscription/${customerId}/last`);
      return normalizePurchase(r, customerId);
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) return null;
      throw e;
    }
  },
  listPurchases: async (
    customerId: number,
  ): Promise<SubscriptionPurchaseResponse[]> => {
    const list = await safe(
      request<unknown[]>(`/subscription/${customerId}/all`),
      [] as unknown[],
    );
    return list.map((r) => normalizePurchase(r, customerId));
  },

  // ----- Machines -----
  createMachine: async (body: MachineCreateRequest, file: File | null) => {
    const fd = new FormData();
    fd.append(
      "request",
      new Blob([JSON.stringify(body)], { type: "application/json" }),
    );
    if (file) fd.append("file", file);
    const res = await fetch(`${BASE}/machine/create`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const payload = (await res
        .json()
        .catch(() => ({ message: "create_failed" }))) as ApiError;
      throw new HttpError(res.status, payload);
    }
    return normalizeMachine(await res.json());
  },
  getMachine: async (id: number): Promise<MachineResponse> =>
    normalizeMachine(await request<unknown>(`/machine/${id}`)),
  listMachines: async (): Promise<MachineResponse[]> => {
    const list = await listOrEmpty(request<unknown[]>("/machine"));
    return list.map(normalizeMachine);
  },
  machineImageUrl: (id: number) => `${BASE}/machine/${id}/image`,

  // ----- Maintenance -----
  createMaintenance: async (
    machineId: number,
    body: MaintenanceCreateRequest,
  ): Promise<MaintenanceResponse> =>
    normalizeMaintenance(
      await request<unknown>(`/machine/${machineId}/maintenance`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    ),
  getLastMaintenance: async (
    machineId: number,
  ): Promise<MaintenanceResponse | null> => {
    try {
      return normalizeMaintenance(
        await request<unknown>(`/machine/${machineId}/maintenance/last`),
      );
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) return null;
      throw e;
    }
  },
  listMaintenances: async (
    machineId: number,
  ): Promise<MaintenanceResponse[]> => {
    const list = await safe(
      request<unknown[]>(`/machine/${machineId}/maintenance/all`),
      [] as unknown[],
    );
    return list.map(normalizeMaintenance);
  },

  // ----- Repairs -----
  createRepair: async (
    machineId: number,
    body: RepairCreateRequest,
  ): Promise<RepairResponse> =>
    normalizeRepair(
      await request<unknown>(`/machine/${machineId}/repair`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    ),
  completeRepair: (machineId: number) =>
    request<ApiResponse>(`/machine/${machineId}/repair/complete`, {
      method: "PUT",
    }),
  getLastRepair: async (
    machineId: number,
  ): Promise<RepairResponse | null> => {
    try {
      return normalizeRepair(
        await request<unknown>(`/machine/${machineId}/repair/last`),
      );
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) return null;
      throw e;
    }
  },
  listRepairs: async (machineId: number): Promise<RepairResponse[]> => {
    const list = await safe(
      request<unknown[]>(`/machine/${machineId}/repair/all`),
      [] as unknown[],
    );
    return list.map(normalizeRepair);
  },

  // ----- UI aggregates (not in real backend) -----
  // The real Spring Boot backend doesn't expose global repair / maintenance /
  // activity feeds — these return empty arrays so the dashboard doesn't break.
  // The mock backend overrides them with full data when MSW is active.
  listAllRepairs: async (): Promise<RepairResponse[]> => {
    try {
      const list = await request<unknown[]>("/repair/all");
      return list.map(normalizeRepair);
    } catch {
      // Fall back: aggregate per-machine — read every machine's repairs.
      try {
        const machines = await request<unknown[]>("/machine");
        const all: RepairResponse[] = [];
        for (const raw of machines) {
          const m = normalizeMachine(raw);
          const list = await safe(
            request<unknown[]>(`/machine/${m.id}/repair/all`),
            [] as unknown[],
          );
          for (const r of list) {
            const rep = normalizeRepair(r);
            rep.machineName = m.name;
            all.push(rep);
          }
        }
        return all;
      } catch {
        return [];
      }
    }
  },
  listAllMaintenance: async (): Promise<MaintenanceResponse[]> => {
    try {
      const list = await request<unknown[]>("/maintenance/all");
      return list.map(normalizeMaintenance);
    } catch {
      try {
        const machines = await request<unknown[]>("/machine");
        const all: MaintenanceResponse[] = [];
        for (const raw of machines) {
          const m = normalizeMachine(raw);
          const list = await safe(
            request<unknown[]>(`/machine/${m.id}/maintenance/all`),
            [] as unknown[],
          );
          for (const r of list) all.push(normalizeMaintenance(r));
        }
        return all;
      } catch {
        return [];
      }
    }
  },
  listActivity: async (): Promise<ActivityItem[]> => {
    return safe(request<ActivityItem[]>("/activity"), []);
  },

  // ----- Statistics -----
  getStatistics: async (
    startDate: string,
    endDate: string,
  ): Promise<StatisticsResponse> => {
    const r = await request<unknown>(
      `/statistics?startDate=${encodeURIComponent(
        startDate,
      )}&endDate=${encodeURIComponent(endDate)}`,
    );
    return normalizeStatistics(r, startDate, endDate);
  },
};
