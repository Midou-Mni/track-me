/**
 * Stats Page
 * 
 * Template-driven charts and metrics:
 * - Per-program and overall views
 * - Range filters: week / month / 3 months / all time
 * - Charts: bar (weekly minutes), radar (skill balance),
 *   line (cumulative vocab), progress ring, streaks
 */

import { useState, useMemo } from "react"
import {
  BarChart3,
  Flame,
  Clock,
  Target,
  TrendingUp,
  Award,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  useActivePrograms,
  useSessionsByDateRange,
  useSessionDates,
} from "@/core/db"
import { CATEGORY_COLORS } from "@/lib/constants"
import {
  toDateKey,
  subDays,
  format,
  formatDuration,
  calculateStreaks,
  startOfWeek,
} from "@/lib/dates"
import { DEFAULT_WEEK_START } from "@/lib/constants"
import { cn } from "@/lib/utils"

type TimeRange = "week" | "month" | "3months" | "all"

const WEEK_STARTS_ON = DEFAULT_WEEK_START as 0 | 1 | 2 | 3 | 4 | 5 | 6

const RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: "week", label: "Week", days: 7 },
  { key: "month", label: "Month", days: 30 },
  { key: "3months", label: "3 Months", days: 90 },
  { key: "all", label: "All", days: 365 * 5 },
]

export function StatsPage() {
  const [range, setRange] = useState<TimeRange>("month")
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)

  const programs = useActivePrograms()
  const sessionDates = useSessionDates()

  const rangeDays = RANGES.find((r) => r.key === range)?.days ?? 30
  const startDate = toDateKey(subDays(new Date(), rangeDays))
  const endDate = toDateKey(new Date())

  const sessions = useSessionsByDateRange(startDate, endDate)

  // Filter by program if selected
  const filteredSessions = useMemo(() => {
    if (!sessions) return []
    if (selectedProgramId) return sessions.filter((s) => s.programId === selectedProgramId)
    return sessions
  }, [sessions, selectedProgramId])

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId)

  // Overall stats
  const totalMinutes = filteredSessions.reduce((sum, s) => sum + (s.durationMin || 0), 0)
  const totalCount = filteredSessions.length
  const avgPerSession = totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0

  // Streaks (all-time)
  const streaks = sessionDates ? calculateStreaks(sessionDates) : { current: 0, best: 0 }

  // ─── Chart Data ───────────────────────────────────────────

  // Weekly minutes bar chart
  const weeklyData = useMemo(() => {
    if (!filteredSessions.length) return []
    const weeks = new Map<string, number>()
    for (const s of filteredSessions) {
      const weekStart = toDateKey(startOfWeek(new Date(s.date + "T00:00:00"), { weekStartsOn: WEEK_STARTS_ON }))
      weeks.set(weekStart, (weeks.get(weekStart) ?? 0) + (s.durationMin || 0))
    }
    return Array.from(weeks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, minutes]) => ({
        week: format(new Date(week + "T00:00:00"), "MMM d"),
        minutes,
      }))
  }, [filteredSessions])

  // Skill balance radar (for languages)
  const skillData = useMemo(() => {
    if (!filteredSessions.length) return []
    const skills = new Map<string, number>()
    for (const s of filteredSessions) {
      const skill = s.fields.skill as string | undefined
      if (skill) {
        skills.set(skill, (skills.get(skill) ?? 0) + (s.durationMin || 0))
      }
    }
    if (skills.size === 0) return []
    return Array.from(skills.entries()).map(([skill, minutes]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      minutes,
    }))
  }, [filteredSessions])

  // Daily activity line chart
  const dailyData = useMemo(() => {
    if (!filteredSessions.length) return []
    const days = new Map<string, number>()
    for (const s of filteredSessions) {
      days.set(s.date, (days.get(s.date) ?? 0) + (s.durationMin || 0))
    }
    return Array.from(days.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, minutes]) => ({
        date: format(new Date(date + "T00:00:00"), "MMM d"),
        minutes,
      }))
  }, [filteredSessions])

  // Cumulative vocabulary (for languages)
  const vocabData = useMemo(() => {
    if (!filteredSessions.length) return []
    const sorted = [...filteredSessions].sort((a, b) => a.date.localeCompare(b.date))
    let cumulative = 0
    const points: Array<{ date: string; words: number }> = []
    for (const s of sorted) {
      const words = (s.fields.newWordsLearned as number) || 0
      if (words > 0) {
        cumulative += words
        points.push({
          date: format(new Date(s.date + "T00:00:00"), "MMM d"),
          words: cumulative,
        })
      }
    }
    return points
  }, [filteredSessions])

  // Rating trend
  const ratingData = useMemo(() => {
    if (!filteredSessions.length) return []
    const weeks = new Map<string, { sum: number; count: number }>()
    for (const s of filteredSessions) {
      const rating = s.fields.selfRating as number | undefined
      if (rating && rating > 0) {
        const weekStart = toDateKey(startOfWeek(new Date(s.date + "T00:00:00"), { weekStartsOn: WEEK_STARTS_ON }))
        const entry = weeks.get(weekStart) ?? { sum: 0, count: 0 }
        entry.sum += rating
        entry.count++
        weeks.set(weekStart, entry)
      }
    }
    return Array.from(weeks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, { sum, count }]) => ({
        week: format(new Date(week + "T00:00:00"), "MMM d"),
        rating: Math.round((sum / count) * 10) / 10,
      }))
  }, [filteredSessions])

  // Course progress
  const courseProgress = useMemo(() => {
    if (!selectedProgram || selectedProgram.categoryId !== "courses") return null
    const totalUnits = (selectedProgram.fields.totalUnits as number) || 0
    if (totalUnits === 0) return null
    const completed = filteredSessions.reduce(
      (sum, s) => sum + ((s.fields.unitsCompleted as number) || 0),
      0
    )
    return { completed, total: totalUnits, percent: Math.round((completed / totalUnits) * 100) }
  }, [selectedProgram, filteredSessions])

  if (programs === undefined || sessions === undefined) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-64 rounded-2xl bg-[hsl(var(--muted))]" />
      </div>
    )
  }

  const chartColor = selectedProgram
    ? `hsl(${CATEGORY_COLORS[selectedProgram.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"})`
    : "hsl(var(--primary))"

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Stats</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">
          Charts and insights across your programs.
        </p>
      </div>

      {/* Program filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedProgramId === null ? "default" : "outline"}
          onClick={() => setSelectedProgramId(null)}
        >
          All Programs
        </Button>
        {programs.map((p) => {
          const color = CATEGORY_COLORS[p.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
          return (
            <Button
              key={p.id}
              size="sm"
              variant={selectedProgramId === p.id ? "default" : "outline"}
              onClick={() => setSelectedProgramId(p.id)}
              style={selectedProgramId === p.id ? { backgroundColor: `hsl(${color})` } : undefined}
            >
              {p.name}
            </Button>
          )
        })}
      </div>

      {/* Range filter */}
      <div className="flex gap-1 rounded-xl bg-[hsl(var(--muted))] p-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all",
              range === r.key
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat icon={Clock} label="Total Time" value={formatDuration(totalMinutes)} />
        <MiniStat icon={TrendingUp} label="Sessions" value={String(totalCount)} />
        <MiniStat icon={Target} label="Avg/Session" value={avgPerSession > 0 ? formatDuration(avgPerSession) : "—"} />
        <MiniStat icon={Flame} label="Current Streak" value={`${streaks.current}d`} highlight={streaks.current >= 3} />
      </div>

      {/* Course progress ring */}
      {courseProgress && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Course Progress
          </h3>
          <div className="flex items-center justify-center gap-8">
            <ProgressRing percent={courseProgress.percent} color={chartColor} />
            <div>
              <div className="text-3xl font-bold">{courseProgress.percent}%</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {courseProgress.completed} / {courseProgress.total} units
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly minutes bar chart */}
      {weeklyData.length > 0 && (
        <ChartCard title="Weekly Minutes">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <ReTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="minutes" fill={chartColor} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Skill balance radar */}
      {skillData.length >= 3 && (
        <ChartCard title="Skill Balance">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={skillData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Radar dataKey="minutes" fill={chartColor} fillOpacity={0.3} stroke={chartColor} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Cumulative vocabulary */}
      {vocabData.length > 1 && (
        <ChartCard title="Vocabulary Growth">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={vocabData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <ReTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="words" stroke={chartColor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Rating trend */}
      {ratingData.length > 1 && (
        <ChartCard title="Rating Trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <ReTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="rating" stroke={chartColor} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Streaks card */}
      {(streaks.current > 0 || streaks.best > 0) && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Streaks
          </h3>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <Flame className="mx-auto h-8 w-8 text-[hsl(var(--primary))]" />
              <div className="mt-2 text-3xl font-bold">{streaks.current}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">Current</div>
            </div>
            <div className="h-12 w-px bg-[hsl(var(--border))]" />
            <div className="text-center">
              <Award className="mx-auto h-8 w-8 text-[hsl(var(--warning))]" />
              <div className="mt-2 text-3xl font-bold">{streaks.best}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">Best</div>
            </div>
          </div>
        </div>
      )}

      {/* Daily activity */}
      {dailyData.length > 1 && (
        <ChartCard title="Daily Activity">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <ReTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="minutes" fill={chartColor} radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-16 text-center">
          <BarChart3 className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-xl font-semibold">No data for this range</h2>
          <p className="mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
            {selectedProgramId
              ? "Try selecting a different time range or program."
              : "Start logging sessions to see your charts come alive."}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────

function MiniStat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
      <Icon className={`mx-auto h-4 w-4 ${highlight ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`} />
      <div className="mt-1 text-lg font-bold">{value}</div>
      <div className="text-[10px] text-[hsl(var(--muted-foreground))]">{label}</div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}
