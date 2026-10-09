/**
 * Quranic Ayahs dataset for Hifz (Memorization) during Pomodoro breaks.
 * Loaded from src/data/ayahs.json so developers/users can add or edit ayahs anytime.
 */

import ayahsData from "@/data/ayahs.json"

export interface Ayah {
  id: number
  surah: string
  surahEn: string
  surahNumber: number
  ayahNumber: number
  arabic: string
  translation: string
  benefit: string
  audioUrl?: string
}

export const AYAHS: Ayah[] = ayahsData as Ayah[]

/**
 * Get today's ayah deterministically based on the current calendar date.
 * Automatically rotates every day through the collection.
 */
export function getTodayAyah(): Ayah {
  if (AYAHS.length === 0) {
    return {
      id: 0,
      surah: "سورة الفاتحة",
      surahEn: "Al-Fatihah",
      surahNumber: 1,
      ayahNumber: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      benefit: "The opening of the Quran and the greatest Surah.",
    }
  }

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - startOfYear.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  const index = dayOfYear % AYAHS.length
  return AYAHS[index]
}

export function getAllAyahs(): Ayah[] {
  return AYAHS
}

export function getAyahById(id: number): Ayah | undefined {
  return AYAHS.find((a) => a.id === id)
}

/** Local storage keys for Hifz tracking */
const MEMORIZED_KEY = "trackme_memorized_ayahs"
const REPETITIONS_KEY = "trackme_ayah_repetitions"

export function getMemorizedAyahIds(): number[] {
  try {
    const raw = localStorage.getItem(MEMORIZED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function toggleMemorizedAyah(id: number): boolean {
  const list = getMemorizedAyahIds()
  const next = list.includes(id) ? list.filter((i) => i !== id) : [...list, id]
  localStorage.setItem(MEMORIZED_KEY, JSON.stringify(next))
  return next.includes(id)
}

export function getAyahRepetitionCount(id: number): number {
  try {
    const raw = localStorage.getItem(REPETITIONS_KEY)
    const map = raw ? JSON.parse(raw) : {}
    return map[id] || 0
  } catch {
    return 0
  }
}

export function incrementAyahRepetition(id: number): number {
  try {
    const raw = localStorage.getItem(REPETITIONS_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[id] = (map[id] || 0) + 1
    localStorage.setItem(REPETITIONS_KEY, JSON.stringify(map))
    return map[id]
  } catch {
    return 1
  }
}

export function resetAyahRepetition(id: number): void {
  try {
    const raw = localStorage.getItem(REPETITIONS_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[id] = 0
    localStorage.setItem(REPETITIONS_KEY, JSON.stringify(map))
  } catch {
    // silent
  }
}
