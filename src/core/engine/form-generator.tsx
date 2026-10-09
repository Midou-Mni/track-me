/**
 * Dynamic Form Generator
 * 
 * Renders a form from any FieldDef[] array. This is the core component
 * that makes the app "smart" — different categories get different forms
 * without any category-specific UI code.
 */

import { useState, useCallback } from "react"
import { Star } from "lucide-react"
import type { FieldDef, ShowIfCondition } from "../templates/types"
import { getDefaultValues, validateFields } from "./validation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DynamicFormProps {
  /** Field definitions from the template */
  fields: FieldDef[]
  /** Initial values (for editing existing records) */
  initialValues?: Record<string, unknown>
  /** Called with validated data when form is submitted */
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  /** Called when form is cancelled */
  onCancel?: () => void
  /** Submit button label */
  submitLabel?: string
  /** Whether submission is in progress */
  submitting?: boolean
}

export function DynamicForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  submitting = false,
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(
    initialValues ?? getDefaultValues(fields)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setValue = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    // Clear error on change
    setErrors((prev) => {
      if (prev[key]) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return prev
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = validateFields(fields, values)
    if (!result.success) {
      setErrors(result.errors)
      // Focus first error field
      const firstErrorKey = Object.keys(result.errors)[0]
      if (firstErrorKey) {
        document.getElementById(`field-${firstErrorKey}`)?.focus()
      }
      return
    }

    await onSubmit(result.data)
  }

  /** Check if a field should be visible based on showIf conditions */
  const isVisible = (field: FieldDef): boolean => {
    if (!field.showIf) return true
    return evaluateShowIf(field.showIf, values)
  }

  const visibleFields = fields.filter(isVisible)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {visibleFields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={values[field.key]}
          error={errors[field.key]}
          onChange={(val) => setValue(field.key, val)}
        />
      ))}

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

// ─── Field Renderer ──────────────────────────────────────────

interface FieldRendererProps {
  field: FieldDef
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}

function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
  const id = `field-${field.key}`

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-[hsl(var(--destructive))]">*</span>}
        {field.unit && (
          <span className="ml-1 text-xs text-[hsl(var(--muted-foreground))]">
            ({field.unit})
          </span>
        )}
      </label>

      {renderInput(field, value, onChange, id)}

      {field.helpText && !error && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{field.helpText}</p>
      )}

      {error && (
        <p className="text-xs text-[hsl(var(--destructive))] animate-slide-up">{error}</p>
      )}
    </div>
  )
}

// ─── Input Renderers ──────────────────────────────────────────

const inputClasses =
  "w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"

const inputErrorClasses =
  "border-[hsl(var(--destructive))] focus:border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive)/0.3)]"

function renderInput(
  field: FieldDef,
  value: unknown,
  onChange: (value: unknown) => void,
  id: string
) {
  const hasError = false // Will be used with error prop

  switch (field.type) {
    case "text":
      return (
        <input
          id={id}
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(inputClasses, hasError && inputErrorClasses)}
        />
      )

    case "longtext":
      return (
        <textarea
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={cn(inputClasses, "resize-none", hasError && inputErrorClasses)}
        />
      )

    case "number":
      return (
        <input
          id={id}
          type="number"
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) => {
            const num = e.target.value === "" ? undefined : Number(e.target.value)
            onChange(num)
          }}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder ?? (field.min !== undefined ? String(field.min) : "")}
          className={cn(inputClasses, hasError && inputErrorClasses)}
        />
      )

    case "duration":
      return <DurationInput id={id} value={value as number} onChange={onChange} field={field} />

    case "select":
      return (
        <SelectInput
          id={id}
          value={value as string}
          onChange={onChange}
          field={field}
        />
      )

    case "multiselect":
      return (
        <MultiselectInput
          value={(value as string[]) ?? []}
          onChange={onChange}
          field={field}
        />
      )

    case "date":
      return (
        <input
          id={id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClasses, hasError && inputErrorClasses)}
        />
      )

    case "rating":
      return <RatingInput value={(value as number) ?? 0} onChange={onChange} max={field.max ?? 5} />

    case "boolean":
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            id={id}
            type="checkbox"
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded border-[hsl(var(--input))] text-[hsl(var(--primary))] accent-[hsl(var(--primary))]"
          />
          <span className="text-sm">{field.helpText ?? field.label}</span>
        </label>
      )

    case "tags":
      return <TagsInput value={(value as string[]) ?? []} onChange={onChange} />

    default:
      return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unsupported field type: {field.type}</p>
  }
}

// ─── Duration Input ──────────────────────────────────────────

function DurationInput({
  id,
  value,
  onChange,
  field,
}: {
  id: string
  value: number
  onChange: (v: unknown) => void
  field: FieldDef
}) {
  const presets = [15, 20, 30, 45, 60, 90]

  return (
    <div className="space-y-2">
      <input
        id={id}
        type="number"
        value={value || ""}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        min={field.min ?? 1}
        max={field.max ?? 480}
        placeholder="Minutes"
        className={inputClasses}
      />
      <div className="flex flex-wrap gap-2">
        {presets.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => onChange(minutes)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              value === minutes
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]"
            )}
          >
            {minutes}m
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Select Input ──────────────────────────────────────────

function SelectInput({
  id,
  value,
  onChange,
  field,
}: {
  id: string
  value: string
  onChange: (v: unknown) => void
  field: FieldDef
}) {
  const [customMode, setCustomMode] = useState(false)

  if (customMode && field.allowCustom) {
    return (
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Type a custom ${field.label.toLowerCase()}`}
          className={cn(inputClasses, "flex-1")}
          autoFocus
        />
        <Button type="button" variant="outline" size="sm" onClick={() => setCustomMode(false)}>
          List
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClasses, "flex-1 appearance-none cursor-pointer")}
      >
        <option value="">{field.placeholder ?? `Select ${field.label.toLowerCase()}`}</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {field.allowCustom && (
        <Button type="button" variant="outline" size="sm" onClick={() => setCustomMode(true)}>
          Custom
        </Button>
      )}
    </div>
  )
}

// ─── Multiselect Input ──────────────────────────────────────

function MultiselectInput({
  value,
  onChange,
  field,
}: {
  value: string[]
  onChange: (v: unknown) => void
  field: FieldDef
}) {
  const toggle = (optValue: string) => {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((opt) => {
        const selected = value.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-all",
              selected
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Rating Input ──────────────────────────────────────────

function RatingInput({
  value,
  onChange,
  max = 5,
}: {
  value: number
  onChange: (v: unknown) => void
  max?: number
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              star <= (hover || value)
                ? "fill-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                : "text-[hsl(var(--muted))]"
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 self-center text-sm text-[hsl(var(--muted-foreground))]">
          {value}/{max}
        </span>
      )}
    </div>
  )
}

// ─── Tags Input ──────────────────────────────────────────

function TagsInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: unknown) => void
}) {
  const [input, setInput] = useState("")

  const addTag = () => {
    const tag = input.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput("")
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((v) => v !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder="Type and press Enter"
          className={cn(inputClasses, "flex-1")}
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-[hsl(var(--secondary))] px-2.5 py-1 text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────

function evaluateShowIf(condition: ShowIfCondition, values: Record<string, unknown>): boolean {
  const fieldValue = values[condition.field]

  if (condition.equals !== undefined) {
    return fieldValue === condition.equals
  }

  if (condition.notEmpty) {
    if (Array.isArray(fieldValue)) return fieldValue.length > 0
    return fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
  }

  return true
}
