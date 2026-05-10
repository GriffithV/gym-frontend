import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardCheck, AlertCircle, FileText, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Table, THead, TBody, Th, Tr, Td, EmptyRow } from "@/components/ui/Table";
import { LoadingState } from "@/components/ui/EmptyState";
import { formatDateLong } from "@/lib/format";
import { StatHero } from "@/components/ui/StatHero";

export default function HealthReportsPage() {
  const expired = useQuery({
    queryKey: qk.healthReportsExpired(),
    queryFn: api.listExpiredHealthReports,
  });
  const customers = useQuery({
    queryKey: qk.customers(),
    queryFn: api.listCustomers,
  });

  const allCustomers = customers.data ?? [];
  const pending = allCustomers.filter((c) => c.status === "PENDING");
  const expiredList = expired.data ?? [];
  const verifiedCount = allCustomers.filter(
    (c) => c.status === "ACTIVE" && c.hasHealthReport,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// sağlık"
        title="Sağlık Raporları"
        subtitle="Süresi dolmuş ve onay bekleyen raporları takip et."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatHero
          label="Geçerli Rapor"
          value={verifiedCount}
          tone="default"
          hint="aktif üye sayısı"
          icon={<ClipboardCheck className="h-4 w-4" />}
          index={0}
        />
        <StatHero
          label="Onay Bekleyen"
          value={pending.length}
          tone={pending.length > 0 ? "amber" : "default"}
          hint="rapor incelemesi"
          icon={<FileText className="h-4 w-4" />}
          index={1}
        />
        <StatHero
          label="Süresi Dolan"
          value={expiredList.length}
          tone={expiredList.length > 0 ? "scarlet" : "default"}
          hint="acil aksiyon"
          icon={<AlertCircle className="h-4 w-4" />}
          index={2}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Expired */}
        <Card flush>
          <CardHeader
            title="Süresi Dolmuş Raporlar"
            subtitle={`${expiredList.length} kayıt · acil`}
            marker={<AlertCircle className="h-4 w-4 text-scarlet animate-pulse-soft" />}
            className="px-5 pt-5 mb-0 border-b-rule"
          />
          {expired.isLoading ? (
            <LoadingState />
          ) : (
            <Table>
              <THead>
                <Th>Üye</Th>
                <Th>Bitiş Tarihi</Th>
                <Th>Durum</Th>
                <Th align="right" className="w-12"></Th>
              </THead>
              <TBody>
                {expiredList.length === 0 ? (
                  <EmptyRow cols={4}>süresi dolmuş rapor yok</EmptyRow>
                ) : (
                  expiredList.map((r) => (
                    <Tr key={r.customerId}>
                      <Td>
                        <Link
                          to={`/customers/${r.customerId}`}
                          className="font-display uppercase tracking-wide text-sm text-bone hover:text-volt"
                        >
                          {r.customerName ?? `#${r.customerId}`}
                        </Link>
                      </Td>
                      <Td mono className="text-scarlet">
                        {r.endDate ?? "—"}
                      </Td>
                      <Td>
                        <StatusBadge status="EXPIRED" />
                      </Td>
                      <Td align="right">
                        <Link
                          to={`/customers/${r.customerId}`}
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-mute hover:text-volt"
                        >
                          aksiyon <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          )}
        </Card>

        {/* Pending verification */}
        <Card flush>
          <CardHeader
            title="Onay Bekleyenler"
            subtitle={`${pending.length} kayıt · inceleme bekliyor`}
            marker={<FileText className="h-4 w-4 text-amber animate-pulse-soft" />}
            className="px-5 pt-5 mb-0 border-b-rule"
          />
          {customers.isLoading ? (
            <LoadingState />
          ) : (
            <Table>
              <THead>
                <Th>Üye</Th>
                <Th>Kayıt</Th>
                <Th>Durum</Th>
                <Th align="right" className="w-12"></Th>
              </THead>
              <TBody>
                {pending.length === 0 ? (
                  <EmptyRow cols={4}>onay bekleyen rapor yok</EmptyRow>
                ) : (
                  pending.map((c) => (
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
                      <Td>
                        {c.hasHealthReport ? (
                          <Badge tone="warn" dot>
                            Yüklendi
                          </Badge>
                        ) : (
                          <Badge tone="muted">Eksik</Badge>
                        )}
                      </Td>
                      <Td align="right">
                        <Link
                          to={`/customers/${c.id}`}
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-mute hover:text-volt"
                        >
                          incele <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Süreç Hatırlatması"
          subtitle="// sağlık raporu lifecycle"
          marker={<ClipboardCheck className="h-4 w-4 text-mute" />}
        />
        <ol className="grid sm:grid-cols-3 gap-3">
          {[
            { n: 1, t: "Yükle", d: "Üye PDF rapor getirir, sisteme yüklenir." },
            { n: 2, t: "Onayla", d: "Personel raporu inceler, geçerlilik tarihi girer." },
            { n: 3, t: "Süreç", d: "Bitiş tarihinde otomatik EXPIRED işaretlenir." },
          ].map((s) => (
            <li key={s.n} className="flex gap-3 bg-ink/40 p-3 shadow-edge">
              <div className="font-display text-display-lg leading-none text-volt">
                0{s.n}
              </div>
              <div>
                <div className="font-display uppercase tracking-wide text-sm text-bone">
                  {s.t}
                </div>
                <p className="mt-1 text-xs text-mute">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
