/**
 * Create Program Page
 * 
 * Two-step flow:
 * 1. Pick a category (CategoryPicker)
 * 2. Fill the template-driven form (DynamicForm)
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryPicker } from "./category-picker"
import { DynamicForm } from "@/core/engine"
import { programsRepo } from "@/core/db"
import type { CategoryTemplate } from "@/core/templates/types"

export function CreateProgramPage() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<CategoryTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!selectedTemplate) return

    setSubmitting(true)
    try {
      // Use the first text field as the program name, or fall back to category name
      const nameField = selectedTemplate.programFields.find(
        (f) => f.type === "text" && f.required
      )
      const name = nameField
        ? (data[nameField.key] as string)
        : (data[selectedTemplate.programFields[0]?.key] as string) ?? selectedTemplate.name

      const program = await programsRepo.create({
        categoryId: selectedTemplate.id,
        name: name || `New ${selectedTemplate.name} Program`,
        fields: data,
        status: "active",
      })

      navigate(`/programs/${program.id}`)
    } catch (error) {
      console.error("Failed to create program:", error)
      alert("Failed to create program. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (selectedTemplate) {
              setSelectedTemplate(null)
            } else {
              navigate("/programs")
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {selectedTemplate
              ? `New ${selectedTemplate.name} Program`
              : "New Program"}
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {selectedTemplate
              ? "Fill in the details below."
              : "Step 1: Choose a category."}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <StepDot active={!selectedTemplate} completed={!!selectedTemplate} label="1" />
        <div className={`h-px flex-1 ${selectedTemplate ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--border))]"}`} />
        <StepDot active={!!selectedTemplate} completed={false} label="2" />
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
        {!selectedTemplate ? (
          <CategoryPicker onSelect={setSelectedTemplate} />
        ) : (
          <div className="space-y-4">
            {/* Category badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: `hsl(${selectedTemplate.color})` }}
            >
              {selectedTemplate.name}
            </div>

            <DynamicForm
              fields={selectedTemplate.programFields}
              onSubmit={handleSubmit}
              onCancel={() => setSelectedTemplate(null)}
              submitLabel="Create Program"
              submitting={submitting}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function StepDot({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
        completed
          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
          : active
          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] ring-4 ring-[hsl(var(--primary)/0.2)]"
          : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
      }`}
    >
      {completed ? "✓" : label}
    </div>
  )
}
