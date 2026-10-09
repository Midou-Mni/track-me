/**
 * Circular Pomodoro Timer Page
 * 
 * Features:
 * - Circular SVG round progress timer
 * - 45-minute focus session (not 20 min)
 * - Rest session featuring Today's Ayah for Hifz (حفظ) from ayahs.json
 * - Repetition counter for Quran memorization
 * - Audio recitation streaming
 * - 1-click session logging to any active program
 */

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Coffee,
  Brain,
  Sliders,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useActivePrograms, sessionsRepo } from "@/core/db"
import { CATEGORY_COLORS } from "@/lib/constants"
import { todayKey } from "@/lib/dates"
import {
  getTodayAyah,
  getAllAyahs,
  getMemorizedAyahIds,
  toggleMemorizedAyah,
  getAyahRepetitionCount,
  incrementAyahRepetition,
  resetAyahRepetition,
  type Ayah,
} from "@/lib/ayahs"
import { playFocusCompleteChime, playBreakCompleteChime } from "@/lib/chime"
import { cn } from "@/lib/utils"

type TimerMode = "focus" | "break"

const DEFAULT_FOCUS_MINUTES = 45
const DEFAULT_BREAK_MINUTES = 15

export function TimerPage() {
  const navigate = useNavigate()
  const programs = useActivePrograms()

  // Configuration
  const [focusDuration, setFocusDuration] = useState(DEFAULT_FOCUS_MINUTES)
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_MINUTES)
  const [selectedProgramId, setSelectedProgramId] = useState<string>("")

  // Timer State
  const [mode, setMode] = useState<TimerMode>("focus")
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0)

  // Show settings popup/dropdown
  const [showConfig, setShowConfig] = useState(false)

  // Session Logging State
  const [sessionLogged, setSessionLogged] = useState(false)

  // Ayah State for Rest/Break session
  const allAyahs = getAllAyahs()
  const [currentAyah, setCurrentAyah] = useState<Ayah>(getTodayAyah())
  const [repetitionCount, setRepetitionCount] = useState(() =>
    getAyahRepetitionCount(currentAyah.id)
  )
  const [memorizedIds, setMemorizedIds] = useState<number[]>(() => getMemorizedAyahIds())
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Auto-select first program
  useEffect(() => {
    if (programs && programs.length > 0 && !selectedProgramId) {
      setSelectedProgramId(programs[0].id)
    }
  }, [programs, selectedProgramId])

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleTimerCompleted()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, mode, focusDuration, breakDuration])

  // Update repetition count when ayah changes
  useEffect(() => {
    setRepetitionCount(getAyahRepetitionCount(currentAyah.id))
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlayingAudio(false)
    }
  }, [currentAyah])

  // Handle timer completion
  const handleTimerCompleted = () => {
    setIsRunning(false)
    if (mode === "focus") {
      playFocusCompleteChime()
      setCompletedSessionsCount((c) => c + 1)
      setSessionLogged(false)

      // Notify user
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🎉 45-Minute Focus Complete!", {
          body: "Great job! Time for your rest session and Quran Hifz (حفظ).",
          icon: "/icon-192.png",
        })
      }

      // Switch to break mode
      setMode("break")
      setTimeLeft(breakDuration * 60)
    } else {
      playBreakCompleteChime()
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🌿 Break Complete!", {
          body: "Rest period finished. Ready for your next focus session!",
          icon: "/icon-192.png",
        })
      }

      // Switch back to focus mode
      setMode("focus")
      setTimeLeft(focusDuration * 60)
    }
  }

  // Timer Controls
  const togglePlayPause = () => {
    setIsRunning((prev) => !prev)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft((mode === "focus" ? focusDuration : breakDuration) * 60)
  }

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft((newMode === "focus" ? focusDuration : breakDuration) * 60)
  }

  // Quick 1-click Log Session to Dexie
  const handleLogFocusSession = async () => {
    if (!selectedProgramId) return
    const prog = programs?.find((p) => p.id === selectedProgramId)
    if (!prog) return

    try {
      await sessionsRepo.create({
        programId: selectedProgramId,
        categoryId: prog.categoryId,
        date: todayKey(),
        durationMin: focusDuration,
        fields: {
          notes: `Completed ${focusDuration}-minute Pomodoro focus session.`,
        },
      })
      setSessionLogged(true)
    } catch (e) {
      alert("Failed to log session: " + (e as Error).message)
    }
  }

  // Audio Playback
  const toggleAudio = () => {
    if (!currentAyah.audioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(currentAyah.audioUrl)
      audioRef.current.onended = () => setIsPlayingAudio(false)
      audioRef.current.onerror = () => setIsPlayingAudio(false)
    } else if (audioRef.current.src !== currentAyah.audioUrl) {
      audioRef.current.src = currentAyah.audioUrl
    }

    if (isPlayingAudio) {
      audioRef.current.pause()
      setIsPlayingAudio(false)
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => setIsPlayingAudio(false))
    }
  }

  // Ayah navigation
  const nextAyah = () => {
    const currentIndex = allAyahs.findIndex((a) => a.id === currentAyah.id)
    const nextIndex = (currentIndex + 1) % allAyahs.length
    setCurrentAyah(allAyahs[nextIndex])
  }

  const prevAyah = () => {
    const currentIndex = allAyahs.findIndex((a) => a.id === currentAyah.id)
    const prevIndex = (currentIndex - 1 + allAyahs.length) % allAyahs.length
    setCurrentAyah(allAyahs[prevIndex])
  }

  const handleIncrementRepetition = () => {
    const nextCount = incrementAyahRepetition(currentAyah.id)
    setRepetitionCount(nextCount)
  }

  const handleResetRepetition = () => {
    resetAyahRepetition(currentAyah.id)
    setRepetitionCount(0)
  }

  const handleToggleMemorized = () => {
    toggleMemorizedAyah(currentAyah.id)
    setMemorizedIds(getMemorizedAyahIds())
  }

  // Circular progress calculations
  const totalSeconds = (mode === "focus" ? focusDuration : breakDuration) * 60
  const progressPercent = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  // SVG Circle parameters
  const strokeWidth = 10
  const radius = 135
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - progressPercent * circumference

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId)
  const categoryColor = selectedProgram
    ? CATEGORY_COLORS[selectedProgram.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
    : "var(--primary)"

  const isMemorized = memorizedIds.includes(currentAyah.id)

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pomodoro Timer</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Deep focus for 45 minutes, followed by Quran memorization & reflection (حفظ).
          </p>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-[hsl(var(--muted))] p-1 text-xs">
            <button
              onClick={() => switchMode("focus")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
                mode === "focus"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <Brain className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              Focus ({focusDuration}m)
            </button>
            <button
              onClick={() => switchMode("break")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
                mode === "break"
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <Coffee className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
              Rest & Hifz ({breakDuration}m)
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowConfig((c) => !c)}
            className="h-8 w-8 text-[hsl(var(--muted-foreground))]"
            title="Configure timer durations"
          >
            <Sliders className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timer Duration Adjuster (Collapsible) */}
      {showConfig && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 animate-slide-up flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Focus Duration:
            </label>
            <div className="flex gap-1">
              {[30, 45, 50, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setFocusDuration(mins)
                    if (mode === "focus" && !isRunning) setTimeLeft(mins * 60)
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                    focusDuration === mins
                      ? "bg-[hsl(var(--primary))] text-white"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Break & Hifz Duration:
            </label>
            <div className="flex gap-1">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setBreakDuration(mins)
                    if (mode === "break" && !isRunning) setTimeLeft(mins * 60)
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                    breakDuration === mins
                      ? "bg-[hsl(var(--primary))] text-white"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Program Selector */}
      {programs && programs.length > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] mr-1">
            Focus Program:
          </span>
          {programs.map((p) => {
            const color = CATEGORY_COLORS[p.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ?? "var(--primary)"
            const isSelected = selectedProgramId === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProgramId(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all border",
                  isSelected
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--foreground))] shadow-xs"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--ring)/0.3)]"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(${color})` }}
                />
                <span>{p.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ─── Circular Round Pomodoro Timer ─── */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* SVG Progress Ring */}
          <svg className="w-80 h-80 sm:w-92 sm:h-92 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke={mode === "focus" ? `hsl(${categoryColor})` : "hsl(var(--warning))"}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
            {/* Mode Tag */}
            <div
              className={cn(
                "mb-2 flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider",
                mode === "focus"
                  ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                  : "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
              )}
            >
              {mode === "focus" ? (
                <>
                  <Brain className="h-3 w-3" /> Focus Session
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3" /> Rest & Hifz
                </>
              )}
            </div>

            {/* Huge Round Time Display */}
            <div className="text-6xl sm:text-7xl font-extrabold tabular-nums tracking-tight">
              {formattedTime}
            </div>

            {/* Selected program name or status */}
            <p className="mt-2 text-xs font-medium text-[hsl(var(--muted-foreground))] truncate max-w-52">
              {mode === "focus"
                ? selectedProgram?.name ?? "Deep Work"
                : "Recite & Memorize Today's Ayah"}
            </p>

            {/* Completed sessions streak indicator */}
            {completedSessionsCount > 0 && (
              <span className="mt-1 text-[10px] text-[hsl(var(--primary))] font-bold">
                ✓ {completedSessionsCount} focus session{completedSessionsCount > 1 ? "s" : ""} finished
              </span>
            )}
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            size="lg"
            onClick={togglePlayPause}
            className={cn(
              "h-14 px-8 rounded-2xl text-base font-semibold shadow-md transition-all gap-2",
              isRunning
                ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                : "bg-[hsl(var(--primary))] text-white hover:opacity-90 active:scale-98"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" /> Start {mode === "focus" ? `${focusDuration}m Focus` : "Break"}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="h-14 w-14 rounded-2xl"
            title="Reset timer"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* 1-Click Log Session Button when focus finishes or progress has been made */}
        {selectedProgramId && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogFocusSession}
              disabled={sessionLogged}
              className="gap-1.5 text-xs h-8"
            >
              {sessionLogged ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  Session Logged!
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Log {focusDuration}m to {selectedProgram?.name}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/log?program=${selectedProgramId}&duration=${focusDuration}`)}
              className="text-xs h-8 text-[hsl(var(--muted-foreground))]"
            >
              Custom Log →
            </Button>
          </div>
        )}
      </div>

      {/* ─── Rest Session: TODAY'S AYAH FOR HIFZ (حفظ) ─── */}
      <div
        className={cn(
          "rounded-3xl border transition-all duration-500 overflow-hidden",
          mode === "break"
            ? "border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--card))] shadow-xl ring-2 ring-[hsl(var(--warning)/0.2)]"
            : "border-[hsl(var(--border))] bg-[hsl(var(--card))] opacity-95"
        )}
      >
        {/* Banner */}
        <div className="bg-[hsl(var(--muted)/0.5)] border-b border-[hsl(var(--border))] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--warning))]" />
            <span className="font-semibold text-sm">
              آية اليوم للحفظ · Today's Ayah for Memorization (Hifz)
            </span>
            {isMemorized && (
              <span className="rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] text-[10px] font-bold px-2 py-0.5">
                محفوظ ✓ Memorized
              </span>
            )}
          </div>

          {/* Ayah Navigation & Audio */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {currentAyah.audioUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAudio}
                className={cn("h-7 px-2.5 text-xs gap-1.5", isPlayingAudio && "text-[hsl(var(--primary))] border-[hsl(var(--primary))]")}
                title="Listen to Tajweed recitation"
              >
                {isPlayingAudio ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{isPlayingAudio ? "Stop" : "Listen"}</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={prevAyah}
              className="h-7 w-7"
              title="Previous Ayah"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] tabular-nums px-1">
              {currentAyah.id} / {allAyahs.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextAyah}
              className="h-7 w-7"
              title="Next Ayah"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Ayah Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Surah Reference Badge */}
          <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <span className="font-semibold text-sm text-[hsl(var(--foreground))]">
              {currentAyah.surah}
            </span>
            <span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono">
              {currentAyah.surahEn} · Ayah {currentAyah.ayahNumber}
            </span>
          </div>

          {/* Arabic Calligraphy Display */}
          <div
            dir="rtl"
            className="text-center font-serif text-2xl sm:text-3xl md:text-4xl leading-loose sm:leading-loose text-[hsl(var(--foreground))] py-2 px-2 selection:bg-[hsl(var(--primary)/0.2)]"
            style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', 'Amiri', serif" }}
          >
            {currentAyah.arabic}
          </div>

          {/* English Translation */}
          <div className="border-t border-[hsl(var(--border))] pt-4">
            <p className="text-sm sm:text-base leading-relaxed text-[hsl(var(--muted-foreground))] italic text-center">
              "{currentAyah.translation}"
            </p>
          </div>

          {/* Spiritual / Learning Benefit */}
          {currentAyah.benefit && (
            <div className="rounded-2xl bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.2)] p-4 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-[hsl(var(--foreground))]">فائدة وتدبر (Reflection): </span>
                <span className="text-[hsl(var(--muted-foreground))]">{currentAyah.benefit}</span>
              </div>
            </div>
          )}

          {/* Hifz Repetition Counter & Memorized Marker */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-[hsl(var(--border))]">
            {/* Repetition Counter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                تكرار الحفظ (Repetitions):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleIncrementRepetition}
                  className="flex items-center gap-1.5 rounded-xl bg-[hsl(var(--primary))] text-white px-3 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition-transform hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Repeat ({repetitionCount}×)
                </button>
                {repetitionCount > 0 && (
                  <button
                    onClick={handleResetRepetition}
                    className="text-[11px] text-[hsl(var(--muted-foreground))] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Memorized Toggle */}
            <Button
              variant={isMemorized ? "secondary" : "outline"}
              size="sm"
              onClick={handleToggleMemorized}
              className="gap-1.5 text-xs h-8"
            >
              <CheckCircle2
                className={cn(
                  "h-3.5 w-3.5",
                  isMemorized ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
                )}
              />
              {isMemorized ? "Marked as Memorized" : "Mark as Memorized"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
