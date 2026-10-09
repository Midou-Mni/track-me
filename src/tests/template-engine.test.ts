/**
 * Unit tests for the Template Engine
 * 
 * Tests:
 * - Template registry (loading, lookup)
 * - Zod schema generation from FieldDefs
 * - Validation of form data
 * - Default values generation
 * - Goal progress calculation
 * - Streak calculation
 */

import { describe, it, expect } from "vitest"
import { getTemplate, getAllTemplates, getTemplateIds, hasTemplate } from "../core/templates"
import { languagesTemplate } from "../core/templates/languages"
import { coursesTemplate } from "../core/templates/courses"
import { generateZodSchema, getDefaultValues, validateFields } from "../core/engine/validation"
import type { FieldDef } from "../core/templates/types"
import { calculateStreaks } from "../lib/dates"

// ─── Template Registry ──────────────────────────────────────

describe("Template Registry", () => {
  it("should return all registered templates", () => {
    const templates = getAllTemplates()
    expect(templates.length).toBe(2)
  })

  it("should return all template IDs", () => {
    const ids = getTemplateIds()
    expect(ids).toContain("languages")
    expect(ids).toContain("courses")
  })

  it("should get a template by ID", () => {
    const template = getTemplate("languages")
    expect(template).toBeDefined()
    expect(template?.name).toBe("Languages")
  })

  it("should return undefined for unknown template", () => {
    const template = getTemplate("nonexistent")
    expect(template).toBeUndefined()
  })

  it("should check template existence", () => {
    expect(hasTemplate("languages")).toBe(true)
    expect(hasTemplate("courses")).toBe(true)
    expect(hasTemplate("sports")).toBe(false)
  })
})

// ─── Languages Template ──────────────────────────────────────

describe("Languages Template", () => {
  it("should have required program fields", () => {
    const keys = languagesTemplate.programFields.map((f) => f.key)
    expect(keys).toContain("language")
    expect(keys).toContain("currentLevel")
    expect(keys).toContain("targetLevel")
    expect(keys).toContain("targetDate")
    expect(keys).toContain("resources")
  })

  it("should have required session fields", () => {
    const keys = languagesTemplate.sessionFields.map((f) => f.key)
    expect(keys).toContain("skill")
    expect(keys).toContain("duration")
    expect(keys).toContain("newWordsLearned")
    expect(keys).toContain("selfRating")
    expect(keys).toContain("notes")
  })

  it("should have goal types", () => {
    const ids = languagesTemplate.goalTypes.map((g) => g.id)
    expect(ids).toContain("minutes-per-week")
    expect(ids).toContain("new-words-per-week")
    expect(ids).toContain("sessions-per-week")
    expect(ids).toContain("daily-streak")
  })

  it("should have 6 skill options for sessions", () => {
    const skillField = languagesTemplate.sessionFields.find((f) => f.key === "skill")
    expect(skillField?.options?.length).toBe(6)
  })

  it("should have metrics", () => {
    expect(languagesTemplate.metrics.length).toBeGreaterThan(0)
  })

  it("should have reminder presets", () => {
    expect(languagesTemplate.reminderPresets.length).toBeGreaterThan(0)
  })
})

// ─── Courses Template ───────────────────────────────────────

describe("Courses Template", () => {
  it("should have required program fields", () => {
    const keys = coursesTemplate.programFields.map((f) => f.key)
    expect(keys).toContain("courseName")
    expect(keys).toContain("platform")
    expect(keys).toContain("totalUnits")
    expect(keys).toContain("deadline")
  })

  it("should have required session fields", () => {
    const keys = coursesTemplate.sessionFields.map((f) => f.key)
    expect(keys).toContain("unitsCompleted")
    expect(keys).toContain("duration")
    expect(keys).toContain("selfRating")
  })

  it("should have goal types", () => {
    expect(coursesTemplate.goalTypes.length).toBeGreaterThan(0)
  })
})

// ─── Zod Schema Generation ─────────────────────────────────

describe("Zod Schema Generation", () => {
  const testFields: FieldDef[] = [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "age", label: "Age", type: "number", min: 0, max: 150 },
    { key: "bio", label: "Bio", type: "longtext" },
    { key: "rating", label: "Rating", type: "rating", min: 1, max: 5 },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: [
        { value: "red", label: "Red" },
        { value: "blue", label: "Blue" },
      ],
    },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "active", label: "Active", type: "boolean" },
    { key: "date", label: "Date", type: "date" },
    { key: "duration", label: "Duration", type: "duration", min: 1, max: 480 },
  ]

  it("should generate a valid Zod schema", () => {
    const schema = generateZodSchema(testFields)
    expect(schema).toBeDefined()
    expect(schema.shape).toBeDefined()
  })

  it("should validate correct data", () => {
    const result = validateFields(testFields, {
      name: "John",
      age: 25,
      bio: "Hello",
      rating: 4,
      color: "red",
      tags: ["tag1"],
      active: true,
      date: "2026-01-15",
      duration: 30,
    })
    expect(result.success).toBe(true)
  })

  it("should reject missing required fields", () => {
    const result = validateFields(testFields, {
      name: "", // empty required field
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.name).toBeDefined()
    }
  })

  it("should reject out-of-range numbers", () => {
    const result = validateFields(testFields, {
      name: "Test",
      age: 200, // max is 150
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.age).toBeDefined()
    }
  })

  it("should reject invalid select values", () => {
    const result = validateFields(testFields, {
      name: "Test",
      color: "invalid-color",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.color).toBeDefined()
    }
  })

  it("should validate languages program fields", () => {
    const result = validateFields(languagesTemplate.programFields, {
      language: "Spanish",
      currentLevel: "A2",
      targetLevel: "B2",
      targetDate: "2026-12-31",
      resources: ["app", "tutor"],
    })
    expect(result.success).toBe(true)
  })

  it("should validate languages session fields", () => {
    const result = validateFields(languagesTemplate.sessionFields, {
      skill: "speaking",
      duration: 30,
      newWordsLearned: 10,
      resource: "app",
      selfRating: 4,
      notes: "Great session",
    })
    expect(result.success).toBe(true)
  })
})

// ─── Default Values ─────────────────────────────────────────

describe("Default Values", () => {
  it("should generate defaults for all field types", () => {
    const fields: FieldDef[] = [
      { key: "text", label: "Text", type: "text" },
      { key: "num", label: "Num", type: "number", defaultValue: 42 },
      { key: "dur", label: "Dur", type: "duration", defaultValue: 30 },
      { key: "sel", label: "Sel", type: "select", options: [] },
      { key: "multi", label: "Multi", type: "multiselect", options: [] },
      { key: "bool", label: "Bool", type: "boolean" },
      { key: "rat", label: "Rat", type: "rating" },
    ]

    const defaults = getDefaultValues(fields)
    expect(defaults.text).toBe("")
    expect(defaults.num).toBe(42)
    expect(defaults.dur).toBe(30)
    expect(defaults.sel).toBe("")
    expect(defaults.multi).toEqual([])
    expect(defaults.bool).toBe(false)
    expect(defaults.rat).toBe(0)
  })

  it("should use defaultValue when provided", () => {
    const fields: FieldDef[] = [
      { key: "name", label: "Name", type: "text", defaultValue: "Default" },
    ]
    const defaults = getDefaultValues(fields)
    expect(defaults.name).toBe("Default")
  })
})

// ─── Streak Calculation ─────────────────────────────────────

describe("Streak Calculation", () => {
  it("should return 0 for empty dates", () => {
    const result = calculateStreaks(new Map())
    expect(result.current).toBe(0)
    expect(result.best).toBe(0)
  })

  it("should calculate a streak of consecutive days", () => {
    const today = new Date()
    const dates = new Map<string, number>()
    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.set(d.toISOString().split("T")[0], 30)
    }

    const result = calculateStreaks(dates)
    expect(result.current).toBe(5)
    expect(result.best).toBe(5)
  })

  it("should handle gaps in streaks", () => {
    const today = new Date()
    const dates = new Map<string, number>()

    // Current streak: today + yesterday (2 days)
    dates.set(today.toISOString().split("T")[0], 30)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    dates.set(yesterday.toISOString().split("T")[0], 30)

    // Gap at day -2

    // Old streak: days -3, -4, -5 (3 days)
    for (let i = 3; i <= 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.set(d.toISOString().split("T")[0], 30)
    }

    const result = calculateStreaks(dates)
    expect(result.current).toBe(2)
    expect(result.best).toBe(3)
  })

  it("should not count a current streak if no activity today or yesterday", () => {
    const dates = new Map<string, number>()
    const today = new Date()
    // Only has activity 3 days ago
    for (let i = 3; i <= 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.set(d.toISOString().split("T")[0], 30)
    }

    const result = calculateStreaks(dates)
    expect(result.current).toBe(0)
    expect(result.best).toBe(3)
  })
})
