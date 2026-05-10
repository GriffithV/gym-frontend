import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { api, HttpError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LoadingState, EmptyState } from "@/components/ui/EmptyState";
import { formatTRY } from "@/lib/format";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/store/auth";
import type { ChargeProfileResponse } from "@/types/dto";

export default function ChargeProfilesPage() {
  const profiles = useQuery({
    queryKey: qk.chargeProfiles(),
    queryFn: api.listChargeProfiles,
  });
  const [editing, setEditing] = useState<ChargeProfileResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const { hasRole } = useAuth();
  const canCreate = hasRole("ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// fiyatlandırma"
        title="Tarifeler"
        subtitle="Üyelik tarifelerini ve indirim çarpanlarını yönet."
        actions={
          canCreate && (
            <Button variant="volt" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Yeni Tarife
            </Button>
          )
        }
      />

      {profiles.isLoading ? (
        <LoadingState />
      ) : (profiles.data ?? []).length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt className="h-10 w-10" />}
            title="Tarife yok"
            description="Üyelik tarifelerini ekleyerek satışa hazır hale getir."
            action={
              canCreate && (
                <Button variant="volt" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  Yeni Tarife
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(profiles.data ?? []).map((p, i) => (
            <ProfileCard
              key={p.id}
              profile={p}
              index={i}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      )}

      <ProfileEditor
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        existing={editing ?? undefined}
      />
    </div>
  );
}

function ProfileCard({
  profile,
  index,
  onEdit,
}: {
  profile: ChargeProfileResponse;
  index: number;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canDelete = hasRole("ADMIN", "CLERK");

  const remove = useMutation({
    mutationFn: () => api.deleteChargeProfile(profile.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chargeProfiles() });
      toast({ tone: "success", title: "Tarife silindi" });
    },
  });

  const isDiscounted = profile.chargeRate < 1;
  const isPremium = profile.chargeRate > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04 }}
      className="relative bg-carbon shadow-edge p-5 group/profile hover:shadow-edge-volt transition-all"
    >
      {/* Top label */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-volt" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            // tarife · {String(profile.id).padStart(2, "0")}
          </span>
        </div>
        {isDiscounted && (
          <span className="font-mono text-[10px] tabular text-lime bg-lime-soft px-1.5 py-0.5">
            %{Math.round((1 - profile.chargeRate) * 100)} İndirim
          </span>
        )}
        {isPremium && (
          <span className="font-mono text-[10px] tabular text-volt bg-volt/10 px-1.5 py-0.5">
            +{Math.round((profile.chargeRate - 1) * 100)}%
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-display text-display-sm uppercase tracking-tight text-bone leading-tight">
        {profile.title}
      </h3>

      {/* Info */}
      <p className="mt-1 text-xs text-mute leading-snug min-h-[2.5rem]">
        {profile.info}
      </p>

      {/* Price block */}
      <div className="mt-5 pt-4 border-t border-rule">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-display-lg tabular text-volt leading-none">
            {formatTRY(profile.chargeCost)}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat label="Çarpan" value={profile.chargeRate.toFixed(2)} />
          <Stat
            label="Net Birim"
            value={formatTRY(profile.chargeCost / profile.chargeRate)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2 opacity-50 group-hover/profile:opacity-100 transition-opacity">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
          Düzenle
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Bu tarifeyi silmek istediğine emin misin?")) {
                remove.mutate();
              }
            }}
            loading={remove.isPending}
          >
            <Trash2 className="h-3 w-3 text-scarlet" />
            Sil
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
        {label}
      </div>
      <div className="font-mono text-xs tabular text-bone mt-0.5">{value}</div>
    </div>
  );
}

function ProfileEditor({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: ChargeProfileResponse;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [info, setInfo] = useState(existing?.info ?? "");
  const [rate, setRate] = useState(String(existing?.chargeRate ?? 1));
  const [cost, setCost] = useState(String(existing?.chargeCost ?? 1500));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // sync when existing changes
  if (open && existing && title === "" && info === "") {
    setTitle(existing.title);
    setInfo(existing.info);
    setRate(String(existing.chargeRate));
    setCost(String(existing.chargeCost));
  }

  const submit = useMutation({
    mutationFn: () => {
      const body = {
        title: title.trim(),
        info: info.trim(),
        chargeRate: Number(rate),
        chargeCost: Number(cost),
      };
      return existing
        ? api.updateChargeProfile(existing.id, body)
        : api.createChargeProfile(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chargeProfiles() });
      toast({
        tone: "success",
        title: existing ? "Tarife güncellendi" : "Tarife eklendi",
      });
      reset();
      onClose();
    },
    onError: (e) => {
      if (e instanceof HttpError) setErrors(e.payload.details ?? {});
    },
  });

  const reset = () => {
    setTitle("");
    setInfo("");
    setRate("1");
    setCost("1500");
    setErrors({});
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Gerekli";
    if (!info.trim()) errs.info = "Gerekli";
    if (Number.isNaN(Number(rate)) || Number(rate) <= 0) errs.chargeRate = "Pozitif sayı";
    if (Number.isNaN(Number(cost)) || Number(cost) < 0) errs.chargeCost = "Pozitif sayı";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    submit.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={existing ? "Tarifeyi Düzenle" : "Yeni Tarife"}
      subtitle="// fiyat ve çarpan"
      size="lg"
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
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          placeholder="örn: Aylık Standart"
        />
        <Textarea
          label="Açıklama"
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          error={errors.info}
          placeholder="Tarifenin kapsadığı hizmetleri kısaca yaz"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Çarpan (Rate)"
            type="number"
            step="0.05"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            error={errors.chargeRate}
            hint="1.0 = standart · 0.7 = %30 indirim"
          />
          <Input
            label="Ücret"
            type="number"
            step="50"
            prefix="₺"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            error={errors.chargeCost}
            hint="vergiler dahil"
          />
        </div>
        <div className="bg-ink/40 p-3 shadow-edge font-mono text-[11px] text-mute uppercase tracking-widest flex items-center justify-between">
          <span>// önizleme</span>
          <span className="text-volt tabular">
            {formatTRY(Number(cost) || 0)} × {Number(rate).toFixed(2)} ={" "}
            <span className="text-bone">
              {formatTRY((Number(cost) || 0) * Number(rate))}
            </span>
          </span>
        </div>
      </form>
    </Modal>
  );
}
