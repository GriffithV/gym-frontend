import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Phone,
  ChevronRight,
  Filter,
  Download,
} from "lucide-react";
import { api, HttpError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, EmptyRow } from "@/components/ui/Table";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { formatPhone } from "@/lib/format";
import { validateName, validatePhone } from "@/lib/validate";
import { toast } from "@/components/ui/Toast";
import type { CustomerStatus } from "@/types/dto";
import { cn } from "@/lib/cn";

const STATUS_FILTERS: { key: "ALL" | CustomerStatus; label: string }[] = [
  { key: "ALL", label: "Tümü" },
  { key: "ACTIVE", label: "Aktif" },
  { key: "PENDING", label: "Beklemede" },
  { key: "EXPIRED", label: "Süresi Dolmuş" },
  { key: "SUSPENDED", label: "Askıda" },
];

export default function CustomersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | CustomerStatus>("ALL");
  const [registerOpen, setRegisterOpen] = useState(false);

  const customers = useQuery({
    queryKey: qk.customers(),
    queryFn: api.listCustomers,
  });

  const list = customers.data ?? [];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return list
      .filter((c) => filter === "ALL" || c.status === filter)
      .filter((c) =>
        s
          ? `${c.name} ${c.surName}`.toLowerCase().includes(s) ||
            c.phoneNumber.includes(s) ||
            String(c.id).includes(s)
          : true,
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [list, search, filter]);

  const counts = useMemo(() => {
    const by: Record<string, number> = {};
    for (const c of list) by[c.status] = (by[c.status] ?? 0) + 1;
    return by;
  }, [list]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// üyeler"
        title="Üye Kayıtları"
        subtitle={`Sistemde toplam ${list.length} kayıt · son güncelleme az önce`}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => toast({ tone: "info", title: "Dışa aktarım", message: "CSV hazırlanıyor (demo)" })}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="volt" size="md" onClick={() => setRegisterOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Yeni Üye
            </Button>
          </>
        }
      />

      <Card flush className="overflow-hidden">
        <div className="p-4 border-b border-rule flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              prefix={<Search className="h-3.5 w-3.5" />}
              placeholder="İsim, telefon veya kayıt numarası ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suffix={search ? <span className="cursor-pointer" onClick={() => setSearch("")}>×</span> : undefined}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mute mr-2 hidden sm:inline">
              <Filter className="h-3 w-3 inline mr-1" />
              filtre
            </span>
            {STATUS_FILTERS.map((f) => (
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
                {f.key !== "ALL" && counts[f.key] != null && (
                  <span
                    className={cn(
                      "font-mono text-[9px] tabular px-1",
                      filter === f.key ? "bg-ink/30" : "bg-steel",
                    )}
                  >
                    {counts[f.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {customers.isLoading ? (
          <LoadingState label="üyeler yükleniyor" />
        ) : (
          <Table>
            <THead>
              <Th className="w-16">#</Th>
              <Th>Üye</Th>
              <Th>Telefon</Th>
              <Th>Durum</Th>
              <Th>Sağlık</Th>
              <Th>Abonelik</Th>
              <Th align="right" className="w-12"></Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <EmptyRow cols={7}>kayıt bulunamadı</EmptyRow>
              ) : (
                filtered.map((c) => (
                  <Tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                    <Td mono className="text-mute">
                      {String(c.id).padStart(4, "0")}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-steel flex items-center justify-center font-display text-bone shrink-0">
                          {c.name.charAt(0)}
                          {c.surName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-display uppercase tracking-wide text-sm text-bone truncate">
                            {c.name} {c.surName}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
                            #{c.id}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td mono>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-mute" />
                        {formatPhone(c.phoneNumber)}
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={c.status} />
                    </Td>
                    <Td>
                      {c.hasHealthReport ? (
                        <Badge tone="active">Mevcut</Badge>
                      ) : (
                        <Badge tone="muted">Yok</Badge>
                      )}
                    </Td>
                    <Td>
                      {c.hasActiveSubscription ? (
                        <Badge tone="active" dot>
                          Aktif
                        </Badge>
                      ) : (
                        <Badge tone="muted">Yok</Badge>
                      )}
                    </Td>
                    <Td align="right" className="text-mute">
                      <ChevronRight className="h-4 w-4 inline-block transition-transform group-hover/row:translate-x-1 group-hover/row:text-volt" />
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        )}
      </Card>

      <RegisterCustomerModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </div>
  );
}

function RegisterCustomerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [surName, setSurName] = useState("");
  const [phone, setPhone] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName("");
    setSurName("");
    setPhone("0");
    setErrors({});
  };

  const create = useMutation({
    mutationFn: () =>
      api.registerCustomer({
        name: name.trim(),
        surName: surName.trim(),
        phoneNumber: phone,
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: qk.customers() });
      qc.invalidateQueries({ queryKey: qk.activity() });
      toast({
        tone: "success",
        title: "Üye eklendi",
        message: `${c.name} ${c.surName} sisteme kaydedildi`,
      });
      onClose();
      reset();
      navigate(`/customers/${c.id}`);
    },
    onError: (e) => {
      if (e instanceof HttpError) {
        setErrors(e.payload.details ?? { phone: e.payload.message });
      }
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
    create.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni Üye Kaydı"
      subtitle="// telefon 11 haneli ve 0 ile başlamalı"
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
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="İsim"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoFocus
          />
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
          hint="11 haneli, 0 ile başlamalı"
          maxLength={11}
          inputMode="numeric"
        />
      </form>
    </Modal>
  );
}
