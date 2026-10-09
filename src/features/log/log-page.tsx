/**
 * Log Session Page
 * 
 * The most-used screen — must take under 15 seconds.
 * Features:
 * - Program selector (with smart default to last-used)
 * - Template-driven form with smart defaults
 * - Built-in timer that auto-fills duration
 * - Quick-log shortcut
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Timer, Play, Pause, Square, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DynamicForm } from "@/core/engine"
import { getDefaultValues } from "@/core/engine"
import { useActivePrograms, sessionsRepo } from "@/core/db"
import type { Program } from "@/core/db"
import { getTemplate } from "@/core/templates"
import { CATEGORY_COLORS } from "@/lib/constants"
import { todayKey, formatDuration } from "@/lib/dates"
import { cn } from "@/lib/utils"

export function LogPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const programs = useActivePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    searchParams.get("program")
  )
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Restore last used program from localStorage
  useEffect(() => {
    if (!selectedProgramId && programs && programs.length > 0) {
      const lastUsed = localStorage.getItem("trackme-last-program")
      if (lastUsed && programs.find((p) => p.id === lastUsed)) {
        setSelectedProgramId(lastUsed)
      } else {
        setSelectedProgramId(programs[0].id)
      }
    }
  }, [programs, selectedProgramId])

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  const startTimer = useCallback(() => {
    setTimerSeconds(0)
    setTimerRunning(true)
  }, [])

  const pauseTimer = useCallback(() => {
    setTimerRunning(false)
  }, [])

  const stopTimer = useCallback(() => {
    setTimerRunning(false)
    // Don't reset — keep the value for the form
  }, [])

  const timerMinutes = Math.ceil(timerSeconds / 60)

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId)
  const template = selectedProgram ? getTemplate(selectedProgram.categoryId) : undefined
  const categoryColor = selectedProgram
    ? CATEGORY_COLORS[selectedProgram.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
    : "var(--primary)"

  // Get defaults with timer value injected
  const getFormDefaults = () => {
    if (!template) return {}
    const defaults = getDefaultValues(template.sessionFields)
    if (timerMinutes > 0) {
      defaults.duration = timerMinutes
    }
    return defaults
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!selectedProgram || !template) return

    setSubmitting(true)
    try {
      const durationMin = (data.duration as number) || timerMinutes || 0

      await sessionsRepo.create({
        programId: selectedProgram.id,
        categoryId: selectedProgram.categoryId,
        date: todayKey(),
        durationMin,
        fields: data,
      })

      // Remember last used program
      localStorage.setItem("trackme-last-program", selectedProgram.id)

      // Show success animation
      setSubmitted(true)
      stopTimer()
      setTimerSeconds(0)

      setTimeout(() => {
        setSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to log session:", error)
      alert("Failed to log session. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (programs === undefined) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-64 rounded-2xl bg-[hsl(var(--muted))]" />
      </div>
    )
  }

  if (programs.length === 0) {
    return (
      <div className="animate-fade-in space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Log Session</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Quick-log your progress in under 15 seconds.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-20 text-center">
          <Timer className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-xl font-semibold">No active programs</h2>
          <p className="mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
            Create a program first, then come back to log sessions.
          </p>
          <Button onClick={() => navigate("/programs/new")} className="mt-4">
            Create Program
          </Button>
        </div>
      </div>
    )
  }

  // Success overlay
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-scale-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--success))] text-white shadow-lg">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Session logged! 🎉</h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Keep up the great work.</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Log Another
          </Button>
          <Button onClick={() => navigate("/")}>
            Back to Today
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Log Session</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Quick-log your progress in under 15 seconds.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/timer")}
          className="gap-2 self-start sm:self-auto border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)]"
        >
          <Timer className="h-4 w-4" />
          <span>45m Pomodoro & Hifz ↗</span>
        </Button>
      </div>

      {/* Program selector */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex w-full items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left transition-colors hover:bg-[hsl(var(--accent)/0.5)]"
        >
          {selectedProgram && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: `hsl(${categoryColor})` }}
            >
              {selectedProgram.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Program</div>
            <div className="font-semibold truncate">
              {selectedProgram?.name ?? "Select a program"}
            </div>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-[hsl(var(--muted-foreground))] transition-transform", showPicker && "rotate-180")} />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-lg animate-slide-down">
              {programs.map((program) => {
                const color = CATEGORY_COLORS[program.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
                return (
                  <ProgramOption
                    key={program.id}
                    program={program}
                    color={color}
                    selected={program.id === selectedProgramId}
                    onSelect={() => {
                      setSelectedProgramId(program.id)
                      setShowPicker(false)
                    }}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Timer */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm font-medium">Timer</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/timer")}
              className="h-6 text-[11px] text-[hsl(var(--primary))] px-2 gap-1"
            >
              45m Pomodoro & Hifz ↗
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!timerRunning && timerSeconds === 0 && (
              <Button size="sm" variant="outline" onClick={startTimer} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Start
              </Button>
            )}
            {timerRunning && (
              <>
                <Button size="sm" variant="outline" onClick={pauseTimer} className="gap-1.5">
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </Button>
                <Button size="sm" variant="outline" onClick={stopTimer} className="gap-1.5">
                  <Square className="h-3.5 w-3.5" />
                  Stop
                </Button>
              </>
            )}
            {!timerRunning && timerSeconds > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={() => setTimerRunning(true)} className="gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTimerSeconds(0)} className="text-xs">
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Timer display */}
        <div className={cn(
          "mt-3 text-center text-4xl font-bold tabular-nums transition-colors",
          timerRunning ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--foreground))]"
        )}>
          {formatTimerDisplay(timerSeconds)}
        </div>
        {timerSeconds > 0 && (
          <p className="mt-1 text-center text-sm text-[hsl(var(--muted-foreground))]">
            ≈ {formatDuration(timerMinutes)} — will auto-fill the duration field
          </p>
        )}
      </div>

      {/* Session form */}
      {template && selectedProgram && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <DynamicForm
            key={`${selectedProgramId}-${timerMinutes}`}
            fields={template.sessionFields}
            initialValues={getFormDefaults()}
            onSubmit={handleSubmit}
            submitLabel="Log Session ✓"
            submitting={submitting}
          />
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────

function ProgramOption({
  program,
  color,
  selected,
  onSelect,
}: {
  program: Program
  color: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--accent))]",
        selected && "bg-[hsl(var(--accent))]"
      )}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: `hsl(${color})` }}
      >
        {program.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-sm">{program.name}</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{program.categoryId}</div>
      </div>
      {selected && <Check className="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />}
    </button>
  )
}

function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}
