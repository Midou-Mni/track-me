import { FolderOpen, Plus, MoreVertical, Pause, Archive, Trash2, Play } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { usePrograms } from "@/core/db"
import { programsRepo, sessionsRepo } from "@/core/db"
import type { Program } from "@/core/db"
import { CATEGORY_COLORS } from "@/lib/constants"
import { formatDuration } from "@/lib/dates"
import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"

export function ProgramsPage() {
  const programs = usePrograms()
  const navigate = useNavigate()
  const isLoading = programs === undefined

  // Group programs by category
  const grouped = programs?.reduce<Record<string, Program[]>>((acc, p) => {
    const cat = p.categoryId
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {}) ?? {}

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-[hsl(var(--muted))]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[hsl(var(--muted))]" />
          ))}
        </div>
      </div>
    )
  }

  const hasPrograms = programs && programs.length > 0

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Programs
          </h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            {hasPrograms
              ? `${programs.length} program${programs.length > 1 ? "s" : ""} total`
              : "Manage your learning programs and goals."}
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => navigate("/programs/new")}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Program</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Programs grouped by category */}
      {hasPrograms &&
        Object.entries(grouped).map(([categoryId, categoryPrograms]) => (
          <div key={categoryId}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: `hsl(${
                    CATEGORY_COLORS[categoryId as keyof typeof CATEGORY_COLORS]
                      ?.hsl ?? "var(--primary)"
                  })`,
                }}
              />
              {categoryId}
            </h2>
            <div className="space-y-3">
              {categoryPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        ))}

      {/* Empty state */}
      {!hasPrograms && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)]">
            <FolderOpen className="h-8 w-8 text-[hsl(var(--primary))]" />
          </div>
          <h2 className="text-xl font-semibold">No programs yet</h2>
          <p className="mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
            Programs are what you're working on — a language you're learning,
            a course you're taking. Each one tracks your progress separately.
          </p>
          <Button size="lg" className="mt-6 gap-2" onClick={() => navigate("/programs/new")}>
            <Plus className="h-4 w-4" />
            Create Your First Program
          </Button>
        </div>
      )}
    </div>
  )
}

/** Individual program card */
function ProgramCard({ program }: { program: Program }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const categoryColor =
    CATEGORY_COLORS[program.categoryId as keyof typeof CATEGORY_COLORS]?.hsl ??
    "var(--primary)"

  // Live query for session stats
  const stats = useLiveQuery(async () => {
    const count = await sessionsRepo.countByProgram(program.id)
    const totalMin = await sessionsRepo.getTotalMinutesByProgram(program.id)
    return { count, totalMin }
  }, [program.id])

  const handleStatusChange = async (status: Program["status"]) => {
    await programsRepo.updateStatus(program.id, status)
    setMenuOpen(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete "${program.name}" and all its sessions?`)) {
      await programsRepo.delete(program.id)
    }
    setMenuOpen(false)
  }

  return (
    <div className="card-hover relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-start gap-4">
        {/* Color badge — clickable to go to detail */}
        <button
          onClick={() => navigate(`/programs/${program.id}`)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white transition-transform hover:scale-105"
          style={{ backgroundColor: `hsl(${categoryColor})` }}
        >
          {program.name.charAt(0)}
        </button>

        {/* Info — clickable to go to detail */}
        <button
          onClick={() => navigate(`/programs/${program.id}`)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{program.name}</h3>
            {program.status !== "active" && (
              <span className="shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] font-medium uppercase text-[hsl(var(--muted-foreground))]">
                {program.status}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-[hsl(var(--muted-foreground))]">
            <span>{stats?.count ?? 0} sessions</span>
            <span>·</span>
            <span>{formatDuration(stats?.totalMin ?? 0)} total</span>
          </div>
        </button>

        {/* Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-8 w-8"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] py-1 shadow-lg animate-scale-in">
                {program.status === "active" ? (
                  <MenuButton
                    icon={Pause}
                    label="Pause"
                    onClick={() => handleStatusChange("paused")}
                  />
                ) : (
                  <MenuButton
                    icon={Play}
                    label="Resume"
                    onClick={() => handleStatusChange("active")}
                  />
                )}
                <MenuButton
                  icon={Archive}
                  label="Archive"
                  onClick={() => handleStatusChange("archived")}
                />
                <div className="my-1 border-t border-[hsl(var(--border))]" />
                <MenuButton
                  icon={Trash2}
                  label="Delete"
                  onClick={handleDelete}
                  danger
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-[hsl(var(--accent))] ${
        danger ? "text-[hsl(var(--destructive))]" : ""
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
