import Dexie, { type EntityTable } from "dexie"
import type {
  Program,
  Session,
  Goal,
  Reminder,
  ScheduledSession,
  Setting,
} from "./types"

/**
 * TrackMe Database
 * 
 * Schema version is tracked both in Dexie (for IndexedDB migrations)
 * and in the export format (for cross-device data portability).
 * 
 * Index design:
 * - programs: indexed by categoryId and status for filtered lists
 * - sessions: indexed by programId, categoryId, and date for queries
 * - goals: indexed by programId for program detail views
 * - reminders: indexed by programId and enabled for notification checks
 * - scheduled: indexed by programId, date, and done for calendar views
 * - settings: keyed by string key (no auto-increment)
 */
export class TrackMeDB extends Dexie {
  programs!: EntityTable<Program, "id">
  sessions!: EntityTable<Session, "id">
  goals!: EntityTable<Goal, "id">
  reminders!: EntityTable<Reminder, "id">
  scheduled!: EntityTable<ScheduledSession, "id">
  settings!: EntityTable<Setting, "key">

  constructor() {
    super("trackme-db")

    // Version 1 — initial schema
    this.version(1).stores({
      programs: "id, categoryId, status, updatedAt",
      sessions: "id, programId, categoryId, date, [programId+date], updatedAt",
      goals: "id, programId, updatedAt",
      reminders: "id, programId, enabled, updatedAt",
      scheduled: "id, programId, date, done, [programId+date], updatedAt",
      settings: "key",
    })

    // Future migrations go here:
    // this.version(2).stores({...}).upgrade(tx => {...})
  }
}

/** Singleton database instance */
export const db = new TrackMeDB()
