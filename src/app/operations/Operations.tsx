import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Banknote,
  ArrowUpRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, Th, Tr, Td, EmptyRow } from "@/components/ui/Table";
import { LoadingState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { StatHero } from "@/components/ui/StatHero";
import { useState } from "react";
import { formatTRY, relativeTimeFromIso } from "@/lib/format";

export default function OperationsPage() {
  const repairs = useQuery({
    queryKey: qk.allRepairs(),
    queryFn: api.listAllRepairs,
  });
  const maintenance = useQuery({
    queryKey: qk.allMaintenance(),
    queryFn: api.listAllMaintenance,
  });
  const machines = useQuery({
    queryKey: qk.machines(),
    queryFn: api.listMachines,
  });
  const [tab, setTab] = useState<"open" | "all" | "maintenance">("open");

  const machineMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of machines.data ?? []) m.set(x.id, x.name);
    return m;
  }, [machines.data]);

  const open = (repairs.data ?? []).filter((r) => !r.isCompleted);
  const all = (repairs.data ?? []).slice().reverse();
  const allMaint = (maintenance.data ?? []).slice().reverse();

  const totalRepairCost = (repairs.data ?? []).reduce((s, r) => s + r.cost, 0);
  const totalMaintCost = (maintenance.data ?? []).reduce((s, r) => s + r.cost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="// operasyon"
        title="Bakım & Onarım"
        subtitle="Salondaki tüm bakım ve onarım operasyonlarının merkezi takibi."
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatHero
          label="Açık Onarım"
          value={open.length}
          tone={open.length > 0 ? "scarlet" : "default"}
          icon={<AlertTriangle className="h-4 w-4" />}
          index={0}
        />
        <StatHero
          label="Toplam Onarım"
          value={(repairs.data ?? []).length}
          tone="default"
          icon={<Wrench className="h-4 w-4" />}
          hint="tüm zamanlar"
          index={1}
        />
        <StatHero
          label="Onarım Gideri"
          value={totalRepairCost}
          format={(n) => formatTRY(n)}
          tone="default"
          icon={<Banknote className="h-4 w-4" />}
          index={2}
        />
        <StatHero
          label="Bakım Gideri"
          value={totalMaintCost}
          format={(n) => formatTRY(n)}
          tone="default"
          icon={<Banknote className="h-4 w-4" />}
          index={3}
        />
      </div>

      <Card flush>
        <Tabs
          items={[
            { value: "open", label: "Açık Onarımlar", count: open.length },
            { value: "all", label: "Tüm Onarımlar", count: all.length },
            { value: "maintenance", label: "Bakım Geçmişi", count: allMaint.length },
          ]}
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
        />
        {repairs.isLoading || maintenance.isLoading ? (
          <LoadingState />
        ) : tab === "open" ? (
          <Table>
            <THead>
              <Th>Makine</Th>
              <Th>Açıklama</Th>
              <Th align="right">Maliyet</Th>
              <Th align="right">Tahmini</Th>
              <Th>Başlangıç</Th>
              <Th align="right" className="w-12"></Th>
            </THead>
            <TBody>
              {open.length === 0 ? (
                <EmptyRow cols={6}>açık onarım yok</EmptyRow>
              ) : (
                open.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <Link
                        to={`/machines/${r.machineId}`}
                        className="font-display uppercase tracking-wide text-sm text-bone hover:text-volt"
                      >
                        {r.machineName ?? machineMap.get(r.machineId) ?? `Makine #${r.machineId}`}
                      </Link>
                    </Td>
                    <Td>
                      <span className="text-sm text-bone/90 line-clamp-2">
                        {r.info}
                      </span>
                    </Td>
                    <Td align="right" mono>
                      {formatTRY(r.cost)}
                    </Td>
                    <Td align="right">
                      <Badge tone="warn">{r.estimatedReturnDays}g</Badge>
                    </Td>
                    <Td mono>{relativeTimeFromIso(r.startedAt)}</Td>
                    <Td align="right">
                      <Link
                        to={`/machines/${r.machineId}`}
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-volt hover:underline"
                      >
                        detay <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        ) : tab === "all" ? (
          <Table>
            <THead>
              <Th>Makine</Th>
              <Th>Açıklama</Th>
              <Th align="right">Maliyet</Th>
              <Th>Durum</Th>
              <Th>Tarih</Th>
            </THead>
            <TBody>
              {all.length === 0 ? (
                <EmptyRow cols={5}>onarım kaydı yok</EmptyRow>
              ) : (
                all.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <Link
                        to={`/machines/${r.machineId}`}
                        className="font-display uppercase tracking-wide text-sm text-bone hover:text-volt"
                      >
                        {r.machineName ?? machineMap.get(r.machineId) ?? `#${r.machineId}`}
                      </Link>
                    </Td>
                    <Td>
                      <span className="text-sm text-bone/90 line-clamp-1">{r.info}</span>
                    </Td>
                    <Td align="right" mono>
                      {formatTRY(r.cost)}
                    </Td>
                    <Td>
                      {r.isCompleted ? (
                        <Badge tone="active">
                          <CheckCircle2 className="h-3 w-3" />
                          Tamam
                        </Badge>
                      ) : (
                        <Badge tone="danger" dot>
                          Açık
                        </Badge>
                      )}
                    </Td>
                    <Td mono>{relativeTimeFromIso(r.startedAt)}</Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        ) : (
          <Table>
            <THead>
              <Th>Makine</Th>
              <Th>Yapılan İşlem</Th>
              <Th align="right">Maliyet</Th>
              <Th>Tarih</Th>
              <Th>Personel</Th>
            </THead>
            <TBody>
              {allMaint.length === 0 ? (
                <EmptyRow cols={5}>bakım kaydı yok</EmptyRow>
              ) : (
                allMaint.map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <Link
                        to={`/machines/${m.machineId}`}
                        className="font-display uppercase tracking-wide text-sm text-bone hover:text-volt"
                      >
                        {machineMap.get(m.machineId) ?? `#${m.machineId}`}
                      </Link>
                    </Td>
                    <Td>
                      <span className="text-sm text-bone/90 line-clamp-1">{m.info}</span>
                    </Td>
                    <Td align="right" mono>
                      {formatTRY(m.cost)}
                    </Td>
                    <Td mono>{relativeTimeFromIso(m.performedAt)}</Td>
                    <Td>
                      <span className="font-mono text-xs text-mute">
                        {m.performedBy ?? "—"}
                      </span>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Hızlı Aksiyon"
          subtitle="// makine seç, kayıt aç"
          marker={<Activity className="h-4 w-4 text-mute" />}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(machines.data ?? []).slice(0, 8).map((m) => (
            <Link
              key={m.id}
              to={`/machines/${m.id}`}
              className="bg-ink/40 shadow-edge hover:shadow-edge-volt p-3 text-sm text-bone hover:text-volt transition-all flex items-center justify-between"
            >
              <span className="truncate">{m.name}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-mute shrink-0" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
