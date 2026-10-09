/**
 * Real user data seed for TrackMe.
 *
 * Programs:
 *  - English (B1 → C1, Duolingo + Coursera)
 *  - Spanish (A1 → B1, Duolingo + Coursera)
 *  - AI Professional Certificate (Coursera + Kaggle, 40 modules)
 *  - AI Self-Study (PDFs, YouTube, Chatbots, 30 chapters)
 */

import { programsRepo, sessionsRepo, goalsRepo, remindersRepo, scheduledRepo, settingsRepo, bulkOps } from "./repositories"
import { format, subDays, addDays } from "date-fns"

const today = () => format(new Date(), "yyyy-MM-dd")

/** Check if DB already has data */
async function hasData(): Promise<boolean> {
  const count = await programsRepo.count()
  return count > 0
}

/** Seed the database (idempotent — skips if data already exists) */
export async function seedDatabase(force = false): Promise<void> {
  if (!force && (await hasData())) {
    console.log("[seed] Database already has data, skipping.")
    return
  }

  if (force) {
    await bulkOps.deleteEverything()
  }

  console.log("[seed] Seeding with real user programs...")

  // ─── Programs ─────────────────────────────────────────────

  const english = await programsRepo.create({
    categoryId: "languages",
    name: "English",
    fields: {
      language: "English",
      currentLevel: "B1",
      targetLevel: "C1",
      resources: ["app", "course"],
    },
    status: "active",
  })

  const spanish = await programsRepo.create({
    categoryId: "languages",
    name: "Spanish",
    fields: {
      language: "Spanish",
      currentLevel: "A1",
      targetLevel: "B1",
      resources: ["app", "course"],
    },
    status: "active",
  })

  const aiPro = await programsRepo.create({
    categoryId: "courses",
    name: "AI Professional Certificate",
    fields: {
      courseName: "AI Professional Certificate",
      platform: "Coursera",
      totalUnits: 40,
      unitType: "modules",
      startDate: format(subDays(new Date(), 14), "yyyy-MM-dd"),
    },
    status: "active",
  })

  const aiStudy = await programsRepo.create({
    categoryId: "courses",
    name: "AI Self-Study",
    fields: {
      courseName: "AI Self-Study",
      platform: "other",
      totalUnits: 30,
      unitType: "chapters",
      startDate: format(subDays(new Date(), 21), "yyyy-MM-dd"),
    },
    status: "active",
  })

  // Ensure sessions (tracks) are clean — only programs, goals, and schedules exist
  await sessionsRepo.clear()

  // ─── Goals ────────────────────────────────────────────────

  // English
  await goalsRepo.create({ programId: english.id, goalTypeId: "minutes-per-week", target: 210, period: "weekly", startDate: format(subDays(new Date(), 30), "yyyy-MM-dd") })
  await goalsRepo.create({ programId: english.id, goalTypeId: "sessions-per-week", target: 7, period: "weekly", startDate: format(subDays(new Date(), 30), "yyyy-MM-dd") })
  await goalsRepo.create({ programId: english.id, goalTypeId: "new-words-per-week", target: 30, period: "weekly", startDate: format(subDays(new Date(), 30), "yyyy-MM-dd") })

  // Spanish
  await goalsRepo.create({ programId: spanish.id, goalTypeId: "minutes-per-week", target: 120, period: "weekly", startDate: format(subDays(new Date(), 21), "yyyy-MM-dd") })
  await goalsRepo.create({ programId: spanish.id, goalTypeId: "sessions-per-week", target: 5, period: "weekly", startDate: format(subDays(new Date(), 21), "yyyy-MM-dd") })
  await goalsRepo.create({ programId: spanish.id, goalTypeId: "new-words-per-week", target: 25, period: "weekly", startDate: format(subDays(new Date(), 21), "yyyy-MM-dd") })

  // AI Professional
  await goalsRepo.create({ programId: aiPro.id, goalTypeId: "minutes-per-week", target: 360, period: "weekly", startDate: format(subDays(new Date(), 14), "yyyy-MM-dd") })
  await goalsRepo.create({ programId: aiPro.id, goalTypeId: "units-per-week", target: 3, period: "weekly", startDate: format(subDays(new Date(), 14), "yyyy-MM-dd") })

  // AI Self-Study
  await goalsRepo.create({ programId: aiStudy.id, goalTypeId: "minutes-per-week", target: 240, period: "weekly", startDate: format(subDays(new Date(), 21), "yyyy-MM-dd") })
  await goalsRepo.create({ programId: aiStudy.id, goalTypeId: "units-per-week", target: 2, period: "weekly", startDate: format(subDays(new Date(), 21), "yyyy-MM-dd") })

  // ─── Reminders ────────────────────────────────────────────

  await remindersRepo.create({ programId: english.id, title: "English on Duolingo 🇬🇧", days: [0, 1, 2, 3, 4, 5, 6], time: "08:00", enabled: true })
  await remindersRepo.create({ programId: spanish.id, title: "Spanish practice 🇪🇸", days: [1, 2, 3, 4, 5], time: "08:30", enabled: true })
  await remindersRepo.create({ programId: aiPro.id, title: "AI Professional study 🤖", days: [1, 3, 5, 6], time: "19:00", enabled: true })
  await remindersRepo.create({ programId: aiStudy.id, title: "AI reading session 📚", days: [2, 4, 0], time: "20:00", enabled: true })

  // ─── Scheduled Sessions ───────────────────────────────────

  await scheduledRepo.create({ programId: english.id, date: today(), time: "08:00", durationMin: 30, note: "Duolingo + Coursera lesson", done: false })
  await scheduledRepo.create({ programId: aiPro.id, date: today(), time: "19:00", durationMin: 90, note: "AI Professional — next module", done: false })
  await scheduledRepo.create({ programId: spanish.id, date: format(addDays(new Date(), 1), "yyyy-MM-dd"), time: "08:30", durationMin: 20, note: "Duolingo streak", done: false })
  await scheduledRepo.create({ programId: aiStudy.id, date: format(addDays(new Date(), 2), "yyyy-MM-dd"), time: "20:00", durationMin: 60, note: "Read next AI chapter", done: false })

  // ─── Settings ────────────────────────────────────────────

  await settingsRepo.set("weekStartDay", 6) // Saturday
  await settingsRepo.set("schemaVersion", 1)

  const counts = await bulkOps.getCounts()
  console.log("[seed] Done!", counts)
}

/** Quick reset — wipe and reseed */
export async function resetDatabase(): Promise<void> {
  await seedDatabase(true)
}

/** Clear only tracked sessions, keeping all programs, goals, schedules, and settings */
export async function clearTrackedSessions(): Promise<void> {
  await sessionsRepo.clear()
}

