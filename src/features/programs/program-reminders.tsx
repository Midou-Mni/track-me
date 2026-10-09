/**
 * Program Schedule & Reminders Manager
 * 
 * Shows on the Program Detail page.
 * Unifies weekly recurring reminders and calendar scheduled sessions
 * so both are completely in sync and manageable in one place.
 */

import { useState } from "react"
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Check,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useRemindersByProgram,
  useScheduledByProgram,
  remindersRepo,
  scheduledRepo,
} from "@/core/db"
import { requestNotificationPermission } from "@/services/notification-service"
import { ScheduleDialog } from "@/features/calendar/schedule-dialog"
import { formatDate, formatRelativeDate, formatDuration } from "@/lib/dates"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"]

interface Props {
  programId: string
  programName: string
}

type TabType = "weekly" | "calendar"

export function ProgramReminders({ programId, programName }: Props) {
  const reminders = useRemindersByProgram(programId)
  const scheduled = useScheduledByProgram(programId)

  const [activeTab, setActiveTab] = useState<TabType>("weekly")
  const [addingReminder, setAddingReminder] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  )

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setNotifPermission(result)
  }

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    await remindersRepo.update(id, { enabled: !enabled })
  }

  const handleDeleteReminder = async (id: string) => {
    if (confirm("Delete this reminder?")) {
      await remindersRepo.delete(id)
    }
  }

  const handleToggleScheduled = async (id: string, done: boolean) => {
    await scheduledRepo.update(id, { done: !done })
  }

  const handleDeleteScheduled = async (id: string) => {
    if (confirm("Delete this scheduled session?")) {
      await scheduledRepo.delete(id)
    }
  }

  const reminderCount = reminders?.length ?? 0
  const scheduledCount = scheduled?.length ?? 0

  // Sort scheduled sessions: pending first, then by date ascending
  const sortedScheduled = [...(scheduled ?? [])].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return a.date.localeCompare(b.date)
  })

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Schedule & Reminders
            </h2>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Manage weekly recurring session times and specific calendar dates.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveTab("weekly")
              setAddingReminder(true)
            }}
            className="gap-1.5 h-8 text-xs"
          >
            <Bell className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
            + Weekly
          </Button>
          <Button
            size="sm"
            onClick={() => setShowScheduleDialog(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            + Schedule Date
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))] mb-4 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab("weekly")}
          className={cn(
            "pb-2.5 transition-colors border-b-2 flex items-center gap-1.5",
            activeTab === "weekly"
              ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] font-semibold"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          Weekly Schedule
          {reminderCount > 0 && (
            <span className="rounded-full bg-[hsl(var(--primary)/0.15)] px-1.5 py-0.2 text-[10px]">
              {reminderCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={cn(
            "pb-2.5 transition-colors border-b-2 flex items-center gap-1.5",
            activeTab === "calendar"
              ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] font-semibold"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          Calendar Sessions
          {scheduledCount > 0 && (
            <span className="rounded-full bg-[hsl(var(--muted))] px-1.5 py-0.2 text-[10px]">
              {scheduledCount}
            </span>
          )}
        </button>
      </div>

      {/* Permission banner */}
      {notifPermission !== "granted" && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[hsl(var(--warning))] shrink-0" />
            <p className="text-xs text-[hsl(var(--warning))]">
              Allow notifications to get 15 min & 5 min alerts before sessions
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRequestPermission}
            className="h-6 text-[11px] px-2.5 shrink-0"
          >
            Enable Alerts
          </Button>
        </div>
      )}

      {/* ─── TAB 1: Weekly Recurring Reminders ─── */}
      {activeTab === "weekly" && (
        <div>
          {addingReminder && (
            <AddReminderForm
              programId={programId}
              programName={programName}
              onDone={() => setAddingReminder(false)}
            />
          )}

          {reminders && reminders.length > 0 ? (
            <div className="space-y-2.5">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    r.enabled
                      ? "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] opacity-60"
                  )}
                >
                  {/* Toggle button */}
                  <button
                    onClick={() => handleToggleReminder(r.id, r.enabled)}
                    title={r.enabled ? "Disable reminder" : "Enable reminder"}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      r.enabled
                        ? "bg-[hsl(var(--primary))] text-white shadow-sm"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                    )}
                  >
                    {r.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">
                        {r.time}
                      </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        · {r.title}
                      </span>
                    </div>

                    {/* Day chips */}
                    <div className="mt-1.5 flex gap-1">
                      {DAY_SHORT.map((label, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                            r.days.includes(i)
                              ? "bg-[hsl(var(--primary))] text-white"
                              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                          )}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteReminder(r.id)}
                    className="shrink-0 p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
                    title="Delete reminder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {notifPermission === "granted" && (
                <p className="mt-3 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
                  Notifications configured: 🔔 15 min before · ⏰ 5 min before · 🚀 at start time
                </p>
              )}
            </div>
          ) : !addingReminder ? (
            <div className="py-6 text-center">
              <Clock className="mx-auto h-7 w-7 text-[hsl(var(--muted-foreground)/0.5)] mb-2" />
              <p className="text-sm font-medium">No weekly recurring reminders</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Add your regular practice routine (e.g. Mon, Wed, Fri at 08:00)
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddingReminder(true)}
                className="mt-3 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Weekly Reminder
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── TAB 2: Calendar Scheduled Sessions ─── */}
      {activeTab === "calendar" && (
        <div>
          {sortedScheduled.length > 0 ? (
            <div className="space-y-2.5">
              {sortedScheduled.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    s.done
                      ? "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] opacity-60"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                  )}
                >
                  {/* Mark done toggle */}
                  <button
                    onClick={() => handleToggleScheduled(s.id, s.done)}
                    title={s.done ? "Mark pending" : "Mark completed"}
                    className="shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    {s.done ? (
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[hsl(var(--primary))]">
                        {formatRelativeDate(s.date)} ({formatDate(s.date, "EEE, MMM d")})
                      </span>
                      {s.time && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
                          at {s.time}
                        </span>
                      )}
                    </div>
                    <div className={cn("text-sm font-medium mt-0.5 truncate", s.done && "line-through")}>
                      {s.note || `${programName} session`}
                      {s.durationMin && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1.5">
                          · {formatDuration(s.durationMin)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteScheduled(s.id)}
                    className="shrink-0 p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
                    title="Delete scheduled date"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <CalendarIcon className="mx-auto h-7 w-7 text-[hsl(var(--muted-foreground)/0.5)] mb-2" />
              <p className="text-sm font-medium">No calendar sessions scheduled</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Book a specific date and time on your calendar for this program
              </p>
              <Button
                size="sm"
                onClick={() => setShowScheduleDialog(true)}
                className="mt-3 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Schedule Date
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Schedule Dialog */}
      {showScheduleDialog && (
        <ScheduleDialog
          initialProgramId={programId}
          onClose={() => setShowScheduleDialog(false)}
        />
      )}
    </div>
  )
}

// ─── Add Reminder Form ────────────────────────────────────────

function AddReminderForm({
  programId,
  programName,
  onDone,
}: {
  programId: string
  programName: string
  onDone: () => void
}) {
  const [time, setTime] = useState("08:00")
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri default
  const [label, setLabel] = useState(`${programName} session`)
  const [saving, setSaving] = useState(false)

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      alert("Select at least one day.")
      return
    }
    setSaving(true)
    try {
      await remindersRepo.create({
        programId,
        title: label || `${programName} session`,
        days: selectedDays,
        time,
        enabled: true,
      })
      onDone()
    } catch (e) {
      alert("Failed to save: " + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)] p-4 space-y-3">
      {/* Label */}
      <div>
        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
          Label / Routine Name
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`e.g. ${programName} morning session`}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
        />
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
          Session time
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
        />
      </div>

      {/* Days */}
      <div>
        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
          Days of week ({selectedDays.length} sessions / week)
        </label>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={cn(
                "flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-bold transition-all",
                selectedDays.includes(i)
                  ? "bg-[hsl(var(--primary))] text-white shadow-sm"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
              )}
            >
              {label.charAt(0)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-[hsl(var(--muted-foreground))]">
          {selectedDays.length === 0
            ? "No days selected"
            : `${selectedDays.length}× per week — ${selectedDays.map((d) => DAY_LABELS[d]).join(", ")}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onDone} className="flex-1">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || selectedDays.length === 0}
          className="flex-1 gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save Weekly Schedule"}
        </Button>
      </div>
    </div>
  )
}
