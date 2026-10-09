import { useLocation, useNavigate } from "react-router-dom"
import {
  Sun,
  FolderOpen,
  PlusCircle,
  Calendar,
  BarChart3,
  Settings,
  Timer,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Monitor,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, APP_NAME } from "@/lib/constants"
import { useUIStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ICON_MAP: Record<string, LucideIcon> = {
  Sun,
  FolderOpen,
  Timer,
  PlusCircle,
  Calendar,
  BarChart3,
  Settings,
}

/** Desktop left sidebar */
export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useUIStore()

  const ThemeIcon =
    theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  const nextTheme = () => {
    const cycle: Array<"system" | "light" | "dark"> = [
      "system",
      "light",
      "dark",
    ]
    const current = cycle.indexOf(theme)
    setTheme(cycle[(current + 1) % cycle.length])
  }

  return (
    <aside
      id="sidebar"
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] transition-all duration-300 md:flex",
        sidebarCollapsed ? "w-18" : "w-60"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))] shadow-md">
          T
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight text-[hsl(var(--sidebar-foreground))] animate-fade-in">
            {APP_NAME}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)
          const isLog = item.id === "log"

          const button = (
            <button
              key={item.id}
              id={`sidebar-${item.id}`}
              onClick={() => navigate(item.path)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isLog
                  ? "mt-2 bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-md hover:shadow-lg hover:brightness-110"
                  : isActive
                  ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                  : "text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              {/* Active indicator bar */}
              {isActive && !isLog && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[hsl(var(--sidebar-primary))] animate-scale-in" />
              )}

              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  isActive && !isLog && "scale-110",
                  isLog && "h-5 w-5"
                )}
              />

              {!sidebarCollapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </button>
          )

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return button
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        {/* Theme toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              id="theme-toggle"
              variant="ghost"
              size={sidebarCollapsed ? "icon" : "default"}
              onClick={nextTheme}
              className={cn(
                "w-full text-[hsl(var(--sidebar-foreground)/0.7)] hover:text-[hsl(var(--sidebar-foreground))]",
                !sidebarCollapsed && "justify-start gap-3"
              )}
            >
              <ThemeIcon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <span className="animate-fade-in capitalize">{theme}</span>
              )}
            </Button>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right" sideOffset={10}>
              Theme: {theme}
            </TooltipContent>
          )}
        </Tooltip>

        {/* Collapse toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              id="sidebar-toggle"
              variant="ghost"
              size={sidebarCollapsed ? "icon" : "default"}
              onClick={toggleSidebar}
              className={cn(
                "mt-1 w-full text-[hsl(var(--sidebar-foreground)/0.7)] hover:text-[hsl(var(--sidebar-foreground))]",
                !sidebarCollapsed && "justify-start gap-3"
              )}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="h-5 w-5 shrink-0" />
                  <span className="animate-fade-in">Collapse</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right" sideOffset={10}>
              Expand sidebar
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  )
}
