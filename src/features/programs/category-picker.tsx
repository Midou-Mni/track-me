/**
 * Category Picker
 * 
 * The first step of the "Add Program" flow.
 * Shows all available categories with their icons and descriptions.
 */

import { Languages, GraduationCap, Dumbbell, Lightbulb, Heart, type LucideIcon } from "lucide-react"
import { getAllTemplates } from "@/core/templates"
import type { CategoryTemplate } from "@/core/templates/types"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, LucideIcon> = {
  Languages,
  GraduationCap,
  Dumbbell,
  Lightbulb,
  Heart,
}

interface CategoryPickerProps {
  onSelect: (template: CategoryTemplate) => void
}

export function CategoryPicker({ onSelect }: CategoryPickerProps) {
  const templates = getAllTemplates()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">What are you tracking?</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Choose a category — each one has its own smart fields and metrics.
        </p>
      </div>

      <div className="grid gap-3">
        {templates.map((template) => {
          const Icon = ICON_MAP[template.icon] ?? Languages
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                "card-hover group flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left transition-all",
                "hover:border-[hsl(var(--ring)/0.5)]"
              )}
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-105"
                style={{ backgroundColor: `hsl(${template.color})` }}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{template.name}</h3>
                <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                  {template.description}
                </p>
              </div>
              <div className="shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1">
                →
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
