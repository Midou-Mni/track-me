/**
 * React hooks for live database queries using Dexie's useLiveQuery.
 * 
 * These hooks provide reactive data — components re-render automatically
 * when the underlying IndexedDB data changes.
 */

import { useLiveQuery } from "dexie-react-hooks"
import {
  programsRepo,
  sessionsRepo,
  goalsRepo,
  remindersRepo,
  scheduledRepo,
  settingsRepo,
} from "./repositories"
import type {
  Program,
  Session,
  Goal,
  Reminder,
  ScheduledSession,
  ProgramStatus,
} from "./types"

// ─── Programs ───────────────────────────────────────────────

export function usePrograms(): Program[] | undefined {
  return useLiveQuery(() => programsRepo.getAll())
}

export function useActivePrograms(): Program[] | undefined {
  return useLiveQuery(() => programsRepo.getActive())
}

export function useProgramsByCategory(categoryId: string): Program[] | undefined {
  return useLiveQuery(() => programsRepo.getByCategory(categoryId), [categoryId])
}

export function useProgramsByStatus(status: ProgramStatus): Program[] | undefined {
  return useLiveQuery(() => programsRepo.getByStatus(status), [status])
}

export function useProgram(id: string | undefined): Program | undefined {
  return useLiveQuery(
    () => (id ? programsRepo.getById(id) : undefined),
    [id]
  )
}

export function useProgramCount(): number | undefined {
  return useLiveQuery(() => programsRepo.count())
}

// ─── Sessions ───────────────────────────────────────────────

export function useSessions(): Session[] | undefined {
  return useLiveQuery(() => sessionsRepo.getAll())
}

export function useSessionsByProgram(programId: string): Session[] | undefined {
  return useLiveQuery(
    () => sessionsRepo.getByProgram(programId),
    [programId]
  )
}

export function useSessionsByDate(date: string): Session[] | undefined {
  return useLiveQuery(() => sessionsRepo.getByDate(date), [date])
}

export function useSessionsByDateRange(
  startDate: string,
  endDate: string
): Session[] | undefined {
  return useLiveQuery(
    () => sessionsRepo.getByDateRange(startDate, endDate),
    [startDate, endDate]
  )
}

export function useSessionCount(): number | undefined {
  return useLiveQuery(() => sessionsRepo.count())
}

export function useSessionDates(): Map<string, number> | undefined {
  return useLiveQuery(() => sessionsRepo.getSessionDates())
}

// ─── Goals ──────────────────────────────────────────────────

export function useGoals(): Goal[] | undefined {
  return useLiveQuery(() => goalsRepo.getAll())
}

export function useGoalsByProgram(programId: string): Goal[] | undefined {
  return useLiveQuery(() => goalsRepo.getByProgram(programId), [programId])
}

// ─── Reminders ──────────────────────────────────────────────

export function useReminders(): Reminder[] | undefined {
  return useLiveQuery(() => remindersRepo.getAll())
}

export function useEnabledReminders(): Reminder[] | undefined {
  return useLiveQuery(() => remindersRepo.getEnabled())
}

export function useRemindersByProgram(programId: string): Reminder[] | undefined {
  return useLiveQuery(() => remindersRepo.getByProgram(programId), [programId])
}


// ─── Scheduled Sessions ────────────────────────────────────

export function useScheduledByDate(date: string): ScheduledSession[] | undefined {
  return useLiveQuery(() => scheduledRepo.getByDate(date), [date])
}

export function useScheduledByDateRange(
  startDate: string,
  endDate: string
): ScheduledSession[] | undefined {
  return useLiveQuery(
    () => scheduledRepo.getByDateRange(startDate, endDate),
    [startDate, endDate]
  )
}

export function useUpcomingScheduled(fromDate: string): ScheduledSession[] | undefined {
  return useLiveQuery(() => scheduledRepo.getUpcoming(fromDate), [fromDate])
}

export function useScheduledByProgram(programId: string): ScheduledSession[] | undefined {
  return useLiveQuery(() => scheduledRepo.getByProgram(programId), [programId])
}

// ─── Settings ───────────────────────────────────────────────

export function useSetting<T = unknown>(key: string): T | undefined {
  return useLiveQuery(() => settingsRepo.get<T>(key), [key])
}
