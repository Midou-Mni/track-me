/**
 * Today Page — The Home Screen
 * 
 * Shows:
 * - Time-based greeting
 * - Streak & weekly stats
 * - Goal progress for each active program
 * - Upcoming scheduled sessions
 * - Quick-log buttons
 */

import { useMemo } from "react"
import { Sun, Flame, Target, ArrowRight, Zap, Clock, TrendingUp, Bell, Timer } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  useActivePrograms,
  useSessionsByDateRange,
  useSessionDates,
  useSessionCount,
  useUpcomingScheduled,
  useEnabledReminders,
  useGoals,
} from "@/core/db"
import { getTemplate } from "@/core/templates"
import { calculateAllGoalProgress } from "@/core/engine"
import type { GoalProgress } from "@/core/engine"
import { CATEGORY_COLORS } from "@/lib/constants"
import {
  todayKey,
  getWeekStart,
  getWeekEnd,
  toDateKey,
  formatDuration,
  calculateStreaks,
  formatRelativeDate,
  addDays,
} from "@/lib/dates"
import { mergeCalendarItems } from "@/lib/calendar-items"

export function TodayPage() {
  const navigate = useNavigate()
  const programs = useActivePrograms()
  const sessionDates = useSessionDates()
  const totalSessions = useSessionCount()
  const allGoals = useGoals()
  const todayStr = todayKey()

  // Get this week's sessions
  const weekStart = toDateKey(getWeekStart())
  const weekEnd = toDateKey(getWeekEnd())
  const weekSessions = useSessionsByDateRange(weekStart, weekEnd)

  // Get upcoming scheduled sessions + active recurring reminders
  const upcoming = useUpcomingScheduled(todayStr)
  const reminders = useEnabledReminders()
  const endOfUpcoming = toDateKey(addDays(new Date(), 7))

  const upcomingItems = useMemo(() => {
    return mergeCalendarItems(
      upcoming ?? [],
      reminders ?? [],
      todayStr,
      endOfUpcoming
    ).filter((item) => !item.done)
  }, [upcoming, reminders, todayStr, endOfUpcoming])

  // Compute stats
  const streaks = sessionDates ? calculateStreaks(sessionDates) : { current: 0, best: 0 }
  const weekMinutes = weekSessions?.reduce((sum, s) => sum + (s.durationMin || 0), 0) ?? 0
  const weekSessionCount = weekSessions?.length ?? 0
  const todayMinutes = weekSessions
    ?.filter((s) => s.date === todayStr)
    .reduce((sum, s) => sum + (s.durationMin || 0), 0) ?? 0
  const todaySessionCount = weekSessions?.filter((s) => s.date === todayStr).length ?? 0

  // Compute goal progress for each active program
  const programGoals: Array<{ program: typeof programs extends (infer T)[] | undefined ? T : never; goals: GoalProgress[] }> = []
  if (programs && allGoals && weekSessions) {
    for (const program of programs) {
      const template = getTemplate(program.categoryId)
      if (!template) continue
      const pGoals = allGoals.filter((g) => g.programId === program.id)
      if (pGoals.length === 0) continue
      const pSessions = weekSessions.filter((s) => s.programId === program.id)
      const progress = calculateAllGoalProgress(pGoals, template.goalTypes, pSessions)
      programGoals.push({ program, goals: progress })
    }
  }

  const isLoading = programs === undefined

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-5 w-48 rounded bg-[hsl(var(--muted))]" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[hsl(var(--muted))]" />
          ))}
        </div>
      </div>
    )
  }

  const hasPrograms = programs.length > 0

  return (
    <div className="animate-fade-in space-y-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Good {getGreeting()} ✨
          </h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            {hasPrograms
              ? todayMinutes > 0
                ? `You've put in ${formatDuration(todayMinutes)} across ${todaySessionCount} session${todaySessionCount > 1 ? "s" : ""} today. ${streaks.current >= 3 ? "🔥 On fire!" : "Keep going!"}`
                : "Ready to make some progress today?"
              : "Create a program to start tracking your progress."}
          </p>
        </div>
        {hasPrograms && (
          <Button
            onClick={() => navigate("/timer")}
            className="self-start sm:self-auto gap-2 rounded-xl shadow-xs"
          >
            <Timer className="h-4 w-4" />
            <span>Start 45m Focus</span>
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Streak"
          value={streaks.current}
          suffix="days"
          highlight={streaks.current >= 3}
          accentColor={streaks.current >= 7 ? "hsl(var(--primary))" : undefined}
        />
        <StatCard
          icon={Clock}
          label="This Week"
          value={weekMinutes > 0 ? formatDuration(weekMinutes) : "0m"}
        />
        <StatCard
          icon={TrendingUp}
          label="Sessions"
          value={weekSessionCount}
          suffix="this week"
        />
        <StatCard
          icon={Zap}
          label="Total"
          value={totalSessions ?? 0}
          suffix="sessions"
        />
      </div>

      {/* Goal progress per program */}
      {programGoals.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Weekly Goals
          </h2>
          <div className="space-y-4">
            {programGoals.map(({ program, goals }) => {
              const color = CATEGORY_COLORS[program.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
              return (
                <div
                  key={program.id}
                  className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
                >
                  <button
                    onClick={() => navigate(`/programs/${program.id}`)}
                    className="mb-3 flex items-center gap-2 text-left"
                  >
                    <div
                      className="h-6 w-6 rounded-lg text-center text-xs font-bold leading-6 text-white"
                      style={{ backgroundColor: `hsl(${color})` }}
                    >
                      {program.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate">{program.name}</span>
                  </button>
                  <div className="space-y-2.5">
                    {goals
                      .filter((g) => g.goal.period === "weekly")
                      .map((gp) => (
                        <GoalBar key={gp.goal.id} progress={gp} color={color} />
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Planned & Upcoming sessions */}
      {upcomingItems && upcomingItems.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Planned & Upcoming
          </h2>
          <div className="space-y-2">
            {upcomingItems.slice(0, 5).map((item) => {
              const program = programs.find((p) => p.id === item.programId)
              const color = program
                ? CATEGORY_COLORS[program.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
                : "var(--primary)"
              const isReminder = item.type === "reminder"
              return (
                <div
                  key={item.key}
                  className="card-hover flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: `hsl(${color})` }}
                  >
                    {isReminder ? <Bell className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {item.note || program?.name || "Session"}
                      </span>
                      {isReminder && (
                        <span className="shrink-0 rounded px-1.5 py-0.2 text-[9px] font-medium bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                          Weekly
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      {formatRelativeDate(item.date)}
                      {item.time && ` at ${item.time}`}
                      {item.durationMin && ` · ${formatDuration(item.durationMin)}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/log?program=${item.programId}${item.durationMin ? `&duration=${item.durationMin}` : ""}`
                      )
                    }
                    className="shrink-0"
                  >
                    Log
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick log buttons for active programs */}
      {hasPrograms && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Quick Log
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {programs.map((program) => {
              const color = CATEGORY_COLORS[program.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
              return (
                <button
                  key={program.id}
                  onClick={() => navigate(`/log?program=${program.id}`)}
                  className="card-hover flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left transition-all"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
                    style={{ backgroundColor: `hsl(${color})` }}
                  >
                    {program.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{program.name}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] capitalize">
                      {program.categoryId}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasPrograms && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-16 text-center">
          <div className="mb-6 flex items-center gap-3">
            {[Sun, Flame, Target].map((Icon, i) => (
              <div key={i} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)]">
                <Icon className="h-7 w-7 text-[hsl(var(--primary))]" />
              </div>
            ))}
          </div>
          <h2 className="text-xl font-semibold">No programs yet</h2>
          <p className="mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
            Create your first program to start tracking your progress.
            Your streaks, goals, and daily sessions will appear here.
          </p>
          <Button onClick={() => navigate("/programs/new")} size="lg" className="mt-6 gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Best streak badge */}
      {streaks.best > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-4 text-center">
          <Flame className="h-5 w-5 text-[hsl(var(--primary))]" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Best streak: <span className="font-bold text-[hsl(var(--foreground))]">{streaks.best} days</span>
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  highlight,
  accentColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  suffix?: string
  highlight?: boolean
  accentColor?: string
}) {
  return (
    <div className="card-hover rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${highlight ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`}
        />
        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className="text-2xl font-bold"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function GoalBar({ progress, color }: { progress: GoalProgress; color: string }) {
  const pct = Math.min(progress.progress * 100, 100)
  const statusLabel =
    progress.status === "completed" ? "✓ Done" :
    progress.status === "ahead" ? "Ahead" :
    progress.status === "on-track" ? "On track" :
    "Behind"

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[hsl(var(--muted-foreground))]">{progress.goalType.label}</span>
        <span className="font-medium tabular-nums">
          {Math.round(progress.current)}/{progress.target} {progress.goalType.unit}
          <span className="ml-1.5 text-[10px] text-[hsl(var(--muted-foreground))]">
            {statusLabel}
          </span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: `hsl(${color})`,
          }}
        />
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}
