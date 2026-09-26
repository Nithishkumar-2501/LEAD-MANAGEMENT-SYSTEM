import { useId, type SVGProps } from 'react';

export function BionisLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const reactId = useId().replace(/:/g, '');
  const gradientA = `bionis-logo-a-${reactId}`;
  const gradientB = `bionis-logo-b-${reactId}`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="50" cy="50" r="42" stroke={`url(#${gradientA})`} strokeWidth="7" fill="none" />
      <path d="M35 50L45 60L65 40" stroke={`url(#${gradientB})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id={gradientA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id={gradientB} x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}
