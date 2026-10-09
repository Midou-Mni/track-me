import { useLocation, useNavigate } from "react-router-dom"
import {
  Sun,
  FolderOpen,
  PlusCircle,
  Calendar,
  BarChart3,
  Settings,
  Timer,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/constants"

const ICON_MAP: Record<string, LucideIcon> = {
  Sun,
  FolderOpen,
  Timer,
  PlusCircle,
  Calendar,
  BarChart3,
  Settings,
}

/** Mobile bottom tab bar */
export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      id="tab-bar"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.85)] backdrop-blur-xl md:hidden tab-bar-safe"
    >
      <div className="flex items-center justify-around px-1 pt-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)
          const isLog = item.id === "log"

          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium transition-all duration-200",
                isLog
                  ? "text-[hsl(var(--primary-foreground))]"
                  : isActive
                  ? "text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {/* Active indicator dot */}
              {isActive && !isLog && (
                <span className="absolute -top-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-[hsl(var(--primary))] animate-scale-in" />
              )}

              {isLog ? (
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] shadow-lg shadow-[hsl(var(--primary)/0.3)] transition-transform active:scale-95">
                  <Icon className="h-5 w-5" />
                </span>
              ) : (
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
              )}

              {!isLog && (
                <span className="leading-none">{item.label}</span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
