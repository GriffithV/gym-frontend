import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  History,
  XCircle,
  Pencil,
  Hash,
} from "lucide-react";
import { api, HttpError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  formatDateLong,
  formatPhone,
  formatTRY,
  daysFromNow,
  formatHourRange,
} from "@/lib/format";
import { validateDate, validateName, validatePhone } from "@/lib/validate";
import { toast } from "@/components/ui/Toast";
import { PurchaseWizard } from "../subscriptions/PurchaseWizard";
import { cn } from "@/lib/cn";

export default function CustomerDetailPage() {
  const { id: idStr } = useParams<{ id: string }>();
  const id = Number(idStr);
  const navigate = useNavigate();

  const customer = useQuery({
    queryKey: qk.customer(id),
    queryFn: () => api.getCustomer(id),
    enabled: !!id,
  });
  const subscription = useQuery({
    queryKey: qk.subscription(id),
    queryFn: () => api.getSubscription(id),
    enabled: !!id,
  });
  const purchases = useQuery({
    queryKey: qk.purchases(id),
    queryFn: () => api.listPurchases(id),
    enabled: !!id,
  });
  const report = useQuery({
    queryKey: qk.healthReport(id),
    queryFn: () => api.getHealthReport(id),
    enabled: !!id,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  if (customer.isLoading) return <LoadingState label="müşteri yükleniyor" />;
  if (!customer.data) {
    return (
      <div className="text-center py-16 font-mono text-mute">
        kayıt bulunamadı
      </div>
    );
  }

  const c = customer.data;
  const sub = subscription.data;
  const past = (purchases.data ?? []).filter((p) => p.isCompleted).reverse();

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/customers")}
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-mute hover:text-volt transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Üyeler
      </button>

      {/* Profile header */}
      <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-end">
        <div className="flex items-end gap-5">
          <div className="h-24 w-24 bg-volt text-ink flex items-center justify-center font-display text-display-2xl shrink-0">
            {c.name.charAt(0)}
            {c.surName.charAt(0)}
          </div>
          <div className="min-w-0 pb-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-volt mb-1">
              // üye {String(c.id).padStart(4, "0")}
            </div>
            <h1 className="font-display text-display-xl uppercase leading-[0.95] tracking-tight text-bone truncate">
              {c.name} {c.surName}
            </h1>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <StatusBadge status={c.status} />
              <span className="flex items-center gap-1.5 font-mono text-xs text-mute">
                <Phone className="h-3 w-3" />
                {formatPhone(c.phoneNumber)}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-xs text-mute">
                <Calendar className="h-3 w-3" />
                Üye {new Date(c.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Düzenle
          </Button>
          {sub?.status !== "ACTIVE" && (
            <Button variant="volt" onClick={() => setPurchaseOpen(true)}>
              <CreditCard className="h-3.5 w-3.5" />
              Abonelik Sat
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Health report state machine */}
        <Card>
          <CardHeader
            title="Sağlık Raporu"
            subtitle={`// pdf zorunlu · 6 ay geçerli`}
            marker={<FileText className="h-4 w-4 text-volt" />}
          />
          <HealthReportSection
            customerId={id}
            report={report.data}
            customerName={`${c.name} ${c.surName}`}
          />
        </Card>

        {/* Active subscription */}
        <Card>
          <CardHeader
            title="Aktif Abonelik"
            subtitle={
              sub?.status === "ACTIVE"
                ? `${daysFromNow(sub.endDate) ?? 0} gün kaldı`
                : "abonelik yok"
            }
            marker={<CreditCard className="h-4 w-4 text-volt" />}
          />
          <SubscriptionPanel
            customerId={id}
            onPurchase={() => setPurchaseOpen(true)}
          />
        </Card>
      </div>

      {/* Purchase history */}
      <Card flush>
        <CardHeader
          title="Geçmiş Satın Alımlar"
          subtitle={`${past.length} kayıt`}
          marker={<History className="h-4 w-4 text-mute" />}
          className="px-5 pt-5 mb-0 border-b-rule"
        />
        {past.length === 0 ? (
          <div className="py-10 text-center font-mono text-xs uppercase tracking-widest text-mute">
            geçmiş satın alım yok
          </div>
        ) : (
          <ul className="divide-y divide-rule/60">
            {past.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-steel flex items-center justify-center text-mute">
                    <CreditCard className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-display uppercase tracking-wide text-sm text-bone">
                      {p.title}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                      {p.startDate} → {p.endDate}
                      {p.isTimeLimited &&
                        ` · ${formatHourRange(p.startHour, p.endHour)}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display uppercase tracking-wide text-bone tabular">
                    {formatTRY(p.chargeCost)}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                    rate · {p.chargeRate.toFixed(2)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EditCustomerModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customerId={id}
      />
      <PurchaseWizard
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        customerId={id}
        customerName={`${c.name} ${c.surName}`}
      />
    </div>
  );
}

function HealthReportSection({
  customerId,
  report,
  customerName,
}: {
  customerId: number;
  report?: import("@/types/dto").CustomerHealthReportResponse;
  customerName: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const qc = useQueryClient();

  const upload = useMutation({
    mutationFn: (file: File) => api.uploadHealthReport(customerId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.healthReport(customerId) });
      qc.invalidateQueries({ queryKey: qk.customer(customerId) });
      qc.invalidateQueries({ queryKey: qk.customers() });
      qc.invalidateQueries({ queryKey: qk.activity() });
      toast({ tone: "success", title: "Rapor yüklendi", message: "Onay bekliyor" });
    },
    onError: (e) => {
      if (e instanceof HttpError) {
        toast({ tone: "error", title: "Yükleme hatası", message: e.payload.details?.file ?? e.message });
      }
    },
  });

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type && f.type !== "application/pdf") {
      toast({ tone: "error", title: "Geçersiz dosya", message: "Sadece PDF kabul edilir" });
      return;
    }
    upload.mutate(f);
  };

  const status = report?.status ?? "MISSING";
  const days = daysFromNow(report?.endDate);

  // State machine visualization
  const steps: Array<{
    key: string;
    label: string;
    state: "done" | "active" | "pending" | "error";
  }> = [
    {
      key: "upload",
      label: "Yüklendi",
      state: status === "MISSING" ? "active" : "done",
    },
    {
      key: "verify",
      label: "Onaylandı",
      state:
        status === "MISSING"
          ? "pending"
          : status === "UPLOADED"
          ? "active"
          : "done",
    },
    {
      key: "active",
      label: status === "EXPIRED" ? "Süresi Doldu" : "Geçerli",
      state:
        status === "VERIFIED"
          ? "done"
          : status === "EXPIRED"
          ? "error"
          : "pending",
    },
  ];

  return (
    <>
      {/* State steps */}
      <div className="grid grid-cols-3 gap-px bg-rule mb-5 shadow-edge">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "bg-carbon p-3 relative",
              s.state === "active" && "bg-steel",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-5 w-5 flex items-center justify-center font-display text-[10px]",
                  s.state === "done" && "bg-lime text-ink",
                  s.state === "active" && "bg-volt text-ink animate-pulse-soft",
                  s.state === "pending" && "bg-steel text-mute shadow-edge",
                  s.state === "error" && "bg-scarlet text-ink",
                )}
              >
                {s.state === "done" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : s.state === "error" ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "font-display text-[11px] uppercase tracking-wide",
                  s.state === "pending" ? "text-mute" : "text-bone",
                )}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action area */}
      {status === "MISSING" && (
        <div className="text-center py-6 px-4 bg-ink/40 shadow-edge">
          <FileText className="h-8 w-8 text-mute mx-auto mb-3" />
          <p className="text-sm text-bone">Sağlık raporu henüz yüklenmedi.</p>
          <p className="text-xs text-mute mt-1">
            Üye antrenmana başlayabilmesi için PDF rapor gerekli.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onPick}
          />
          <Button
            variant="volt"
            size="md"
            className="mt-4"
            onClick={() => fileRef.current?.click()}
            loading={upload.isPending}
          >
            <Upload className="h-3.5 w-3.5" />
            PDF Yükle
          </Button>
        </div>
      )}

      {status === "UPLOADED" && report && (
        <div className="bg-amber-soft p-4 shadow-edge flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-display uppercase tracking-wide text-sm text-bone">
              Onay bekliyor
            </div>
            <p className="text-xs text-mute mt-1">
              {report.fileName} · {new Date(report.uploadedAt!).toLocaleDateString("tr-TR")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={`/api/customer/${customerId}/health_report/document`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-volt hover:underline"
              >
                <FileText className="h-3 w-3" />
                Belgeyi Görüntüle
              </a>
              <Button variant="outline" size="sm" onClick={() => setVerifyOpen(true)}>
                Onayla
              </Button>
            </div>
          </div>
        </div>
      )}

      {status === "VERIFIED" && report && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-lime-soft p-3 shadow-edge">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
              Geçerlilik
            </div>
            <div className="font-display text-display-sm tabular text-lime mt-1">
              {days ?? 0} gün
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-1">
              biti{"ş "}
              {formatDateLong(report.endDate)}
            </div>
          </div>
          <div className="bg-carbon p-3 shadow-edge">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
              Onaylandı
            </div>
            <div className="font-display text-sm text-bone mt-1">
              {new Date(report.verifiedAt!).toLocaleDateString("tr-TR")}
            </div>
            <a
              href={`/api/customer/${customerId}/health_report/document`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-volt hover:underline"
            >
              <FileText className="h-3 w-3" />
              Belge
            </a>
          </div>
        </div>
      )}

      {status === "EXPIRED" && (
        <div className="bg-scarlet-soft p-4 shadow-edge flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-scarlet shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-display uppercase tracking-wide text-sm text-bone">
              Süresi Doldu
            </div>
            <p className="text-xs text-mute mt-1">
              Üye antrenmana devam edemez. Yeni rapor yüklenmeli.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onPick}
            />
            <Button
              variant="volt"
              size="sm"
              className="mt-3"
              onClick={() => fileRef.current?.click()}
              loading={upload.isPending}
            >
              <Upload className="h-3.5 w-3.5" />
              Yeni Rapor Yükle
            </Button>
          </div>
        </div>
      )}

      <VerifyReportModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        customerId={customerId}
        customerName={customerName}
      />
    </>
  );
}

function VerifyReportModal({
  open,
  onClose,
  customerId,
  customerName,
}: {
  open: boolean;
  onClose: () => void;
  customerId: number;
  customerName: string;
}) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });
  const [error, setError] = useState<string | undefined>();
  const qc = useQueryClient();

  const verify = useMutation({
    mutationFn: () => api.verifyHealthReport(customerId, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.healthReport(customerId) });
      qc.invalidateQueries({ queryKey: qk.customer(customerId) });
      qc.invalidateQueries({ queryKey: qk.customers() });
      qc.invalidateQueries({ queryKey: qk.healthReportsExpired() });
      qc.invalidateQueries({ queryKey: qk.activity() });
      toast({
        tone: "success",
        title: "Rapor onaylandı",
        message: `${customerName} aktif`,
      });
      onClose();
    },
    onError: (e) => {
      if (e instanceof HttpError) {
        setError(e.payload.details?.revisionDate ?? "Geçersiz tarih");
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateDate(date);
    if (!v.ok) return setError(v.reason);
    setError(undefined);
    verify.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Raporu Onayla"
      subtitle="// geçerlilik bitiş tarihi"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="volt"
            loading={verify.isPending}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Onayla
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <p className="text-sm text-mute mb-4">
          Doktor raporunu inceledikten sonra geçerlilik bitiş tarihini gir.
          Genelde rapor tarihi + 6 aydır.
        </p>
        <Input
          label="Geçerlilik Bitiş Tarihi"
          prefix={<Calendar className="h-3.5 w-3.5" />}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="gg/aa/yyyy"
          error={error}
          hint="format: gg/aa/yyyy · 19xx veya 20xx"
        />
      </form>
    </Modal>
  );
}

function SubscriptionPanel({
  customerId,
  onPurchase,
}: {
  customerId: number;
  onPurchase: () => void;
}) {
  const qc = useQueryClient();
  const sub = useQuery({
    queryKey: qk.subscription(customerId),
    queryFn: () => api.getSubscription(customerId),
  });
  const last = useQuery({
    queryKey: ["subscription", customerId, "last"],
    queryFn: () => api.getLastPurchase(customerId).catch(() => null),
  });

  const cancel = useMutation({
    mutationFn: () => api.cancelSubscription(customerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscription(customerId) });
      qc.invalidateQueries({ queryKey: qk.customer(customerId) });
      qc.invalidateQueries({ queryKey: qk.customers() });
      toast({ tone: "warn", title: "Abonelik iptal edildi" });
    },
  });

  const init = useMutation({
    mutationFn: () => api.initSubscription(customerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscription(customerId) });
      toast({ tone: "info", title: "Abonelik kaydı açıldı" });
    },
  });

  if (!sub.data || sub.data.status === "NONE") {
    return (
      <div className="text-center py-6 px-4 bg-ink/40 shadow-edge">
        <CreditCard className="h-8 w-8 text-mute mx-auto mb-3" />
        <p className="text-sm text-bone">Abonelik kaydı yok</p>
        <p className="text-xs text-mute mt-1">
          Üye için önce abonelik kaydı açılmalı.
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => init.mutate()} loading={init.isPending}>
            Kaydı Aç
          </Button>
          <Button variant="volt" size="sm" onClick={onPurchase}>
            Abonelik Sat
          </Button>
        </div>
      </div>
    );
  }

  if (sub.data.status === "ACTIVE" && last.data) {
    const days = daysFromNow(sub.data.endDate);
    return (
      <div className="space-y-4">
        <div className="bg-volt/10 shadow-edge-volt p-4">
          <div className="font-display uppercase tracking-wide text-bone text-base mb-1">
            {last.data.title}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-display-lg tabular text-volt">
                {days}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
                gün kaldı
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-display-sm tabular text-bone">
                {formatTRY(last.data.chargeCost)}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                ödeme
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
              Başlangıç
            </div>
            <div className="text-bone tabular mt-1">{last.data.startDate}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
              Biti{"ş"}
            </div>
            <div className="text-bone tabular mt-1">{last.data.endDate}</div>
          </div>
          {last.data.isTimeLimited && (
            <div className="col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
                Saat Aralığı
              </div>
              <div className="text-bone tabular mt-1">
                {formatHourRange(last.data.startHour, last.data.endHour)}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="danger"
          block
          size="sm"
          onClick={() => {
            if (confirm("Aboneliği iptal etmek istediğine emin misin?")) {
              cancel.mutate();
            }
          }}
          loading={cancel.isPending}
        >
          <XCircle className="h-3.5 w-3.5" />
          İptal Et
        </Button>
      </div>
    );
  }

  if (sub.data.status === "EXPIRED") {
    return (
      <div className="text-center py-6 px-4 bg-scarlet-soft shadow-edge">
        <p className="font-display uppercase text-bone">Süresi Doldu</p>
        <Button variant="volt" size="sm" className="mt-3" onClick={onPurchase}>
          Yenile
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-6 px-4 bg-carbon shadow-edge">
      <p className="text-sm text-mute">{sub.data.status}</p>
      <Button variant="volt" size="sm" className="mt-3" onClick={onPurchase}>
        Yeni Abonelik
      </Button>
    </div>
  );
}

function EditCustomerModal({
  open,
  onClose,
  customerId,
}: {
  open: boolean;
  onClose: () => void;
  customerId: number;
}) {
  const qc = useQueryClient();
  const customer = useQuery({
    queryKey: qk.customer(customerId),
    queryFn: () => api.getCustomer(customerId),
    enabled: open,
  });
  const [name, setName] = useState("");
  const [surName, setSurName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (open && customer.data && !name && !surName && !phone) {
    setName(customer.data.name);
    setSurName(customer.data.surName);
    setPhone(customer.data.phoneNumber);
  }

  const update = useMutation({
    mutationFn: () =>
      api.updateCustomer(customerId, {
        name: name.trim(),
        surName: surName.trim(),
        phoneNumber: phone,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.customer(customerId) });
      qc.invalidateQueries({ queryKey: qk.customers() });
      toast({ tone: "success", title: "Üye güncellendi" });
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
    const s = validateName(surName);
    if (!s.ok) errs.surName = s.reason ?? "";
    const p = validatePhone(phone);
    if (!p.ok) errs.phoneNumber = p.reason ?? "";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    update.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Üyeyi Düzenle"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="volt"
            loading={update.isPending}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="İsim" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input
            label="Soyisim"
            value={surName}
            onChange={(e) => setSurName(e.target.value)}
            error={errors.surName}
          />
        </div>
        <Input
          label="Telefon"
          prefix={<Phone className="h-3.5 w-3.5" />}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          error={errors.phoneNumber}
          maxLength={11}
        />
        <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
          <Hash className="h-3 w-3 inline mr-1" /> kayıt id ·{" "}
          {String(customerId).padStart(4, "0")}
        </div>
      </form>
    </Modal>
  );
}
