import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  Wrench,
  Banknote,
  ArrowUpRight,
  Activity,
  Dumbbell,
  ClipboardCheck,
  CreditCard,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/queries";
import { StatHero } from "@/components/ui/StatHero";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ProgressBar, ProgressRing } from "@/components/ui/ProgressRing";
import { LoadingState } from "@/components/ui/EmptyState";
import { formatTRY, relativeTimeFromIso, daysFromNow, todayBackend, toBackendDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import type { ActivityKind, MachineStatus } from "@/types/dto";

const ACTIVITY_ICONS: Record<ActivityKind, typeof Activity> = {
  subscription_purchased: CreditCard,
  customer_registered: UserPlus,
  report_uploaded: ClipboardCheck,
  report_verified: ClipboardCheck,
  report_expired: AlertCircle,
  maintenance_logged: Wrench,
  repair_started: Wrench,
  repair_completed: Wrench,
  user_login: Users,
};

const ACTIVITY_TONES: Record<ActivityKind, "lime" | "amber" | "scarlet" | "volt" | "mute"> = {
  subscription_purchased: "volt",
  customer_registered: "lime",
  report_uploaded: "mute",
  report_verified: "lime",
  report_expired: "scarlet",
  maintenance_logged: "mute",
  repair_started: "amber",
  repair_completed: "lime",
  user_login: "mute",
};

export default function DashboardPage() {
  const customers = useQuery({ queryKey: qk.customers(), queryFn: api.listCustomers });
  const machines = useQuery({ queryKey: qk.machines(), queryFn: api.listMachines });
  const expired = useQuery({
    queryKey: qk.healthReportsExpired(),
    queryFn: api.listExpiredHealthReports,
  });
  const repairs = useQuery({ queryKey: qk.allRepairs(), queryFn: api.listAllRepairs });
  const activity = useQuery({ queryKey: qk.activity(), queryFn: api.listActivity });

  // Statistics for last 7 days
  const today = new Date();
  const sevenAgo = new Date();
  sevenAgo.setDate(today.getDate() - 7);
  const stats = useQuery({
    queryKey: qk.statistics(toBackendDate(sevenAgo), todayBackend()),
    queryFn: () => api.getStatistics(toBackendDate(sevenAgo), todayBackend()),
  });

  const allCustomers = customers.data ?? [];
  const allMachines = machines.data ?? [];
  const activeMembers = allCustomers.filter((c) => c.status === "ACTIVE").length;
  const pendingMembers = allCustomers.filter((c) => c.status === "PENDING").length;
  const expiredCount = expired.data?.length ?? 0;
  const machinesNeedAttention = allMachines.filter(
    (m) => m.status === "MAINTENANCE_DUE" || m.status === "UNDER_REPAIR",
  ).length;
  const openRepairs = (repairs.data ?? []).filter((r) => !r.isCompleted);
  const newThisWeek = allCustomers.filter((c) => {
    const d = new Date(c.createdAt);
    return Date.now() - d.getTime() <= 7 * 86400_000;
  }).length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-6 mb-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-volt mb-2 flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 bg-volt animate-ping opacity-60" />
              <span className="relative h-1.5 w-1.5 bg-volt" />
            </span>
            // canlı pano
          </div>
          <h1 className="font-display text-display-2xl uppercase leading-[0.92] tracking-tight">
            Salonun
            <br />
            <span className="text-volt">nabzı</span>
          </h1>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
            Bu hafta yeni
          </div>
          <div className="font-display text-display-lg tabular text-bone">
            +{newThisWeek}
          </div>
        </div>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatHero
          label="Aktif Üye"
          value={activeMembers}
          delta={newThisWeek}
          deltaSuffix="bu hafta"
          icon={<Users className="h-4 w-4" />}
          tone="default"
          index={0}
        />
        <StatHero
          label="Bekleyen Onay"
          value={pendingMembers}
          hint="rapor bekleniyor"
          icon={<ClipboardCheck className="h-4 w-4" />}
          tone={pendingMembers > 0 ? "amber" : "default"}
          index={1}
        />
        <StatHero
          label="Süresi Dolan Rapor"
          value={expiredCount}
          hint="acil aksiyon"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={expiredCount > 0 ? "scarlet" : "default"}
          index={2}
        />
        <StatHero
          label="Haftalık Gelir"
          value={stats.data?.totalRevenue ?? 0}
          format={(n) => formatTRY(n)}
          icon={<Banknote className="h-4 w-4" />}
          tone="volt"
          index={3}
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Activity feed */}
        <Card flush>
          <CardHeader
            title="Canlı Aktivite"
            subtitle="// son işlemler"
            marker={<span className="h-2 w-2 bg-volt animate-pulse-soft" />}
            className="px-5 pt-5 mb-0 border-b-rule"
          />
          {activity.isLoading ? (
            <LoadingState label="aktivite yükleniyor" />
          ) : (activity.data ?? []).length === 0 ? (
            <div className="py-12 text-center font-mono text-xs uppercase tracking-widest text-mute">
              henüz aktivite yok
            </div>
          ) : (
            <ul className="divide-y divide-rule/60">
              {(activity.data ?? []).slice(0, 10).map((item, i) => {
                const Icon = ACTIVITY_ICONS[item.kind];
                const tone = ACTIVITY_TONES[item.kind];
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="px-5 py-3 flex items-start gap-3 hover:bg-steel/40 transition-colors"
                  >
                    <div
                      className={`mt-0.5 h-7 w-7 flex items-center justify-center shrink-0 ${
                        tone === "volt"
                          ? "bg-volt text-ink"
                          : tone === "lime"
                          ? "bg-lime-soft text-lime"
                          : tone === "amber"
                          ? "bg-amber-soft text-amber"
                          : tone === "scarlet"
                          ? "bg-scarlet-soft text-scarlet"
                          : "bg-steel text-mute"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-bone leading-snug">
                        {item.message}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mute">
                        {item.actor} <span className="text-rule">·</span>{" "}
                        {relativeTimeFromIso(item.at)}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-rule">
            <Link
              to="/customers"
              className="font-mono text-[10px] uppercase tracking-widest text-mute hover:text-volt transition-colors"
            >
              // tüm kayıtlar
            </Link>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Net profit ring */}
          <Card>
            <CardHeader
              title="7 Günlük Performans"
              subtitle={`${stats.data?.startDate ?? ""} → ${stats.data?.endDate ?? ""}`}
            />
            <div className="flex items-center gap-5">
              <ProgressRing
                value={Math.min(
                  1,
                  Math.max(0, (stats.data?.netProfit ?? 0) / Math.max(1, stats.data?.totalRevenue ?? 1)),
                )}
                size={88}
                thickness={6}
                tone={(stats.data?.netProfit ?? 0) > 0 ? "lime" : "scarlet"}
              />
              <div className="flex-1 min-w-0 space-y-2">
                <Row label="Gelir" value={formatTRY(stats.data?.totalRevenue ?? 0)} tone="default" />
                <Row label="Bakım" value={`-${formatTRY(stats.data?.totalMaintenanceCost ?? 0)}`} tone="amber" />
                <Row label="Onarım" value={`-${formatTRY(stats.data?.totalRepairCost ?? 0)}`} tone="scarlet" />
                <div className="pt-2 border-t border-rule">
                  <Row
                    label="Net"
                    value={formatTRY(stats.data?.netProfit ?? 0)}
                    tone={(stats.data?.netProfit ?? 0) > 0 ? "lime" : "scarlet"}
                    bold
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Equipment status */}
          <Card>
            <CardHeader
              title="Ekipman Durumu"
              subtitle={`${allMachines.length} makine · ${machinesNeedAttention} dikkat`}
              action={
                <Link
                  to="/machines"
                  className="font-mono text-[10px] uppercase tracking-widest text-mute hover:text-volt"
                >
                  detay →
                </Link>
              }
              marker={<Dumbbell className="h-4 w-4 text-volt" />}
            />
            <div className="space-y-2">
              {allMachines.slice(0, 5).map((m) => {
                const days = daysFromNow(m.lastMaintenanceDate);
                const total = m.maintenanceMonthlyPeriod * 30;
                const elapsed = days != null ? Math.max(0, total - Math.abs(days)) : 0;
                const pct = Math.max(0, Math.min(1, 1 - elapsed / total));
                return (
                  <Link
                    key={m.id}
                    to={`/machines/${m.id}`}
                    className="block group/item -mx-2 px-2 py-1.5 hover:bg-steel/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-sm text-bone truncate">{m.name}</span>
                      <MachineStatusPill status={m.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressBar
                        value={pct}
                        tone={
                          m.status === "UNDER_REPAIR"
                            ? "scarlet"
                            : m.status === "MAINTENANCE_DUE"
                            ? "amber"
                            : "lime"
                        }
                        height={3}
                        className="flex-1"
                      />
                      <span className="font-mono text-[10px] tabular text-mute shrink-0">
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Open repairs */}
          {openRepairs.length > 0 && (
            <Card>
              <CardHeader
                title="Açık Onarımlar"
                subtitle={`${openRepairs.length} aktif`}
                marker={<Wrench className="h-4 w-4 text-amber" />}
              />
              <ul className="space-y-2">
                {openRepairs.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 py-1.5 border-b border-rule/40 last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-bone truncate">
                        {r.machineName ?? `Makine #${r.machineId}`}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                        {r.estimatedReturnDays}g · {formatTRY(r.cost)}
                      </div>
                    </div>
                    <Badge tone="warn" dot>
                      Onarımda
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction
          to="/customers"
          label="Yeni Üye"
          subtitle="kayıt aç"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <QuickAction
          to="/health-reports"
          label="Rapor Kontrol"
          subtitle={`${expiredCount + pendingMembers} bekleyen`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          highlight={expiredCount + pendingMembers > 0}
        />
        <QuickAction
          to="/subscriptions"
          label="Abonelik Sat"
          subtitle="yeni satın alım"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <QuickAction
          to="/operations"
          label="Bakım Kaydı"
          subtitle={`${openRepairs.length} açık onarım`}
          icon={<Wrench className="h-5 w-5" />}
          highlight={openRepairs.length > 0}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone: "default" | "lime" | "amber" | "scarlet";
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between font-mono text-xs">
      <span className="uppercase tracking-widest text-mute">{label}</span>
      <span
        className={`tabular ${bold ? "font-display text-base" : "text-sm"} ${
          tone === "lime"
            ? "text-lime"
            : tone === "amber"
            ? "text-amber"
            : tone === "scarlet"
            ? "text-scarlet"
            : "text-bone"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MachineStatusPill({ status }: { status: MachineStatus }) {
  return <StatusBadge status={status} />;
}

function QuickAction({
  to,
  label,
  subtitle,
  icon,
  highlight,
}: {
  to: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group/qa relative bg-carbon shadow-edge hover:shadow-edge-volt p-4 transition-all flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`h-10 w-10 flex items-center justify-center shrink-0 ${
            highlight ? "bg-volt text-ink" : "bg-steel text-volt"
          } group-hover/qa:animate-voltage-flicker`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-display uppercase tracking-wide text-sm text-bone truncate">
            {label}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5 truncate">
            {subtitle}
          </div>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-mute group-hover/qa:text-volt transition-colors shrink-0" />
    </Link>
  );
}
