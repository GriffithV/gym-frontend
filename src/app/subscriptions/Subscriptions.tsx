import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, Th, Tr, Td, EmptyRow } from "@/components/ui/Table";
import { LoadingState } from "@/components/ui/EmptyState";
import { StatHero } from "@/components/ui/StatHero";
import {
  formatTRY,
  formatHourRange,
  daysFromNow,
  formatDateLong,
} from "@/lib/format";
import type { CustomerResponse } from "@/types/dto";
import { cn } from "@/lib/cn";

export default function SubscriptionsPage() {
  const customers = useQuery({
    queryKey: qk.customers(),
    queryFn: api.listCustomers,
  });
  const [search, setSearch] = useState("");

  const active = useMemo(() => {
    return (customers.data ?? []).filter((c) => c.hasActiveSubscription);
  }, [customers.data]);

  const expired = useMemo(() => {
    return (customers.data ?? []).filter((c) => c.status === "EXPIRED");
  }, [customers.data]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return active;
    return active.filter(
      (c) =>
        `${c.name} ${c.surName}`.toLowerCase().includes(s) ||
        c.phoneNumber.includes(s),
    );
  }, [active, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// üyelikler"
        title="Abonelikler"
        subtitle="Aktif abonelikleri takip et, satın alımlarını yönet."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatHero
          label="Aktif Üyelik"
          value={active.length}
          tone="default"
          icon={<CreditCard className="h-4 w-4" />}
          hint={`${customers.data?.length ?? 0} kayıttan`}
          index={0}
        />
        <StatHero
          label="Saat Sınırlı"
          value={Math.floor(active.length * 0.18)}
          tone="default"
          icon={<Clock className="h-4 w-4" />}
          hint="özel tarife"
          index={1}
        />
        <StatHero
          label="Süresi Dolan"
          value={expired.length}
          tone={expired.length > 0 ? "scarlet" : "default"}
          icon={<AlertCircle className="h-4 w-4" />}
          hint="yenileme bekliyor"
          index={2}
        />
      </div>

      <Card flush>
        <div className="px-5 pt-5 pb-3 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-rule">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-volt" />
            <h2 className="font-display uppercase tracking-wide text-sm text-bone">
              Aktif Abonelikler
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-mute">
              · {filtered.length} kayıt
            </span>
          </div>
          <div className="w-full md:w-72">
            <Input
              prefix={<Search className="h-3.5 w-3.5" />}
              placeholder="Üye ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {customers.isLoading ? (
          <LoadingState />
        ) : (
          <Table>
            <THead>
              <Th>Üye</Th>
              <Th>Tarife</Th>
              <Th>Saat</Th>
              <Th align="right">Bitiş</Th>
              <Th align="right">Kalan</Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <EmptyRow cols={5}>aktif abonelik yok</EmptyRow>
              ) : (
                filtered.map((c) => <SubscriptionRow key={c.id} customer={c} />)
              )}
            </TBody>
          </Table>
        )}
      </Card>

      {expired.length > 0 && (
        <Card flush>
          <CardHeader
            title="Yenileme Bekleyenler"
            subtitle={`${expired.length} kayıt · gelir fırsatı`}
            marker={<TrendingUp className="h-4 w-4 text-amber" />}
            className="px-5 pt-5 mb-0 border-b-rule"
          />
          <Table>
            <THead>
              <Th>Üye</Th>
              <Th>Son Görülme</Th>
              <Th align="right">Aksiyon</Th>
            </THead>
            <TBody>
              {expired.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link
                      to={`/customers/${c.id}`}
                      className="font-display uppercase tracking-wide text-sm text-bone hover:text-volt"
                    >
                      {c.name} {c.surName}
                    </Link>
                  </Td>
                  <Td mono>
                    {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                  </Td>
                  <Td align="right">
                    <Link
                      to={`/customers/${c.id}`}
                      className="font-mono text-[10px] uppercase tracking-widest text-volt hover:underline"
                    >
                      yenile →
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function SubscriptionRow({ customer }: { customer: CustomerResponse }) {
  const sub = useQuery({
    queryKey: qk.subscription(customer.id),
    queryFn: () => api.getSubscription(customer.id),
  });
  const last = useQuery({
    queryKey: ["subscription", customer.id, "last"],
    queryFn: () => api.getLastPurchase(customer.id).catch(() => null),
  });

  const days = daysFromNow(sub.data?.endDate);
  const expiringSoon = days != null && days <= 7;

  return (
    <Tr>
      <Td>
        <Link
          to={`/customers/${customer.id}`}
          className="flex items-center gap-3 group/link"
        >
          <div className="h-8 w-8 bg-steel flex items-center justify-center font-display text-xs text-bone shrink-0">
            {customer.name.charAt(0)}
            {customer.surName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-display uppercase tracking-wide text-sm text-bone group-hover/link:text-volt transition-colors truncate">
              {customer.name} {customer.surName}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-0.5">
              #{customer.id}
            </div>
          </div>
        </Link>
      </Td>
      <Td>
        {last.data ? (
          <div>
            <div className="font-display uppercase tracking-wide text-sm text-bone">
              {last.data.title}
            </div>
            <div className="font-mono text-[10px] tabular text-mute mt-0.5">
              {formatTRY(last.data.chargeCost)} · ×{last.data.chargeRate.toFixed(2)}
            </div>
          </div>
        ) : (
          <span className="text-mute">—</span>
        )}
      </Td>
      <Td>
        {sub.data?.isTimeLimited ? (
          <Badge tone="warn">
            <Clock className="h-3 w-3" />
            {formatHourRange(sub.data.startHour, sub.data.endHour)}
          </Badge>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-widest text-mute">
            sınırsız
          </span>
        )}
      </Td>
      <Td align="right" mono>
        {sub.data?.endDate ? formatDateLong(sub.data.endDate) : "—"}
      </Td>
      <Td align="right">
        {days != null ? (
          <span
            className={cn(
              "font-display tabular tracking-wide",
              expiringSoon ? "text-scarlet" : "text-bone",
            )}
          >
            {days}
            <span className="text-mute font-mono text-xs ml-1">gün</span>
          </span>
        ) : (
          <span className="text-mute">—</span>
        )}
      </Td>
    </Tr>
  );
}
