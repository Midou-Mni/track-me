/**
 * Notification Service
 *
 * Handles browser Web Notifications for scheduled sessions.
 * Polls every minute, fires at -15min, -5min and on-time.
 * Runs as a singleton — call startNotificationService() once in main.
 */

const POLL_INTERVAL_MS = 60_000 // 1 minute

let pollingInterval: ReturnType<typeof setInterval> | null = null
let firedKeys = new Set<string>() // prevent duplicate fires

/** Request browser notification permission */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied"
  if (Notification.permission === "granted") return "granted"
  return Notification.requestPermission()
}

/** Check if notifications are available and granted */
export function canNotify(): boolean {
  return "Notification" in window && Notification.permission === "granted"
}

/** Show a browser notification */
function showNotification(title: string, body: string, tag: string) {
  if (!canNotify()) return
  try {
    const n = new Notification(title, {
      body,
      tag, // deduplicates same notification
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      requireInteraction: false,
      silent: false,
    })
    // Auto-close after 10s
    setTimeout(() => n.close(), 10_000)
  } catch {
    // Silently fail if blocked
  }
}

interface ScheduledReminder {
  id: string
  programName: string
  time: string // HH:MM
  days?: number[] // 0=Sun … 6=Sat
  date?: string // YYYY-MM-DD
  enabled: boolean
}

/** 
 * Main polling function — called every minute.
 * Checks all reminders and fires notifications at -15min, -5min, and 0min.
 */
function checkReminders(reminders: ScheduledReminder[]) {
  const now = new Date()
  const currentDay = now.getDay() // 0-6
  const currentH = now.getHours()
  const currentM = now.getMinutes()
  const dateStr = now.toISOString().split("T")[0]

  for (const reminder of reminders) {
    if (!reminder.enabled) continue

    // If specific date is specified, only fire on that date
    if (reminder.date && reminder.date !== dateStr) continue

    // If recurring days of week are specified, only fire on matching days
    if (reminder.days && !reminder.days.includes(currentDay)) continue

    const [rH, rM] = reminder.time.split(":").map(Number)
    if (isNaN(rH) || isNaN(rM)) continue

    const sessionMinutesFromMidnight = rH * 60 + rM
    const nowMinutesFromMidnight = currentH * 60 + currentM
    const diff = sessionMinutesFromMidnight - nowMinutesFromMidnight

    if (diff === 15) {
      const key = `${reminder.id}-${dateStr}-15`
      if (!firedKeys.has(key)) {
        firedKeys.add(key)
        showNotification(
          `⏰ ${reminder.programName} in 15 minutes`,
          `Your session starts at ${reminder.time}. Get ready!`,
          key
        )
      }
    } else if (diff === 5) {
      const key = `${reminder.id}-${dateStr}-5`
      if (!firedKeys.has(key)) {
        firedKeys.add(key)
        showNotification(
          `🚀 ${reminder.programName} in 5 minutes`,
          `Almost time! Wrap up what you're doing.`,
          key
        )
      }
    } else if (diff === 0) {
      const key = `${reminder.id}-${dateStr}-0`
      if (!firedKeys.has(key)) {
        firedKeys.add(key)
        showNotification(
          `✅ Time for ${reminder.programName}!`,
          `Your session is starting now. Let's go! 💪`,
          key
        )
      }
    }
  }

  // Clean up old fired keys (keep only today's)
  if (firedKeys.size > 200) {
    firedKeys = new Set()
  }
}

/** 
 * Start the notification polling service.
 * Call once at app startup with a function that returns current reminders.
 */
export function startNotificationService(
  getReminders: () => ScheduledReminder[]
) {
  if (pollingInterval) clearInterval(pollingInterval)

  // Check immediately, then every minute
  checkReminders(getReminders())
  pollingInterval = setInterval(() => {
    checkReminders(getReminders())
  }, POLL_INTERVAL_MS)
}

/** Stop the notification service */
export function stopNotificationService() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

export type { ScheduledReminder }
