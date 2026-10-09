/**
 * Date utility helpers — wraps date-fns with app-specific logic.
 */

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  subDays,
  addDays,
  eachDayOfInterval,
  differenceInDays,
  isToday,
  isYesterday,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns"
import { DEFAULT_WEEK_START } from "./constants"

/** Format a date as YYYY-MM-DD (for DB storage and comparisons) */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/** Today as YYYY-MM-DD */
export function todayKey(): string {
  return toDateKey(new Date())
}

/** Get the start of the current week based on the configured week start day */
export function getWeekStart(date: Date = new Date(), weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = DEFAULT_WEEK_START as 0 | 1 | 2 | 3 | 4 | 5 | 6): Date {
  return startOfWeek(date, { weekStartsOn })
}

/** Get the end of the current week based on the configured week start day */
export function getWeekEnd(date: Date = new Date(), weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = DEFAULT_WEEK_START as 0 | 1 | 2 | 3 | 4 | 5 | 6): Date {
  return endOfWeek(date, { weekStartsOn })
}

/** Get all days in the current week */
export function getCurrentWeekDays(weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = DEFAULT_WEEK_START as 0 | 1 | 2 | 3 | 4 | 5 | 6): Date[] {
  const start = getWeekStart(new Date(), weekStartsOn)
  const end = getWeekEnd(new Date(), weekStartsOn)
  return eachDayOfInterval({ start, end })
}

/** Get all days in a month */
export function getMonthDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  })
}

/** Format a date for display */
export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, pattern)
}

/** Format a date as relative (Today, Yesterday, or the date) */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "MMM d")
}

/** Format duration in minutes to a human-readable string */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Calculate streak: count consecutive days with sessions ending at today/yesterday.
 * @param sessionDates - Map of date keys (YYYY-MM-DD) to minutes
 * @returns { current, best } streak counts
 */
export function calculateStreaks(
  sessionDates: Map<string, number>
): { current: number; best: number } {
  if (sessionDates.size === 0) return { current: 0, best: 0 }

  // Sort all dates
  const dates = Array.from(sessionDates.keys()).sort()
  
  // Calculate all streaks
  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = parseISO(dates[i - 1])
    const curr = parseISO(dates[i])
    const diff = differenceInDays(curr, prev)

    if (diff === 1) {
      tempStreak++
    } else {
      bestStreak = Math.max(bestStreak, tempStreak)
      tempStreak = 1
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak)

  // Current streak: must include today or yesterday
  const todayStr = todayKey()
  const yesterdayStr = toDateKey(subDays(new Date(), 1))

  if (sessionDates.has(todayStr) || sessionDates.has(yesterdayStr)) {
    // Count backwards from the most recent day
    const startFrom = sessionDates.has(todayStr) ? new Date() : subDays(new Date(), 1)
    currentStreak = 0
    let checkDate = startFrom

    while (sessionDates.has(toDateKey(checkDate))) {
      currentStreak++
      checkDate = subDays(checkDate, 1)
    }
  }

  return { current: currentStreak, best: Math.max(bestStreak, currentStreak) }
}

// Re-export commonly used date-fns functions
export {
  format,
  parseISO,
  subDays,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  differenceInDays,
  isToday,
  isSameMonth,
  isSameDay,
}
