import type { ComponentType, SVGProps } from "react"
import {
  HomeIcon,
  TrendsIcon,
  ActivityIcon,
  RecoveryIcon,
  SleepIcon,
  ReportsIcon,
} from "./components/bionis/icons"

export type TimelineOptionValue = "7d" | "14d" | "30d"

export type TimelineOption = {
  label: string
  value: TimelineOptionValue
}

export const timelineOptions: TimelineOption[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
]

export const currentUser = {
  name: "Dr. K. Arulmurugan",
  email: "arulmurugan.cse@vsbec.in",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  age: 38,
  planStatus: "Active",
}

export type BodyVitalTone = "good" | "neutral" | "warn"
export type HealthPredictionTone = "warning" | "success" | "danger"

export interface BodyVital {
  id: string
  label: string
  value: string
  tone: BodyVitalTone
}

export const bodyVitals: BodyVital[] = [
  { id: "hr", label: "Resting Heart Rate", value: "62 bpm", tone: "good" },
  { id: "hrv", label: "Heart Rate Variability", value: "54 ms", tone: "good" },
  { id: "temp", label: "Skin Temperature", value: "+0.2°F", tone: "neutral" },
  { id: "spo2", label: "Blood Oxygen (SpO2)", value: "98%", tone: "good" },
  { id: "resp", label: "Respiratory Rate", value: "14.2 rpm", tone: "good" },
]

export interface HealthPrediction {
  id: string
  title: string
  description: string
  tone: HealthPredictionTone
}

export const healthPredictions: HealthPrediction[] = [
  {
    id: "pred-1",
    title: "Elevated Readiness",
    description: "Your cardiovascular system has recovered optimal reserve capacity for high-volume admissions counseling.",
    tone: "success",
  },
  {
    id: "pred-2",
    title: "Mild Late Afternoon Fatigue Risk",
    description: "REM sleep dipped slightly on Tuesday night. Consider a 15-minute screen break around 3:30 PM.",
    tone: "warning",
  },
  {
    id: "pred-3",
    title: "Metabolic Stability High",
    description: "Daily step variance and resting heart rate show strong circadian regularity over the past 7 days.",
    tone: "success",
  },
]

export type RecommendedAction = {
  id: string
  title: string
  description: string
  icon: "bed" | "drop" | "highKnees" | "voice"
}

export const recommendedActions: RecommendedAction[] = [
  {
    id: "act-1",
    title: "Hydration Check-in",
    description: "Drink 500ml of water before your 11:30 AM candidate counseling session.",
    icon: "drop",
  },
  {
    id: "act-2",
    title: "Postural Reset / Walk",
    description: "Complete 1,500 brisk steps across the campus quad after lunch to sustain alertness.",
    icon: "highKnees",
  },
  {
    id: "act-3",
    title: "Consistent Bedtime Goal",
    description: "Wind down by 10:45 PM tonight to lock in full 7.8 hours recovery.",
    icon: "bed",
  },
  {
    id: "act-4",
    title: "Voice Rest Interval",
    description: "Hydrate vocal cords with warm herbal tea between continuous student calls.",
    icon: "voice",
  },
]

export type KeyMetricIcon =
  | "heart"
  | "walk"
  | "moon"
  | "battery"
  | "heartbeat"
  | "nurse"

export interface KeyMetric {
  id: string
  label: string
  value: string | number
  unit: string
  icon: KeyMetricIcon
  trend: {
    direction: "up" | "down"
    emphasis: string
    label: string
  }
}

export const keyMetricsByTimeline: Record<TimelineOptionValue, KeyMetric[]> = {
  "7d": [
    {
      id: "km-steps",
      label: "Daily Steps",
      value: "9,840",
      unit: "steps",
      icon: "walk",
      trend: { direction: "up", emphasis: "+12%", label: "vs last week" },
    },
    {
      id: "km-sleep",
      label: "Avg Sleep",
      value: "7.6",
      unit: "hrs",
      icon: "moon",
      trend: { direction: "up", emphasis: "+24m", label: "vs last week" },
    },
    {
      id: "km-recovery",
      label: "Recovery Score",
      value: "88",
      unit: "%",
      icon: "battery",
      trend: { direction: "up", emphasis: "+6 pts", label: "optimal zone" },
    },
    {
      id: "km-hr",
      label: "Resting HR",
      value: "61",
      unit: "bpm",
      icon: "heart",
      trend: { direction: "up", emphasis: "-2 bpm", label: "improving baseline" },
    },
  ],
  "14d": [
    {
      id: "km-steps",
      label: "Daily Steps",
      value: "9,450",
      unit: "steps",
      icon: "walk",
      trend: { direction: "up", emphasis: "+8%", label: "vs prior 14d" },
    },
    {
      id: "km-sleep",
      label: "Avg Sleep",
      value: "7.4",
      unit: "hrs",
      icon: "moon",
      trend: { direction: "up", emphasis: "+15m", label: "steady" },
    },
    {
      id: "km-recovery",
      label: "Recovery Score",
      value: "84",
      unit: "%",
      icon: "battery",
      trend: { direction: "up", emphasis: "+4 pts", label: "stable" },
    },
    {
      id: "km-hr",
      label: "Resting HR",
      value: "62",
      unit: "bpm",
      icon: "heart",
      trend: { direction: "up", emphasis: "-1 bpm", label: "stable baseline" },
    },
  ],
  "30d": [
    {
      id: "km-steps",
      label: "Daily Steps",
      value: "9,120",
      unit: "steps",
      icon: "walk",
      trend: { direction: "up", emphasis: "+15%", label: "month over month" },
    },
    {
      id: "km-sleep",
      label: "Avg Sleep",
      value: "7.3",
      unit: "hrs",
      icon: "moon",
      trend: { direction: "up", emphasis: "+18m", label: "above goal" },
    },
    {
      id: "km-recovery",
      label: "Recovery Score",
      value: "82",
      unit: "%",
      icon: "battery",
      trend: { direction: "up", emphasis: "+5 pts", label: "healthy band" },
    },
    {
      id: "km-hr",
      label: "Resting HR",
      value: "63",
      unit: "bpm",
      icon: "heart",
      trend: { direction: "up", emphasis: "-3 bpm", label: "positive trend" },
    },
  ],
}

export const trendsMetricsByTimeline: Record<TimelineOptionValue, KeyMetric[]> = keyMetricsByTimeline

export interface WellnessData {
  condition: string
  score: number
  summary: {
    before: string
    highlight: string
    after: string
  }
}

export const wellnessByTimeline: Record<TimelineOptionValue, WellnessData> = {
  "7d": {
    condition: "Peak Cognitive & Physical Balance",
    score: 92,
    summary: {
      before: "Your biometric readiness is at ",
      highlight: "optimal institutional capacity",
      after: ". Sleep duration and HRV stability indicate high stress resilience.",
    },
  },
  "14d": {
    condition: "Consistent Recovery Reserve",
    score: 87,
    summary: {
      before: "Averaging ",
      highlight: "87% wellness score",
      after: " across two weeks of counseling calls with steady diurnal rhythms.",
    },
  },
  "30d": {
    condition: "Robust Baseline Health",
    score: 85,
    summary: {
      before: "Your 30-day biological metrics show a ",
      highlight: "sustained upward trend",
      after: " in stamina, deep sleep hours, and daily physical activity.",
    },
  },
}

export interface SleepBreakdownPoint {
  label: string
  labelLines: string[]
  hours: number
  fullDate?: string
}

export function getSleepBreakdown(timeline: TimelineOptionValue): {
  points: SleepBreakdownPoint[]
  flaggedNights: number
} {
  if (timeline === "7d") {
    return {
      points: [
        { label: "Mon", labelLines: ["Mon", "10"], hours: 7.8, fullDate: "Monday, Sep 10" },
        { label: "Tue", labelLines: ["Tue", "11"], hours: 6.2, fullDate: "Tuesday, Sep 11" },
        { label: "Wed", labelLines: ["Wed", "12"], hours: 8.1, fullDate: "Wednesday, Sep 12" },
        { label: "Thu", labelLines: ["Thu", "13"], hours: 7.5, fullDate: "Thursday, Sep 13" },
        { label: "Fri", labelLines: ["Fri", "14"], hours: 7.9, fullDate: "Friday, Sep 14" },
        { label: "Sat", labelLines: ["Sat", "15"], hours: 8.4, fullDate: "Saturday, Sep 15" },
        { label: "Sun", labelLines: ["Sun", "16"], hours: 7.6, fullDate: "Sunday, Sep 16" },
      ],
      flaggedNights: 1,
    }
  }

  if (timeline === "14d") {
    const days = ["M", "T", "W", "T", "F", "S", "S"]
    return {
      points: Array.from({ length: 14 }, (_, i) => ({
        label: `${days[i % 7]} ${i + 1}`,
        labelLines: [days[i % 7], `${i + 1}`],
        hours: 6.5 + (Math.sin(i) * 1.2 + 0.8),
        fullDate: `Day ${i + 1}`,
      })),
      flaggedNights: 2,
    }
  }

  return {
    points: Array.from({ length: 30 }, (_, i) => ({
      label: `${i + 1}`,
      labelLines: [`${i + 1}`],
      hours: 6.8 + (Math.cos(i / 2) * 1.1 + 0.6),
      fullDate: `Day ${i + 1}`,
    })),
    flaggedNights: 3,
  }
}

export interface ActivityTrendPoint {
  dateKey: string
  label: string
  showTick: boolean
  steps: number
  recovery: number
  fullDate?: string
}

export function getActivityTrend(timeline: TimelineOptionValue): ActivityTrendPoint[] {
  const count = timeline === "7d" ? 7 : timeline === "14d" ? 14 : 30
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return Array.from({ length: count }, (_, i) => {
    const dayLabel = days[i % 7]
    const stepsVal = 7.5 + (i % 3) * 1.2 + Math.sin(i) * 0.8
    const recVal = 70 + (i % 4) * 6 + Math.cos(i) * 5

    return {
      dateKey: `d-${i + 1}`,
      label: dayLabel,
      showTick: timeline === "7d" || i % 2 === 0,
      steps: Math.min(12, Math.max(5, stepsVal)),
      recovery: Math.min(95, Math.max(55, recVal)),
      fullDate: `Date: ${dayLabel}, Day #${i + 1}`,
    }
  })
}

export interface SleepRecoveryTrendPoint {
  dateKey: string
  formattedDate: string
  showTick: boolean
  sleepHrs: number
  sleepPlot: number
  recoveryScore: number
  recoveryPlot: number
  fullDate?: string
}

export function getSleepRecoveryTrend(timeline: TimelineOptionValue): SleepRecoveryTrendPoint[] {
  const count = timeline === "7d" ? 7 : timeline === "14d" ? 14 : 30

  return Array.from({ length: count }, (_, i) => {
    const sleep = 6.8 + Math.sin(i / 1.5) * 1.2
    const rec = 72 + Math.cos(i / 2) * 18

    return {
      dateKey: `trend-${i + 1}`,
      formattedDate: `Day ${i + 1}`,
      showTick: i % (timeline === "30d" ? 4 : 2) === 0,
      sleepHrs: Math.round(sleep * 10) / 10,
      sleepPlot: sleep * 10,
      recoveryScore: Math.round(rec),
      recoveryPlot: rec,
      fullDate: `2026-09-${String(i + 1).padStart(2, "0")}`,
    }
  })
}

export interface RecoveryFactor {
  id: string
  label: string
  value: string
  fillPercentage: number
  icon: "moon" | "walk" | "warning" | "alert" | "bed"
}

export const recoveryFactors: RecoveryFactor[] = [
  { id: "sleep", label: "Deep & REM Sleep Quality", value: "88%", fillPercentage: 88, icon: "moon" },
  { id: "steps", label: "Cardiovascular Movement", value: "92%", fillPercentage: 92, icon: "walk" },
  { id: "bedtime", label: "Circadian Bedtime Consistency", value: "84%", fillPercentage: 84, icon: "bed" },
  { id: "stress", label: "Autonomic Stress Recovery", value: "76%", fillPercentage: 76, icon: "warning" },
  { id: "screen", label: "Pre-bed Screen Dimming", value: "68%", fillPercentage: 68, icon: "alert" },
]

export const recoveryFactorsByTimeline: Record<TimelineOptionValue, RecoveryFactor[]> = {
  "7d": recoveryFactors,
  "14d": recoveryFactors.map((f) => ({ ...f, fillPercentage: Math.max(50, f.fillPercentage - 3) })),
  "30d": recoveryFactors.map((f) => ({ ...f, fillPercentage: Math.max(50, f.fillPercentage - 5) })),
}

export type HeatmapTile = "low" | "med" | "high"

export interface HeatmapColumn {
  id: string
  tiles: Array<{
    id: string
    level: HeatmapTile
    score: number
    date: string
    status: string
  }>
}

export const heatmapDateLabels = ["Mon", "Wed", "Fri", "Sun"]

export const recoveryHeatmapData: HeatmapColumn[] = Array.from({ length: 7 }, (_, col) => ({
  id: `col-${col}`,
  tiles: Array.from({ length: 5 }, (_, row) => {
    const score = 60 + ((col * 7 + row * 11) % 38)
    const level: HeatmapTile = score > 85 ? "high" : score > 72 ? "med" : "low"
    return {
      id: `tile-${col}-${row}`,
      level,
      score,
      date: `Sep ${col * 4 + row + 1}`,
      status: level === "high" ? "Optimal Recovery" : level === "med" ? "Normal" : "Needs Rest",
    }
  }),
}))

export function getRecoveryHeatmap(timeline: TimelineOptionValue): {
  columns: HeatmapColumn[]
  dateLabels: string[]
} {
  return {
    columns: recoveryHeatmapData,
    dateLabels: heatmapDateLabels,
  }
}

export interface NavigationItem {
  name: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  badge?: string
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/", icon: HomeIcon },
      { name: "Trends", href: "/trends", icon: TrendsIcon, badge: "Live" },
      { name: "Activity", href: "/activity", icon: ActivityIcon },
      { name: "Recovery", href: "/recovery", icon: RecoveryIcon },
      { name: "Sleep", href: "/sleep", icon: SleepIcon },
      { name: "Reports", href: "/reports", icon: ReportsIcon },
    ],
  },
]

export type NotificationIcon = "moon" | "check" | "heart" | "alert" | "activity" | "battery"
export type NotificationTone = "warning" | "success" | "info" | "danger"

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
  icon: NotificationIcon
  tone: NotificationTone
}

export const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Optimal Readiness Reached",
    description: "Heart Rate Variability peaked at 58ms last night. Peak performance zone.",
    time: "10m ago",
    unread: true,
    icon: "battery",
    tone: "success",
  },
  {
    id: "notif-2",
    title: "Hydration Reminder",
    description: "Counseling sessions active. Remember to hydrate before 12:00 PM.",
    time: "1h ago",
    unread: true,
    icon: "heart",
    tone: "info",
  },
  {
    id: "notif-3",
    title: "Daily Step Target Nearing",
    description: "You're at 8,200 of 10,000 steps today.",
    time: "2h ago",
    unread: false,
    icon: "activity",
    tone: "success",
  },
]

export const profileHealthSummary = {
  wellnessScore: 92,
  condition: "Prime Readiness",
  summary: {
    before: "Your stamina index is ",
    highlight: "8% higher than last week",
    after: ", with consistently low resting heart rate and sound recovery.",
  },
  vitals: [
    { label: "Resting HR", value: "61 bpm", tone: "good" as BodyVitalTone },
    { label: "HRV", value: "54 ms", tone: "good" as BodyVitalTone },
    { label: "SpO2", value: "98%", tone: "good" as BodyVitalTone },
    { label: "Temp", value: "+0.1°F", tone: "good" as BodyVitalTone },
  ],
}
