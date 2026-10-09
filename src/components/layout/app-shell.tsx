import { Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { Sidebar } from "./sidebar"
import { TabBar } from "./tab-bar"
import { MobileHeader } from "./mobile-header"

/** Root app shell — sidebar on desktop, tab bar on mobile */
export function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <div className="relative min-h-dvh">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile header */}
      <MobileHeader />

      {/* Main content */}
      <main
        className={cn(
          "min-h-dvh transition-[margin] duration-300",
          // Desktop: offset by sidebar width
          "md:ml-60",
          sidebarCollapsed && "md:ml-18",
          // Mobile: pad bottom for tab bar
          "pb-24 md:pb-0"
        )}
      >
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile tab bar */}
      <TabBar />
    </div>
  )
}
