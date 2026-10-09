/** 
 * Database types for TrackMe
 * All entities stored in IndexedDB via Dexie.js
 */

/** Program status lifecycle */
export type ProgramStatus = "active" | "paused" | "completed" | "archived"

/** Base fields shared by all records */
export interface BaseRecord {
  id: string
  createdAt: string  // ISO date string
  updatedAt: string  // ISO date string
}

/** A learning/tracking program (e.g., "Learn Spanish", "CS50 Course") */
export interface Program extends BaseRecord {
  categoryId: string
  name: string
  /** Category-specific fields, keyed by FieldDef.key */
  fields: Record<string, unknown>
  status: ProgramStatus
  /** User-chosen color override (optional, falls back to category color) */
  color?: string
}

/** A logged session — one unit of work within a program */
export interface Session extends BaseRecord {
  programId: string
  categoryId: string
  /** ISO date string (date only, no time) for grouping */
  date: string
  /** Category-specific session fields */
  fields: Record<string, unknown>
  /** Duration in minutes — extracted from fields for easy querying */
  durationMin: number
}

/** Goal period types */
export type GoalPeriod = "daily" | "weekly" | "monthly"

/** A goal attached to a program */
export interface Goal extends BaseRecord {
  programId: string
  /** References GoalTypeDef.id from the category template */
  goalTypeId: string
  /** Target value (e.g., 300 for "300 minutes/week") */
  target: number
  period: GoalPeriod
  startDate: string
  endDate?: string
}

/** A reminder (local notification) */
export interface Reminder extends BaseRecord {
  programId?: string
  title: string
  /** Days of week: 0=Sun, 1=Mon, ..., 6=Sat */
  days: number[]
  /** Time in HH:mm format */
  time: string
  enabled: boolean
  lastFiredAt?: string
}

/** A scheduled/planned session for the calendar */
export interface ScheduledSession extends BaseRecord {
  programId: string
  /** ISO date string */
  date: string
  /** Optional time in HH:mm format */
  time?: string
  /** Planned duration in minutes */
  durationMin?: number
  note?: string
  done: boolean
}

/** A key-value setting */
export interface Setting {
  key: string
  value: unknown
}

/** All table data combined — used for export/import */
export interface AppData {
  programs: Program[]
  sessions: Session[]
  goals: Goal[]
  reminders: Reminder[]
  scheduled: ScheduledSession[]
  settings: Setting[]
}

/** Export file format */
export interface ExportFile {
  app: "trackme"
  schemaVersion: number
  exportedAt: string
  programs: Program[]
  sessions: Session[]
  goals: Goal[]
  reminders: Reminder[]
  scheduled: ScheduledSession[]
  settings: Setting[]
}
