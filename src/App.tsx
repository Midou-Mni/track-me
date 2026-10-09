import { BrowserRouter, Routes, Route } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/layout"
import { TodayPage } from "@/features/today/today-page"
import { ProgramsPage } from "@/features/programs/programs-page"
import { CreateProgramPage } from "@/features/programs/create-program-page"
import { ProgramDetailPage } from "@/features/programs/program-detail-page"
import { TimerPage } from "@/features/timer/timer-page"
import { LogPage } from "@/features/log/log-page"
import { CalendarPage } from "@/features/calendar/calendar-page"
import { StatsPage } from "@/features/stats/stats-page"
import { SettingsPage } from "@/features/settings/settings-page"

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<TodayPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/new" element={<CreateProgramPage />} />
            <Route path="/programs/:id" element={<ProgramDetailPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}
