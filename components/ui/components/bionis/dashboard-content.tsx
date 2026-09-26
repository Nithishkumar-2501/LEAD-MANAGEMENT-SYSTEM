"use client";

import { useMemo, useState, type ComponentType, type SVGProps } from 'react';
import {
  AlertDiamondIcon,
  AlertTriangleIcon,
  BedIcon,
  BlingFilledIcon,
  CalendarIcon,
  CheckCircleRegularIcon,
  DropIcon,
  HeartbeatFilledIcon,
  HighKneesIcon,
  Sparkles3FilledIcon,
  VoiceIcon,
} from './icons';
import {
  ScoreDonut,
  SleepBreakdownChart,
  ActivityTrendChart,
  KeyMetricCard,
} from './shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  bodyVitals,
  currentUser,
  getActivityTrend,
  getSleepBreakdown,
  healthPredictions,
  keyMetricsByTimeline,
  recommendedActions,
  timelineOptions,
  wellnessByTimeline,
  type BodyVitalTone,
  type HealthPredictionTone,
  type RecommendedAction,
  type TimelineOptionValue,
} from '../../data';
import { cn } from '@/lib/utils';

function useGreeting(fullName: string) {
  return useMemo(() => {
    const hour = new Date().getHours();
    const firstName = fullName.split(' ')[0] ?? fullName;

    if (hour < 12) return `Good Morning, ${firstName}`;
    if (hour < 18) return `Good Afternoon, ${firstName}`;
    return `Good Evening, ${firstName}`;
  }, [fullName]);
}

const predictionToneIcon: Record<
  HealthPredictionTone,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  warning: AlertTriangleIcon,
  success: CheckCircleRegularIcon,
  danger: AlertDiamondIcon,
};

const actionIcons: Record<
  RecommendedAction['icon'],
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  bed: BedIcon,
  drop: DropIcon,
  highKnees: HighKneesIcon,
  voice: VoiceIcon,
};

function InsightBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
      {children}
    </span>
  );
}

export function DashboardContent() {
  const greeting = useGreeting(currentUser.name);
  const [timeline, setTimeline] = useState<TimelineOptionValue>('7d');
  const selectedLabel =
    timelineOptions.find((option) => option.value === timeline)?.label ??
    'Last 7 days';
  const wellness = wellnessByTimeline[timeline];
  const keyMetrics = keyMetricsByTimeline[timeline];
  const sleepBreakdown = getSleepBreakdown(timeline);
  const activityTrend = getActivityTrend(timeline);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
            {greeting}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time institutional oversight across Karur & Coimbatore campuses
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2 rounded-xl px-4 text-xs font-semibold"
            >
              <CalendarIcon className="size-4" />
              <span>{selectedLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bionis-dashboard min-w-40">
            <DropdownMenuRadioGroup
              value={timeline}
              onValueChange={(value) =>
                setTimeline(value as TimelineOptionValue)
              }
            >
              {timelineOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Overall Score Banner */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col gap-2 max-w-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Overall Admission Velocity</h2>
            <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {wellness.condition}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {wellness.summary.before}
            <span className="font-semibold text-slate-900 dark:text-white">
              {wellness.summary.highlight}
            </span>
            {wellness.summary.after}
          </p>
        </div>

        <div className="shrink-0">
          <ScoreDonut value={wellness.score} label="Target Fill" />
        </div>
      </section>

      {/* 4 Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {keyMetrics.map((metric) => (
          <KeyMetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SleepBreakdownChart
          key={`sleep-${timeline}`}
          data={sleepBreakdown.points}
          flaggedNights={sleepBreakdown.flaggedNights}
        />
        <ActivityTrendChart
          key={`activity-${timeline}`}
          data={activityTrend}
          periodLabel={selectedLabel}
        />
      </section>

      {/* 3 Insight Columns */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* AI Prediction */}
        <article className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-xs">
                <Sparkles3FilledIcon className="size-4" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">AI Admission Forecast</h3>
            </div>
            <InsightBadge>7 days outlook</InsightBadge>
          </div>

          <div className="flex flex-col gap-2.5">
            {healthPredictions.map((item) => {
              const Icon = predictionToneIcon[item.tone];
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                  <Icon className="size-4.5 mt-0.5 text-indigo-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Institutional Vitals */}
        <article className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs">
                <HeartbeatFilledIcon className="size-4" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Campus Vitals</h3>
            </div>
            <InsightBadge>All Stable</InsightBadge>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
            {bodyVitals.map((vital) => (
              <div key={vital.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/40 dark:border-white/5 last:border-none">
                <span className="text-slate-600 dark:text-slate-300 font-medium">{vital.label}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{vital.value}</span>
              </div>
            ))}
          </div>
        </article>

        {/* Recommended Actions */}
        <article className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500 text-white shadow-xs">
              <BlingFilledIcon className="size-4" />
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recommended Actions</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {recommendedActions.map((action) => {
              const Icon = actionIcons[action.icon];
              return (
                <div key={action.id} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                  <Icon className="size-4.5 mt-0.5 text-teal-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{action.title}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{action.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
