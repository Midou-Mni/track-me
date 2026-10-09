/**
 * Data Export/Import
 * 
 * Handles JSON export/import for cross-device data portability.
 * Uses the ExportFile format defined in the DB types.
 */

import { db } from "../db/database"
import type { ExportFile } from "../db/types"
import { bulkOps } from "../db/repositories"

const SCHEMA_VERSION = 1

/**
 * Export all data to a JSON file and trigger download.
 */
export async function exportData(): Promise<void> {
  const [programs, sessions, goals, reminders, scheduled, settings] = await Promise.all([
    db.programs.toArray(),
    db.sessions.toArray(),
    db.goals.toArray(),
    db.reminders.toArray(),
    db.scheduled.toArray(),
    db.settings.toArray(),
  ])

  const exportFile: ExportFile = {
    app: "trackme",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    programs,
    sessions,
    goals,
    reminders,
    scheduled,
    settings,
  }

  const json = JSON.stringify(exportFile, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `trackme-backup-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import data from a JSON file.
 * Returns the count of records imported.
 */
export async function importData(file: File): Promise<{ success: boolean; counts?: Record<string, number>; error?: string }> {
  try {
    const text = await file.text()
    const data = JSON.parse(text) as ExportFile

    // Validate format
    if (data.app !== "trackme") {
      return { success: false, error: "Not a valid TrackMe export file." }
    }
    if (data.schemaVersion > SCHEMA_VERSION) {
      return {
        success: false,
        error: `This file was exported from a newer version (v${data.schemaVersion}). Please update your app.`,
      }
    }

    // Import all data in a transaction
    await db.transaction(
      "rw",
      [db.programs, db.sessions, db.goals, db.reminders, db.scheduled, db.settings],
      async () => {
        // Use put (upsert) to merge with existing data
        if (data.programs?.length) await db.programs.bulkPut(data.programs)
        if (data.sessions?.length) await db.sessions.bulkPut(data.sessions)
        if (data.goals?.length) await db.goals.bulkPut(data.goals)
        if (data.reminders?.length) await db.reminders.bulkPut(data.reminders)
        if (data.scheduled?.length) await db.scheduled.bulkPut(data.scheduled)
        if (data.settings?.length) await db.settings.bulkPut(data.settings)
      }
    )

    const counts = await bulkOps.getCounts()
    return { success: true, counts }
  } catch (error) {
    return { success: false, error: `Import failed: ${(error as Error).message}` }
  }
}

/**
 * Prompt user to select a file and import it.
 */
export function triggerImport(): Promise<{ success: boolean; counts?: Record<string, number>; error?: string }> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve({ success: false, error: "No file selected." })
        return
      }
      const result = await importData(file)
      resolve(result)
    }
    input.click()
  })
}
