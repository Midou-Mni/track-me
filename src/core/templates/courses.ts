import type { CategoryTemplate } from "./types"

/**
 * Courses Category Template
 * 
 * Tracks course completion progress with units/modules,
 * deadlines, pace calculations, and projected finish dates.
 */
export const coursesTemplate: CategoryTemplate = {
  id: "courses",
  name: "Courses",
  icon: "GraduationCap",
  color: "200 80% 55%",
  description: "Track your online courses, bootcamps, and structured learning.",

  // ─── Program Fields ───
  programFields: [
    {
      key: "courseName",
      label: "Course Name",
      type: "text",
      required: true,
      placeholder: "e.g., CS50, Machine Learning Specialization",
    },
    {
      key: "platform",
      label: "Platform / Provider",
      type: "select",
      required: false,
      allowCustom: true,
      options: [
        { value: "Udemy", label: "Udemy" },
        { value: "Coursera", label: "Coursera" },
        { value: "YouTube", label: "YouTube" },
        { value: "edX", label: "edX" },
        { value: "Pluralsight", label: "Pluralsight" },
        { value: "Udacity", label: "Udacity" },
        { value: "university", label: "University" },
        { value: "book", label: "Book" },
        { value: "other", label: "Other" },
      ],
    },
    {
      key: "totalUnits",
      label: "Total Units",
      type: "number",
      required: true,
      min: 1,
      max: 500,
      helpText: "Total number of modules, lessons, or chapters",
    },
    {
      key: "unitType",
      label: "Unit Type",
      type: "select",
      required: true,
      defaultValue: "modules",
      options: [
        { value: "modules", label: "Modules" },
        { value: "lessons", label: "Lessons" },
        { value: "chapters", label: "Chapters" },
        { value: "lectures", label: "Lectures" },
        { value: "videos", label: "Videos" },
        { value: "hours", label: "Hours" },
      ],
    },
    {
      key: "startDate",
      label: "Start Date",
      type: "date",
      required: false,
    },
    {
      key: "deadline",
      label: "Deadline",
      type: "date",
      required: false,
      helpText: "When do you need to finish?",
    },
  ],

  // ─── Session Fields ───
  sessionFields: [
    {
      key: "unitsCompleted",
      label: "Units Completed",
      type: "number",
      required: false,
      min: 0,
      max: 50,
      defaultValue: 0,
      unit: "units",
    },
    {
      key: "duration",
      label: "Duration",
      type: "duration",
      required: true,
      min: 1,
      max: 480,
      unit: "min",
      defaultValue: 60,
      helpText: "How long did you study?",
    },
    {
      key: "notes",
      label: "What I Covered",
      type: "longtext",
      required: false,
      placeholder: "Topics, key concepts, notes...",
    },
    {
      key: "selfRating",
      label: "Understanding",
      type: "rating",
      required: false,
      min: 1,
      max: 5,
      helpText: "How well did you understand the material?",
    },
  ],

  // ─── Goal Types ───
  goalTypes: [
    {
      id: "units-per-week",
      label: "Units per week",
      unit: "units",
      defaultTarget: 2,
      sessionField: "fields.unitsCompleted",
      aggregation: "sum",
      period: "weekly",
      icon: "BookOpen",
    },
    {
      id: "minutes-per-week",
      label: "Minutes per week",
      unit: "min",
      defaultTarget: 360,
      sessionField: "durationMin",
      aggregation: "sum",
      period: "weekly",
      icon: "Clock",
    },
    {
      id: "finish-by-date",
      label: "Finish by date",
      unit: "date",
      defaultTarget: 0,
      sessionField: "fields.unitsCompleted",
      aggregation: "sum",
      period: "weekly",
      icon: "Target",
    },
  ],

  // ─── Metrics / Charts ───
  metrics: [
    {
      id: "percent-complete",
      label: "Progress",
      chartType: "progress-ring",
      totalField: "totalUnits",
      completedField: "fields.unitsCompleted",
      description: "Overall course completion",
    },
    {
      id: "pace-status",
      label: "Pace Status",
      chartType: "number",
      description: "Ahead / on track / behind schedule",
    },
    {
      id: "projected-finish",
      label: "Projected Finish",
      chartType: "number",
      description: "Estimated completion date at current pace",
    },
    {
      id: "weekly-minutes",
      label: "Weekly Minutes",
      chartType: "bar",
      sessionField: "durationMin",
      aggregation: "sum",
      groupBy: "week",
      unit: "min",
      description: "Study time per week",
    },
    {
      id: "avg-rating",
      label: "Understanding Trend",
      chartType: "line",
      sessionField: "fields.selfRating",
      aggregation: "average",
      groupBy: "week",
      description: "How your understanding trends over time",
    },
  ],

  // ─── Reminder Presets ───
  reminderPresets: [
    {
      label: "Daily study session",
      days: [0, 1, 2, 3, 4, 5, 6],
      time: "19:00",
    },
    {
      label: "Weekday mornings",
      days: [1, 2, 3, 4, 5],
      time: "07:00",
    },
    {
      label: "Weekend deep dives",
      days: [0, 6],
      time: "09:00",
    },
  ],
}
