import type { ComponentType, SVGProps } from 'react';
import { HomeIcon, TrendsIcon, ReportsIcon, ActivityIcon, BedIcon, DropIcon, HighKneesIcon, VoiceIcon, MoonStarsIcon, HeartbeatIcon } from './components/bionis/icons';

export type TimelineOptionValue = '7d' | '30d' | '90d' | '1y';

export const timelineOptions = [
  { value: '7d' as TimelineOptionValue, label: 'Last 7 days' },
  { value: '30d' as TimelineOptionValue, label: 'Last 30 days' },
  { value: '90d' as TimelineOptionValue, label: 'Last 90 days' },
  { value: '1y' as TimelineOptionValue, label: 'Past year' },
];

export const currentUser = {
  name: 'Executive Admin',
  email: 'admin.karur@vsb.ac.in',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  age: '36',
  planStatus: 'Active Scope',
};

export type BodyVitalTone = 'good' | 'neutral' | 'warn';

export const bodyVitals = [
  { id: '1', label: 'TNEA Lead Velocity', value: '106 Active', tone: 'good' as BodyVitalTone },
  { id: '2', label: 'Marksheet Verification', value: '12 Cleared', tone: 'good' as BodyVitalTone },
  { id: '3', label: 'Confirmed Enrolment', value: '5 Admitted', tone: 'good' as BodyVitalTone },
  { id: '4', label: 'Tuition Fee Receipts', value: '₹4,75,000', tone: 'good' as BodyVitalTone },
];

export type HealthPredictionTone = 'warning' | 'success' | 'danger';

export const healthPredictions = [
  {
    id: 'p1',
    title: 'CSE & AI/DS Capacity',
    description: 'Projected to hit 100% quota capacity within 8 days of counseling.',
    tone: 'success' as HealthPredictionTone,
  },
  {
    id: 'p2',
    title: 'Merit Cutoff Candidates',
    description: '6 applicants with 190+ TNEA cutoffs have active outreach pending.',
    tone: 'warning' as HealthPredictionTone,
  },
  {
    id: 'p3',
    title: 'Regional Inflow Surge',
    description: 'Coimbatore & Tirupur inquiries increased +24% after expo.',
    tone: 'success' as HealthPredictionTone,
  },
];

export type RecommendedAction = {
  id: string;
  title: string;
  description: string;
  icon: 'bed' | 'drop' | 'highKnees' | 'voice';
};

export const recommendedActions: RecommendedAction[] = [
  {
    id: 'a1',
    title: 'Telecall Merit Candidates (190+)',
    description: 'Connect with top percentile students to confirm scholarship waiver seats.',
    icon: 'voice',
  },
  {
    id: 'a2',
    title: 'Audit 12th PCM Marksheets',
    description: '4 candidate marksheets awaiting Anna University normalization check.',
    icon: 'drop',
  },
  {
    id: 'a3',
    title: 'Dispatch Fee Confirmation Links',
    description: 'Send Razorpay link to 5 provisionally enrolled students.',
    icon: 'highKnees',
  },
];

export const wellnessByTimeline: Record<TimelineOptionValue, {
  condition: string;
  score: number;
  summary: { before: string; highlight: string; after: string };
}> = {
  '7d': {
    condition: 'Optimal Intake Velocity',
    score: 88,
    summary: {
      before: 'Admissions allocation is pacing ',
      highlight: '+18.4% above last year',
      after: ' across Karur & Coimbatore engineering streams.',
    },
  },
  '30d': {
    condition: 'Strong Conversion Trajectory',
    score: 84,
    summary: {
      before: 'Counselor engagement maintains ',
      highlight: '92% call response rate',
      after: ' with positive marksheet document verifications.',
    },
  },
  '90d': {
    condition: 'Peak Intake Season',
    score: 91,
    summary: {
      before: 'Quarterly intake targets tracking ',
      highlight: 'at 89% quota fill',
      after: ' for core engineering and technology courses.',
    },
  },
  '1y': {
    condition: 'Institutional Milestone',
    score: 95,
    summary: {
      before: 'Overall institutional intake reflects ',
      highlight: '100% capacity in CSE & AI/DS',
      after: ' across both premier campuses.',
    },
  },
};

export type KeyMetricIcon = 'heart' | 'walk' | 'moon' | 'battery' | 'heartbeat' | 'nurse';

export type KeyMetric = {
  id: string;
  label: string;
  value: string;
  unit: string;
  icon: KeyMetricIcon;
  trend: {
    direction: 'up' | 'down';
    emphasis: string;
    label: string;
  };
};

export const keyMetricsByTimeline: Record<TimelineOptionValue, KeyMetric[]> = {
  '7d': [
    {
      id: 'km1',
      label: 'Total TNEA Leads',
      value: '106',
      unit: 'Leads',
      icon: 'walk',
      trend: { direction: 'up', emphasis: '+14.2%', label: 'vs last intake' },
    },
    {
      id: 'km2',
      label: 'Verified Marksheets',
      value: '12',
      unit: 'Audited',
      icon: 'heart',
      trend: { direction: 'up', emphasis: '+8.5%', label: '10th & 12th Cutoffs' },
    },
    {
      id: 'km3',
      label: 'Confirmed Enrolment',
      value: '5',
      unit: 'Seats',
      icon: 'moon',
      trend: { direction: 'up', emphasis: '+18%', label: 'VSB Seats Filled' },
    },
    {
      id: 'km4',
      label: 'Total Fee Receipts',
      value: '4.75',
      unit: 'Lakhs (₹)',
      icon: 'battery',
      trend: { direction: 'up', emphasis: '+12.4%', label: 'Tuition Revenue' },
    },
  ],
  '30d': [
    {
      id: 'km1',
      label: 'Total TNEA Leads',
      value: '342',
      unit: 'Leads',
      icon: 'walk',
      trend: { direction: 'up', emphasis: '+22.5%', label: 'monthly growth' },
    },
    {
      id: 'km2',
      label: 'Verified Marksheets',
      value: '48',
      unit: 'Audited',
      icon: 'heart',
      trend: { direction: 'up', emphasis: '+15.2%', label: 'verified' },
    },
    {
      id: 'km3',
      label: 'Confirmed Enrolment',
      value: '22',
      unit: 'Seats',
      icon: 'moon',
      trend: { direction: 'up', emphasis: '+25%', label: 'intake achieved' },
    },
    {
      id: 'km4',
      label: 'Total Fee Receipts',
      value: '18.2',
      unit: 'Lakhs (₹)',
      icon: 'battery',
      trend: { direction: 'up', emphasis: '+19.8%', label: 'collections' },
    },
  ],
  '90d': [
    {
      id: 'km1',
      label: 'Total TNEA Leads',
      value: '890',
      unit: 'Leads',
      icon: 'walk',
      trend: { direction: 'up', emphasis: '+31%', label: 'quarterly volume' },
    },
    {
      id: 'km2',
      label: 'Verified Marksheets',
      value: '142',
      unit: 'Audited',
      icon: 'heart',
      trend: { direction: 'up', emphasis: '+24%', label: 'documents' },
    },
    {
      id: 'km3',
      label: 'Confirmed Enrolment',
      value: '78',
      unit: 'Seats',
      icon: 'moon',
      trend: { direction: 'up', emphasis: '+28%', label: 'enrolled' },
    },
    {
      id: 'km4',
      label: 'Total Fee Receipts',
      value: '64.5',
      unit: 'Lakhs (₹)',
      icon: 'battery',
      trend: { direction: 'up', emphasis: '+26.5%', label: 'tuition revenue' },
    },
  ],
  '1y': [
    {
      id: 'km1',
      label: 'Total TNEA Leads',
      value: '2,450',
      unit: 'Leads',
      icon: 'walk',
      trend: { direction: 'up', emphasis: '+45%', label: 'annual intake' },
    },
    {
      id: 'km2',
      label: 'Verified Marksheets',
      value: '420',
      unit: 'Audited',
      icon: 'heart',
      trend: { direction: 'up', emphasis: '+38%', label: 'total verified' },
    },
    {
      id: 'km3',
      label: 'Confirmed Enrolment',
      value: '260',
      unit: 'Seats',
      icon: 'moon',
      trend: { direction: 'up', emphasis: '+35%', label: 'seats filled' },
    },
    {
      id: 'km4',
      label: 'Total Fee Receipts',
      value: '2.1',
      unit: 'Crores (₹)',
      icon: 'battery',
      trend: { direction: 'up', emphasis: '+40%', label: 'annual total' },
    },
  ],
};

export type SleepBreakdownPoint = {
  label: string;
  hours: number;
  labelLines: string[];
};

export function getSleepBreakdown(timeline: TimelineOptionValue) {
  return {
    flaggedNights: 2,
    points: [
      { label: '190+ Merit', hours: 6, labelLines: ['190+ Cutoff', 'Merit Waiver'] },
      { label: '180-189 1st', hours: 8.5, labelLines: ['180-189', 'First Class'] },
      { label: '170-179 Pref', hours: 5.2, labelLines: ['170-179', 'Preferred'] },
      { label: '<170 Mgmt', hours: 3.5, labelLines: ['<170 Cutoff', 'Management'] },
      { label: 'Sports Quota', hours: 4.8, labelLines: ['Sports', 'Quota'] },
      { label: 'NRI Quota', hours: 2.5, labelLines: ['NRI', 'Special'] },
      { label: 'Govt 7.5%', hours: 7.2, labelLines: ['Govt 7.5%', 'Preferential'] },
    ],
  };
}

export type ActivityTrendPoint = {
  dateKey: string;
  label: string;
  showTick: boolean;
  steps: number;
  recovery: number;
};

export function getActivityTrend(timeline: TimelineOptionValue): ActivityTrendPoint[] {
  return [
    { dateKey: 'Mon', label: 'Mon', showTick: true, steps: 4.5, recovery: 6.8 },
    { dateKey: 'Tue', label: 'Tue', showTick: true, steps: 6.2, recovery: 7.5 },
    { dateKey: 'Wed', label: 'Wed', showTick: true, steps: 8.1, recovery: 8.2 },
    { dateKey: 'Thu', label: 'Thu', showTick: true, steps: 7.4, recovery: 7.9 },
    { dateKey: 'Fri', label: 'Fri', showTick: true, steps: 9.3, recovery: 9.1 },
    { dateKey: 'Sat', label: 'Sat', showTick: true, steps: 6.8, recovery: 8.0 },
    { dateKey: 'Sun', label: 'Sun', showTick: true, steps: 5.4, recovery: 7.2 },
  ];
}

export type SleepRecoveryTrendPoint = {
  dateKey: string;
  formattedDate: string;
  showTick: boolean;
  sleepHrs: number;
  recoveryScore: number;
  sleepPlot: number;
  recoveryPlot: number;
};

export function getSleepRecoveryTrend(timeline: TimelineOptionValue): SleepRecoveryTrendPoint[] {
  return [
    { dateKey: 'W1', formattedDate: 'Week 1', showTick: true, sleepHrs: 7.2, recoveryScore: 82, sleepPlot: 72, recoveryPlot: 82 },
    { dateKey: 'W2', formattedDate: 'Week 2', showTick: true, sleepHrs: 7.8, recoveryScore: 86, sleepPlot: 78, recoveryPlot: 86 },
    { dateKey: 'W3', formattedDate: 'Week 3', showTick: true, sleepHrs: 8.1, recoveryScore: 89, sleepPlot: 81, recoveryPlot: 89 },
    { dateKey: 'W4', formattedDate: 'Week 4', showTick: true, sleepHrs: 8.5, recoveryScore: 92, sleepPlot: 85, recoveryPlot: 92 },
  ];
}

export const trendsMetricsByTimeline = keyMetricsByTimeline;

export type RecoveryFactor = {
  id: string;
  label: string;
  value: string;
  icon: 'moon' | 'walk' | 'warning' | 'alert' | 'bed';
  fillPercentage: number;
};

export const recoveryFactors: RecoveryFactor[] = [
  { id: 'sleep', label: 'Document Verification Speed', value: '1.2s', icon: 'moon', fillPercentage: 88 },
  { id: 'steps', label: 'Counselor Outbound Calls', value: '184 calls', icon: 'walk', fillPercentage: 74 },
  { id: 'stress', label: 'Pending Cutoff Audits', value: '4 pending', icon: 'warning', fillPercentage: 25 },
  { id: 'screen', label: 'Unreachable Lead Rate', value: '6.2%', icon: 'alert', fillPercentage: 15 },
  { id: 'bedtime', label: 'Tuition Fee Confirmation', value: '92%', icon: 'bed', fillPercentage: 92 },
];

export const recoveryFactorsByTimeline: Record<TimelineOptionValue, RecoveryFactor[]> = {
  '7d': recoveryFactors,
  '30d': recoveryFactors,
  '90d': recoveryFactors,
  '1y': recoveryFactors,
};

export type HeatmapTile = 'low' | 'med' | 'high';

export type HeatmapColumn = {
  id: string;
  tiles: Array<{
    id: string;
    level: HeatmapTile;
    score: number;
    date: string;
    status: string;
  }>;
};

export const heatmapDateLabels = ['Mon', 'Wed', 'Fri', 'Sun'];

export const recoveryHeatmapData: HeatmapColumn[] = [
  {
    id: 'c1',
    tiles: [
      { id: 't1', level: 'high', score: 92, date: 'Monday 09:00', status: 'Peak Inflow' },
      { id: 't2', level: 'med', score: 75, date: 'Monday 12:00', status: 'Active Outreach' },
      { id: 't3', level: 'high', score: 88, date: 'Monday 15:00', status: 'Counseling' },
      { id: 't4', level: 'med', score: 70, date: 'Monday 18:00', status: 'Follow-ups' },
      { id: 't5', level: 'low', score: 45, date: 'Monday 21:00', status: 'Off-hours' },
    ],
  },
  {
    id: 'c2',
    tiles: [
      { id: 't6', level: 'med', score: 68, date: 'Tuesday 09:00', status: 'Moderate Inflow' },
      { id: 't7', level: 'high', score: 95, date: 'Tuesday 12:00', status: 'Peak Verification' },
      { id: 't8', level: 'high', score: 91, date: 'Tuesday 15:00', status: 'Walk-ins' },
      { id: 't9', level: 'med', score: 78, date: 'Tuesday 18:00', status: 'Telecalls' },
      { id: 't10', level: 'low', score: 40, date: 'Tuesday 21:00', status: 'Off-hours' },
    ],
  },
  {
    id: 'c3',
    tiles: [
      { id: 't11', level: 'high', score: 85, date: 'Wednesday 09:00', status: 'High Inflow' },
      { id: 't12', level: 'high', score: 89, date: 'Wednesday 12:00', status: 'Admissions' },
      { id: 't13', level: 'med', score: 72, date: 'Wednesday 15:00', status: 'Counseling' },
      { id: 't14', level: 'high', score: 94, date: 'Wednesday 18:00', status: 'Fee Verification' },
      { id: 't15', level: 'low', score: 50, date: 'Wednesday 21:00', status: 'Off-hours' },
    ],
  },
  {
    id: 'c4',
    tiles: [
      { id: 't16', level: 'med', score: 70, date: 'Thursday 09:00', status: 'Registration' },
      { id: 't17', level: 'high', score: 96, date: 'Thursday 12:00', status: 'Merit Allocation' },
      { id: 't18', level: 'high', score: 90, date: 'Thursday 15:00', status: 'Campus Visits' },
      { id: 't19', level: 'med', score: 75, date: 'Thursday 18:00', status: 'Telecalls' },
      { id: 't20', level: 'low', score: 35, date: 'Thursday 21:00', status: 'Off-hours' },
    ],
  },
];

export function getRecoveryHeatmap(timeline: TimelineOptionValue) {
  return {
    columns: recoveryHeatmapData,
    dateLabels: heatmapDateLabels,
  };
}

export type NavigationItem = {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
};

export const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Admin Dashboard', href: '/', icon: HomeIcon },
      { name: 'Intake Trends', href: '/trends', icon: TrendsIcon, badge: 'Live' },
      { name: 'TNEA Reports', href: '/reports', icon: ReportsIcon },
      { name: 'Counseling Log', href: '/activity', icon: ActivityIcon },
    ],
  },
];

export type NotificationIcon = 'moon' | 'check' | 'heart' | 'alert' | 'activity' | 'battery';
export type NotificationTone = 'warning' | 'success' | 'info' | 'danger';

export const notifications = [
  {
    id: 'n1',
    title: 'Merit Cutoff Application',
    description: 'Applicant with 196.5 TNEA cutoff registered for CSE stream.',
    time: '5m ago',
    icon: 'check' as NotificationIcon,
    tone: 'success' as NotificationTone,
    unread: true,
  },
  {
    id: 'n2',
    title: 'Marksheet Verification Notice',
    description: '4 HSC certificates queued for Anna University normalization.',
    time: '25m ago',
    icon: 'alert' as NotificationIcon,
    tone: 'warning' as NotificationTone,
    unread: true,
  },
  {
    id: 'n3',
    title: 'Tuition Fee Confirmed',
    description: 'Received ₹95,000 for Coimbatore campus enrollment.',
    time: '1h ago',
    icon: 'activity' as NotificationIcon,
    tone: 'info' as NotificationTone,
    unread: false,
  },
];

export const profileHealthSummary = {
  wellnessScore: 88,
  condition: 'Optimal Velocity',
  summary: {
    before: 'VSB Central Admissions ',
    highlight: 'is tracking 88% overall quota',
    after: ' across Karur & Coimbatore campuses.',
  },
  vitals: [
    { label: 'Karur Occupancy', value: '84.2%', tone: 'good' },
    { label: 'Coimbatore Occupancy', value: '78.5%', tone: 'good' },
    { label: 'Marksheet OCR', value: '1.2s', tone: 'good' },
  ],
};
