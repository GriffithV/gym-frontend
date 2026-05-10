import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Search,
  UserPlus,
  Hash,
  KeyRound,
  Calendar,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { api, HttpError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RoleBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/EmptyState";
import { StatHero } from "@/components/ui/StatHero";
import { passwordStrength, validateName, validatePassword } from "@/lib/validate";
import { toast } from "@/components/ui/Toast";
import { roleLabel } from "@/lib/format";
import type { UserRole } from "@/types/dto";
import { cn } from "@/lib/cn";

const ROLE_FILTERS: Array<{ key: "ALL" | UserRole; label: string }> = [
  { key: "ALL", label: "Tümü" },
  { key: "ADMIN", label: "Yönetici" },
  { key: "CLERK", label: "Resepsiyon" },
  { key: "REPAIRMAN", label: "Tekniker" },
];

export default function StaffPage() {
  const staff = useQuery({ queryKey: qk.staff(), queryFn: api.listUsers });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | UserRole>("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  const list = staff.data ?? [];
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return list
      .filter((u) => filter === "ALL" || u.userType === filter)
      .filter((u) =>
        s
          ? `${u.name} ${u.surName}`.toLowerCase().includes(s) ||
            String(u.id).includes(s)
          : true,
      );
  }, [list, search, filter]);

  const counts = useMemo(() => {
    const by: Record<string, number> = {};
    for (const u of list) by[u.userType] = (by[u.userType] ?? 0) + 1;
    return by;
  }, [list]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// personel"
        title="Personel Yönetimi"
        subtitle="Sistem operatörleri ve rol yetkileri."
        actions={
          <Button variant="volt" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Yeni Personel
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatHero
          label="Yönetici"
          value={counts.ADMIN ?? 0}
          tone="volt"
          icon={<Shield className="h-4 w-4" />}
          index={0}
        />
        <StatHero
          label="Resepsiyon"
          value={counts.CLERK ?? 0}
          tone="default"
          icon={<Users className="h-4 w-4" />}
          index={1}
        />
        <StatHero
          label="Tekniker"
          value={counts.REPAIRMAN ?? 0}
          tone="default"
          icon={<KeyRound className="h-4 w-4" />}
          index={2}
        />
      </div>

      <Card flush>
        <div className="p-4 border-b border-rule flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              prefix={<Search className="h-3.5 w-3.5" />}
              placeholder="İsim veya ID ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 h-8 font-display text-[11px] uppercase tracking-widest transition-all flex items-center gap-1.5",
                  filter === f.key
                    ? "bg-volt text-ink"
                    : "shadow-edge text-mute hover:text-bone",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {staff.isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Shield className="h-10 w-10" />}
            title="Personel yok"
            description="Yeni personel ekleyerek başla."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-rule">
            {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: i * 0.025 }}
                className="bg-carbon p-5 group/staff hover:bg-steel/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 bg-volt text-ink flex items-center justify-center font-display font-black text-lg">
                    {u.name.charAt(0)}
                    {u.surName.charAt(0)}
                  </div>
                  <RoleBadge role={u.userType} />
                </div>
                <h3 className="font-display uppercase tracking-tight text-bone text-base leading-tight">
                  {u.name} {u.surName}
                </h3>
                <div className="mt-2 space-y-1 font-mono text-[10px] uppercase tracking-widest text-mute">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    {String(u.id).padStart(4, "0")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("tr-TR")
                      : "—"}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-rule font-mono text-[10px] uppercase tracking-widest text-mute">
                  // {roleLabel(u.userType).toLowerCase()} · aktif
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <CreateStaffModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateStaffModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [userType, setUserType] = useState<UserRole>("CLERK");
  const [name, setName] = useState("");
  const [surName, setSurName] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const strength = passwordStrength(password);

  const reset = () => {
    setUserType("CLERK");
    setName("");
    setSurName("");
    setPassword("");
    setSecret("");
    setErrors({});
  };

  const create = useMutation({
    mutationFn: () =>
      api.registerUser({
        userType,
        name: name.trim(),
        surName: surName.trim(),
        password,
        backupSecret: secret.trim(),
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: qk.staff() });
      toast({
        tone: "success",
        title: "Personel eklendi",
        message: `Yeni ID: ${r.id}`,
      });
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
    const s = validateName(surName);
    if (!s.ok) errs.surName = s.reason ?? "";
    const p = validatePassword(password);
    if (!p.ok) errs.password = p.reason ?? "";
    if (!secret.trim()) errs.backupSecret = "Gizli kelime gerekli";
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
      title="Yeni Personel"
      subtitle="// rol ve yetki ata"
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
            Personel Oluştur
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Select
          label="Rol"
          value={userType}
          onChange={(e) => setUserType(e.target.value as UserRole)}
        >
          <option value="ADMIN">Yönetici (ADMIN) — tam yetki</option>
          <option value="CLERK">Resepsiyon (CLERK) — üye / abonelik</option>
          <option value="REPAIRMAN">Tekniker (REPAIRMAN) — bakım / onarım</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="İsim"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            label="Soyisim"
            value={surName}
            onChange={(e) => setSurName(e.target.value)}
            error={errors.surName}
          />
        </div>
        <div>
          <Input
            label="Şifre"
            type="password"
            prefix={<KeyRound className="h-3.5 w-3.5" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="8-31 krk · büyük + küçük + rakam + özel · boşluk yok"
          />
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-1 flex-1",
                  n <= strength.score
                    ? strength.score < 3
                      ? "bg-scarlet"
                      : strength.score < 5
                      ? "bg-amber"
                      : "bg-lime"
                    : "bg-steel",
                )}
              />
            ))}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-mute">
            {strength.label}
          </div>
        </div>
        <Input
          label="Gizli Kelime (Backup Secret)"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          error={errors.backupSecret}
          hint="Şifre sıfırlamada kullanılır · personele bildir"
        />
      </form>
    </Modal>
  );
}
