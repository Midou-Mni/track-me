/**
 * Program Detail Page
 * 
 * Shows all details for a single program:
 * - Program info with status management
 * - Goal progress
 * - Session history
 * - Quick log button
 */

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Clock,
  Flame,
  Target,
  Plus,
  Pause,
  Play,
  Archive,
  CheckCircle,
  MoreVertical,
  Trash2,
  Edit,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useProgram,
  useSessionsByProgram,
  useGoalsByProgram,
  programsRepo,
  sessionsRepo,
} from "@/core/db"
import type { Program } from "@/core/db"
import { ProgramReminders } from "./program-reminders"
import { getTemplate } from "@/core/templates"
import { calculateAllGoalProgress } from "@/core/engine"
import type { GoalProgress } from "@/core/engine"
import { CATEGORY_COLORS } from "@/lib/constants"
import { formatDuration, formatRelativeDate, formatDate } from "@/lib/dates"

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const program = useProgram(id)
  const sessions = useSessionsByProgram(id ?? "")
  const goals = useGoalsByProgram(id ?? "")
  const [menuOpen, setMenuOpen] = useState(false)

  if (program === undefined || sessions === undefined) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-40 rounded-2xl bg-[hsl(var(--muted))]" />
        <div className="h-60 rounded-2xl bg-[hsl(var(--muted))]" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Program not found</h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          This program may have been deleted.
        </p>
        <Button onClick={() => navigate("/programs")} className="mt-4">
          Back to Programs
        </Button>
      </div>
    )
  }

  const template = getTemplate(program.categoryId)
  const categoryColor =
    CATEGORY_COLORS[program.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"

  // Compute stats
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMin || 0), 0)

  // Goal progress
  const goalProgress: GoalProgress[] = goals && template
    ? calculateAllGoalProgress(goals, template.goalTypes, sessions)
    : []

  const handleStatusChange = async (status: Program["status"]) => {
    await programsRepo.updateStatus(program.id, status)
    setMenuOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${program.name}" and all its ${totalSessions} sessions? This cannot be undone.`)) return
    await programsRepo.delete(program.id)
    navigate("/programs")
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/programs")} className="mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
              style={{ backgroundColor: `hsl(${categoryColor})` }}
            >
              {program.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate md:text-3xl">
                {program.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <span className="capitalize">{program.categoryId}</span>
                {program.status !== "active" && (
                  <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] font-medium uppercase">
                    {program.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate(`/log?program=${program.id}`)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Log Session</span>
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="h-5 w-5" />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] py-1 shadow-lg animate-scale-in">
                  <MenuItem icon={Edit} label="Edit Program" onClick={() => { setMenuOpen(false) }} />
                  <div className="my-1 border-t border-[hsl(var(--border))]" />
                  {program.status === "active" ? (
                    <MenuItem icon={Pause} label="Pause" onClick={() => handleStatusChange("paused")} />
                  ) : program.status === "paused" ? (
                    <MenuItem icon={Play} label="Resume" onClick={() => handleStatusChange("active")} />
                  ) : null}
                  <MenuItem icon={CheckCircle} label="Mark Complete" onClick={() => handleStatusChange("completed")} />
                  <MenuItem icon={Archive} label="Archive" onClick={() => handleStatusChange("archived")} />
                  <div className="my-1 border-t border-[hsl(var(--border))]" />
                  <MenuItem icon={Trash2} label="Delete" onClick={handleDelete} danger />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatMini icon={Clock} label="Total Time" value={formatDuration(totalMinutes)} />
        <StatMini icon={Flame} label="Sessions" value={String(totalSessions)} />
        <StatMini
          icon={Target}
          label="Avg/Session"
          value={totalSessions > 0 ? formatDuration(Math.round(totalMinutes / totalSessions)) : "—"}
        />
      </div>

      {/* Program fields summary */}
      {template && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Details
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {template.programFields.map((field) => {
              const value = program.fields[field.key]
              if (value === undefined || value === null || value === "") return null

              let displayValue: string
              if (Array.isArray(value)) {
                displayValue = value.join(", ")
              } else if (field.type === "select" && field.options) {
                displayValue = field.options.find((o) => o.value === value)?.label ?? String(value)
              } else {
                displayValue = String(value)
              }

              return (
                <div key={field.key}>
                  <div className="text-[hsl(var(--muted-foreground))] text-xs">{field.label}</div>
                  <div className="font-medium truncate">{displayValue}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Goal progress */}
      {goalProgress.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Goals
          </h2>
          <div className="space-y-3">
            {goalProgress.map((gp) => (
              <GoalProgressCard key={gp.goal.id} progress={gp} categoryColor={categoryColor} />
            ))}
          </div>
        </div>
      )}

      {/* Reminders */}
      <ProgramReminders programId={program.id} programName={program.name} />

      {/* Session history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Session History
          {totalSessions > 0 && (
            <span className="ml-2 text-xs font-normal">({totalSessions} total)</span>
          )}
        </h2>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-12 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No sessions logged yet. Start tracking your progress!
            </p>
            <Button
              onClick={() => navigate(`/log?program=${program.id}`)}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Log First Session
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 20).map((session) => (
              <SessionCard key={session.id} session={session} template={template} />
            ))}
            {sessions.length > 20 && (
              <p className="pt-2 text-center text-sm text-[hsl(var(--muted-foreground))]">
                Showing 20 of {sessions.length} sessions
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function StatMini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      <div className="mt-1 text-lg font-bold">{value}</div>
      <div className="text-[10px] text-[hsl(var(--muted-foreground))]">{label}</div>
    </div>
  )
}

function GoalProgressCard({ progress, categoryColor }: { progress: GoalProgress; categoryColor: string }) {
  const statusColors = {
    completed: "text-[hsl(var(--success))]",
    ahead: "text-[hsl(var(--success))]",
    "on-track": "text-[hsl(var(--primary))]",
    behind: "text-[hsl(var(--destructive))]",
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{progress.goalType.label}</span>
        <span className={`text-xs font-semibold uppercase ${statusColors[progress.status]}`}>
          {progress.status.replace("-", " ")}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progress.progress * 100, 100)}%`,
                backgroundColor: `hsl(${categoryColor})`,
              }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold tabular-nums">
          {Math.round(progress.current)}/{progress.target}
          <span className="ml-0.5 text-xs font-normal text-[hsl(var(--muted-foreground))]">
            {progress.goalType.unit}
          </span>
        </span>
      </div>
    </div>
  )
}

function SessionCard({
  session,
  template,
}: {
  session: { id: string; date: string; durationMin: number; fields: Record<string, unknown> }
  template: ReturnType<typeof getTemplate>
}) {
  const skillField = template?.sessionFields.find((f) => f.key === "skill")
  const skillValue = session.fields.skill as string | undefined
  const skillLabel = skillField?.options?.find((o) => o.value === skillValue)?.label ?? skillValue
  const rating = session.fields.selfRating as number | undefined
  const notes = session.fields.notes as string | undefined

  const handleDelete = async () => {
    if (confirm("Delete this session?")) {
      await sessionsRepo.delete(session.id)
    }
  }

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-colors hover:bg-[hsl(var(--accent)/0.5)]">
      {/* Date column */}
      <div className="w-16 shrink-0 text-center">
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {formatRelativeDate(session.date)}
        </div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {formatDate(session.date, "EEE")}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{formatDuration(session.durationMin)}</span>
          {skillLabel && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              · {skillLabel}
            </span>
          )}
          {(session.fields.newWordsLearned as number) > 0 && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              · {session.fields.newWordsLearned as number} words
            </span>
          )}
          {(session.fields.unitsCompleted as number) > 0 && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              · {session.fields.unitsCompleted as number} units
            </span>
          )}
        </div>
        {notes && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">{notes}</p>
        )}
      </div>

      {/* Rating */}
      {rating && rating > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <Star className="h-3 w-3 fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" />
          <span className="text-xs font-medium">{rating}</span>
        </div>
      )}

      {/* Delete (on hover) */}
      <button
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-[hsl(var(--accent))] ${
        danger ? "text-[hsl(var(--destructive))]" : ""
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
