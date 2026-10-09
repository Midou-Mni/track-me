/**
 * Zod Schema Generator
 * 
 * Generates Zod validation schemas dynamically from FieldDef[] arrays.
 * Used for both program creation forms and session logging forms.
 */

import { z } from "zod"
import type { FieldDef } from "../templates/types"

/**
 * Generate a Zod schema from an array of FieldDefs.
 * Returns a z.object schema that validates form data.
 */
export function generateZodSchema(fields: FieldDef[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    let fieldSchema = buildFieldSchema(field)

    // Apply required/optional
    if (!field.required) {
      fieldSchema = fieldSchema.optional()
    }

    shape[field.key] = fieldSchema
  }

  return z.object(shape)
}

/**
 * Build a Zod schema for a single FieldDef based on its type.
 */
function buildFieldSchema(field: FieldDef): z.ZodTypeAny {
  switch (field.type) {
    case "text":
      return buildTextSchema(field)

    case "longtext":
      return z.string().max(2000, "Too long (max 2000 characters)")

    case "number":
      return buildNumberSchema(field)

    case "duration":
      return buildNumberSchema({ ...field, min: field.min ?? 1, max: field.max ?? 1440 })

    case "select": {
      if (field.allowCustom) {
        // Allow any string if custom options are allowed
        return z.string().min(1, `${field.label} is required`)
      }
      const values = field.options?.map((o) => o.value) ?? []
      if (values.length === 0) return z.string()
      return z.enum(values as [string, ...string[]], {
        message: `Select a valid ${field.label.toLowerCase()}`,
      })
    }

    case "multiselect":
      return z.array(z.string()).default([])

    case "tags":
      return z.array(z.string()).default([])

    case "date":
      return z.string().refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        { message: "Invalid date format (expected YYYY-MM-DD)" }
      )

    case "rating":
      return z.number()
        .int()
        .min(field.min ?? 1, `Minimum ${field.min ?? 1}`)
        .max(field.max ?? 5, `Maximum ${field.max ?? 5}`)

    case "boolean":
      return z.boolean().default(false)

    default:
      return z.unknown()
  }
}

function buildTextSchema(field: FieldDef): z.ZodString {
  let schema = z.string()
  if (field.required) {
    schema = schema.min(1, `${field.label} is required`)
  }
  return schema
}

function buildNumberSchema(field: FieldDef): z.ZodNumber {
  let schema = z.number({ message: `${field.label} must be a number` })
  if (field.min !== undefined) {
    schema = schema.min(field.min, `Minimum ${field.min}${field.unit ? ` ${field.unit}` : ""}`)
  }
  if (field.max !== undefined) {
    schema = schema.max(field.max, `Maximum ${field.max}${field.unit ? ` ${field.unit}` : ""}`)
  }
  return schema
}

/**
 * Get default values for a set of fields.
 * Used to initialize form state.
 */
export function getDefaultValues(fields: FieldDef[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}

  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue
    } else {
      // Type-specific defaults
      switch (field.type) {
        case "text":
        case "longtext":
        case "select":
        case "date":
          defaults[field.key] = ""
          break
        case "number":
        case "duration":
          defaults[field.key] = field.min ?? 0
          break
        case "rating":
          defaults[field.key] = 0
          break
        case "multiselect":
        case "tags":
          defaults[field.key] = []
          break
        case "boolean":
          defaults[field.key] = false
          break
      }
    }
  }

  return defaults
}

/**
 * Validate form data against a set of field definitions.
 * Returns { success: true, data } or { success: false, errors }.
 */
export function validateFields(
  fields: FieldDef[],
  data: Record<string, unknown>
): { success: true; data: Record<string, unknown> } | { success: false; errors: Record<string, string> } {
  const schema = generateZodSchema(fields)
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? "unknown"
    errors[key] = issue.message
  }

  return { success: false, errors }
}
