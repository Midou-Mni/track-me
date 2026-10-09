import { useState } from "react"
import {
  Download,
  Upload,
  Bell,
  Palette,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Database,
  RefreshCcw,
  Info,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { seedDatabase, resetDatabase, bulkOps } from "@/core/db"
import { exportData, triggerImport } from "@/core/data/export-import"

export function SettingsPage() {
  const { theme, setTheme } = useUIStore()
  const [seeding, setSeeding] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedDatabase()
      alert("Sample data loaded! Check the Today and Programs pages.")
    } catch (e) {
      alert("Error seeding: " + (e as Error).message)
    } finally {
      setSeeding(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("This will DELETE all data and load fresh sample data. Continue?")) return
    setSeeding(true)
    try {
      await resetDatabase()
      alert("Database reset with fresh sample data!")
    } catch (e) {
      alert("Error resetting: " + (e as Error).message)
    } finally {
      setSeeding(false)
    }
  }
  const handleClearTracks = async () => {
    if (!confirm("Clear all logged session tracks? Your programs, schedules, reminders, and goals will NOT be deleted.")) return
    try {
      await bulkOps.clearSessions()
      alert("All session tracks cleared! Programs, routines, and schedules remain intact.")
    } catch (e) {
      alert("Error clearing sessions: " + (e as Error).message)
    }
  }

  const handleDeleteAll = async () => {
    const first = confirm("Delete ALL data? This cannot be undone.")
    if (!first) return
    const second = confirm("Are you absolutely sure? All programs, sessions, goals, and settings will be permanently deleted.")
    if (!second) return
    try {
      await bulkOps.deleteEverything()
      alert("All data deleted.")
    } catch (e) {
      alert("Error deleting: " + (e as Error).message)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportData()
    } catch (e) {
      alert("Export failed: " + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    const result = await triggerImport()
    if (result.success) {
      alert(`Import successful! Records: ${JSON.stringify(result.counts)}`)
    } else {
      alert(result.error ?? "Import failed.")
    }
  }

  const settingsGroups = [
    {
      title: "Appearance",
      items: [
        {
          icon: theme === "dark" ? Moon : theme === "light" ? Sun : Monitor,
          label: "Theme",
          description: `Currently: ${theme}`,
          action: () => {
            const cycle: Array<"system" | "light" | "dark"> = ["system", "light", "dark"]
            const current = cycle.indexOf(theme)
            setTheme(cycle[(current + 1) % cycle.length])
          },
        },
        {
          icon: Palette,
          label: "Week starts on",
          description: "Saturday",
          action: () => {},
        },
      ],
    },
    {
      title: "Data",
      items: [
        {
          icon: Download,
          label: exporting ? "Exporting..." : "Export Data",
          description: "Download all your data as a JSON file",
          action: handleExport,
        },
        {
          icon: Upload,
          label: "Import Data",
          description: "Import data from a JSON backup file",
          action: handleImport,
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Reminder Notifications",
          description: "Coming soon — browser notifications for reminders",
          action: () => {},
        },
      ],
    },
    {
      title: "Developer",
      items: [
        {
          icon: Database,
          label: "Load Sample Data",
          description: seeding ? "Loading..." : "Add demo programs and sessions",
          action: handleSeed,
        },
        {
          icon: RefreshCcw,
          label: "Reset Database",
          description: "Wipe everything and reload clean programs",
          action: handleReset,
        },
        {
          icon: Trash2,
          label: "Clear All Session Tracks",
          description: "Wipe session history only — keeps all programs, schedules, and goals",
          action: handleClearTracks,
        },
      ],
    },
    {
      title: "Danger Zone",
      items: [
        {
          icon: Trash2,
          label: "Delete All Data",
          description: "Permanently remove all programs and sessions",
          action: handleDeleteAll,
          danger: true,
        },
      ],
    },
  ]

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">
          Customize TrackMe and manage your data.
        </p>
      </div>

      <div className="space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {group.title}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              {group.items.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={seeding && (item.label.includes("Sample") || item.label.includes("Reset"))}
                  className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[hsl(var(--accent))] disabled:opacity-50 ${
                    index > 0 ? "border-t border-[hsl(var(--border))]" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      "danger" in item && item.danger
                        ? "bg-[hsl(var(--destructive)/0.1)]"
                        : "bg-[hsl(var(--primary)/0.1)]"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        "danger" in item && item.danger
                          ? "text-[hsl(var(--destructive))]"
                          : "text-[hsl(var(--primary))]"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium ${
                        "danger" in item && item.danger ? "text-[hsl(var(--destructive))]" : ""
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] truncate">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* App info */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-3">
          <Info className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm font-medium">About</span>
        </div>
        <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
          <p>TrackMe v1.0.0</p>
          <p>All data is stored locally on this device using IndexedDB.</p>
          <p>No accounts, no servers — your data never leaves your browser.</p>
        </div>
      </div>
    </div>
  )
}
