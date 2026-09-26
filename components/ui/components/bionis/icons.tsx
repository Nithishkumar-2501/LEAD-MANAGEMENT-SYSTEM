import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export type IconProps = SVGProps<SVGSVGElement>;

function Icon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-5', className)}
      {...props}
    />
  );
}

export function HomeIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M10 2.5L2.5 8.5V17.5H7.5V12.5H12.5V17.5H17.5V8.5L10 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SleepIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M17.5 10.5C16.8 14.5 13 17.5 9 17.5C4.5 17.5 1.5 13.5 2.5 9C3.5 4.5 7.5 1.5 12 2C11 3.5 10.5 5.5 11 7.5C11.5 9.5 13 11 15 11.5C16 11.5 16.8 11 17.5 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ActivityIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M2.5 10H6L8.5 3.5L11.5 16.5L14 10H17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function TrendsIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M17.5 5.5L11 12L7.5 8.5L2.5 13.5M17.5 5.5H13M17.5 5.5V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ReportsIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M5 2.5H12.5L16.5 6.5V17.5H5V2.5ZM12.5 2.5V6.5H16.5M7.5 10.5H12.5M7.5 13.5H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function BellIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M15 7C15 4.2 12.8 2 10 2C7.2 2 5 4.2 5 7C5 12 2.5 13.5 2.5 13.5H17.5C17.5 13.5 15 12 15 7ZM8.5 16.5C8.8 17.5 9.3 18 10 18C10.7 18 11.2 17.5 11.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GearIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16.5 10C16.5 9.5 16.9 9 17.2 8.6L16.2 6.8L14.7 7.2C14.2 6.8 13.8 6.5 13.3 6.3L13 4.8H11L10.7 6.3C10.2 6.5 9.8 6.8 9.3 7.2L7.8 6.8L6.8 8.6C7.1 9 7.5 9.5 7.5 10C7.5 10.5 7.1 11 6.8 11.4L7.8 13.2L9.3 12.8C9.8 13.2 10.2 13.5 10.7 13.7L11 15.2H13L13.3 13.7C13.8 13.5 14.2 13.2 14.7 12.8L16.2 13.2L17.2 11.4C16.9 11 16.5 10.5 16.5 10Z" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

export function QuestionIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7.5 8C7.5 6.6 8.6 5.5 10 5.5C11.4 5.5 12.5 6.6 12.5 8C12.5 9.2 11.5 9.8 10.8 10.3C10.3 10.6 10 11 10 11.8M10 14.5H10.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function UserIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M16.5 17.5C16.5 14.5 13.5 12 10 12C6.5 12 3.5 14.5 3.5 17.5M10 9C12 9 13.5 7.5 13.5 5.5C13.5 3.5 12 2 10 2C8 2 6.5 3.5 6.5 5.5C6.5 7.5 8 9 10 9Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ArrowRightIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SidebarCollapseIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ToggleIcon({ className, pressed = false, ...props }: IconProps & { pressed?: boolean }) {
  return (
    <svg viewBox="0 0 24 14" fill="none" className={cn('w-6 h-3.5', className)} {...props}>
      <rect x="0.5" y="0.5" width="23" height="13" rx="6.5" fill={pressed ? 'currentColor' : 'none'} stroke="currentColor"/>
      <circle cx={pressed ? 17 : 7} cy="7" r="4.5" fill={pressed ? '#ffffff' : 'currentColor'}/>
    </svg>
  );
}

export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function CalendarIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 1.5V3.5M11 1.5V3.5M2 6.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function CloseIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function TrendUpIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={cn('size-3', className)} {...props}>
      <path d="M2 9.5L6.5 5L9 7.5L10.5 2.5M10.5 2.5H7.5M10.5 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function WarningFilledIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={cn('size-5', className)} {...props}>
      <path fillRule="evenodd" d="M10 2L18.5 17H1.5L10 2ZM10 7.5V11.5M10 14.5H10.01" stroke="none"/>
    </svg>
  );
}

export function AlertDiamondIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M10 2L18 10L10 18L2 10L10 2ZM10 6.5V10.5M10 13.5H10.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function AlertTriangleIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M10 2.5L18 17H2L10 2.5ZM10 7.5V11.5M10 14.5H10.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function BedIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M2.5 15V6M2.5 11H17.5V15M17.5 15V9C17.5 7.5 16 6.5 14.5 6.5H9.5C8 6.5 6.5 7.5 6.5 9V11M5 8.5C5 7.5 4 6.5 3 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function BlingFilledIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={cn('size-4', className)} {...props}>
      <path d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z"/>
    </svg>
  );
}

export function CheckCircleRegularIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M6.5 10L9 12.5L14 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function DropIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <path d="M10 2.5C10 2.5 4 8.5 4 12.5C4 15.8 6.7 18.5 10 18.5C13.3 18.5 16 15.8 16 12.5C16 8.5 10 2.5 10 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function HeartbeatFilledIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <path d="M8 14.5C8 14.5 1.5 10 1.5 5.5C1.5 3 3.5 1.5 5.5 1.5C6.8 1.5 7.6 2.2 8 3C8.4 2.2 9.2 1.5 10.5 1.5C12.5 1.5 14.5 3 14.5 5.5C14.5 10 8 14.5 8 14.5Z" fill="currentColor"/>
    </svg>
  );
}

export function HeartbeatIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <path d="M1.5 8.5H4L6 4L9 13L11.5 7L13 8.5H14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function NurseFilledIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={cn('size-4', className)} {...props}>
      <rect x="2" y="2" width="12" height="12" rx="3"/>
      <path d="M8 4.5V11.5M4.5 8H11.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function HighKneesIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <circle cx="10" cy="4" r="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 9L10 8L13 10M10 8V13L7 17M10 13L13 14V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Sparkles3FilledIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={cn('size-4', className)} {...props}>
      <path d="M8 1L9 5L13 6L9 7L8 11L7 7L3 6L7 5L8 1ZM13 10L13.5 12L15.5 12.5L13.5 13L13 15L12.5 13L10.5 12.5L12.5 12L13 10Z"/>
    </svg>
  );
}

export function VoiceIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn('size-5', className)} {...props}>
      <rect x="7" y="3" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M4 8.5C4 11.8 6.7 14.5 10 14.5C13.3 14.5 16 11.8 16 8.5M10 14.5V17.5M7 17.5H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function WalkIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <circle cx="9" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5.5 8L8 7L10.5 8.5M8 7V11L6 14.5M8 11L10 12L11 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MoonStarsIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <path d="M12 8C11.5 11.5 8.5 14 5 14C3.8 14 2.8 13.6 2 13C2.8 10.5 5 8.5 8 8C9.5 7.8 11 8.2 12 8ZM12.5 3L13 4.5L14.5 5L13 5.5L12.5 7L12 5.5L10.5 5L12 4.5L12.5 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function BatteryChargingIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('size-4', className)} {...props}>
      <rect x="2" y="4" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M13.5 6.5V9.5M7 5.5L5.5 8.5H8.5L7 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MoreVerticalIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={cn('size-4', className)} {...props}>
      <circle cx="8" cy="3.5" r="1.2"/>
      <circle cx="8" cy="8" r="1.2"/>
      <circle cx="8" cy="12.5" r="1.2"/>
    </svg>
  );
}
