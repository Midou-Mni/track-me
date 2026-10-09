/**
 * Calendar Page
 * 
 * Features:
 * - Month view with activity heatmap
 * - Week view with scheduled sessions
 * - Tap a day to see sessions, add a log, or schedule
 * - Color-coded by category/program
 * - Saturday-start weeks
 */

import { useState, useMemo } from "react"
import { ScheduleDialog } from "./schedule-dialog"
import { useNavigate } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Star,
  LayoutGrid,
  List,
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useSessionsByDateRange,
  useScheduledByDateRange,
  useEnabledReminders,
  useReminders,
  useActivePrograms,
  scheduledRepo,
  remindersRepo,
} from "@/core/db"
import type { Reminder } from "@/core/db"
import { CATEGORY_COLORS } from "@/lib/constants"
import { DEFAULT_WEEK_START } from "@/lib/constants"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  toDateKey,
  formatDuration,
  formatDate,
  addDays,
  subDays,
} from "@/lib/dates"
import { cn } from "@/lib/utils"
import { mergeCalendarItems, groupByDate } from "@/lib/calendar-items"
import type { CalendarItem } from "@/lib/calendar-items"

type ViewMode = "month" | "week" | "schedule"

const WEEK_STARTS_ON = DEFAULT_WEEK_START as 0 | 1 | 2 | 3 | 4 | 5 | 6

const DAY_LABELS = (() => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const shifted = []
  for (let i = 0; i < 7; i++) {
    shifted.push(days[(WEEK_STARTS_ON + i) % 7])
  }
  return shifted
})()

export function CalendarPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(toDateKey(new Date()))
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDialogMode, setScheduleDialogMode] = useState<"once" | "weekly">("once")

  const programs = useActivePrograms()

  // Date ranges for queries
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON })

  const weekViewStart = startOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON })
  const weekViewEnd = endOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON })

  const queryStart = toDateKey(viewMode === "month" ? calendarStart : weekViewStart)
  const queryEnd = toDateKey(viewMode === "month" ? calendarEnd : weekViewEnd)

  const sessions = useSessionsByDateRange(queryStart, queryEnd)
  const scheduled = useScheduledByDateRange(queryStart, queryEnd)
  const enabledReminders = useEnabledReminders()
  const allReminders = useReminders()

  // Build session map: date → { totalMin, sessions[] }
  const sessionMap = useMemo(() => {
    const map = new Map<string, { totalMin: number; count: number; categories: Set<string> }>()
    if (!sessions) return map
    for (const s of sessions) {
      const entry = map.get(s.date) ?? { totalMin: 0, count: 0, categories: new Set<string>() }
      entry.totalMin += s.durationMin || 0
      entry.count++
      entry.categories.add(s.categoryId)
      map.set(s.date, entry)
    }
    return map
  }, [sessions])

  // Build unified calendar item map (scheduled + recurring reminders)
  const calendarItemMap = useMemo(() => {
    const items = mergeCalendarItems(
      scheduled ?? [],
      enabledReminders ?? [],
      queryStart,
      queryEnd
    )
    return groupByDate(items)
  }, [scheduled, enabledReminders, queryStart, queryEnd])

  // Max minutes for heatmap normalization
  const maxMinutes = useMemo(() => {
    let max = 0
    for (const entry of sessionMap.values()) {
      if (entry.totalMin > max) max = entry.totalMin
    }
    return Math.max(max, 30) // minimum baseline
  }, [sessionMap])

  // Calendar days for month view
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [calendarStart, calendarEnd])

  // Week days for week view
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekViewStart, end: weekViewEnd })
  }, [weekViewStart, weekViewEnd])

  // Selected day data
  const selectedDaySessions = selectedDate
    ? sessions?.filter((s) => s.date === selectedDate) ?? []
    : []
  const selectedDayItems: CalendarItem[] = selectedDate
    ? calendarItemMap.get(selectedDate) ?? []
    : []

  // Navigation
  const goNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 7))
  }
  const goPrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 7))
  }
  const goToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(toDateKey(new Date()))
  }

  const activeRoutinesCount = allReminders?.filter((r) => r.enabled).length ?? 0

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Calendar</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Your schedule, recurring weekly routines, and activity heatmap.
          </p>
        </div>

        {/* Action buttons & View mode switcher */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Schedule button with mode picker */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => {
                setScheduleDialogMode("once")
                setShowSchedule(true)
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Date</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setScheduleDialogMode("weekly")
                setShowSchedule(true)
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <Bell className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              <span>+ Weekly Routine</span>
            </Button>
          </div>

          {/* View Mode Switcher tabs */}
          <div className="flex rounded-xl bg-[hsl(var(--muted))] p-1 text-xs">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all",
                viewMode === "month"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all",
                viewMode === "week"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Week</span>
            </button>
            <button
              onClick={() => setViewMode("schedule")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all",
                viewMode === "schedule"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Weekly Schedule</span>
              {activeRoutinesCount > 0 && (
                <span className="rounded-full bg-[hsl(var(--primary)/0.15)] px-1.5 py-0.2 text-[10px] font-bold text-[hsl(var(--primary))]">
                  {activeRoutinesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation bar (Month & Week views only) */}
      {viewMode !== "schedule" && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {viewMode === "month"
                ? format(currentDate, "MMMM yyyy")
                : `${formatDate(weekViewStart, "MMM d")} – ${formatDate(weekViewEnd, "MMM d, yyyy")}`}
            </h2>
            <button
              onClick={goToday}
              className="text-xs text-[hsl(var(--primary))] hover:underline"
            >
              Today
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={goNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main View Display */}
      {viewMode === "month" ? (
        <MonthView
          days={calendarDays}
          currentMonth={currentDate}
          sessionMap={sessionMap}
          calendarItemMap={calendarItemMap}
          maxMinutes={maxMinutes}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ) : viewMode === "week" ? (
        <WeekView
          days={weekDays}
          sessionMap={sessionMap}
          calendarItemMap={calendarItemMap}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          programs={programs}
        />
      ) : (
        /* VIEW MODE: FULL WEEKLY SCHEDULE BOARD */
        <WeeklyScheduleView
          reminders={allReminders ?? []}
          programs={programs}
          onAddRoutine={() => {
            setScheduleDialogMode("weekly")
            setShowSchedule(true)
          }}
          onLog={(pId) => navigate(`/log?program=${pId}`)}
        />
      )}

      {/* Selected day detail (in Month & Week modes) */}
      {viewMode !== "schedule" && selectedDate && (
        <DayDetail
          date={selectedDate}
          sessions={selectedDaySessions}
          items={selectedDayItems}
          programs={programs}
          onLog={() => navigate(`/log`)}
          onSchedule={() => {
            setScheduleDialogMode("once")
            setShowSchedule(true)
          }}
        />
      )}

      {/* Weekly Schedule Summary Card (prominently visible below month & week views) */}
      {viewMode !== "schedule" && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h3 className="font-semibold text-sm">Weekly Recurring Schedule</h3>
              <span className="rounded-full bg-[hsl(var(--primary)/0.12)] px-2 py-0.2 text-[10px] font-semibold text-[hsl(var(--primary))]">
                {activeRoutinesCount} routine{activeRoutinesCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setScheduleDialogMode("weekly")
                  setShowSchedule(true)
                }}
                className="h-7 text-xs gap-1.5"
              >
                <Plus className="h-3 w-3" />
                Add Weekly Routine
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("schedule")}
                className="h-7 text-xs text-[hsl(var(--primary))]"
              >
                Full Weekly Board →
              </Button>
            </div>
          </div>

          {/* 7-day strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAY_LABELS.map((dayLabel, i) => {
              const dayIdx = (WEEK_STARTS_ON + i) % 7
              const dayItems = (allReminders ?? []).filter((r) => r.enabled && r.days.includes(dayIdx))
              return (
                <div
                  key={dayIdx}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] p-2.5 text-xs flex flex-col min-h-20"
                >
                  <div className="flex items-center justify-between font-bold text-[10px] uppercase text-[hsl(var(--muted-foreground))] mb-1.5">
                    <span>{dayLabel}</span>
                    <span className="text-[9px] font-normal opacity-60">{dayItems.length}</span>
                  </div>
                  {dayItems.length === 0 ? (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground)/0.5)] my-auto text-center italic">—</span>
                  ) : (
                    <div className="space-y-1">
                      {dayItems.map((r) => {
                        const prog = programs?.find((p) => p.id === r.programId)
                        const color = prog
                          ? CATEGORY_COLORS[prog.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
                          : "var(--primary)"
                        return (
                          <div key={r.id} className="flex items-center gap-1.5 text-[11px] truncate">
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: `hsl(${color})` }}
                            />
                            <span className="font-semibold tabular-nums text-[10px] text-[hsl(var(--primary))] shrink-0">{r.time}</span>
                            <span className="truncate">{prog?.name ?? r.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Schedule dialog (Supports both Specific Date and Weekly Routine) */}
      {showSchedule && (
        <ScheduleDialog
          initialDate={selectedDate ?? undefined}
          initialMode={scheduleDialogMode}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  )
}

// ─── Weekly Schedule View ────────────────────────────────────

function WeeklyScheduleView({
  reminders,
  programs,
  onAddRoutine,
  onLog,
}: {
  reminders: Reminder[]
  programs: ReturnType<typeof useActivePrograms>
  onAddRoutine: () => void
  onLog: (programId: string) => void
}) {
  const handleToggle = async (id: string, enabled: boolean) => {
    await remindersRepo.update(id, { enabled: !enabled })
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this weekly routine?")) {
      await remindersRepo.delete(id)
    }
  }

  // Group active reminders by day of week
  const dayRoutines = useMemo(() => {
    const list: Array<{ dayIndex: number; label: string; items: Reminder[] }> = []
    for (let i = 0; i < 7; i++) {
      const dayIdx = (WEEK_STARTS_ON + i) % 7
      const matching = (reminders ?? [])
        .filter((r) => r.enabled && r.days.includes(dayIdx))
        .sort((a, b) => a.time.localeCompare(b.time))
      list.push({
        dayIndex: dayIdx,
        label: DAY_LABELS[i],
        items: matching,
      })
    }
    return list
  }, [reminders])

  return (
    <div className="space-y-6">
      {/* 7-Day Weekly Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {dayRoutines.map(({ dayIndex, label, items }) => (
          <div
            key={dayIndex}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 flex flex-col min-h-48"
          >
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2 mb-2.5">
              <span className="font-semibold text-xs tracking-wider uppercase text-[hsl(var(--foreground))]">
                {label}
              </span>
              <span className="rounded-full bg-[hsl(var(--primary)/0.12)] px-1.5 py-0.2 text-[10px] font-bold text-[hsl(var(--primary))]">
                {items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-[11px] text-[hsl(var(--muted-foreground)/0.6)] my-auto text-center italic py-4">
                Rest / Flexible
              </p>
            ) : (
              <div className="space-y-2 flex-1">
                {items.map((r) => {
                  const prog = programs?.find((p) => p.id === r.programId)
                  const color = prog
                    ? CATEGORY_COLORS[prog.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
                    : "var(--primary)"

                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-2.5 text-xs flex flex-col gap-1 transition-all hover:border-[hsl(var(--primary)/0.4)]"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${color})` }}
                          />
                          <span className="font-semibold text-[11px] truncate">{prog?.name ?? "Routine"}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[hsl(var(--primary))] tabular-nums shrink-0">
                          {r.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                        {r.title}
                      </p>
                      {r.programId && (
                        <button
                          onClick={() => onLog(r.programId!)}
                          className="mt-1 text-[10px] font-medium text-[hsl(var(--primary))] hover:underline text-left"
                        >
                          Log session →
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Routine Manager Card */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Manage Recurring Weekly Routines
            </h3>
          </div>
          <Button size="sm" onClick={onAddRoutine} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            + Add Weekly Routine
          </Button>
        </div>

        {reminders.length === 0 ? (
          <p className="text-center py-6 text-sm text-[hsl(var(--muted-foreground))]">
            No weekly routines configured yet. Click "+ Add Weekly Routine" to set your regular schedule.
          </p>
        ) : (
          <div className="space-y-2.5">
            {reminders.map((r) => {
              const prog = programs?.find((p) => p.id === r.programId)
              const color = prog
                ? CATEGORY_COLORS[prog.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
                : "var(--primary)"

              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    r.enabled
                      ? "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] opacity-60"
                  )}
                >
                  <button
                    onClick={() => handleToggle(r.id, r.enabled)}
                    title={r.enabled ? "Disable routine" : "Enable routine"}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      r.enabled
                        ? "bg-[hsl(var(--primary))] text-white shadow-xs"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                    )}
                  >
                    {r.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: `hsl(${color})` }}
                      />
                      <span className="font-semibold text-sm truncate">{prog?.name ?? "Program"}</span>
                      <span className="text-xs text-[hsl(var(--primary))] font-bold tabular-nums">
                        {r.time}
                      </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        · {r.title}
                      </span>
                    </div>

                    <div className="mt-1.5 flex gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((dayLetter, i) => (
                        <span
                          key={i}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                            r.days.includes(i)
                              ? "bg-[hsl(var(--primary))] text-white"
                              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                          )}
                        >
                          {dayLetter}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
                    title="Delete routine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Month View ──────────────────────────────────────────────

function MonthView({
  days,
  currentMonth,
  sessionMap,
  calendarItemMap,
  maxMinutes,
  selectedDate,
  onSelectDate,
}: {
  days: Date[]
  currentMonth: Date
  sessionMap: Map<string, { totalMin: number; count: number; categories: Set<string> }>
  calendarItemMap: Map<string, CalendarItem[]>
  maxMinutes: number
  selectedDate: string | null
  onSelectDate: (date: string) => void
}) {
  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = toDateKey(day)
          const entry = sessionMap.get(dateKey)
          const items = calendarItemMap.get(dateKey) ?? []
          const hasScheduled = items.length > 0
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)
          const selected = selectedDate === dateKey

          // Heatmap intensity (0-4)
          let intensity = 0
          if (entry) {
            const ratio = entry.totalMin / maxMinutes
            if (ratio > 0.75) intensity = 4
            else if (ratio > 0.5) intensity = 3
            else if (ratio > 0.25) intensity = 2
            else intensity = 1
          }

          // Get primary category color for the dot
          const primaryCategory = entry?.categories.values().next().value
          const catColor = primaryCategory
            ? CATEGORY_COLORS[primaryCategory as keyof typeof CATEGORY_COLORS]?.hsl
            : undefined

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "relative flex flex-col items-center rounded-xl p-1.5 text-sm transition-all min-h-12",
                !inMonth && "opacity-30",
                selected
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                  : today
                  ? "ring-2 ring-[hsl(var(--primary))] ring-inset"
                  : "hover:bg-[hsl(var(--accent))]"
              )}
            >
              <span className={cn("text-xs font-medium", !selected && today && "text-[hsl(var(--primary))]")}>
                {format(day, "d")}
              </span>

              {/* Heatmap dot */}
              {intensity > 0 && !selected && (
                <div
                  className="mt-0.5 h-2 w-2 rounded-full transition-all"
                  style={{
                    backgroundColor: catColor ? `hsl(${catColor})` : `hsl(var(--primary))`,
                    opacity: 0.3 + intensity * 0.175,
                    transform: `scale(${0.6 + intensity * 0.1})`,
                  }}
                />
              )}

              {/* Selected state shows minutes */}
              {selected && entry && (
                <span className="text-[9px] font-medium">{entry.totalMin}m</span>
              )}

              {/* Scheduled/reminder indicator */}
              {hasScheduled && !selected && (
                <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--warning))]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Heatmap legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor: level === 0
                ? "hsl(var(--muted))"
                : `hsl(var(--primary) / ${0.2 + level * 0.2})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ─── Week View ──────────────────────────────────────────────

function WeekView({
  days,
  sessionMap,
  calendarItemMap,
  selectedDate,
  onSelectDate,
  programs,
}: {
  days: Date[]
  sessionMap: Map<string, { totalMin: number; count: number; categories: Set<string> }>
  calendarItemMap: Map<string, CalendarItem[]>
  selectedDate: string | null
  onSelectDate: (date: string) => void
  programs: ReturnType<typeof useActivePrograms>
}) {
  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dateKey = toDateKey(day)
        const entry = sessionMap.get(dateKey)
        const dayItems = calendarItemMap.get(dateKey) ?? []
        const today = isToday(day)
        const selected = selectedDate === dateKey

        return (
          <button
            key={dateKey}
            onClick={() => onSelectDate(dateKey)}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition-all",
              selected
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--card))] shadow-sm"
                : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--ring)/0.3)]",
              today && !selected && "ring-1 ring-[hsl(var(--primary)/0.3)]"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-xl text-center",
                  today ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"
                )}>
                  <span className="text-[10px] font-medium leading-none">{format(day, "EEE")}</span>
                  <span className="text-sm font-bold leading-none">{format(day, "d")}</span>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {today ? "Today" : formatDate(day, "MMMM d")}
                  </div>
                  {entry ? (
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {entry.count} session{entry.count > 1 ? "s" : ""} · {formatDuration(entry.totalMin)}
                    </div>
                  ) : (
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">No sessions logged</div>
                  )}
                </div>
              </div>

              {/* Activity bar */}
              {entry && (
                <div className="flex items-center gap-1">
                  {Array.from(entry.categories).map((catId) => (
                    <div
                      key={catId}
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${CATEGORY_COLORS[catId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"})`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled / reminders preview */}
            {dayItems.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-[hsl(var(--border))] pt-2.5">
                {dayItems.map((item) => {
                  const prog = programs?.find((p) => p.id === item.programId)
                  const isReminder = item.type === "reminder"
                  return (
                    <div key={item.key} className="flex items-center gap-2 text-xs">
                      {isReminder ? (
                        <Bell className="h-3 w-3 text-[hsl(var(--primary))] shrink-0" />
                      ) : (
                        <CalendarIcon className="h-3 w-3 text-[hsl(var(--warning))] shrink-0" />
                      )}
                      <span className={cn("truncate flex-1", item.done && "line-through opacity-50")}>
                        {item.time && `${item.time} · `}
                        {item.note || prog?.name || (isReminder ? "Weekly Reminder" : "Scheduled")}
                        {item.durationMin && ` · ${formatDuration(item.durationMin)}`}
                      </span>
                      {isReminder && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                          Weekly
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Day Detail Panel ──────────────────────────────────────

function DayDetail({
  date,
  sessions,
  items,
  programs,
  onLog,
  onSchedule,
}: {
  date: string
  sessions: Array<{ id: string; programId: string; categoryId: string; durationMin: number; fields: Record<string, unknown> }>
  items: CalendarItem[]
  programs: ReturnType<typeof useActivePrograms>
  onLog: () => void
  onSchedule: () => void
}) {
  const navigate = useNavigate()
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMin || 0), 0)
  const today = date === toDateKey(new Date())

  const handleToggleScheduled = async (id: string, currentDone: boolean) => {
    await scheduledRepo.update(id, { done: !currentDone })
  }

  const handleDeleteScheduled = async (id: string) => {
    if (confirm("Delete this scheduled session?")) {
      await scheduledRepo.delete(id)
    }
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          {today ? "Today" : formatDate(date, "EEEE, MMMM d")}
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSchedule} className="gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            Schedule
          </Button>
          <Button size="sm" onClick={onLog} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Log
          </Button>
        </div>
      </div>

      {sessions.length === 0 && items.length === 0 && (
        <p className="py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No activity or reminders on this day.
        </p>
      )}

      {/* Logged Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <span>{sessions.length} completed session{sessions.length > 1 ? "s" : ""}</span>
            <span>{formatDuration(totalMinutes)} total</span>
          </div>
          {sessions.map((session) => {
            const program = programs?.find((p) => p.id === session.programId)
            const color = CATEGORY_COLORS[session.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
            const skill = session.fields.skill as string | undefined
            const rating = session.fields.selfRating as number | undefined

            return (
              <div key={session.id} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/0.5)] p-3">
                <div
                  className="h-8 w-8 shrink-0 rounded-lg text-center text-xs font-bold leading-8 text-white"
                  style={{ backgroundColor: `hsl(${color})` }}
                >
                  {program?.name.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{program?.name ?? "Unknown"}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDuration(session.durationMin)}
                    {skill && ` · ${skill}`}
                  </div>
                </div>
                {rating && rating > 0 && (
                  <div className="flex items-center gap-0.5 text-xs">
                    <Star className="h-3 w-3 fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" />
                    {rating}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Scheduled sessions & recurring reminders */}
      {items.length > 0 && (
        <div className={cn(sessions.length > 0 && "mt-4 border-t border-[hsl(var(--border))] pt-3")}>
          <div className="mb-2.5 flex items-center justify-between text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <span>Planned & Reminders ({items.length})</span>
          </div>
          <div className="space-y-2">
            {items.map((item) => {
              const program = programs?.find((p) => p.id === item.programId)
              const color = program
                ? CATEGORY_COLORS[program.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
                : "var(--primary)"
              const isReminder = item.type === "reminder"

              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-3"
                >
                  {/* Status/Type icon */}
                  {isReminder ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleScheduled(item.id, item.done)}
                      title={item.done ? "Mark incomplete" : "Mark done"}
                      className="shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                  )}

                  {/* Program badge & details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: `hsl(${color})` }}
                      />
                      <span className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                        {program?.name ?? "General"}
                      </span>
                      {isReminder && (
                        <span className="rounded bg-[hsl(var(--primary)/0.1)] px-1.5 py-0.2 text-[9px] font-medium text-[hsl(var(--primary))]">
                          Weekly
                        </span>
                      )}
                    </div>
                    <div className={cn("text-sm font-medium mt-0.5 truncate", item.done && "line-through opacity-50")}>
                      {item.time && <span className="text-xs font-semibold text-[hsl(var(--primary))] mr-1.5">{item.time}</span>}
                      {item.note || (isReminder ? "Session Reminder" : "Scheduled Session")}
                      {item.durationMin && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1.5">
                          ({formatDuration(item.durationMin)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigate(
                          `/log?program=${item.programId}${item.durationMin ? `&duration=${item.durationMin}` : ""}`
                        )
                      }
                      className="h-7 text-xs px-2"
                      title="Log this session now"
                    >
                      Log
                    </Button>
                    {!isReminder && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteScheduled(item.id)}
                        className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                        title="Delete scheduled session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
