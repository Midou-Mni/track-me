/**
 * Schedule Session & Weekly Routine Dialog
 * 
 * Supports:
 * - One-time session for a specific date
 * - Recurring weekly routine (days of week, session time)
 */

import { useState } from "react"
import { X, Calendar as CalendarIcon, Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useActivePrograms, scheduledRepo, remindersRepo } from "@/core/db"
import { CATEGORY_COLORS } from "@/lib/constants"
import { todayKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface ScheduleDialogProps {
  /** Pre-selected date (YYYY-MM-DD) */
  initialDate?: string
  /** Pre-selected program ID */
  initialProgramId?: string
  /** Initial mode: "once" (calendar date) or "weekly" (weekly schedule) */
  initialMode?: "once" | "weekly"
  onClose: () => void
  onCreated?: () => void
}

export function ScheduleDialog({
  initialDate,
  initialProgramId,
  initialMode = "once",
  onClose,
  onCreated,
}: ScheduleDialogProps) {
  const programs = useActivePrograms()
  const [mode, setMode] = useState<"once" | "weekly">(initialMode)
  const [programId, setProgramId] = useState(initialProgramId ?? "")

  // One-time session state
  const [date, setDate] = useState(initialDate ?? todayKey())
  const [time, setTime] = useState("")
  const [durationMin, setDurationMin] = useState<number | "">("")
  const [note, setNote] = useState("")

  // Weekly routine state
  const [weeklyTime, setWeeklyTime] = useState("08:00")
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri
  const [weeklyLabel, setWeeklyLabel] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort()
    )
  }

  const selectedProgram = programs?.find((p) => p.id === programId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!programId) return

    setSubmitting(true)
    try {
      if (mode === "once") {
        await scheduledRepo.create({
          programId,
          date,
          time: time || undefined,
          durationMin: durationMin || undefined,
          note: note || undefined,
          done: false,
        })
      } else {
        if (selectedDays.length === 0) {
          alert("Please select at least one day of the week.")
          setSubmitting(false)
          return
        }
        await remindersRepo.create({
          programId,
          title: weeklyLabel || `${selectedProgram?.name ?? "Program"} routine`,
          days: selectedDays,
          time: weeklyTime || "08:00",
          enabled: true,
        })
      }

      onCreated?.()
      onClose()
    } catch (error) {
      alert("Failed to schedule: " + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!programs) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[8%] z-50 mx-auto max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl animate-slide-up md:inset-x-auto max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === "once" ? "Schedule Session" : "Add Weekly Routine"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode switcher tabs */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[hsl(var(--muted))] p-1">
          <button
            type="button"
            onClick={() => setMode("once")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all",
              mode === "once"
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Specific Date
          </button>
          <button
            type="button"
            onClick={() => setMode("weekly")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all",
              mode === "weekly"
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            Weekly Routine
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Program picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Program <span className="text-[hsl(var(--destructive))]">*</span>
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {programs.map((p) => {
                const color = CATEGORY_COLORS[p.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
                const selected = programId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProgramId(p.id)
                      if (!weeklyLabel) setWeeklyLabel(`${p.name} routine`)
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
                      selected
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--accent))]"
                        : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent)/0.5)]"
                    )}
                  >
                    <div
                      className="h-7 w-7 shrink-0 rounded-lg text-center text-xs font-bold leading-7 text-white"
                      style={{ backgroundColor: `hsl(${color})` }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                    {selected && <Check className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* MODE: ONE-TIME SESSION */}
          {mode === "once" ? (
            <>
              {/* Date */}
              <div className="space-y-1.5">
                <label htmlFor="sched-date" className="block text-sm font-medium">
                  Date <span className="text-[hsl(var(--destructive))]">*</span>
                </label>
                <input
                  id="sched-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                />
              </div>

              {/* Time + Duration row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="sched-time" className="block text-sm font-medium">
                    Time
                  </label>
                  <input
                    id="sched-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sched-dur" className="block text-sm font-medium">
                    Duration (min)
                  </label>
                  <input
                    id="sched-dur"
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value === "" ? "" : Number(e.target.value))}
                    min={1}
                    max={480}
                    placeholder="e.g. 60"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label htmlFor="sched-note" className="block text-sm font-medium">
                  Note
                </label>
                <input
                  id="sched-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's the plan?"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                />
              </div>
            </>
          ) : (
            /* MODE: WEEKLY ROUTINE */
            <>
              {/* Routine Label */}
              <div className="space-y-1.5">
                <label htmlFor="routine-label" className="block text-sm font-medium">
                  Routine Name
                </label>
                <input
                  id="routine-label"
                  type="text"
                  value={weeklyLabel}
                  onChange={(e) => setWeeklyLabel(e.target.value)}
                  placeholder="e.g. Duolingo practice"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                />
              </div>

              {/* Session Time */}
              <div className="space-y-1.5">
                <label htmlFor="routine-time" className="block text-sm font-medium">
                  Time of Day
                </label>
                <input
                  id="routine-time"
                  type="time"
                  value={weeklyTime}
                  onChange={(e) => setWeeklyTime(e.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                />
              </div>

              {/* Days of week */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Days of Week ({selectedDays.length} sessions / week)
                </label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((dayLabel, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-bold transition-all",
                        selectedDays.includes(i)
                          ? "bg-[hsl(var(--primary))] text-white shadow-xs"
                          : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                      )}
                    >
                      {dayLabel.charAt(0)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {selectedDays.length === 0
                    ? "Select at least 1 day"
                    : `${selectedDays.map((d) => DAY_LABELS[d]).join(", ")}`}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!programId || submitting || (mode === "weekly" && selectedDays.length === 0)}
              className="flex-1"
            >
              {submitting ? "Saving..." : mode === "once" ? "Schedule Date" : "Save Routine"}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
