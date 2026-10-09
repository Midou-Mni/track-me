/**
 * Template Registry
 * 
 * Central registry of all category templates.
 * Adding a new category = importing a new config file and adding it to the map.
 */

import type { CategoryTemplate } from "./types"
import { languagesTemplate } from "./languages"
import { coursesTemplate } from "./courses"

/** Map of all registered templates by ID */
const templateRegistry = new Map<string, CategoryTemplate>([
  [languagesTemplate.id, languagesTemplate],
  [coursesTemplate.id, coursesTemplate],
])

/** Get a template by category ID */
export function getTemplate(categoryId: string): CategoryTemplate | undefined {
  return templateRegistry.get(categoryId)
}

/** Get a template by category ID, or throw if not found */
export function getTemplateOrThrow(categoryId: string): CategoryTemplate {
  const template = templateRegistry.get(categoryId)
  if (!template) {
    throw new Error(`Unknown category: "${categoryId}". Available: ${getTemplateIds().join(", ")}`)
  }
  return template
}

/** Get all registered templates */
export function getAllTemplates(): CategoryTemplate[] {
  return Array.from(templateRegistry.values())
}

/** Get all registered template IDs */
export function getTemplateIds(): string[] {
  return Array.from(templateRegistry.keys())
}

/** Check if a template exists */
export function hasTemplate(categoryId: string): boolean {
  return templateRegistry.has(categoryId)
}
