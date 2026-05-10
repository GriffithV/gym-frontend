// MSW handlers mirroring the real Spring Boot /api endpoints.
// Cookie auth is simulated: USER_SESSION cookie stores a mock token.

import { HttpResponse, http } from "msw";
import type {
  ApiError,
  ApiResponse,
  ChargeProfileCreateRequest,
  CustomerRegisterRequest,
  LoginRequest,
  MaintenanceCreateRequest,
  RepairCreateRequest,
  StatisticsResponse,
  SubscriptionPurchaseRequest,
  UserRegisterRequest,
  UserRole,
} from "@/types/dto";
import { db, logActivity } from "./seed";
import { parseBackendDate, toBackendDate } from "@/lib/format";
import { validateDate, validatePassword, validatePhone } from "@/lib/validate";

const BASE = "*/api";

function bad(message: string, details?: Record<string, string>, status = 400) {
  return HttpResponse.json<ApiError>({ message, details }, { status });
}

function getSessionUser(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const m = /USER_SESSION=([^;]+)/.exec(cookieHeader);
  if (!m) return null;
  const session = db.sessions.get(m[1]);
  if (!session || session.expiresAt < Date.now()) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

function requireRole(req: Request, roles: UserRole[]) {
  const user = getSessionUser(req);
  if (!user) return { error: bad("unauthenticated", undefined, 401) };
  if (!roles.includes(user.userType)) {
    return { error: bad("forbidden", undefined, 403) };
  }
  return { user };
}

function makeSession(userId: number) {
  const token = `mock-${crypto.randomUUID()}`;
  db.sessions.set(token, {
    userId,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
  return token;
}

function setSessionCookie(token: string) {
  return `USER_SESSION=${token}; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax`;
}

function clearSessionCookie() {
  return "USER_SESSION=; Path=/; Max-Age=0; SameSite=Lax";
}

export const handlers = [
  // ---------- Auth ----------
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const user = db.users.find(
      (u) =>
        u.id === Number(body.id) &&
        (u as { password?: string }).password === body.password,
    );
    if (!user) return bad("invalid_credentials", undefined, 401);
    const token = makeSession(user.id);
    logActivity({
      kind: "user_login",
      message: `${user.name} ${user.surName} giriş yaptı`,
      actor: `${user.name} ${user.surName}`,
    });
    return HttpResponse.json<ApiResponse>(
      { success: true, message: "login_success" },
      { headers: { "Set-Cookie": setSessionCookie(token) } },
    );
  }),

  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json<ApiResponse>(
      { success: true, message: "logout_success" },
      { headers: { "Set-Cookie": clearSessionCookie() } },
    ),
  ),

  // helper for FE to know who is logged in
  http.get(`${BASE}/auth/me`, ({ request }) => {
    const user = getSessionUser(request);
    if (!user) return bad("unauthenticated", undefined, 401);
    const { password, backupSecret, ...safe } = user as typeof user & {
      password: string;
      backupSecret: string;
    };
    void password;
    void backupSecret;
    return HttpResponse.json(safe);
  }),

  // ---------- Users ----------
  http.post(`${BASE}/user/register`, async ({ request }) => {
    const auth = requireRole(request, ["ADMIN"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as UserRegisterRequest;
    const v = validatePassword(body.password);
    if (!v.ok) return bad("invalid_password", { password: v.reason ?? "" });
    const u = {
      id: db.nextId.user++,
      name: body.name,
      surName: body.surName,
      userType: body.userType,
      createdAt: new Date().toISOString(),
      password: body.password,
      backupSecret: body.backupSecret,
    };
    db.users.push(u);
    return HttpResponse.json({ id: u.id });
  }),

  http.post(`${BASE}/user/password-reset`, ({ request }) => {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    const backupSecret = url.searchParams.get("backupSecret") ?? "";
    const newPassword = url.searchParams.get("newPassword") ?? "";
    const u = db.users.find((u) => u.id === id);
    if (!u || u.backupSecret !== backupSecret)
      return bad("invalid_credentials", undefined, 401);
    const v = validatePassword(newPassword);
    if (!v.ok) return bad("invalid_password", { newPassword: v.reason ?? "" });
    u.password = newPassword;
    return HttpResponse.json<ApiResponse>({ success: true, message: "password_reset" });
  }),

  http.get(`${BASE}/user/:id`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN"]);
    if ("error" in auth) return auth.error;
    const u = db.users.find((u) => u.id === Number(params.id));
    if (!u) return bad("user_not_found", undefined, 404);
    const { password, backupSecret, ...safe } = u;
    void password;
    void backupSecret;
    return HttpResponse.json(safe);
  }),

  http.get(`${BASE}/user`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(
      db.users.map(({ password, backupSecret, ...rest }) => {
        void password;
        void backupSecret;
        return rest;
      }),
    );
  }),

  // ---------- Customers ----------
  http.post(`${BASE}/customer/register`, async ({ request }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as CustomerRegisterRequest;
    const v = validatePhone(body.phoneNumber);
    if (!v.ok) return bad("invalid_phone", { phoneNumber: v.reason ?? "" });
    const c = {
      id: db.nextId.customer++,
      name: body.name,
      surName: body.surName,
      phoneNumber: body.phoneNumber,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
      hasHealthReport: false,
      hasActiveSubscription: false,
    };
    db.customers.push(c);
    db.subscriptions.set(c.id, { customerId: c.id, status: "NONE" });
    logActivity({
      kind: "customer_registered",
      message: `${c.name} ${c.surName} sisteme kaydedildi`,
      actor: `${auth.user.name} ${auth.user.surName}`,
    });
    return HttpResponse.json(c);
  }),

  http.put(`${BASE}/customer/:id`, async ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as CustomerRegisterRequest;
    const c = db.customers.find((c) => c.id === Number(params.id));
    if (!c) return bad("customer_not_found", undefined, 404);
    Object.assign(c, body);
    return HttpResponse.json(c);
  }),

  http.get(`${BASE}/customer/:id`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const c = db.customers.find((c) => c.id === Number(params.id));
    if (!c) return bad("customer_not_found", undefined, 404);
    return HttpResponse.json(c);
  }),

  http.get(`${BASE}/customer`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(db.customers);
  }),

  // ---- Health reports (must come BEFORE the catch-all customer/:id route) ----
  http.get(`${BASE}/customer/health_report`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const expired = Array.from(db.healthReports.values()).filter(
      (r) => r.status === "EXPIRED",
    );
    return HttpResponse.json(expired);
  }),

  http.post(`${BASE}/customer/:id/health_report`, async ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const id = Number(params.id);
    const fd = await request.formData();
    const file = fd.get("file") as File | null;
    if (!file) return bad("file_missing", { file: "PDF dosyası gerekli" });
    if (file.type && file.type !== "application/pdf") {
      return bad("invalid_file_type", { file: "Sadece PDF kabul edilir" });
    }
    const c = db.customers.find((c) => c.id === id);
    if (!c) return bad("customer_not_found", undefined, 404);
    db.healthReports.set(id, {
      customerId: id,
      customerName: `${c.name} ${c.surName}`,
      status: "UPLOADED",
      uploadedAt: new Date().toISOString(),
      fileName: file.name || `saglik_${id}.pdf`,
      fileBlob: file,
    });
    c.hasHealthReport = true;
    logActivity({
      kind: "report_uploaded",
      message: `${c.name} ${c.surName} — sağlık raporu yüklendi`,
      actor: `${auth.user.name} ${auth.user.surName}`,
    });
    return HttpResponse.json<ApiResponse>({ success: true, message: "uploaded" });
  }),

  http.get(`${BASE}/customer/:id/health_report/document`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const r = db.healthReports.get(Number(params.id));
    if (!r) return bad("report_not_found", undefined, 404);
    if (r.fileBlob) {
      return new HttpResponse(r.fileBlob, {
        headers: { "Content-Type": "application/pdf" },
      });
    }
    // synthesize a tiny PDF if no real one
    const pdf = new Blob(
      ["%PDF-1.4\n% mock report\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF"],
      { type: "application/pdf" },
    );
    return new HttpResponse(pdf, {
      headers: { "Content-Type": "application/pdf" },
    });
  }),

  http.get(`${BASE}/customer/:id/health_report`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const r = db.healthReports.get(Number(params.id));
    if (!r)
      return HttpResponse.json({
        customerId: Number(params.id),
        status: "MISSING",
      });
    const { fileBlob, ...rest } = r;
    void fileBlob;
    return HttpResponse.json(rest);
  }),

  http.put(`${BASE}/customer/:id/health_report/verify`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const url = new URL(request.url);
    const revisionDate = url.searchParams.get("revisionDate") ?? "";
    const v = validateDate(revisionDate);
    if (!v.ok) return bad("wrong_date_format", { revisionDate: v.reason ?? "" });
    const id = Number(params.id);
    const r = db.healthReports.get(id);
    if (!r) return bad("report_not_found", undefined, 404);
    r.status = "VERIFIED";
    r.verifiedAt = new Date().toISOString();
    r.endDate = revisionDate;
    const c = db.customers.find((c) => c.id === id);
    if (c) c.status = "ACTIVE";
    logActivity({
      kind: "report_verified",
      message: `${c?.name ?? ""} ${c?.surName ?? ""} — sağlık raporu onaylandı`,
      actor: `${auth.user.name} ${auth.user.surName}`,
    });
    return HttpResponse.json<ApiResponse>({ success: true, message: "verified" });
  }),

  // ---------- Charge profiles ----------
  http.post(`${BASE}/charge-profile/create`, async ({ request }) => {
    const auth = requireRole(request, ["ADMIN"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as ChargeProfileCreateRequest;
    const cp = { id: db.nextId.charge++, ...body };
    db.chargeProfiles.push(cp);
    return HttpResponse.json(cp);
  }),

  http.put(`${BASE}/charge-profile/:id`, async ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as ChargeProfileCreateRequest;
    const cp = db.chargeProfiles.find((p) => p.id === Number(params.id));
    if (!cp) return bad("profile_not_found", undefined, 404);
    Object.assign(cp, body);
    return HttpResponse.json(cp);
  }),

  http.delete(`${BASE}/charge-profile/:id`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const idx = db.chargeProfiles.findIndex((p) => p.id === Number(params.id));
    if (idx === -1) return bad("profile_not_found", undefined, 404);
    db.chargeProfiles.splice(idx, 1);
    return HttpResponse.json<ApiResponse>({ success: true, message: "deleted" });
  }),

  http.get(`${BASE}/charge-profile/charge-profile`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(db.chargeProfiles);
  }),

  http.get(`${BASE}/charge-profile/:id`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const cp = db.chargeProfiles.find((p) => p.id === Number(params.id));
    if (!cp) return bad("profile_not_found", undefined, 404);
    return HttpResponse.json(cp);
  }),

  // ---------- Subscriptions ----------
  http.post(`${BASE}/subscription/:customerId/initialize`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const customerId = Number(params.customerId);
    if (!db.subscriptions.has(customerId)) {
      db.subscriptions.set(customerId, { customerId, status: "NONE" });
    }
    return HttpResponse.json<ApiResponse>({ success: true, message: "initialized" });
  }),

  http.post(`${BASE}/subscription/:customerId/purchase/create`, async ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as SubscriptionPurchaseRequest;
    const customerId = Number(params.customerId);
    const c = db.customers.find((c) => c.id === customerId);
    if (!c) return bad("customer_not_found", undefined, 404);
    if (body.subscriptionDays < 8 || body.subscriptionDays > 30)
      return bad("invalid_days", { subscriptionDays: "8 ile 30 arasında olmalı" });
    if (body.subscriptionMonthPeriod < 1)
      return bad("invalid_month_period", { subscriptionMonthPeriod: "En az 1 olmalı" });
    if (body.isTimeLimited) {
      if (body.startHour == null || body.endHour == null)
        return bad("hours_required");
      if (body.startHour >= body.endHour)
        return bad("invalid_hours");
    }
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + body.subscriptionDays * body.subscriptionMonthPeriod);
    const purchase = {
      id: db.nextId.purchase++,
      customerId,
      title: body.title,
      subscriptionDays: body.subscriptionDays,
      subscriptionMonthPeriod: body.subscriptionMonthPeriod,
      chargeRate: body.chargeRate,
      chargeCost: body.chargeCost,
      isTimeLimited: body.isTimeLimited,
      startHour: body.startHour,
      endHour: body.endHour,
      startDate: toBackendDate(start),
      endDate: toBackendDate(end),
      isCompleted: false,
    };
    db.purchases.push(purchase);
    db.subscriptions.set(customerId, {
      customerId,
      status: "ACTIVE",
      currentPurchaseId: purchase.id,
      endDate: purchase.endDate,
      isTimeLimited: body.isTimeLimited,
      startHour: body.startHour,
      endHour: body.endHour,
    });
    c.status = "ACTIVE";
    c.hasActiveSubscription = true;
    logActivity({
      kind: "subscription_purchased",
      message: `${c.name} ${c.surName} — ${body.title} abonelik aldı`,
      actor: `${auth.user.name} ${auth.user.surName}`,
    });
    return HttpResponse.json(purchase);
  }),

  http.put(`${BASE}/subscription/:customerId`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const customerId = Number(params.customerId);
    const sub = db.subscriptions.get(customerId);
    if (!sub) return bad("subscription_not_found", undefined, 404);
    sub.status = "CANCELLED";
    const c = db.customers.find((c) => c.id === customerId);
    if (c) c.hasActiveSubscription = false;
    return HttpResponse.json<ApiResponse>({ success: true, message: "cancelled" });
  }),

  http.get(`${BASE}/subscription/:customerId/last`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const list = db.purchases.filter((p) => p.customerId === Number(params.customerId));
    const last = list[list.length - 1];
    if (!last) return bad("purchase_not_found", undefined, 404);
    return HttpResponse.json(last);
  }),

  http.get(`${BASE}/subscription/:customerId/all`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const list = db.purchases.filter((p) => p.customerId === Number(params.customerId));
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/subscription/:customerId`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "CLERK"]);
    if ("error" in auth) return auth.error;
    const sub = db.subscriptions.get(Number(params.customerId));
    if (!sub)
      return HttpResponse.json({ customerId: Number(params.customerId), status: "NONE" });
    return HttpResponse.json(sub);
  }),

  // ---------- Machines ----------
  http.post(`${BASE}/machine/create`, async ({ request }) => {
    const auth = requireRole(request, ["ADMIN"]);
    if ("error" in auth) return auth.error;
    const fd = await request.formData();
    const reqBlob = fd.get("request");
    const reqText = typeof reqBlob === "string" ? reqBlob : await (reqBlob as Blob).text();
    const body = JSON.parse(reqText) as {
      name: string;
      lastMaintenanceDate: string;
      maintenanceMonthlyPeriod: number;
    };
    const v = validateDate(body.lastMaintenanceDate);
    if (!v.ok) return bad("wrong_date_format", { lastMaintenanceDate: v.reason ?? "" });
    const file = fd.get("file") as File | null;
    const id = db.nextId.machine++;
    if (file) db.machineImages.set(id, file);
    const m = {
      id,
      name: body.name,
      lastMaintenanceDate: body.lastMaintenanceDate,
      maintenanceMonthlyPeriod: body.maintenanceMonthlyPeriod,
      status: "OPERATIONAL" as const,
    };
    db.machines.push(m);
    return HttpResponse.json(m);
  }),

  http.get(`${BASE}/machine/:id/image`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    const blob = db.machineImages.get(Number(params.id));
    if (!blob) return bad("image_not_found", undefined, 404);
    return new HttpResponse(blob, { headers: { "Content-Type": "image/jpeg" } });
  }),

  http.get(`${BASE}/machine/:id`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    const m = db.machines.find((m) => m.id === Number(params.id));
    if (!m) return bad("machine_not_found", undefined, 404);
    return HttpResponse.json(m);
  }),

  http.get(`${BASE}/machine`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(db.machines);
  }),

  // ---------- Maintenance ----------
  http.post(`${BASE}/machine/:machineId/maintenance`, async ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as MaintenanceCreateRequest;
    const m = db.machines.find((m) => m.id === Number(params.machineId));
    if (!m) return bad("machine_not_found", undefined, 404);
    const entry = {
      id: db.nextId.maintenance++,
      machineId: m.id,
      cost: body.cost,
      info: body.info,
      performedAt: new Date().toISOString(),
      performedBy: `${auth.user.name} ${auth.user.surName}`,
    };
    db.maintenance.push(entry);
    m.lastMaintenanceDate = toBackendDate(new Date());
    if (m.status === "MAINTENANCE_DUE") m.status = "OPERATIONAL";
    logActivity({
      kind: "maintenance_logged",
      message: `${m.name} — bakım kaydedildi (${body.cost.toLocaleString("tr-TR")} ₺)`,
      actor: `${auth.user.name} ${auth.user.surName}`,
    });
    return HttpResponse.json(entry);
  }),

  http.get(`${BASE}/machine/:machineId/maintenance/last`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    const list = db.maintenance.filter((m) => m.machineId === Number(params.machineId));
    if (list.length === 0) return bad("maintenance_not_found", undefined, 404);
    return HttpResponse.json(list[list.length - 1]);
  }),

  http.get(`${BASE}/machine/:machineId/maintenance/all`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(
      db.maintenance.filter((m) => m.machineId === Number(params.machineId)),
    );
  }),

  // ---------- Repairs ----------
  http.post(`${BASE}/machine/:machineId/repair`, async ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    const body = (await request.json()) as RepairCreateRequest;
    const m = db.machines.find((m) => m.id === Number(params.machineId));
    if (!m) return bad("machine_not_found", undefined, 404);
    const r = {
      id: db.nextId.repair++,
      machineId: m.id,
      machineName: m.name,
      cost: body.cost,
      info: body.info,
      estimatedReturnDays: body.estimatedReturnDays,
      isCompleted: body.isCompleted,
      startedAt: new Date().toISOString(),
      completedAt: body.isCompleted ? new Date().toISOString() : undefined,
    };
    db.repairs.push(r);
    if (!body.isCompleted) m.status = "UNDER_REPAIR";
    logActivity({
      kind: "repair_started",
      message: `${m.name} — onarıma alındı`,
      actor: `${auth.user.name} ${auth.user.surName}`,
    });
    return HttpResponse.json(r);
  }),

  http.put(`${BASE}/machine/:machineId/repair/complete`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    const machineId = Number(params.machineId);
    const open = db.repairs.filter((r) => r.machineId === machineId && !r.isCompleted);
    const last = open[open.length - 1];
    if (!last) return bad("no_open_repair", undefined, 404);
    last.isCompleted = true;
    last.completedAt = new Date().toISOString();
    const m = db.machines.find((m) => m.id === machineId);
    if (m) m.status = "OPERATIONAL";
    logActivity({
      kind: "repair_completed",
      message: `${m?.name ?? ""} — onarımı tamamlandı`,
      actor: `${auth.user.name} ${auth.user.surName}`,
    });
    return HttpResponse.json<ApiResponse>({ success: true, message: "completed" });
  }),

  http.get(`${BASE}/machine/:machineId/repair/last`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    const list = db.repairs.filter((r) => r.machineId === Number(params.machineId));
    if (list.length === 0) return bad("repair_not_found", undefined, 404);
    return HttpResponse.json(list[list.length - 1]);
  }),

  http.get(`${BASE}/machine/:machineId/repair/all`, ({ request, params }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(
      db.repairs.filter((r) => r.machineId === Number(params.machineId)),
    );
  }),

  // ---------- UI helpers ----------
  http.get(`${BASE}/repair/all`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(db.repairs);
  }),
  http.get(`${BASE}/maintenance/all`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN", "REPAIRMAN"]);
    if ("error" in auth) return auth.error;
    return HttpResponse.json(db.maintenance);
  }),
  http.get(`${BASE}/activity`, ({ request }) => {
    const user = getSessionUser(request);
    if (!user) return bad("unauthenticated", undefined, 401);
    return HttpResponse.json(db.activity.slice(0, 30));
  }),

  // ---------- Statistics ----------
  http.get(`${BASE}/statistics`, ({ request }) => {
    const auth = requireRole(request, ["ADMIN"]);
    if ("error" in auth) return auth.error;
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";
    const sd = parseBackendDate(startDate);
    const ed = parseBackendDate(endDate);
    if (!sd || !ed) return bad("wrong_date_format");
    if (sd > ed) return bad("invalid_range");

    const inRange = (iso: string) => {
      const d = new Date(iso);
      return d >= sd && d <= new Date(ed.getTime() + 86400000);
    };
    const inRangeBd = (bd: string) => {
      const d = parseBackendDate(bd);
      return d != null && d >= sd && d <= ed;
    };

    const purchases = db.purchases.filter((p) => inRangeBd(p.startDate));
    const totalRevenue = purchases.reduce((acc, p) => acc + p.chargeCost, 0);
    const maintCost = db.maintenance
      .filter((m) => inRange(m.performedAt))
      .reduce((acc, m) => acc + m.cost, 0);
    const repairCost = db.repairs
      .filter((r) => inRange(r.startedAt))
      .reduce((acc, r) => acc + r.cost, 0);

    // daily series
    const days: Record<string, { revenue: number; maintenance: number; repair: number }> = {};
    const cursor = new Date(sd);
    while (cursor <= ed) {
      days[toBackendDate(cursor)] = { revenue: 0, maintenance: 0, repair: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }
    for (const p of purchases) {
      const k = p.startDate;
      if (days[k]) days[k].revenue += p.chargeCost;
    }
    for (const m of db.maintenance.filter((m) => inRange(m.performedAt))) {
      const k = toBackendDate(new Date(m.performedAt));
      if (days[k]) days[k].maintenance += m.cost;
    }
    for (const r of db.repairs.filter((r) => inRange(r.startedAt))) {
      const k = toBackendDate(new Date(r.startedAt));
      if (days[k]) days[k].repair += r.cost;
    }

    const stats: StatisticsResponse = {
      startDate,
      endDate,
      totalRevenue,
      totalMaintenanceCost: maintCost,
      totalRepairCost: repairCost,
      netProfit: totalRevenue - maintCost - repairCost,
      subscriptionsSold: purchases.length,
      daily: Object.entries(days).map(([date, v]) => ({ date, ...v })),
    };
    return HttpResponse.json(stats);
  }),
];
