// Core database barrel export
export { db, TrackMeDB } from "./database"
export type {
  Program,
  Session,
  Goal,
  Reminder,
  ScheduledSession,
  Setting,
  ProgramStatus,
  GoalPeriod,
  AppData,
  ExportFile,
  BaseRecord,
} from "./types"
export {
  programsRepo,
  sessionsRepo,
  goalsRepo,
  remindersRepo,
  scheduledRepo,
  settingsRepo,
  bulkOps,
} from "./repositories"
export {
  usePrograms,
  useActivePrograms,
  useProgramsByCategory,
  useProgramsByStatus,
  useProgram,
  useProgramCount,
  useSessions,
  useSessionsByProgram,
  useSessionsByDate,
  useSessionsByDateRange,
  useSessionCount,
  useSessionDates,
  useGoals,
  useGoalsByProgram,
  useReminders,
  useEnabledReminders,
  useRemindersByProgram,
  useScheduledByDate,
  useScheduledByDateRange,
  useUpcomingScheduled,
  useScheduledByProgram,
  useSetting,
} from "./hooks"
export { seedDatabase, resetDatabase, clearTrackedSessions } from "./seed"
