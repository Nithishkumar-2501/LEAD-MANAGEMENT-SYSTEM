"use client";

import { useState } from 'react';
import { CalendarIcon } from './icons';
import {
  KeyMetricCard,
  RecoveryFactorsCard,
  RecoveryHeatmapCard,
  SleepRecoveryTrendChart,
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
  getRecoveryHeatmap,
  getSleepRecoveryTrend,
  recoveryFactorsByTimeline,
  timelineOptions,
  trendsMetricsByTimeline,
  type TimelineOptionValue,
} from '../../data';

export function TrendsContent() {
  const [timeline, setTimeline] = useState<TimelineOptionValue>('7d');
  const selectedLabel =
    timelineOptions.find((option) => option.value === timeline)?.label ??
    'Last 7 days';
  const metrics = trendsMetricsByTimeline[timeline];
  const trendData = getSleepRecoveryTrend(timeline);
  const factors = recoveryFactorsByTimeline[timeline];
  const heatmap = getRecoveryHeatmap(timeline);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
            Intake Trends
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Historical admissions velocity and enrollment tracking
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <KeyMetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section>
        <SleepRecoveryTrendChart key={`trend-${timeline}`} data={trendData} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecoveryFactorsCard key={`factors-${timeline}`} factors={factors} />
        <RecoveryHeatmapCard
          key={`heatmap-${timeline}`}
          data={heatmap.columns}
          dateLabels={heatmap.dateLabels}
        />
      </section>
    </div>
  );
}
