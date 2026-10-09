/**
 * Repository layer — CRUD operations for all database tables.
 * 
 * Each repository provides typed methods for common operations.
 * All mutations automatically set createdAt/updatedAt timestamps.
 */

import { db } from "./database"
import type {
  Program,
  Session,
  Goal,
  Reminder,
  ScheduledSession,
  Setting,
  ProgramStatus,
} from "./types"

// ─── Helpers ────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

// ─── Programs ───────────────────────────────────────────────

export const programsRepo = {
  async getAll(): Promise<Program[]> {
    return db.programs.toArray()
  },

  async getById(id: string): Promise<Program | undefined> {
    return db.programs.get(id)
  },

  async getByCategory(categoryId: string): Promise<Program[]> {
    return db.programs.where("categoryId").equals(categoryId).toArray()
  },

  async getByStatus(status: ProgramStatus): Promise<Program[]> {
    return db.programs.where("status").equals(status).toArray()
  },

  async getActive(): Promise<Program[]> {
    return db.programs.where("status").equals("active").toArray()
  },

  async create(
    data: Omit<Program, "id" | "createdAt" | "updatedAt">
  ): Promise<Program> {
    const record: Program = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.programs.add(record)
    return record
  },

  async update(
    id: string,
    changes: Partial<Omit<Program, "id" | "createdAt">>
  ): Promise<void> {
    await db.programs.update(id, { ...changes, updatedAt: now() })
  },

  async updateStatus(id: string, status: ProgramStatus): Promise<void> {
    await db.programs.update(id, { status, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction("rw", [db.programs, db.sessions, db.goals, db.reminders, db.scheduled], async () => {
      // Delete all related data
      await db.sessions.where("programId").equals(id).delete()
      await db.goals.where("programId").equals(id).delete()
      await db.reminders.where("programId").equals(id).delete()
      await db.scheduled.where("programId").equals(id).delete()
      await db.programs.delete(id)
    })
  },

  async count(): Promise<number> {
    return db.programs.count()
  },
}

// ─── Sessions ───────────────────────────────────────────────

export const sessionsRepo = {
  async getAll(): Promise<Session[]> {
    return db.sessions.toArray()
  },

  async getById(id: string): Promise<Session | undefined> {
    return db.sessions.get(id)
  },

  async getByProgram(programId: string): Promise<Session[]> {
    return db.sessions
      .where("programId")
      .equals(programId)
      .reverse()
      .sortBy("date")
  },

  async getByDate(date: string): Promise<Session[]> {
    return db.sessions.where("date").equals(date).toArray()
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Session[]> {
    return db.sessions
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray()
  },

  async getByProgramAndDateRange(
    programId: string,
    startDate: string,
    endDate: string
  ): Promise<Session[]> {
    return db.sessions
      .where("[programId+date]")
      .between([programId, startDate], [programId, endDate], true, true)
      .toArray()
  },

  async create(
    data: Omit<Session, "id" | "createdAt" | "updatedAt">
  ): Promise<Session> {
    const record: Session = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.sessions.add(record)
    return record
  },

  async update(
    id: string,
    changes: Partial<Omit<Session, "id" | "createdAt">>
  ): Promise<void> {
    await db.sessions.update(id, { ...changes, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.sessions.delete(id)
  },

  async clear(): Promise<void> {
    await db.sessions.clear()
  },

  async count(): Promise<number> {
    return db.sessions.count()
  },

  async countByProgram(programId: string): Promise<number> {
    return db.sessions.where("programId").equals(programId).count()
  },

  async getTotalMinutesByProgram(programId: string): Promise<number> {
    const sessions = await db.sessions
      .where("programId")
      .equals(programId)
      .toArray()
    return sessions.reduce((sum, s) => sum + (s.durationMin || 0), 0)
  },

  /** Get all unique dates that have sessions (for calendar heatmap) */
  async getSessionDates(): Promise<Map<string, number>> {
    const map = new Map<string, number>()
    await db.sessions.each((session) => {
      const current = map.get(session.date) || 0
      map.set(session.date, current + (session.durationMin || 0))
    })
    return map
  },
}

// ─── Goals ──────────────────────────────────────────────────

export const goalsRepo = {
  async getAll(): Promise<Goal[]> {
    return db.goals.toArray()
  },

  async getById(id: string): Promise<Goal | undefined> {
    return db.goals.get(id)
  },

  async getByProgram(programId: string): Promise<Goal[]> {
    return db.goals.where("programId").equals(programId).toArray()
  },

  async create(
    data: Omit<Goal, "id" | "createdAt" | "updatedAt">
  ): Promise<Goal> {
    const record: Goal = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.goals.add(record)
    return record
  },

  async update(
    id: string,
    changes: Partial<Omit<Goal, "id" | "createdAt">>
  ): Promise<void> {
    await db.goals.update(id, { ...changes, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.goals.delete(id)
  },
}

// ─── Reminders ──────────────────────────────────────────────

export const remindersRepo = {
  async getAll(): Promise<Reminder[]> {
    return db.reminders.toArray()
  },

  async getById(id: string): Promise<Reminder | undefined> {
    return db.reminders.get(id)
  },

  async getByProgram(programId: string): Promise<Reminder[]> {
    return db.reminders.where("programId").equals(programId).toArray()
  },

  async getEnabled(): Promise<Reminder[]> {
    return db.reminders.filter((r) => Boolean(r.enabled)).toArray()
  },

  async create(
    data: Omit<Reminder, "id" | "createdAt" | "updatedAt">
  ): Promise<Reminder> {
    const record: Reminder = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.reminders.add(record)
    return record
  },

  async update(
    id: string,
    changes: Partial<Omit<Reminder, "id" | "createdAt">>
  ): Promise<void> {
    await db.reminders.update(id, { ...changes, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.reminders.delete(id)
  },

  async markFired(id: string): Promise<void> {
    await db.reminders.update(id, { lastFiredAt: now(), updatedAt: now() })
  },
}

// ─── Scheduled Sessions ────────────────────────────────────

export const scheduledRepo = {
  async getAll(): Promise<ScheduledSession[]> {
    return db.scheduled.toArray()
  },

  async getById(id: string): Promise<ScheduledSession | undefined> {
    return db.scheduled.get(id)
  },

  async getByDate(date: string): Promise<ScheduledSession[]> {
    return db.scheduled.where("date").equals(date).toArray()
  },

  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ScheduledSession[]> {
    return db.scheduled
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray()
  },

  async getByProgram(programId: string): Promise<ScheduledSession[]> {
    return db.scheduled.where("programId").equals(programId).toArray()
  },

  async getUpcoming(fromDate: string): Promise<ScheduledSession[]> {
    return db.scheduled
      .where("date")
      .aboveOrEqual(fromDate)
      .and((s) => !s.done)
      .toArray()
  },

  async create(
    data: Omit<ScheduledSession, "id" | "createdAt" | "updatedAt">
  ): Promise<ScheduledSession> {
    const record: ScheduledSession = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.scheduled.add(record)
    return record
  },

  async update(
    id: string,
    changes: Partial<Omit<ScheduledSession, "id" | "createdAt">>
  ): Promise<void> {
    await db.scheduled.update(id, { ...changes, updatedAt: now() })
  },

  async markDone(id: string): Promise<void> {
    await db.scheduled.update(id, { done: true, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.scheduled.delete(id)
  },
}

// ─── Settings ───────────────────────────────────────────────

export const settingsRepo = {
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const record = await db.settings.get(key)
    return record?.value as T | undefined
  },

  async getAll(): Promise<Setting[]> {
    return db.settings.toArray()
  },

  async set(key: string, value: unknown): Promise<void> {
    await db.settings.put({ key, value })
  },

  async delete(key: string): Promise<void> {
    await db.settings.delete(key)
  },

  async getMultiple(keys: string[]): Promise<Record<string, unknown>> {
    const records = await db.settings.where("key").anyOf(keys).toArray()
    const result: Record<string, unknown> = {}
    for (const r of records) {
      result[r.key] = r.value
    }
    return result
  },
}

// ─── Bulk Operations ────────────────────────────────────────

export const bulkOps = {
  /** Delete ALL data from ALL tables */
  async deleteEverything(): Promise<void> {
    await db.transaction(
      "rw",
      [db.programs, db.sessions, db.goals, db.reminders, db.scheduled, db.settings],
      async () => {
        await db.programs.clear()
        await db.sessions.clear()
        await db.goals.clear()
        await db.reminders.clear()
        await db.scheduled.clear()
        await db.settings.clear()
      }
    )
  },

  /** Clear only session logs/tracks, leaving programs, goals, and schedules intact */
  async clearSessions(): Promise<void> {
    await db.sessions.clear()
  },

  /** Get counts for all tables (for summary/debug) */
  async getCounts(): Promise<Record<string, number>> {
    const [programs, sessions, goals, reminders, scheduled, settings] =
      await Promise.all([
        db.programs.count(),
        db.sessions.count(),
        db.goals.count(),
        db.reminders.count(),
        db.scheduled.count(),
        db.settings.count(),
      ])
    return { programs, sessions, goals, reminders, scheduled, settings }
  },
}
