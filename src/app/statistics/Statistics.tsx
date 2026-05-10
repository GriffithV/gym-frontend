import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Banknote,
  Wrench,
  AlertTriangle,
  Calendar,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatHero } from "@/components/ui/StatHero";
import { LoadingState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatTRY, todayBackend, toBackendDate, parseBackendDate } from "@/lib/format";
import { validateDate } from "@/lib/validate";
import type { StatisticsResponse } from "@/types/dto";
import { cn } from "@/lib/cn";

const PRESETS = [
  { label: "7 gün", days: 7 },
  { label: "30 gün", days: 30 },
  { label: "90 gün", days: 90 },
  { label: "1 yıl", days: 365 },
];

export default function StatisticsPage() {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toBackendDate(d);
  });
  const [end, setEnd] = useState(todayBackend());
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});

  const stats = useQuery({
    queryKey: qk.statistics(start, end),
    queryFn: () => api.getStatistics(start, end),
  });

  const setPreset = (days: number) => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - days);
    setStart(toBackendDate(s));
    setEnd(toBackendDate(e));
    setErrors({});
  };

  const onApply = () => {
    const errs: typeof errors = {};
    const sv = validateDate(start);
    const ev = validateDate(end);
    if (!sv.ok) errs.start = sv.reason;
    if (!ev.ok) errs.end = ev.reason;
    setErrors(errs);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// analitik"
        title="İstatistikler"
        subtitle="Salonun finansal performansı ve operasyonel metrikler."
      />

      {/* Date range bar */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="flex gap-3 flex-1">
            <Input
              label="Başlangıç"
              prefix={<Calendar className="h-3.5 w-3.5" />}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              error={errors.start}
              hint="gg/aa/yyyy"
            />
            <Input
              label="Biti{ş}"
              prefix={<Calendar className="h-3.5 w-3.5" />}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              error={errors.end}
              hint="gg/aa/yyyy"
            />
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPreset(p.days)}
                className="h-10 px-3 shadow-edge hover:shadow-edge-volt text-mute hover:text-volt font-display uppercase tracking-widest text-[11px] transition-all"
              >
                {p.label}
              </button>
            ))}
            <Button variant="volt" onClick={onApply}>
              Uygula
            </Button>
          </div>
        </div>
      </Card>

      {stats.isLoading ? (
        <LoadingState label="istatistikler hazırlanıyor" />
      ) : !stats.data ? (
        <Card>
          <div className="py-10 text-center font-mono text-xs uppercase tracking-widest text-mute">
            tarih aralığı geçersiz
          </div>
        </Card>
      ) : (
        <StatisticsContent data={stats.data} />
      )}
    </div>
  );
}

function StatisticsContent({ data }: { data: StatisticsResponse }) {
  const profitMargin = data.totalRevenue > 0 ? data.netProfit / data.totalRevenue : 0;

  const chartData = useMemo(() => {
    return (data.daily ?? []).map((d) => {
      const parsed = parseBackendDate(d.date);
      return {
        ...d,
        short: parsed
          ? `${parsed.getDate()}/${parsed.getMonth() + 1}`
          : d.date,
        net: d.revenue - d.maintenance - d.repair,
      };
    });
  }, [data.daily]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatHero
          label="Brüt Gelir"
          value={data.totalRevenue}
          format={(n) => formatTRY(n)}
          tone="volt"
          icon={<Banknote className="h-4 w-4" />}
          index={0}
        />
        <StatHero
          label="Bakım Maliyeti"
          value={data.totalMaintenanceCost}
          format={(n) => formatTRY(n)}
          tone="amber"
          icon={<Wrench className="h-4 w-4" />}
          index={1}
        />
        <StatHero
          label="Onarım Maliyeti"
          value={data.totalRepairCost}
          format={(n) => formatTRY(n)}
          tone="scarlet"
          icon={<AlertTriangle className="h-4 w-4" />}
          index={2}
        />
        <StatHero
          label="Net Kar"
          value={data.netProfit}
          format={(n) => formatTRY(n)}
          tone={data.netProfit > 0 ? "default" : "scarlet"}
          icon={<TrendingUp className="h-4 w-4" />}
          delta={Math.round(profitMargin * 100)}
          deltaSuffix="% margin"
          index={3}
        />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Revenue area chart */}
        <Card flush>
          <CardHeader
            title="Gelir Akışı"
            subtitle={`${data.startDate} → ${data.endDate} · günlük`}
            marker={<TrendingUp className="h-4 w-4 text-volt" />}
            className="px-5 pt-5 mb-0 border-b-rule"
          />
          <div className="px-5 py-4">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E5FF00" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#E5FF00" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-cost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3D3D" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF3D3D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2A2F" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="short"
                  tick={{ fill: "#6E6E76", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "#2A2A2F" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6E6E76", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "#2A2A2F" }}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0A0A0B",
                    border: "1px solid #2A2A2F",
                    borderRadius: 0,
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                  labelStyle={{ color: "#E5FF00" }}
                  itemStyle={{ color: "#FAFAF7" }}
                  formatter={(v) => [formatTRY(Number(v)), ""]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#E5FF00"
                  strokeWidth={2}
                  fill="url(#grad-rev)"
                  name="Gelir"
                />
                <Area
                  type="monotone"
                  dataKey="maintenance"
                  stroke="#FFB020"
                  strokeWidth={1}
                  fill="transparent"
                  name="Bakım"
                />
                <Area
                  type="monotone"
                  dataKey="repair"
                  stroke="#FF3D3D"
                  strokeWidth={1}
                  fill="url(#grad-cost)"
                  name="Onarım"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution */}
        <Card>
          <CardHeader
            title="Dağılım"
            subtitle="// gelir vs gider"
            marker={<BarChart3 className="h-4 w-4 text-volt" />}
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { name: "Gelir", value: data.totalRevenue, color: "#E5FF00" },
                {
                  name: "Bakım",
                  value: data.totalMaintenanceCost,
                  color: "#FFB020",
                },
                {
                  name: "Onarım",
                  value: data.totalRepairCost,
                  color: "#FF3D3D",
                },
              ]}
              layout="vertical"
              margin={{ left: 10, right: 10 }}
            >
              <CartesianGrid stroke="#2A2A2F" horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fill: "#6E6E76", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={{ stroke: "#2A2A2F" }}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#FAFAF7", fontSize: 11, fontFamily: "Big Shoulders Display", letterSpacing: "0.1em" }}
                axisLine={{ stroke: "#2A2A2F" }}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: "#0A0A0B",
                  border: "1px solid #2A2A2F",
                  borderRadius: 0,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                }}
                cursor={{ fill: "#1F1F23" }}
                formatter={(v) => [formatTRY(Number(v)), ""]}
              />
              <Bar dataKey="value" radius={0}>
                {[
                  { fill: "#E5FF00" },
                  { fill: "#FFB020" },
                  { fill: "#FF3D3D" },
                ].map((c, i) => (
                  <rect key={i} fill={c.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-widest">
            <Legend2 color="#E5FF00" label="Gelir" />
            <Legend2 color="#FFB020" label="Bakım" />
            <Legend2 color="#FF3D3D" label="Onarım" />
          </div>
        </Card>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Satılan Abonelik"
          value={String(data.subscriptionsSold)}
          icon={<Users className="h-4 w-4" />}
        />
        <Kpi
          label="Kar Marjı"
          value={`${Math.round(profitMargin * 100)}%`}
          tone={profitMargin > 0.4 ? "lime" : profitMargin > 0 ? "default" : "scarlet"}
        />
        <Kpi
          label="Ort. Abonelik"
          value={
            data.subscriptionsSold > 0
              ? formatTRY(data.totalRevenue / data.subscriptionsSold)
              : "—"
          }
        />
        <Kpi
          label="Toplam Gider"
          value={formatTRY(data.totalMaintenanceCost + data.totalRepairCost)}
          tone="amber"
        />
      </div>
    </div>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-mute">
      <span className="h-2 w-2" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "default" | "lime" | "amber" | "scarlet";
  icon?: React.ReactNode;
}) {
  const c =
    tone === "lime"
      ? "text-lime"
      : tone === "amber"
      ? "text-amber"
      : tone === "scarlet"
      ? "text-scarlet"
      : "text-bone";
  return (
    <div className="bg-carbon shadow-edge p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-mute">
          {label}
        </span>
        {icon && <span className="text-mute">{icon}</span>}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-display-sm tabular tracking-tight",
          c,
        )}
      >
        {value}
      </div>
    </div>
  );
}
