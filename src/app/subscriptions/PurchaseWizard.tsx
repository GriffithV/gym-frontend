import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  Check,
  Tag,
  Calendar,
  CreditCard,
} from "lucide-react";
import { api, HttpError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/EmptyState";
import { formatTRY, formatHourRange } from "@/lib/format";
import { toast } from "@/components/ui/Toast";
import type { ChargeProfileResponse } from "@/types/dto";
import { cn } from "@/lib/cn";

interface PurchaseWizardProps {
  open: boolean;
  onClose: () => void;
  customerId: number;
  customerName: string;
}

interface FormState {
  profile: ChargeProfileResponse | null;
  days: number;
  monthPeriod: number;
  isTimeLimited: boolean;
  startHour: number;
  endHour: number;
}

const STEPS = ["Tarife", "Plan", "Onay"] as const;

export function PurchaseWizard({
  open,
  onClose,
  customerId,
  customerName,
}: PurchaseWizardProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const profiles = useQuery({
    queryKey: qk.chargeProfiles(),
    queryFn: api.listChargeProfiles,
    enabled: open,
  });

  const [form, setForm] = useState<FormState>({
    profile: null,
    days: 30,
    monthPeriod: 1,
    isTimeLimited: false,
    startHour: 9,
    endHour: 15,
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(0);
      setForm({
        profile: null,
        days: 30,
        monthPeriod: 1,
        isTimeLimited: false,
        startHour: 9,
        endHour: 15,
      });
    }
  }, [open]);

  const purchase = useMutation({
    mutationFn: () => {
      if (!form.profile) throw new Error("no profile");
      return api.purchaseSubscription(customerId, {
        title: form.profile.title,
        subscriptionDays: form.days,
        subscriptionMonthPeriod: form.monthPeriod,
        chargeRate: form.profile.chargeRate,
        chargeCost: form.profile.chargeCost,
        isTimeLimited: form.isTimeLimited,
        startHour: form.isTimeLimited ? form.startHour : undefined,
        endHour: form.isTimeLimited ? form.endHour : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscription(customerId) });
      qc.invalidateQueries({ queryKey: qk.purchases(customerId) });
      qc.invalidateQueries({ queryKey: qk.customer(customerId) });
      qc.invalidateQueries({ queryKey: qk.customers() });
      qc.invalidateQueries({ queryKey: qk.activity() });
      toast({
        tone: "success",
        title: "Abonelik aktif",
        message: `${customerName} — ${form.profile?.title}`,
      });
      onClose();
    },
    onError: (e) => {
      if (e instanceof HttpError) {
        toast({ tone: "error", title: "Satın alım başarısız", message: e.message });
      }
    },
  });

  const totalCost = useMemo(() => {
    if (!form.profile) return 0;
    return form.profile.chargeCost * form.monthPeriod;
  }, [form.profile, form.monthPeriod]);

  const canNext = step === 0 ? !!form.profile : step === 1 ? form.days >= 8 && form.days <= 30 && form.monthPeriod >= 1 : true;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Abonelik Satışı"
      subtitle={`// ${customerName}`}
      size="xl"
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Geri
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              variant="volt"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              Devam
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="volt"
              loading={purchase.isPending}
              onClick={() => purchase.mutate()}
            >
              <Check className="h-3.5 w-3.5" />
              Satışı Tamamla
            </Button>
          )}
        </>
      }
    >
      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 flex-1">
            <span
              className={cn(
                "h-7 w-7 flex items-center justify-center font-display text-xs",
                i < step
                  ? "bg-lime text-ink"
                  : i === step
                  ? "bg-volt text-ink"
                  : "bg-steel text-mute shadow-edge",
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={cn(
                "font-display uppercase tracking-wide text-xs",
                i === step ? "text-volt" : i < step ? "text-bone" : "text-mute",
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "flex-1 h-px",
                  i < step ? "bg-lime" : "bg-rule",
                )}
              />
            )}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            {profiles.isLoading ? (
              <LoadingState />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {(profiles.data ?? []).map((p) => {
                  const selected = form.profile?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          profile: p,
                          isTimeLimited:
                            p.title.includes("Sabah") || p.title.includes("Gece"),
                          startHour: p.title.includes("Sabah") ? 6 : p.title.includes("Gece") ? 20 : 9,
                          endHour: p.title.includes("Sabah") ? 12 : p.title.includes("Gece") ? 23 : 15,
                        }));
                      }}
                      className={cn(
                        "relative text-left p-4 transition-all",
                        selected
                          ? "bg-volt/10 shadow-edge-volt"
                          : "bg-carbon shadow-edge hover:shadow-edge-volt",
                      )}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 h-5 w-5 bg-volt text-ink flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-3 w-3 text-volt" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-mute">
                          // tarife · {String(p.id).padStart(2, "0")}
                        </span>
                      </div>
                      <h4 className="font-display text-display-sm uppercase tracking-tight text-bone">
                        {p.title}
                      </h4>
                      <p className="mt-1 text-xs text-mute leading-snug">{p.info}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-base tabular text-volt">
                          {formatTRY(p.chargeCost)}
                        </span>
                        <span className="font-mono text-[10px] tabular text-mute">
                          ×{p.chargeRate.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Günlük Süre"
                type="number"
                min={8}
                max={30}
                value={form.days}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    days: Math.min(30, Math.max(8, Number(e.target.value))),
                  }))
                }
                hint="8-30 gün arası"
                suffix="gün"
              />
              <Select
                label="Aylık Periyot"
                value={form.monthPeriod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthPeriod: Number(e.target.value) }))
                }
                hint="kaç ay boyunca"
              >
                {[1, 2, 3, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} ay
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-carbon shadow-edge hover:shadow-edge-volt transition-all">
                <input
                  type="checkbox"
                  checked={form.isTimeLimited}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isTimeLimited: e.target.checked }))
                  }
                  className="mt-1 accent-volt"
                />
                <div className="flex-1">
                  <div className="font-display uppercase tracking-wide text-sm text-bone">
                    Saat Sınırlı
                  </div>
                  <p className="text-xs text-mute mt-0.5">
                    Üye sadece belirlenen saatler arasında giriş yapabilir
                    (örn: 09:00-15:00 sabah kuşu).
                  </p>
                </div>
                <Clock className="h-4 w-4 text-mute mt-1" />
              </label>
              {form.isTimeLimited && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-2 gap-3 mt-3"
                >
                  <Select
                    label="Başlangıç"
                    value={form.startHour}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startHour: Number(e.target.value),
                      }))
                    }
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Biti{ş}"
                    value={form.endHour}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        endHour: Number(e.target.value),
                      }))
                    }
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h} disabled={h <= form.startHour}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </Select>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && form.profile && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <div className="bg-volt/10 shadow-edge-volt p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-volt">
                    // satış özeti
                  </div>
                  <h3 className="mt-1 font-display text-display-lg uppercase tracking-tight text-bone">
                    {form.profile.title}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-display text-display-2xl tabular text-volt leading-none">
                    {formatTRY(totalCost)}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-1">
                    toplam
                  </div>
                </div>
              </div>
              <p className="text-sm text-mute">{form.profile.info}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <SummaryRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Günlük Süre"
                value={`${form.days} gün`}
              />
              <SummaryRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Aylık Periyot"
                value={`${form.monthPeriod} ay`}
              />
              <SummaryRow
                icon={<Tag className="h-3.5 w-3.5" />}
                label="Çarpan"
                value={`×${form.profile.chargeRate.toFixed(2)}`}
              />
              <SummaryRow
                icon={<CreditCard className="h-3.5 w-3.5" />}
                label="Aylık Ücret"
                value={formatTRY(form.profile.chargeCost)}
              />
              {form.isTimeLimited && (
                <SummaryRow
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Saat Aralığı"
                  value={formatHourRange(form.startHour, form.endHour)}
                  badge={<Badge tone="warn">Sınırlı</Badge>}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-carbon shadow-edge p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-mute">{icon}</span>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
            {label}
          </div>
          <div className="font-display uppercase tracking-wide text-sm text-bone tabular truncate">
            {value}
          </div>
        </div>
      </div>
      {badge}
    </div>
  );
}
