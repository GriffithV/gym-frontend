import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  Receipt,
  Dumbbell,
  Wrench,
  BarChart3,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from "lucide-react";
import { useUi } from "@/store/ui";
import { useAuth } from "@/store/auth";
import type { UserRole } from "@/types/dto";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  shortcut?: string;
}

const NAV: NavItem[] = [
  { to: "/", label: "Pano", icon: LayoutDashboard, roles: ["ADMIN", "CLERK", "REPAIRMAN"], shortcut: "1" },
  { to: "/customers", label: "Üyeler", icon: Users, roles: ["ADMIN", "CLERK"], shortcut: "2" },
  { to: "/health-reports", label: "Sağlık Raporları", icon: ClipboardCheck, roles: ["ADMIN", "CLERK"], shortcut: "3" },
  { to: "/subscriptions", label: "Abonelikler", icon: CreditCard, roles: ["ADMIN", "CLERK"], shortcut: "4" },
  { to: "/charge-profiles", label: "Tarifeler", icon: Receipt, roles: ["ADMIN", "CLERK"], shortcut: "5" },
  { to: "/machines", label: "Makineler", icon: Dumbbell, roles: ["ADMIN", "REPAIRMAN"], shortcut: "6" },
  { to: "/operations", label: "Bakım & Onarım", icon: Wrench, roles: ["ADMIN", "REPAIRMAN"], shortcut: "7" },
  { to: "/statistics", label: "İstatistikler", icon: BarChart3, roles: ["ADMIN"], shortcut: "8" },
  { to: "/staff", label: "Personel", icon: Shield, roles: ["ADMIN"], shortcut: "9" },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUi();
  const { user } = useAuth();
  const role = user?.userType;

  return (
    <aside
      className={cn(
        "relative shrink-0 bg-ink border-r border-rule flex flex-col transition-[width] duration-200 ease-out",
        sidebarCollapsed ? "w-[72px]" : "w-[232px]",
      )}
    >
      <div className="px-4 py-5 border-b border-rule flex items-center justify-between">
        <Logo collapsed={sidebarCollapsed} />
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV.filter((n) => !role || n.roles.includes(role)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group/nav relative flex items-center gap-3 px-3 py-2.5 transition-all",
                  "font-display text-[13px] uppercase tracking-wide",
                  isActive
                    ? "bg-volt text-ink"
                    : "text-mute hover:text-bone hover:bg-steel",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-[3px] bg-ink" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.shortcut && (
                        <kbd
                          className={cn(
                            "font-mono text-[10px] px-1 py-0.5 transition-opacity",
                            isActive ? "bg-ink/70 text-volt" : "bg-steel text-mute",
                          )}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-rule">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 text-mute hover:text-volt transition-colors font-mono text-[10px] uppercase tracking-widest"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span>Daralt</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
