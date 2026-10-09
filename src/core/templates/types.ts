/**
 * Template Engine Types
 * 
 * These types define the schema for category templates.
 * A CategoryTemplate is a config object that drives the entire UI:
 * forms, goals, charts, and reminders are all generated from it.
 * 
 * Adding a new category = adding one new template config file.
 */

// ─── Field Definition ───────────────────────────────────────

/** Supported field input types */
export type FieldType =
  | "text"
  | "longtext"
  | "number"
  | "select"
  | "multiselect"
  | "date"
  | "rating"     // 1-5 stars
  | "duration"   // minutes
  | "boolean"
  | "tags"

/** A single option for select/multiselect fields */
export interface FieldOption {
  value: string
  label: string
}

/** Conditional visibility for a field */
export interface ShowIfCondition {
  /** The key of the field to check */
  field: string
  /** Show this field if the referenced field's value equals this */
  equals?: unknown
  /** Show this field if the referenced field's value is not empty */
  notEmpty?: boolean
}

/** Definition of a form field — used to generate forms dynamically */
export interface FieldDef {
  /** Unique key within the template (used as form field name and DB key) */
  key: string
  /** Human-readable label */
  label: string
  /** Input type */
  type: FieldType
  /** Whether this field is required */
  required?: boolean
  /** Default value */
  defaultValue?: unknown
  /** Options for select/multiselect */
  options?: FieldOption[]
  /** Whether to allow custom/free-text options (for select/multiselect) */
  allowCustom?: boolean
  /** Min value (for number/duration/rating) */
  min?: number
  /** Max value (for number/duration/rating) */
  max?: number
  /** Unit label (e.g., "min", "words") */
  unit?: string
  /** Help text shown below the field */
  helpText?: string
  /** Conditional visibility */
  showIf?: ShowIfCondition
  /** Placeholder text */
  placeholder?: string
}

// ─── Goal Type Definition ──────────────────────────────────

/** How goal progress is computed */
export interface GoalTypeDef {
  /** Unique ID (e.g., "minutes-per-week") */
  id: string
  /** Human-readable label */
  label: string
  /** Unit for the target value */
  unit: string
  /** Default target value */
  defaultTarget: number
  /** Which session field to aggregate (e.g., "durationMin", "fields.newWordsLearned") */
  sessionField: string
  /** How to aggregate: "sum" adds values, "count" counts sessions */
  aggregation: "sum" | "count"
  /** Goal period */
  period: "daily" | "weekly" | "monthly"
  /** Icon name (Lucide) */
  icon?: string
}

// ─── Metric Definition ─────────────────────────────────────

/** Chart types supported by the stats screen */
export type ChartType = "bar" | "line" | "radar" | "progress-ring" | "number"

/** Definition of a metric/chart to show on the stats screen */
export interface MetricDef {
  /** Unique ID */
  id: string
  /** Human-readable label */
  label: string
  /** Chart type */
  chartType: ChartType
  /** Which session field(s) to use */
  sessionField?: string
  /** How to aggregate data */
  aggregation?: "sum" | "count" | "average" | "cumulative" | "latest"
  /** Group data by */
  groupBy?: "day" | "week" | "month" | "field-value"
  /** For radar charts: which field provides the categories */
  radarField?: string
  /** For progress-ring: which program field holds the total */
  totalField?: string
  /** For progress-ring: which session field holds the completed count */
  completedField?: string
  /** Unit label */
  unit?: string
  /** Description */
  description?: string
}

// ─── Reminder Preset ───────────────────────────────────────

/** Preset reminder configuration */
export interface ReminderPreset {
  /** Preset label */
  label: string
  /** Default days (0=Sun ... 6=Sat) */
  days: number[]
  /** Default time (HH:mm) */
  time: string
}

// ─── Category Template ─────────────────────────────────────

/** The full template for a category — drives the entire UI */
export interface CategoryTemplate {
  /** Unique ID (e.g., "languages", "courses") */
  id: string
  /** Human-readable name */
  name: string
  /** Lucide icon name */
  icon: string
  /** HSL color string (e.g., "270 70% 60%") */
  color: string
  /** Description shown when choosing a category */
  description: string
  /** Fields shown when creating/editing a program */
  programFields: FieldDef[]
  /** Fields shown when logging a session */
  sessionFields: FieldDef[]
  /** Available goal types */
  goalTypes: GoalTypeDef[]
  /** Metrics/charts to show on the stats screen */
  metrics: MetricDef[]
  /** Preset reminder configurations */
  reminderPresets: ReminderPreset[]
}
