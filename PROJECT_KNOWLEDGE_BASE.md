# 🌐 SPHEREX ADMISSION OS — MASTER PROJECT KNOWLEDGE BASE
> **Project Title:** Next-Generation Multi-Campus College Admission CRM & Lead Management System  
> **Institution:** V.S.B. Engineering College (Karur & Coimbatore Campuses) & Multi-Tenant SaaS  
> **Author & Master Architect:** Nithish Kumar (`spherexnithish#`)  
> **Version:** 2.5.0-ENTERPRISE (Cross-Platform Web & Native Android Release)  
> **Repository:** `https://github.com/Nithishkumar-2501/LEAD-MANAGEMENT-SYSTEM.git`  
> **Last Updated:** October 2026

---

## 📑 TABLE OF CONTENTS
1. [Executive Summary & System Vision](#1-executive-summary--system-vision)
2. [Technology Stack & Core Dependencies](#2-technology-stack--core-dependencies)
3. [User Roles, Personas & Master Credentials](#3-user-roles-personas--master-credentials)
4. [Master Creator Architecture & Universal Kill-Switch](#4-master-creator-architecture--universal-kill-switch)
5. [Lead Lifecycle, Quota Engine & UPI QR Payment Workflow](#5-lead-lifecycle-quota-engine--upi-qr-payment-workflow)
6. [Multi-Campus Architecture (Karur & Coimbatore)](#6-multi-campus-architecture-karur--coimbatore)
7. [Database Schema (Prisma SQLite & Cloud Firebase)](#7-database-schema-prisma-sqlite--cloud-firebase)
8. [Mobile Architecture (Capacitor Android Native)](#8-mobile-architecture-capacitor-android-native)
9. [REST API Endpoint Directory](#9-rest-api-endpoint-directory)
10. [Modules & Component Hierarchy](#10-modules--component-hierarchy)
11. [Build, Deployment & Developer Runbook](#11-build-deployment--developer-runbook)
12. [Security, Anti-Tamper & Error Recovery Guide](#12-security-anti-tamper--error-recovery-guide)

---

## 1. EXECUTIVE SUMMARY & SYSTEM VISION

**SPHEREX Admission OS** is an enterprise-grade Lead Management System (LMS) and Admissions Customer Relationship Management (CRM) platform engineered specifically for higher education institutions. Originally architected for the **V.S.B. Group of Institutions** (spanning both the **Karur Main Campus** and **Coimbatore Campus**), it operates as a multi-campus, multi-tenant administrative ecosystem.

### Key Capabilities:
- **High-Throughput Lead Processing:** Seamlessly ingests student leads via manual entry, single-lead creation with UPI verification, and high-volume batch CSV imports.
- **Dynamic 1,00,000 Lead Quota Engine:** Enforces strict institutional quotas per academic cycle with automated overage calculation and real-time ledger accounting.
- **Micro-Delegation to Faculty (Teachers):** Automatically balances student inquiries across department faculties and monitors telecalling, WhatsApp, and SMS outreach KPIs.
- **Universal Multi-Layer Emergency Kill-Switch:** Master Creator commands can instantaneously freeze or suspend Web, Mobile, or Campus-level access globally within ~3.5 seconds across all logged-in devices.
- **Cross-Platform Native Deployment:** Full Web Application (Next.js 14 SSR/CSR) synchronized seamlessly with a high-performance Native Android Application (Capacitor 8.5.1).

---

## 2. TECHNOLOGY STACK & CORE DEPENDENCIES

| Layer | Technologies / Packages | Purpose & Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 14.1.0` (React 18.2.0, App Router) | Server-side rendering, API routes, fast routing, dynamic loading. |
| **Language** | `TypeScript 5.3.3` | Strict type safety across client modals, server APIs, and Prisma models. |
| **Styling & Design System** | `Tailwind CSS 3.4.1`, `clsx`, `tailwind-merge` | Fluid responsive layout, dark/light glassmorphic surfaces, custom specular buttons. |
| **Micro-Animations** | `motion 13.2.0` (Framer Motion) | Spring-physics transitions, collapsible sidebars, and reactive toast badges. |
| **WebGL Graphics** | `ogl 1.0.11` | High-fidelity fluid background noise shaders and 3D landing elements. |
| **Icons & Visuals** | `lucide-react 0.344.0`, `react-icons 5.7.0` | Comprehensive semantic icon library for status badges, telephony, and controls. |
| **Data Analytics & Charts**| `recharts 3.10.1` | Real-time admission funnels, departmental lead counts, and revenue trends. |
| **Local Relational DB** | `Prisma ORM 5.10.2` + `SQLite` (`prisma/dev.db`) | Local caching, seed data, structured schema migrations, and relational integrity. |
| **Cloud Real-time DB** | `Firebase 12.18.0` (Firestore & Realtime Database) | Low-latency cloud synchronization for leads, telecalling logs, and kill-switches. |
| **Mobile Runtime** | `@capacitor/core 8.5.1`, `@capacitor/android` | Translates Next.js build output into a production Android APK (`SPHEREX.apk`). |
| **Native Toolchain** | Java 17, Android SDK 34, Gradle 8.2 | Compiles native Android binary with native dialer, SMS, and deep-link hooks. |

---

## 3. USER ROLES, PERSONAS & MASTER CREDENTIALS

The platform features a 4-tier Role-Based Access Control (RBAC) hierarchy.

### Master Authentication Directory

```
                     ┌────────────────────────────────────────┐
                     │          MASTER CREATOR (ROOT)         │
                     │  ID: spherexnithish#  / spherex#2501   │
                     └───────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │     KARUR CAMPUS ADMIN    │                   │   COIMBATORE CAMPUS ADMIN │
   │ adminkarur@123 / vsbec@123│                   │admincovai@123 / vsbectc@1213│
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │     KARUR FACULTY TEAM    │                   │  COIMBATORE FACULTY TEAM  │
   │teacherkarur@123/vsbteacher│                   │teachercovai@123/vsbteacher│
   └───────────────────────────┘                   └───────────────────────────┘
```

### Detailed Role Specifications

#### 1. Master Creator (Super Administrator / Root)
- **Primary Login ID:** `spherexnithish#` *(Accepts: `spherexnithish`, case-insensitive, ignores trailing/leading spaces)*
- **Master Password:** `spherex#2501` *(Accepts: `Spherex#2501`, case-insensitive)*
- **Role Identifier:** `CREATOR`
- **Permissions:**
  - Full root authority across all campuses.
  - Access to the dedicated **Creator Control Module** (`/dashboard?tab=creator`).
  - Global Web Kill-Switch & Global Mobile Kill-Switch toggles.
  - Institutional license generator, fee configuration, and validity renewal.
  - Live revenue telemetry for UPI lead creation charges (₹500/lead).
  - Emergency lockouts and campus-specific suspension controls.
  - Direct database export and purge tools.

#### 2. Karur Campus Admin
- **Username / Email:** `adminkarur@123`
- **Password:** `vsbec@123`
- **Assigned Campus:** `KARUR`
- **Role Identifier:** `ADMIN`
- **Permissions:**
  - Complete control of Karur Campus admissions pipeline.
  - CSV lead ingestion (up to the 1,00,000 campus limit).
  - Teacher allocation, quota adjustments, and performance audits.
  - Application approvals, payment tracking, and stage management.

#### 3. Coimbatore Campus Admin
- **Username / Email:** `admincovai@123`
- **Password:** `vsbectc@1213`
- **Assigned Campus:** `COIMBATORE`
- **Role Identifier:** `ADMIN`
- **Permissions:**
  - Same operational authority as Karur Admin, isolated to Coimbatore students, staff, and quotas.

#### 4. Department Teachers / Counselors
- **Karur Faculty Demo:** `teacherkarur@123` / `vsbteacher@123`
- **Coimbatore Faculty Demo:** `teachercovai@123` / `vsbteacher@1213`
- **Department Staff Accounts:** Created dynamically in the Teachers Module (e.g., `cse_faculty@vsb.ac.in`).
- **Role Identifier:** `TEACHER` / `COUNSELOR`
- **Permissions:**
  - Access restricted to assigned student leads (`UserDashboardView.tsx`).
  - Single-click native call dialer, WhatsApp templated messaging, and SMS dispatch.
  - Call outcome logging (Interested, Not Interested, Callback Scheduled, Wrong Number).
  - Personal quota tracking (Target vs. Reached).

---

## 4. MASTER CREATOR ARCHITECTURE & UNIVERSAL KILL-SWITCH

The system implements an anti-tamper, high-availability security architecture designed to prevent unauthorized operation, manage campus software billing, and enforce institutional licensing.

```
+-----------------------------------------------------------------------------------+
|                        CREATOR CONTROL CONSOLE (ROOT)                             |
|                                                                                   |
|  [ STOP WEB GLOBALLY ]    [ STOP MOBILE GLOBALLY ]    [ FREEZE ENTIRE SPHEREX ]   |
+-----------------------------------------------------------------------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
[ FIRESTORE CLOUD ]            [ REALTIME DATABASE ]             [ LOCAL NEXT.JS API ]
Path: system_licenses/         Path: spherex_licenses/           Route: /api/creator/licenses
collection: college_registry   node: campus_keys                 File: collegeLicenseService.ts
     |                                   |                                   |
     +-----------------------------------+-----------------------------------+
                                         |
             Distributed Broadcast & 3.5s Reactive Heartbeat Poll
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
   [ BROWSER CLIENT (WEB) ]                            [ CAPACITOR ANDROID (APP) ]
 - Reads cached / cloud license                      - Reads cached / cloud license
 - If stopped: Renders Fullscreen Lockdown           - If stopped: Renders Fullscreen Lockdown
 - Prevents background requests                      - Stops all native calls & SMS
```

### Triple-Redundancy Sync Engine
To guarantee that a stoppage triggers even under restrictive networks or offline cache conditions, license states are persisted across three separate channels:
1. **Firebase Firestore:** Document at `system_licenses/college_registry` contains live statuses for `KARUR`, `COIMBATORE`, `GLOBAL_WEB`, and `GLOBAL_MOBILE`.
2. **Firebase Realtime Database (RTDB):** Real-time WebSocket connection to `https://spherex-5463b-default-rtdb.firebaseio.com/spherex_licenses` pushes instant delta updates.
3. **Local REST API Fallback:** `src/app/api/creator/licenses/route.ts` provides server-side verification and fallback JSON state.

### Heartbeat Polling Loop
Both `src/components/LoginModal.tsx` and `src/app/dashboard/page.tsx` execute an active heartbeat every **3,500ms**:
- If `isWebStopped === true` on web, or `isMobileStopped === true` on Capacitor, or `college.licenseStatus === "SUSPENDED" | "EXPIRED"`:
  - The application UI is immediately unmounted.
  - An impenetrable, glassmorphic **System Suspension Screen** is displayed.
  - All navigation, data tables, and input forms are disabled.
  - **Creator Bypass:** A secure lock icon allows Master Creator `spherexnithish#` to enter root credentials and unlock the system.

---

## 5. LEAD LIFECYCLE, QUOTA ENGINE & UPI QR PAYMENT WORKFLOW

### The Student Lead Funnel Stages
```
  [1. NEW LEAD]  ──►  [2. INQUIRY]  ──►  [3. CONTACTED]  ──►  [4. COUNSELING]
                                                                     │
  [8. ENROLLED]  ◄──  [7. ADMITTED] ◄──  [6. PAYMENT VERIFIED] ◄──  [5. APPLICATION]
```

### 1,00,000 Free Lead Quota Enforcement
Each campus license includes an annual quota of **1,00,000 free student leads**:
- **Quota Tracking:** Handled by `src/lib/leadQuotaService.ts`.
- **Live Counter:** As leads are added via single entry or CSV, the counter decrements against the 1,00,000 limit.
- **Overage Threshold:** Once 1,00,000 leads are reached:
  - The system triggers the `LeadLimitOverageModal.tsx`.
  - Further leads cannot be saved without purchasing an overage pack (₹500/lead or 10,000 lead add-on packs).
  - Admins can request quota extension from the Creator inside the portal.

### Lead Creation via Dynamic UPI QR Code
To prevent ghost leads and automate departmental revenue collection:
1. When an Admin or Counselor clicks **"Add Single Lead"** (`AddQuickLeadModal.tsx`), the student details are validated.
2. Before writing to the database, `LeadPaymentQrModal.tsx` launches.
3. A dynamic UPI QR code is rendered encoding the Creator's VPA, transaction reference, student name, and amount (default: **₹500.00**).
4. Upon confirmation (or bypass by authorized Admin), the transaction is recorded in the immutable audit collection `spherex_lead_qr_payments_ledger` and the lead is committed to Firestore & SQLite.

### Bulk CSV Ingestion Engine
- File: `src/components/CsvLeadsImportModal.tsx` and `src/lib/csvParser.ts`.
- Automatically maps messy CSV columns (e.g. `Stud_Name`, `Phone_No`, `12th_Cutoff`, `Dist`) into standardized `Lead` models.
- Performs client-side deduplication against phone numbers and emails.
- Validates the total batch count against the remaining quota before ingestion.

---

## 6. MULTI-CAMPUS ARCHITECTURE (KARUR & COIMBATORE)

The CRM natively supports departmental structures across both flagship campuses:

### Karur Main Campus (`KARUR`)
- **Institution:** V.S.B. Engineering College, NH-67, Covai Road, Karur, Tamil Nadu.
- **Key Engineering Streams:**
  - B.E. Computer Science and Engineering (CSE)
  - B.Tech Artificial Intelligence and Data Science (AI & DS)
  - B.Tech Information Technology (IT)
  - B.E. Electronics and Communication Engineering (ECE)
  - B.E. Electrical and Electronics Engineering (EEE)
  - B.E. Mechanical Engineering (MECH)
  - B.E. Civil Engineering (CIVIL)

### Coimbatore Campus (`COIMBATORE`)
- **Institution:** V.S.B. College of Technical Campus, Pollachi Main Road, Coimbatore, Tamil Nadu.
- **Key Streams:**
  - B.E. Computer Science and Engineering (CSE)
  - B.Tech AI & DS / Cyber Security
  - B.E. Electronics and Communication Engineering (ECE)
  - B.Tech Information Technology (IT)

*Data Isolation:* When logged in as `adminkarur@123`, queries automatically scope `WHERE campus = 'KARUR'`. When logged in as `admincovai@123`, queries scope `WHERE campus = 'COIMBATORE'`. The Master Creator can toggle between campuses or view unified multi-campus analytics.

---

## 7. DATABASE SCHEMA (PRISMA SQLITE & CLOUD FIREBASE)

### Prisma SQLite Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  role          String   @default("COUNSELOR") // CREATOR | ADMIN | COUNSELOR | TEACHER
  createdAt     DateTime @default(now())
  assignedLeads Lead[]   @relation("CounselorLeads")
  tasks         Task[]   @relation("CounselorTasks")
}

model Lead {
  id                 String       @id @default(uuid())
  name               String
  email              String
  phone              String
  alternatePhone     String?
  fatherName         String?
  motherName         String?
  gender             String?      @default("Male")
  bloodGroup         String?      @default("O+")
  physicallyDisabled String?      @default("No")
  community          String?      @default("BC")
  source             String       @default("TNEA Counselling")
  courseInterest     String
  campus             String       @default("KARUR")
  school             String?      @default("Govt Higher Secondary School")
  district           String?      @default("Karur")
  state              String?      @default("Tamil Nadu")
  address            String?      @default("123 College Road, Tamil Nadu")
  status             String       @default("NEW")
  counselorId        String?
  createdAt          DateTime     @default(now())
  counselor          User?        @relation("CounselorLeads", fields: [counselorId], references: [id])
  application        Application?
  tasks              Task[]
}

model Application {
  id            String    @id @default(uuid())
  leadId        String    @unique
  stage         String    @default("INQUIRY")
  marks10th     Float
  marks12th     Float
  paymentStatus String    @default("PENDING")
  lead          Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  payments      Payment[]
}

model Task {
  id          String   @id @default(uuid())
  counselorId String
  leadId      String
  title       String
  type        String   @default("CALL")
  dueDate     DateTime
  isCompleted Boolean  @default(false)
  counselor   User     @relation("CounselorTasks", fields: [counselorId], references: [id])
  lead        Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
}

model Payment {
  id            String      @id @default(uuid())
  applicationId String
  studentName   String      @default("Student Candidate")
  course        String      @default("B.E. Computer Science")
  campus        String      @default("KARUR")
  amount        Float
  status        String      @default("COMPLETED")
  transactionId String      @unique
  createdAt     DateTime    @default(now())
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
}

model Teacher {
  id              String   @id @default(uuid())
  name            String
  email           String   @unique
  phone           String
  department      String
  campus          String   @default("KARUR")
  coursesAssigned String   @default("[]")
  experienceYears Int      @default(3)
  status          String   @default("ACTIVE")
  avatar          String   @default("VS")
  assignedQuota   Int      @default(1000)
  contactedCount  Int      @default(0)
  createdAt       DateTime @default(now())
}
```

### Firebase Cloud Firestore & RTDB Layout

```
spherex-5463b (Firebase Project)
├── Firestore Root
│   ├── leads/                     --> { id, name, phone, course, campus, status, counselorId, ... }
│   ├── teachers/                  --> { id, name, email, department, campus, quota, assignedCount }
│   ├── system_licenses/           --> college_registry doc { KARUR: {...}, COIMBATORE: {...}, globalWebStopped, globalMobileStopped }
│   ├── spherex_lead_qr_payments/  --> { txId, studentName, amount, campus, timestamp, status }
│   └── student_audit_logs/        --> { leadId, counselorId, action, previousStatus, newStatus, timestamp }
└── Realtime Database Root
    └── spherex_licenses/          --> Live heartbeat mirrors for instantaneous WebSocket propagation
```

---

## 8. MOBILE ARCHITECTURE (CAPACITOR ANDROID NATIVE)

The mobile client is packaged directly from the compiled Next.js static asset export using **Capacitor 8.5.1**.

### Native Configuration (`capacitor.config.ts`)
- **App ID:** `com.spherex.admissioncrm`
- **App Name:** `SPHEREX Admission OS`
- **Web Directory:** `out`
- **Bundled Web Runtime:** `false`
- **Cleartext HTTP:** Allowed for local debugging via `android:usesCleartextTraffic="true"`.

### Native Android Features (`android/app/src/main/`)
1. **Direct Native Telephony:** Counselors can tap a phone number to open the native Android dialer without copying numbers.
2. **Hardware Back Button Interception:** Intercepted to dismiss modals instead of quitting the application.
3. **Deep Linking & Offline Resilience:** IndexedDB and ServiceWorker caching ensure counselor access during intermittent connectivity.
4. **Compiled Standalone APK:** Automatically assembled to `android/app/build/outputs/apk/debug/app-debug.apk` and copied to `public/SPHEREX.apk` (~37.9 MB) for one-click download.

---

## 9. REST API ENDPOINT DIRECTORY

| Route | Method | Payload / Parameters | Response / Behavior |
| :--- | :--- | :--- | :--- |
| `/api/creator/licenses` | `GET` | None | Returns all college licenses, quota states, and global kill-switch flags. |
| `/api/creator/licenses` | `POST` | `{ action, collegeId, payload }` | Modifies license validity, freezes campuses, or toggles global stop switches. |
| `/api/contacts` | `GET` | `?campus=KARUR&page=1` | Retrieves paginated leads filtered by institutional campus and counselor assignment. |
| `/api/contacts` | `POST` | `Lead` object | Validates quota, verifies payment, and creates a lead in SQLite & Firestore. |
| `/api/teachers` | `GET` | `?campus=COIMBATORE` | Returns faculty list, telecalling statistics, and remaining quota metrics. |
| `/api/teachers` | `POST` | `Teacher` payload | Registers a new faculty counselor and establishes lead distribution rules. |
| `/api/applications` | `GET` | `?status=INQUIRY` | Returns student applications sorted by admission funnel stage and cutoff. |
| `/api/tasks` | `GET`, `POST` | Counselor tasks | Manages follow-up phone calls, campus visit schedules, and reminders. |
| `/api/email` | `POST` | `{ to, subject, html }` | Dispatches admission brochures, offer letters, and payment receipts. |
| `/api/seed` | `POST` | None | Seeds default V.S.B. faculty, quotas, and test leads into the database. |

---

## 10. MODULES & COMPONENT HIERARCHY

The web application is structured into domain-specific modules located in `src/components/`:

- **`LoginModal.tsx`:** Primary gateway. Handles role detection (`CREATOR`, `ADMIN`, `TEACHER`), resilient credential matching, license verification, and session persistence.
- **`CreatorControlModule.tsx`:** Master root console. Hosts the global kill-switches, campus licensing dashboard, UPI QR payment ledger, and telemetry logs.
- **`AdminDashboardView.tsx`:** Campus executive overview. Displays live admissions metrics, departmental targets, and counselor conversion rates.
- **`UserDashboardView.tsx`:** Counselor telecalling cockpit. Features quick-call actions, disposition logging, and personal lead targets.
- **`ContactDirectoryModule.tsx`:** High-performance student directory. Includes multi-parameter filtering, batch lead actions, and CSV imports.
- **`ApplicantDetailModal.tsx`:** 360-degree student dossier. Houses academic marks, 10th/12th cutoffs, counseling notes, uploaded documents, and communication logs.
- **`ApplicationManagerModule.tsx`:** Kanban and list views of the student admission pipeline.
- **`TeacherModule.tsx`:** Faculty management. Manages teacher onboarding, quota assignments, and call audits.
- **`SocialMediaPlatformModule.tsx`:** Digital marketing attribution. Tracks inquiries from Facebook, Instagram, Google Ads, and walk-ins.
- **`PaymentBillingModule.tsx`:** Fee receipt generation, tuition fee payments, and scholarship tracking.
- **`AiIntelligenceModule.tsx` & `NoraAiDatabaseModal.tsx`:** Natural language search and AI-assisted candidate eligibility scoring.

---

## 11. BUILD, DEPLOYMENT & DEVELOPER RUNBOOK

### Local Development Setup
```bash
# 1. Install all dependencies
npm install

# 2. Generate Prisma Client
npm run prisma:generate

# 3. Seed SQLite Database
npm run prisma:seed

# 4. Launch Next.js Hot-Reload Dev Server (Port 3000)
npm run dev
```

### Full Native Android APK Compilation
To compile the web app, synchronize Capacitor assets, and generate a release-ready debug APK:
```bash
# One-command automated pipeline:
npm run build:apk
```
*Behind the scenes:*
1. Runs `prisma generate` and `next build` (exports static distribution to `out/`).
2. Runs `npx cap sync android` to copy HTML/JS/CSS assets and plugins into `android/app/src/main/assets/`.
3. Invokes `gradlew.bat assembleDebug` inside the `android/` directory.
4. Generates `android/app/build/outputs/apk/debug/app-debug.apk`.
5. Copies the binary to `public/SPHEREX.apk` for browser downloads.

### Git Version Control Workflow
```bash
git add .
git commit -m "feat: your descriptive update"
git push origin main
```

---

## 12. SECURITY, ANTI-TAMPER & ERROR RECOVERY GUIDE

### 1. Master Creator Lockout Recovery
If you are locked out of the Master Creator console:
- Verify you are entering ID: `spherexnithish#` and Password: `spherex#2501`.
- The system includes smart normalization: leading/trailing whitespaces are automatically stripped, and missing `#` characters are accepted.
- If cloud credentials fail due to lack of internet, the hardcoded fallback credentials in `src/lib/authService.ts` and `src/components/LoginModal.tsx` will grant root access.

### 2. Emergency Global Kill-Switch Reset
If the system was accidentally stopped and devices are locked out:
1. Open the login dialog or click the **Creator Bypass Key** on the suspension screen.
2. Sign in with `spherexnithish#` / `spherex#2501`.
3. Navigate to **Creator Control** (`/dashboard?tab=creator`).
4. Click **"Resume All Systems"** or turn off the **"Emergency Freeze"** toggle.
5. All connected mobile apps and web browsers will automatically restore normal operation within 3.5 seconds.

### 3. Database Sync Reset
If local SQLite data diverges from Cloud Firestore:
- Trigger a sync re-index by visiting `/api/creator/licenses` or calling `syncAllLeadsFromCloud()` in `src/lib/firebaseSync.ts`.
- Local SQLite changes are queued and synced to Firestore as soon as an internet connection is established.

---

*(End of Master Knowledge Base Document)*
