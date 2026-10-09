/**
 * Reminder expansion utility
 *
 * Converts recurring Reminder records into virtual CalendarItem entries
 * for a given date range. No DB writes — purely computed.
 */

import type { Reminder, ScheduledSession } from "@/core/db"
import { eachDayOfInterval, parseISO, format } from "@/lib/dates"

/** Unified item type for calendar display */
export interface CalendarItem {
  /** Unique key for React rendering */
  key: string
  id: string
  programId: string
  date: string        // YYYY-MM-DD
  time?: string       // HH:MM
  durationMin?: number
  note: string
  done: boolean
  /** "scheduled" = one-time DB record; "reminder" = expanded from recurring */
  type: "scheduled" | "reminder"
  reminderId?: string
}

/**
 * Expand a list of reminders into CalendarItems for the given date range.
 * Each reminder fires on the matching days within [startDate, endDate].
 */
export function expandReminders(
  reminders: Reminder[],
  startDate: string,
  endDate: string
): CalendarItem[] {
  const items: CalendarItem[] = []
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  for (const reminder of reminders) {
    if (!reminder.enabled) continue
    for (const day of days) {
      const dayOfWeek = day.getDay() // 0=Sun...6=Sat
      if (!reminder.days.includes(dayOfWeek)) continue
      const dateKey = format(day, "yyyy-MM-dd")
      items.push({
        key: `reminder-${reminder.id}-${dateKey}`,
        id: reminder.id,
        programId: reminder.programId ?? "",
        date: dateKey,
        time: reminder.time,
        note: reminder.title,
        done: false,
        type: "reminder",
        reminderId: reminder.id,
      })
    }
  }

  return items
}

/**
 * Convert a ScheduledSession DB record into a CalendarItem.
 */
export function scheduledToCalendarItem(s: ScheduledSession): CalendarItem {
  return {
    key: `scheduled-${s.id}`,
    id: s.id,
    programId: s.programId,
    date: s.date,
    time: s.time,
    durationMin: s.durationMin,
    note: s.note ?? "",
    done: s.done,
    type: "scheduled",
  }
}

/**
 * Merge scheduled sessions and expanded reminders into a unified list,
 * de-duplicating by same programId + date + time (scheduled takes priority).
 */
export function mergeCalendarItems(
  scheduled: ScheduledSession[],
  reminders: Reminder[],
  startDate: string,
  endDate: string
): CalendarItem[] {
  const scheduledItems = scheduled.map(scheduledToCalendarItem)
  const reminderItems = expandReminders(reminders, startDate, endDate)

  // De-duplicate: if a scheduled session exists for the same program+date+time
  // as a reminder, the scheduled one wins (it may be marked done etc.)
  const scheduledKeys = new Set(
    scheduledItems.map((s) => `${s.programId}-${s.date}-${s.time ?? ""}`)
  )

  const filteredReminders = reminderItems.filter(
    (r) => !scheduledKeys.has(`${r.programId}-${r.date}-${r.time ?? ""}`)
  )

  return [...scheduledItems, ...filteredReminders].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.time ?? "").localeCompare(b.time ?? "")
  })
}

/**
 * Group CalendarItems by date.
 */
export function groupByDate(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const list = map.get(item.date) ?? []
    list.push(item)
    map.set(item.date, list)
  }
  return map
}
