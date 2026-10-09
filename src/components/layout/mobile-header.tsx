import { useLocation } from "react-router-dom"
import { Moon, Sun, Monitor } from "lucide-react"
import { APP_NAME, NAV_ITEMS } from "@/lib/constants"
import { useUIStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"

/** Mobile top header bar */
export function MobileHeader() {
  const location = useLocation()
  const { theme, setTheme } = useUIStore()

  // Find current page label
  const currentNav = NAV_ITEMS.find((item) =>
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path)
  )
  const pageTitle = currentNav?.label ?? APP_NAME

  const nextTheme = () => {
    const cycle: Array<"system" | "light" | "dark"> = [
      "system",
      "light",
      "dark",
    ]
    const current = cycle.indexOf(theme)
    setTheme(cycle[(current + 1) % cycle.length])
  }

  const ThemeIcon =
    theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <header
      id="mobile-header"
      className="sticky top-0 z-30 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.85)] px-4 py-3 backdrop-blur-xl md:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-sm">
          T
        </div>
        <h1 className="text-lg font-bold tracking-tight">{pageTitle}</h1>
      </div>

      <Button
        id="mobile-theme-toggle"
        variant="ghost"
        size="icon"
        onClick={nextTheme}
        className="text-[hsl(var(--muted-foreground))]"
      >
        <ThemeIcon className="h-5 w-5" />
      </Button>
    </header>
  )
}
