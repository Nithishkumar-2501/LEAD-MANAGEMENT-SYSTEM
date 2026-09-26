"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
} from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BatteryChargingIcon,
  BlingFilledIcon,
  CalendarIcon,
  HeartbeatFilledIcon,
  HeartbeatIcon,
  MoonStarsIcon,
  MoreVerticalIcon,
  NurseFilledIcon,
  TrendUpIcon,
  WalkIcon,
  WarningFilledIcon,
} from './icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  heatmapDateLabels,
  recoveryFactors,
  recoveryHeatmapData,
  type ActivityTrendPoint,
  type HeatmapColumn,
  type HeatmapTile,
  type KeyMetric,
  type KeyMetricIcon,
  type RecoveryFactor,
  type SleepBreakdownPoint,
  type SleepRecoveryTrendPoint,
} from '../../data';
import { cn } from '@/lib/utils';

export const CHART_THEME_COLORS = {
  recovery: '#06b6d4',
  sleep: '#6366f1',
  prediction: '#6366f1',
  actions: '#0d9488',
  improving: '#10b981',
  outlook: '#0284c7',
  tooltipBg: '#0f172a',
  heatmap: {
    low: 'rgba(2, 132, 199, 0.25)',
    med: '#0284c7',
    high: '#38bdf8',
  },
} as const;

const metricIcons: Record<
  KeyMetricIcon,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  heart: HeartbeatIcon,
  walk: WalkIcon,
  moon: MoonStarsIcon,
  battery: BatteryChargingIcon,
  heartbeat: HeartbeatFilledIcon,
  nurse: NurseFilledIcon,
};

const metricIconBgMap: Record<KeyMetricIcon, string> = {
  heart: '#f43f5e',
  walk: '#0284c7',
  moon: '#6366f1',
  battery: '#10b981',
  heartbeat: '#0284c7',
  nurse: '#10b981',
};

export function KeyMetricCard({
  metric,
  className,
}: {
  metric: KeyMetric;
  className?: string;
}) {
  const Icon = metricIcons[metric.icon] || HeartbeatIcon;
  const isUp = metric.trend.direction === 'up';

  return (
    <article
      className={cn(
        'flex min-h-[9.5rem] min-w-0 flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
            style={{ backgroundColor: metricIconBgMap[metric.icon] || '#0284c7' }}
          >
            <Icon className="size-3.5" />
          </span>
          <p className="truncate text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
            {metric.label}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0 border-border/50"
              aria-label={`More about ${metric.label}`}
            >
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bionis-dashboard min-w-max"
          >
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>View trend</DropdownMenuItem>
            <DropdownMenuItem>Compare periods</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        <p className="leading-none">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{metric.value}</span>{' '}
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.unit}</span>
        </p>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
          <TrendUpIcon
            className={cn(
              isUp ? 'text-emerald-500' : 'rotate-180 text-rose-500',
            )}
          />
          <p className="text-xs">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{metric.trend.emphasis}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">{metric.trend.label}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

export function ScoreDonut({
  value,
  max = 100,
  label = 'Score',
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { value: number; max?: number; label?: string }) {
  const chartColor = '#0284c7';
  const progress = Math.min(Math.max(value / max, 0), 1);

  const pieData = [
    { name: 'Score', value: progress },
    { name: 'Remaining', value: Math.max(1 - progress, 0) },
  ];

  return (
    <div
      className={cn('relative size-28 shrink-0 flex items-center justify-center', className)}
      style={style}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={[{ value: 1 }]}
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="92%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={chartColor} fillOpacity={0.12} />
          </Pie>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="92%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            cornerRadius={10}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            <Cell key="score" fill={chartColor} />
            <Cell key="remaining" fill="transparent" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}%
        </span>
      </div>
    </div>
  );
}

export function SleepBreakdownChart({
  data,
  flaggedNights,
  className,
}: {
  data: SleepBreakdownPoint[];
  flaggedNights: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'flex min-h-[26rem] flex-col justify-between gap-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-xs">
            <MoonStarsIcon className="size-4.5" />
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">TNEA Cutoff Distribution Breakdown</h3>
        </div>
        {flaggedNights > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <WarningFilledIcon className="size-3.5" />
            {flaggedNights} Priority Brackets
          </span>
        ) : null}
      </div>

      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} height={28} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={36} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload;
                return (
                  <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                    <p className="font-semibold text-sky-400">{point.label}</p>
                    <p className="mt-1 font-bold text-white">{point.hours} Registered Candidates</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function ActivityTrendChart({
  data,
  periodLabel,
  className,
}: {
  data: ActivityTrendPoint[];
  periodLabel: string;
  className?: string;
}) {
  const reactId = useId().replace(/:/g, '');
  const stepsGradientId = `steps-fill-${reactId}`;
  const recoveryGradientId = `recovery-fill-${reactId}`;

  return (
    <article
      className={cn(
        'flex min-h-[26rem] flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-xs">
            <HeartbeatIcon className="size-4.5" />
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Lead Inflow & Counseling Velocity Trend</h3>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
          {periodLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cyan-400" />
          TNEA Inflow (x10)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-purple-500" />
          Counseling Connects
        </div>
      </div>

      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={stepsGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id={recoveryGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={36} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload;
                return (
                  <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                    <p className="font-semibold text-slate-400">{point.label}</p>
                    <p className="text-cyan-300 font-bold">Leads: {Math.round(point.steps * 10)}</p>
                    <p className="text-purple-300 font-bold">Calls: {Math.round(point.recovery * 10)}</p>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="steps" stroke="#06b6d4" strokeWidth={2.5} fill={`url(#${stepsGradientId})`} />
            <Area type="monotone" dataKey="recovery" stroke="#8b5cf6" strokeWidth={2.5} fill={`url(#${recoveryGradientId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function SleepRecoveryTrendChart({
  data,
  className,
}: {
  data: SleepRecoveryTrendPoint[];
  className?: string;
}) {
  return (
    <article className={cn('flex flex-col gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm', className)}>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Admission Intake Growth Over Time</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis dataKey="formattedDate" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="recoveryScore" stroke="#0284c7" fill="#0284c7" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function RecoveryFactorsCard({
  factors = recoveryFactors,
  className,
}: {
  factors?: RecoveryFactor[];
  className?: string;
}) {
  return (
    <article className={cn('flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm', className)}>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Admission Operational Factors</h3>
      <div className="space-y-3 mt-2">
        {factors.map((f) => (
          <div key={f.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{f.label}</span>
            <span className="font-bold text-slate-900 dark:text-white">{f.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function RecoveryHeatmapCard({
  className,
}: {
  data?: HeatmapColumn[];
  dateLabels?: string[];
  className?: string;
}) {
  return (
    <article className={cn('flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm', className)}>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Counseling Activity Heatmap</h3>
      <div className="grid grid-cols-4 gap-2 pt-4">
        {['Mon', 'Wed', 'Fri', 'Sun'].map((day) => (
          <div key={day} className="text-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
            <span className="text-xs font-semibold text-slate-500">{day}</span>
            <div className="mt-2 h-4 w-full rounded-md bg-sky-500/80" />
          </div>
        ))}
      </div>
    </article>
  );
}
