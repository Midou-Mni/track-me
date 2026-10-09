import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { liveQuery } from "dexie"
import { initializeTheme } from "@/stores/ui-store"
import { startNotificationService } from "@/services/notification-service"
import type { ScheduledReminder } from "@/services/notification-service"
import { db } from "@/core/db"
import App from "./App"
import "./index.css"

import { toDateKey } from "@/lib/dates"

// Initialize theme before first render to prevent flash
initializeTheme()

// Clean session tracks on user request — keep all programs, goals, schedules, and reminders intact
if (!localStorage.getItem("trackme_tracks_cleared_v2")) {
  db.sessions.clear().then(() => {
    localStorage.setItem("trackme_tracks_cleared_v2", "true")
    console.log("[TrackMe] Cleaned session tracks, keeping programs intact.")
  })
}

// Module-level reminder cache kept fresh via liveQuery (both recurring and scheduled)
let reminderCache: ScheduledReminder[] = []

liveQuery(async () => {
  const [reminders, scheduled, programs] = await Promise.all([
    db.reminders.toArray(),
    db.scheduled.toArray(),
    db.programs.toArray(),
  ])
  return { reminders, scheduled, programs }
}).subscribe(({ reminders, scheduled, programs }) => {
  const programMap = new Map(programs.map((p) => [p.id, p.name]))
  const todayStr = toDateKey(new Date())

  const recurring: ScheduledReminder[] = reminders.map((r) => ({
    id: r.id,
    programName: r.title,
    time: r.time,
    days: r.days,
    enabled: r.enabled,
  }))

  const scheduledToday: ScheduledReminder[] = scheduled
    .filter((s) => s.date === todayStr && s.time && !s.done)
    .map((s) => ({
      id: s.id,
      programName: s.note || programMap.get(s.programId) || "Scheduled Session",
      time: s.time!,
      date: s.date,
      enabled: !s.done,
    }))

  reminderCache = [...recurring, ...scheduledToday]
})

// Start polling — reads from the live cache each minute
startNotificationService(() => reminderCache)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
