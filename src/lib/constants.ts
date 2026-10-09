/** App-wide constants */

export const APP_NAME = "TrackMe"
export const APP_DESCRIPTION = "Track your progress in everything"
export const SCHEMA_VERSION = 1

/** Week start day — 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
export const DEFAULT_WEEK_START = 6 // Saturday

/** Navigation items */
export const NAV_ITEMS = [
  { id: "today", label: "Today", path: "/", icon: "Sun" },
  { id: "programs", label: "Programs", path: "/programs", icon: "FolderOpen" },
  { id: "timer", label: "Timer", path: "/timer", icon: "Timer" },
  { id: "log", label: "Log", path: "/log", icon: "PlusCircle" },
  { id: "calendar", label: "Calendar", path: "/calendar", icon: "Calendar" },
  { id: "stats", label: "Stats", path: "/stats", icon: "BarChart3" },
  { id: "settings", label: "Settings", path: "/settings", icon: "Settings" },
] as const

/** Category accent colors — used for tinting UI per category */
export const CATEGORY_COLORS = {
  languages: { name: "Violet", hsl: "270 70% 60%", class: "text-languages" },
  courses: { name: "Sky Blue", hsl: "200 80% 55%", class: "text-courses" },
  sports: { name: "Emerald", hsl: "155 70% 45%", class: "text-sports" },
  skills: { name: "Coral", hsl: "10 80% 60%", class: "text-skills" },
  habits: { name: "Rose", hsl: "340 65% 55%", class: "text-habits" },
} as const
