/**
 * Goal Calculator
 * 
 * Computes progress toward goals based on session data
 * and goal type definitions from templates.
 */

import type { GoalTypeDef } from "../templates/types"
import type { Session, Goal } from "../db/types"
import { getWeekStart, getWeekEnd, toDateKey, startOfMonth, endOfMonth } from "@/lib/dates"

export interface GoalProgress {
  goal: Goal
  goalType: GoalTypeDef
  /** Current value achieved in the period */
  current: number
  /** Target value */
  target: number
  /** Progress as 0-1 fraction */
  progress: number
  /** Human-readable status */
  status: "ahead" | "on-track" | "behind" | "completed"
}

/**
 * Calculate progress for a single goal.
 */
export function calculateGoalProgress(
  goal: Goal,
  goalType: GoalTypeDef,
  sessions: Session[]
): GoalProgress {
  const now = new Date()

  // Determine the period window
  let periodStart: string
  let periodEnd: string

  switch (goal.period) {
    case "daily":
      periodStart = toDateKey(now)
      periodEnd = periodStart
      break
    case "weekly":
      periodStart = toDateKey(getWeekStart(now))
      periodEnd = toDateKey(getWeekEnd(now))
      break
    case "monthly":
      periodStart = toDateKey(startOfMonth(now))
      periodEnd = toDateKey(endOfMonth(now))
      break
  }

  // Filter sessions to the period
  const periodSessions = sessions.filter(
    (s) => s.date >= periodStart && s.date <= periodEnd
  )

  // Aggregate
  let current: number

  if (goalType.aggregation === "count") {
    current = periodSessions.length
  } else {
    // Sum the specified field
    current = periodSessions.reduce((sum, session) => {
      const value = getSessionFieldValue(session, goalType.sessionField)
      return sum + (typeof value === "number" ? value : 0)
    }, 0)
  }

  const progress = goal.target > 0 ? Math.min(current / goal.target, 1) : 0
  const status = getGoalStatus(progress)

  return {
    goal,
    goalType,
    current,
    target: goal.target,
    progress,
    status,
  }
}

/**
 * Calculate progress for all goals of a program.
 */
export function calculateAllGoalProgress(
  goals: Goal[],
  goalTypes: GoalTypeDef[],
  sessions: Session[]
): GoalProgress[] {
  return goals.map((goal) => {
    const goalType = goalTypes.find((gt) => gt.id === goal.goalTypeId)
    if (!goalType) {
      return {
        goal,
        goalType: { id: goal.goalTypeId, label: "Unknown", unit: "", defaultTarget: 0, sessionField: "", aggregation: "count" as const, period: "weekly" as const },
        current: 0,
        target: goal.target,
        progress: 0,
        status: "behind" as const,
      }
    }
    return calculateGoalProgress(goal, goalType, sessions)
  })
}

/**
 * Extract a value from a session, supporting nested field access.
 * Supports "durationMin" (top-level) and "fields.xyz" (nested) paths.
 */
function getSessionFieldValue(session: Session, fieldPath: string): unknown {
  if (fieldPath.startsWith("fields.")) {
    const key = fieldPath.slice(7) // Remove "fields."
    return session.fields[key]
  }
  return (session as unknown as Record<string, unknown>)[fieldPath]
}

function getGoalStatus(progress: number): GoalProgress["status"] {
  if (progress >= 1) return "completed"
  if (progress >= 0.8) return "ahead"
  if (progress >= 0.4) return "on-track"
  return "behind"
}
