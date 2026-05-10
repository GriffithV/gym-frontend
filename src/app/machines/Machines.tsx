import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Plus,
  Wrench,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Upload,
  X,
} from "lucide-react";
import { api, HttpError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatHero } from "@/components/ui/StatHero";
import { todayBackend, daysFromNow, parseBackendDate, toBackendDate } from "@/lib/format";
import { validateDate, validateRange, validateName } from "@/lib/validate";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/store/auth";
import type { MachineResponse } from "@/types/dto";
import { cn } from "@/lib/cn";

export default function MachinesPage() {
  const machines = useQuery({
    queryKey: qk.machines(),
    queryFn: api.listMachines,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const { hasRole } = useAuth();
  const canCreate = hasRole("ADMIN");

  const list = machines.data ?? [];
  const operational = list.filter((m) => m.status === "OPERATIONAL").length;
  const dueOrRepair = list.filter(
    (m) => m.status === "MAINTENANCE_DUE" || m.status === "UNDER_REPAIR",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// envanter"
        title="Makineler"
        subtitle="Salondaki ekipmanın bakım ve onarım durumu."
        actions={
          canCreate && (
            <Button variant="volt" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Yeni Makine
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatHero
          label="Toplam Ekipman"
          value={list.length}
          tone="default"
          icon={<Dumbbell className="h-4 w-4" />}
          index={0}
        />
        <StatHero
          label="Çalışıyor"
          value={operational}
          tone="default"
          icon={<Dumbbell className="h-4 w-4" />}
          hint="aktif kullanım"
          index={1}
        />
        <StatHero
          label="Dikkat"
          value={dueOrRepair}
          tone={dueOrRepair > 0 ? "amber" : "default"}
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="bakım veya onarım"
          index={2}
        />
      </div>

      {machines.isLoading ? (
        <LoadingState />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Dumbbell className="h-10 w-10" />}
            title="Makine yok"
            description="Salondaki ekipmanı sisteme ekleyerek bakım takibini başlat."
            action={
              canCreate && (
                <Button variant="volt" onClick={() => setCreateOpen(true)}>
                  Yeni Makine
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((m, i) => (
            <MachineCard key={m.id} machine={m} index={i} />
          ))}
        </div>
      )}

      <CreateMachineModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function MachineCard({
  machine,
  index,
}: {
  machine: MachineResponse;
  index: number;
}) {
  const days = daysFromNow(machine.lastMaintenanceDate);
  const total = machine.maintenanceMonthlyPeriod * 30;
  const elapsed = days != null ? Math.max(0, Math.abs(days)) : 0;
  const remaining = Math.max(0, total - elapsed);
  const pct = Math.max(0, Math.min(1, remaining / total));
  const tone =
    machine.status === "UNDER_REPAIR"
      ? "scarlet"
      : machine.status === "MAINTENANCE_DUE"
      ? "amber"
      : "lime";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04 }}
    >
      <Link
        to={`/machines/${machine.id}`}
        className="group/m block bg-carbon shadow-edge hover:shadow-edge-volt transition-all"
      >
        {/* Image area / placeholder */}
        <div className="relative h-32 bg-steel overflow-hidden">
          <div className="absolute inset-0 bg-grid-faint opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell className="h-14 w-14 text-rule group-hover/m:text-volt/60 transition-colors" strokeWidth={1.25} />
          </div>
          <div className="absolute top-2 right-2">
            <StatusBadge status={machine.status} />
          </div>
          <div className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-widest text-mute">
            // m{String(machine.id).padStart(2, "0")}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-display uppercase tracking-tight text-sm text-bone leading-tight truncate">
            {machine.name}
          </h3>

          <div className="mt-3 flex items-center gap-3">
            <ProgressRing
              value={pct}
              size={48}
              thickness={3}
              tone={tone}
              label={`${Math.round(pct * 100)}%`}
            />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
                Sonraki Bakım
              </div>
              <div className="font-display tabular text-bone text-base">
                {Math.ceil(remaining)}
                <span className="font-mono text-xs text-mute ml-1">gün</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                her {machine.maintenanceMonthlyPeriod} ay
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-rule flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
              <Calendar className="h-3 w-3 inline mr-1" />
              {machine.lastMaintenanceDate}
            </div>
            <ChevronRight className="h-4 w-4 text-mute group-hover/m:text-volt group-hover/m:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CreateMachineModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayBackend());
  const [period, setPeriod] = useState("6");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName("");
    setDate(todayBackend());
    setPeriod("6");
    setFile(null);
    setErrors({});
  };

  const create = useMutation({
    mutationFn: () =>
      api.createMachine(
        {
          name: name.trim(),
          lastMaintenanceDate: date,
          maintenanceMonthlyPeriod: Number(period),
        },
        file,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.machines() });
      toast({ tone: "success", title: "Makine eklendi" });
      reset();
      onClose();
    },
    onError: (e) => {
      if (e instanceof HttpError) setErrors(e.payload.details ?? {});
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const n = validateName(name);
    if (!n.ok) errs.name = n.reason ?? "";
    const d = validateDate(date);
    if (!d.ok) errs.lastMaintenanceDate = d.reason ?? "";
    const p = validateRange(Number(period), 1, 128);
    if (!p.ok) errs.maintenanceMonthlyPeriod = p.reason ?? "";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    create.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Yeni Makine"
      subtitle="// envantere ekle"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="volt"
            loading={create.isPending}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Makine Adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="örn: Koşu Bandı M-04"
          maxLength={200}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Son Bakım Tarihi"
            prefix={<Calendar className="h-3.5 w-3.5" />}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.lastMaintenanceDate}
            hint="gg/aa/yyyy"
          />
          <Input
            label="Bakım Periyodu"
            type="number"
            min={1}
            max={128}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            error={errors.maintenanceMonthlyPeriod}
            suffix="ay"
            hint="1-128 arası"
          />
        </div>

        <div>
          <div className="font-display text-[11px] tracking-[0.2em] uppercase text-mute mb-1.5">
            Görsel (opsiyonel)
          </div>
          {file ? (
            <div className="flex items-center justify-between gap-3 bg-carbon shadow-edge p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 bg-volt text-ink flex items-center justify-center font-display text-xs">
                  IMG
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs text-bone truncate">
                    {file.name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-mute hover:text-scarlet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="block bg-carbon shadow-edge hover:shadow-edge-volt p-6 text-center cursor-pointer transition-all">
              <Upload className="h-6 w-6 mx-auto mb-2 text-mute" />
              <div className="font-mono text-[11px] uppercase tracking-widest text-mute">
                Görsel Yükle (JPG/PNG)
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        <PreviewCard date={date} period={Number(period)} name={name} />
      </form>
    </Modal>
  );
}

function PreviewCard({
  date,
  period,
  name,
}: {
  date: string;
  period: number;
  name: string;
}) {
  const parsed = parseBackendDate(date);
  if (!parsed || !period) return null;
  const next = new Date(parsed);
  next.setMonth(next.getMonth() + period);
  return (
    <div className="bg-ink/40 shadow-edge p-3 flex items-center justify-between">
      <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
        // sonraki bakım
      </div>
      <div className="font-mono text-xs tabular text-volt">
        {name || "—"} → {toBackendDate(next)}
      </div>
    </div>
  );
}
