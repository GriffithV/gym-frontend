import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Dumbbell,
  History,
  Clock,
} from "lucide-react";
import { api, HttpError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { LoadingState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import {
  formatTRY,
  daysFromNow,
  relativeTimeFromIso,
  formatDateLong,
} from "@/lib/format";
import { validateRange } from "@/lib/validate";
import { toast } from "@/components/ui/Toast";

export default function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const machineId = Number(id);

  const machine = useQuery({
    queryKey: qk.machine(machineId),
    queryFn: () => api.getMachine(machineId),
    enabled: !!machineId,
  });
  const maintenance = useQuery({
    queryKey: qk.maintenance(machineId),
    queryFn: () => api.listMaintenances(machineId),
    enabled: !!machineId,
  });
  const repairs = useQuery({
    queryKey: qk.repairs(machineId),
    queryFn: () => api.listRepairs(machineId),
    enabled: !!machineId,
  });

  const [tab, setTab] = useState<"maintenance" | "repair">("maintenance");
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [repairOpen, setRepairOpen] = useState(false);

  if (machine.isLoading) return <LoadingState label="makine yükleniyor" />;
  if (!machine.data) {
    return <div className="text-center py-16 font-mono text-mute">bulunamadı</div>;
  }

  const m = machine.data;
  const days = daysFromNow(m.lastMaintenanceDate);
  const total = m.maintenanceMonthlyPeriod * 30;
  const elapsed = days != null ? Math.max(0, Math.abs(days)) : 0;
  const remaining = Math.max(0, total - elapsed);
  const pct = Math.max(0, Math.min(1, remaining / total));

  const totalMaintenanceCost = (maintenance.data ?? []).reduce(
    (s, x) => s + x.cost,
    0,
  );
  const totalRepairCost = (repairs.data ?? []).reduce((s, x) => s + x.cost, 0);
  const openRepair = (repairs.data ?? []).find((r) => !r.isCompleted);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/machines")}
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-mute hover:text-volt transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Makineler
      </button>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Hero */}
        <Card flush className="overflow-hidden">
          <div className="relative h-56 bg-steel">
            <div className="absolute inset-0 bg-grid-faint opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Dumbbell
                className="h-32 w-32 text-rule"
                strokeWidth={1.25}
              />
            </div>
            <div className="absolute top-4 left-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-volt">
                // makine · {String(m.id).padStart(3, "0")}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <StatusBadge status={m.status} />
            </div>
          </div>
          <div className="p-5">
            <h1 className="font-display text-display-xl uppercase tracking-tight text-bone leading-[0.95]">
              {m.name}
            </h1>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-mono text-xs text-mute">
                <Calendar className="h-3 w-3" />
                Son bakım · {m.lastMaintenanceDate}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-xs text-mute">
                <Clock className="h-3 w-3" />
                Periyot · {m.maintenanceMonthlyPeriod} ay
              </span>
            </div>
          </div>
        </Card>

        {/* Status panel */}
        <Card>
          <CardHeader
            title="Bakım Durumu"
            subtitle="// sonraki periyota kadar"
            marker={<Wrench className="h-4 w-4 text-volt" />}
          />
          <div className="flex items-center gap-5">
            <ProgressRing
              value={pct}
              size={104}
              thickness={6}
              tone={
                m.status === "UNDER_REPAIR"
                  ? "scarlet"
                  : m.status === "MAINTENANCE_DUE"
                  ? "amber"
                  : "lime"
              }
              label={`${Math.round(pct * 100)}%`}
            />
            <div className="flex-1 space-y-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
                  Kalan
                </div>
                <div className="font-display text-display-lg tabular text-bone leading-none">
                  {Math.ceil(remaining)}
                  <span className="font-mono text-sm text-mute ml-1">gün</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="volt"
                  size="sm"
                  onClick={() => setMaintenanceOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  Bakım Kaydı
                </Button>
                {!openRepair ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRepairOpen(true)}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Onarıma Al
                  </Button>
                ) : (
                  <CompleteRepairButton machineId={machineId} />
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-2 gap-3">
        <CostStat
          label="Toplam Bakım Maliyeti"
          value={totalMaintenanceCost}
          count={maintenance.data?.length ?? 0}
          tone="amber"
          icon={<Wrench className="h-4 w-4" />}
        />
        <CostStat
          label="Toplam Onarım Maliyeti"
          value={totalRepairCost}
          count={repairs.data?.length ?? 0}
          tone="scarlet"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* History tabs */}
      <Card flush>
        <Tabs
          items={[
            {
              value: "maintenance",
              label: "Bakım Geçmişi",
              count: maintenance.data?.length ?? 0,
            },
            {
              value: "repair",
              label: "Onarım Geçmişi",
              count: repairs.data?.length ?? 0,
            },
          ]}
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
        />
        <div className="px-5 py-4">
          {tab === "maintenance" ? (
            (maintenance.data ?? []).length === 0 ? (
              <div className="py-10 text-center font-mono text-xs uppercase tracking-widest text-mute">
                bakım kaydı yok
              </div>
            ) : (
              <ul className="divide-y divide-rule/60 -mx-5">
                {(maintenance.data ?? [])
                  .slice()
                  .reverse()
                  .map((rec) => (
                    <li
                      key={rec.id}
                      className="px-5 py-3 flex items-start gap-4 hover:bg-steel/30 transition-colors"
                    >
                      <div className="h-8 w-8 bg-amber-soft text-amber flex items-center justify-center shrink-0">
                        <Wrench className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-bone">{rec.info}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                          {rec.performedBy ?? "—"} ·{" "}
                          {relativeTimeFromIso(rec.performedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display tabular text-bone">
                          {formatTRY(rec.cost)}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )
          ) : (repairs.data ?? []).length === 0 ? (
            <div className="py-10 text-center font-mono text-xs uppercase tracking-widest text-mute">
              onarım kaydı yok
            </div>
          ) : (
            <ul className="divide-y divide-rule/60 -mx-5">
              {(repairs.data ?? [])
                .slice()
                .reverse()
                .map((r) => (
                  <li
                    key={r.id}
                    className="px-5 py-3 flex items-start gap-4 hover:bg-steel/30 transition-colors"
                  >
                    <div
                      className={`h-8 w-8 flex items-center justify-center shrink-0 ${
                        r.isCompleted
                          ? "bg-lime-soft text-lime"
                          : "bg-scarlet-soft text-scarlet"
                      }`}
                    >
                      {r.isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-bone">{r.info}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                        {relativeTimeFromIso(r.startedAt)} · tahmini{" "}
                        {r.estimatedReturnDays}g
                      </div>
                      {r.isCompleted && (
                        <div className="font-mono text-[10px] uppercase tracking-widest text-lime mt-0.5">
                          tamamlandı · {formatDateLong(
                            r.completedAt
                              ? r.completedAt.slice(0, 10)
                              : undefined,
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display tabular text-bone">
                        {formatTRY(r.cost)}
                      </div>
                      <div className="mt-1">
                        {r.isCompleted ? (
                          <Badge tone="active">Tamam</Badge>
                        ) : (
                          <Badge tone="danger" dot>
                            Açık
                          </Badge>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </Card>

      <MaintenanceModal
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        machineId={machineId}
      />
      <RepairModal
        open={repairOpen}
        onClose={() => setRepairOpen(false)}
        machineId={machineId}
      />
    </div>
  );
}

function CostStat({
  label,
  value,
  count,
  tone,
  icon,
}: {
  label: string;
  value: number;
  count: number;
  tone: "amber" | "scarlet";
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-carbon shadow-edge p-4 flex items-center gap-4">
      <div
        className={`h-10 w-10 flex items-center justify-center ${
          tone === "amber"
            ? "bg-amber-soft text-amber"
            : "bg-scarlet-soft text-scarlet"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-display-sm tabular text-bone">
            {formatTRY(value)}
          </span>
          <span className="font-mono text-[10px] tabular text-mute">
            {count} kayıt
          </span>
        </div>
      </div>
    </div>
  );
}

function CompleteRepairButton({ machineId }: { machineId: number }) {
  const qc = useQueryClient();
  const complete = useMutation({
    mutationFn: () => api.completeRepair(machineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.machine(machineId) });
      qc.invalidateQueries({ queryKey: qk.repairs(machineId) });
      qc.invalidateQueries({ queryKey: qk.machines() });
      qc.invalidateQueries({ queryKey: qk.activity() });
      toast({ tone: "success", title: "Onarım tamamlandı" });
    },
  });
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => complete.mutate()}
      loading={complete.isPending}
    >
      <CheckCircle2 className="h-3 w-3 text-lime" />
      Onarımı Bitir
    </Button>
  );
}

function MaintenanceModal({
  open,
  onClose,
  machineId,
}: {
  open: boolean;
  onClose: () => void;
  machineId: number;
}) {
  const qc = useQueryClient();
  const [cost, setCost] = useState("0");
  const [info, setInfo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: () =>
      api.createMaintenance(machineId, {
        cost: Number(cost),
        info: info.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.maintenance(machineId) });
      qc.invalidateQueries({ queryKey: qk.machine(machineId) });
      qc.invalidateQueries({ queryKey: qk.machines() });
      qc.invalidateQueries({ queryKey: qk.activity() });
      toast({ tone: "success", title: "Bakım kaydı eklendi" });
      setCost("0");
      setInfo("");
      onClose();
    },
    onError: (e) => {
      if (e instanceof HttpError) setErrors(e.payload.details ?? {});
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const c = validateRange(Number(cost), 0, 1_000_000);
    if (!c.ok) errs.cost = c.reason ?? "";
    if (!info.trim()) errs.info = "Açıklama gerekli";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    submit.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bakım Kaydı"
      subtitle="// rutin bakım"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="volt"
            loading={submit.isPending}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Maliyet"
          type="number"
          min={0}
          prefix="₺"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          error={errors.cost}
        />
        <Textarea
          label="Yapılan İşlem"
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          error={errors.info}
          placeholder="Yağlama, kayış kontrolü, vb."
        />
      </form>
    </Modal>
  );
}

function RepairModal({
  open,
  onClose,
  machineId,
}: {
  open: boolean;
  onClose: () => void;
  machineId: number;
}) {
  const qc = useQueryClient();
  const [cost, setCost] = useState("0");
  const [info, setInfo] = useState("");
  const [days, setDays] = useState("3");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: () =>
      api.createRepair(machineId, {
        cost: Number(cost),
        info: info.trim(),
        estimatedReturnDays: Number(days),
        isCompleted: false,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.repairs(machineId) });
      qc.invalidateQueries({ queryKey: qk.machine(machineId) });
      qc.invalidateQueries({ queryKey: qk.machines() });
      qc.invalidateQueries({ queryKey: qk.activity() });
      toast({ tone: "warn", title: "Makine onarıma alındı" });
      setCost("0");
      setInfo("");
      setDays("3");
      onClose();
    },
    onError: (e) => {
      if (e instanceof HttpError) setErrors(e.payload.details ?? {});
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const c = validateRange(Number(cost), 0, 1_000_000);
    if (!c.ok) errs.cost = c.reason ?? "";
    const d = validateRange(Number(days), 1, 365);
    if (!d.ok) errs.estimatedReturnDays = d.reason ?? "";
    if (!info.trim()) errs.info = "Açıklama gerekli";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    submit.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Onarım Talebi"
      subtitle="// makine arızası"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="volt"
            loading={submit.isPending}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Onarıma Al
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Textarea
          label="Arıza Açıklaması"
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          error={errors.info}
          placeholder="örn: Motor yanık kokusu yapıyor, çalışırken titriyor"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tahmini Maliyet"
            type="number"
            min={0}
            prefix="₺"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            error={errors.cost}
          />
          <Input
            label="Tahmini Süre"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            error={errors.estimatedReturnDays}
            suffix="gün"
          />
        </div>
        <div className="bg-scarlet-soft p-3 shadow-edge text-xs text-bone flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-scarlet shrink-0 mt-0.5" />
          <span>
            Makine "Onarımda" durumuna alınacak ve onarım tamamlanana kadar
            kullanım dışı görünecek.
          </span>
        </div>
      </form>
    </Modal>
  );
}
