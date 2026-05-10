import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User as UserIcon, Hash } from "lucide-react";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { RoleBadge } from "../ui/Badge";
import { cn } from "@/lib/cn";

const ROUTE_LABELS: Record<string, string> = {
  "": "Pano",
  customers: "Üyeler",
  "health-reports": "Sağlık Raporları",
  subscriptions: "Abonelikler",
  "charge-profiles": "Tarifeler",
  machines: "Makineler",
  operations: "Bakım & Onarım",
  statistics: "İstatistikler",
  staff: "Personel",
  new: "Yeni",
};

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  const labels = ["Pano", ...parts.map((p) => ROUTE_LABELS[p] ?? p)];

  return (
    <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
      {labels.map((l, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-rule">/</span>}
          <span
            className={cn(
              i === labels.length - 1 ? "text-bone" : "text-mute",
            )}
          >
            {l}
          </span>
        </span>
      ))}
    </nav>
  );
}

function Clock() {
  const now = useNow();
  const time = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-1.5 shadow-edge bg-carbon">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 bg-volt animate-ping opacity-75" />
        <span className="relative h-2 w-2 bg-volt" />
      </span>
      <span className="font-mono text-xs uppercase tracking-widest text-mute">
        {date}
      </span>
      <span className="text-rule">·</span>
      <span className="font-mono text-sm tabular text-bone">{time}</span>
    </div>
  );
}

function UserMenu() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onLogout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 pl-3 pr-2 py-1.5 shadow-edge hover:shadow-edge-volt transition-all"
      >
        <div className="h-7 w-7 bg-volt text-ink flex items-center justify-center font-display font-black text-sm">
          {user.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-display uppercase tracking-wide text-xs text-bone leading-none">
            {user.name} {user.surName}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-mute mt-1">
            #{user.id} · {roleLabel(user.userType)}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-mute transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-carbon shadow-edge z-40">
          <div className="p-4 border-b border-rule">
            <div className="font-display uppercase tracking-wide text-sm text-bone">
              {user.name} {user.surName}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-mute flex items-center gap-2">
              <Hash className="h-3 w-3" />
              {user.id}
            </div>
            <div className="mt-2">
              <RoleBadge role={user.userType} />
            </div>
          </div>
          <div className="p-1">
            <Link
              to="/staff"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-bone hover:bg-steel transition-colors"
            >
              <UserIcon className="h-4 w-4 text-mute" />
              Personel Yönetimi
            </Link>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-scarlet hover:bg-steel transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  return (
    <header className="h-16 shrink-0 px-6 border-b border-rule bg-ink/95 backdrop-blur sticky top-0 z-30 flex items-center justify-between gap-6">
      <Breadcrumbs />
      <div className="flex items-center gap-3">
        <Clock />
        <button
          className="relative h-9 w-9 flex items-center justify-center shadow-edge hover:shadow-edge-volt text-mute hover:text-volt transition-all"
          aria-label="Bildirimler"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-scarlet" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
