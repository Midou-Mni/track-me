import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark" | "system"

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "trackme-ui",
    }
  )
)

/** Apply the theme class to the document */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  root.classList.toggle("dark", isDark)

  // Update meta theme-color
  const metaThemeColor = document.querySelector(
    'meta[name="theme-color"]:not([media])'
  ) ?? document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", isDark ? "#0f0f14" : "#faf8f5")
  }
}

/** Initialize theme on app load */
export function initializeTheme() {
  const stored = localStorage.getItem("trackme-ui")
  let theme: Theme = "system"

  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      theme = parsed.state?.theme ?? "system"
    } catch {
      // ignore parse errors
    }
  }

  applyTheme(theme)

  // Listen for system preference changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const currentTheme = useUIStore.getState().theme
      if (currentTheme === "system") {
        applyTheme("system")
      }
    })
}
