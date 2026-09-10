---
name: elevating-crm-design
description: Elevates and refines CRM user interfaces with fluid spring motion animations, glassmorphism surfaces, tactile micro-interactions, responsive dashboard layouts, and accessible high-contrast typography. Use when redesigning UI/UX, implementing motion animations, polishing CRM cards and tables, or enhancing web and mobile aesthetics.
---

# Elevating CRM Design

## When to use this skill
- Elevating CRM UI aesthetics, component styling, and motion animations.
- Adding fluid spring transitions (`cubic-bezier(0.34, 1.56, 0.64, 1)`), tactile press scales (`active:scale-[0.98]`), and ambient hover glows.
- Designing responsive, high-contrast dashboards and modals that look state-of-the-art in both dark and light modes.
- Polishing lead status badges (HOT, WARM, COLD), metric counters, and table rows with live micro-interactions.

## Workflow

### Checklist
Copy this checklist to track state during UI/UX and motion elevation tasks:
- [ ] 1. **Audit Existing Tokens**: Inspect `src/app/globals.css` and `tailwind.config.ts` for animation keyframes, surface tokens, and contrast variables.
- [ ] 2. **Implement Motion Design System**: Add fluid spring curves, hover elevation classes, pulse indicators, and tactile press micro-interactions.
- [ ] 3. **Enhance Navigation & Headers**: Polish top navigation bar, campus switcher, sidebar link transitions, and active indicators.
- [ ] 4. **Upgrade Data & Metric Cards**: Implement radiant gradient backdrops, smooth counter card hover lifts, and subtle borders.
- [ ] 5. **Refine Tables & Status Badges**: Add glowing pulse dots for HOT/WARM/COLD states, sleek row hover highlights, and responsive WhatsApp trigger buttons.
- [ ] 6. **Elevate Modals & Drawers**: Configure smooth backdrop blurs, scale-in entrances, and illuminated stage pipeline trackers.
- [ ] 7. **Validate Builds & Performance**: Test TypeScript compilation, Next.js build, and native mobile packaging.

### Plan-Validate-Execute Loop
1. **Plan**: Identify target components needing visual hierarchy or motion upgrades.
2. **Validate**: Verify CSS class compatibility with Tailwind CSS v3 and ensure light mode high-contrast rules are not overridden.
3. **Execute**: Apply standardized animation and surface utility classes across components.

## Instructions

### 1. Motion & Micro-Interaction Principles
- **Spring Curves**: Use cubic-bezier timing curves for snappy, organic UI feel:
  ```css
  --spring-snappy: cubic-bezier(0.16, 1, 0.3, 1);
  --spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  ```
- **Tactile Feedback**: Every interactive button and pill must feature active press feedback:
  ```tsx
  className="transition-all duration-200 active:scale-[0.97] hover:brightness-110"
  ```
- **Elevated Card Hovers**: Cards must lift subtly and illuminate on hover:
  ```css
  .card-hover-elevate {
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease;
  }
  .card-hover-elevate:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 36px -10px rgba(79, 70, 229, 0.22);
    border-color: rgba(99, 102, 241, 0.4);
  }
  ```

### 2. Status Badge Styling Standards
- **HOT**: Amber-rose gradient pill with live pulsating flame indicator:
  ```tsx
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-300">
    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
    HOT 🔥
  </span>
  ```
- **WARM**: Amber-yellow gradient pill with steady glow:
  ```tsx
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-300">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
    WARM ⚡
  </span>
  ```
- **COLD**: Sky-cyan gradient pill with cool border:
  ```tsx
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/30 text-sky-300">
    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
    COLD ❄️
  </span>
  ```

### 3. Glassmorphism & High-Contrast Light Mode Rules
- Dark mode must use rich deep slate surfaces (`bg-slate-900/80` or `bg-[#0f172a]/90`) with semi-transparent frosted borders (`border-white/10`).
- Light mode must maintain crisp solid black typography (`#000000`) for headers, table values, and student credentials with zero dark backdrop patches.

### 4. Verification & Build Commands
Execute these bash commands to validate and package changes:

```bash
# Verify TypeScript syntax and imports
npx tsc --noEmit

# Compile Next.js production bundle
npm run build

# Sync and assemble Android mobile package
npx cap sync android
cd android && ./gradlew.bat assembleDebug
```

## Resources
- [Tailwind Configuration](file:///e:/FINAL%20YEAR%20PROJECT/CRM%20FILE/tailwind.config.ts)
- [Global Styles & Animation Keyframes](file:///e:/FINAL%20YEAR%20PROJECT/CRM%20FILE/src/app/globals.css)
