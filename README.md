# 🎓 SPHEREX — Intelligent Admission CRM & Omnichannel Lead Management System
### V.S.B. Engineering College (Autonomous) • Karur & Coimbatore Campuses, Tamil Nadu, India

[![Next.js 14](https://img.shields.io/badge/Next.js-14.1.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Google Firebase](https://img.shields.io/badge/Firebase-12.18.0-FFA611?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Capacitor Android](https://img.shields.io/badge/Capacitor-8.5.1-119EFF?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![Resend Email](https://img.shields.io/badge/Resend-Email_API-000000?style=for-the-badge&logo=mailgun)](https://resend.com/)

---

## 📌 1. Project Overview & Institutional Background

**SPHEREX** is an enterprise-grade digital Admission Customer Relationship Management (CRM) and Omnichannel Lead Management System engineered for **V.S.B. Engineering College**. It manages the complete admissions lifecycle—from multi-channel lead acquisition and counselor batch splitting to TNEA cutoff evaluation, student profile verification, fee collection, and mobile app synchronization across two autonomous campuses:

1. **Karur Campus (TNEA Counseling Code: 612)**  
   *NH-67, Covai Road, Karur - 639 111, Tamil Nadu*
2. **Coimbatore Campus (TNEA Counseling Code: 714)**  
   *Pollachi Main Road, Eachanari, Coimbatore - 641 021, Tamil Nadu*

---

## 🏗️ 2. System Architecture

```mermaid
graph TD
    subgraph Client Application Layer
        Web[Web Browser - Next.js 14 App Router]
        Mobile[Android Native App - Capacitor APK]
    end

    subgraph API & Backend Layer
        API_Email[/api/email/send - Resend API Route]
        API_Contacts[/api/contacts - Student Database]
        API_Teachers[/api/teachers - Faculty Management]
        API_AI[/api/ai/* - Nora AI Marksheet OCR]
        WebRTC[WebRTC Voice Signaling Server :5000]
    end

    subgraph Dual-Persistence & Cloud Synchronization Layer
        Prisma[Prisma ORM 5.22]
        SQLite[(Local SQLite Database: dev.db)]
        FirebaseSync[Firebase Live Sync Engine]
        Firestore[(Google Cloud Firestore)]
        RTDB[(Firebase Realtime Database)]
    end

    Web --> API_Email & API_Contacts & API_Teachers & API_AI
    Mobile --> API_Email & API_Contacts & API_Teachers & API_AI
    API_Contacts & API_Teachers --> Prisma
    Prisma --> SQLite
    Web & Mobile --> FirebaseSync
    FirebaseSync --> Firestore & RTDB
    Web & Mobile --> WebRTC
```

---

## ⚡ 3. Key Features & Functional Modules

### 📊 1. Admissions Analytics Dashboard
- **Real-Time KPIs**: Total Leads, Marksheets Verified, Confirmed Admissions, and Fees Collected (₹).
- **TNEA Conversion Funnel**: 5-stage pipeline tracking (`NEW` ➔ `CONTACTED` ➔ `IN_REVIEW` ➔ `ADMITTED` ➔ `REJECTED`).
- **Campus Selector**: Instant global toggle between **Karur** and **Coimbatore** updating all metrics, tables, and lead assignments.

### 🏛️ 2. Department-Ordered Teacher & Faculty Directory
- **Side Department Navigation**:
  - Organized by academic department (Mechanical Engineering, Computer Science, Electronics & Communication, Information Technology, AI & Data Science, Civil, Electrical, Biomedical, etc.).
  - **Live Teacher Count Badges**: Every department button displays the exact number of professors (e.g., `Mechanical Engineering (4 Teachers)`).
  - Department-specific iconography and color badges.
  - "All Departments" overview button.
- **Department Roster View**: Clicking any department filters and lists only faculty belonging to that department.
- **Interactive Faculty Cards**:
  - Photo / Avatar with Admin camera upload.
  - Active vs. On Leave availability toggle.
  - Profile ID, Experience, Email, and Phone.
  - Assigned Lead Quota (e.g., `Contacts #1 to #100`).
  - **Calling Audit**: Real-time `🟢 Talked` vs `🟡 Not Talked` metrics with a progress bar and direct `View Students ➔` drawer.
  - In-Portal Email, Direct Phone Dial, Profile Edit, and Delete (Admin).

### ⚡ 3. Admin Lead Allocation Control Panel
- **Batch Lead Splitting**: Admins can split database contacts into teacher batches (e.g., 100 leads to Prof. P. Rajesh: Contacts #1 - #100).
- **Role Isolation**: Teachers exclusively view and manage their assigned leads; non-assigned leads remain secure.
- **Daily Call Analytics & Audio Audit**: Waveform visualization, recorded call playback, and transcript audit drawer.

### 📝 4. 3-Sheet Structured Candidate Entry
- **Sheet 1 — Personal & Contact Data**: Full Name, Primary Mobile, Alternate Phone, Gender, Blood Group, Disability Status.
- **Sheet 2 — Academic Performance & Cutoff**: 10th Marks, 12th Marks, TNEA Cutoff (out of 200), School Name, District, and State.
- **Sheet 3 — Program Choice & Marketing Attribution**: Campus, Preferred Degree Program, Admission Stage, and Source (Google Ads, Meta, Science Expo, Walk-in, etc.).

### 📧 5. Institutional Email Dispatch System
- **Resend API Integration**: Dispatches official admission emails styled with V.S.B. institutional headers, campus addresses, and formatted student records.
- **Defensive Error Handling**: Prevents JSON parse crashes and falls back smoothly to native device email clients (`mailto:`) when running in offline or mobile shells.

### 📞 6. Omnichannel Communication
- **Direct Dialing**: Integrated `tel:` protocol launching device phone dialers.
- **Direct WhatsApp Chat**: Pre-filled template messages launched via `wa.me/`.
- **WebRTC Voice Calling**: Browser peer-to-peer audio calls with live recording HUD and talk-time tracking.

### 🤖 7. Nora AI Intelligence
- In-app assistant for instant candidate cutoff eligibility calculations, marksheet OCR analysis, and admission propensity predictions.

---

## 💻 4. Technology Stack

| Component | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `14.1.0` | React Server Components, Dynamic Node.js API routes |
| **Language** | TypeScript | `5.3.3` | End-to-end static typing |
| **UI Library** | React | `18.2.0` | Core reactive interface |
| **Styling** | TailwindCSS | `3.4.1` | High-contrast modern glassmorphism design |
| **Database** | SQLite + Prisma ORM | `5.22.0` | Relational local persistence |
| **Cloud Sync** | Google Firebase | `12.18.0` | Cloud Firestore & Realtime Database dual-sync |
| **Email API** | Resend API | Latest | Automated branded HTML admission emails |
| **Mobile Runtime** | Capacitor Android | `8.5.1` | Android native packaging (`CRM-Mobile-App.apk`) |
| **Icons** | Lucide React | `0.344.0` | Unified institutional iconography |

---

## 🔑 5. Pre-Configured User Credentials

| Role | Username / ID | Password | Campus | Scope & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Karur System Admin** | `adminkarur@123` | `vsbec@123` | Karur (VSB-612) | Full Admin Access, Lead Splitting, Faculty Quotas |
| **Coimbatore Admin** | `admincovai@123` | `vsbectc@1213` | Coimbatore (VSB-714) | Full Admin Access for Coimbatore Campus |
| **Faculty (Mech HOD)** | `rajesh.mech@vsbec.in` | `rajesh@vsb2026` | Karur | Assigned Batch #1 - #100 Contacts |
| **Faculty (CSE HOD)** | `arulmurugan.cse@vsbec.in` | `arul@vsb2026` | Karur | Assigned Batch #101 - #200 Contacts |
| **Faculty (ECE HOD)** | `meenakshi.ece@vsbec.in` | `meenakshi@vsb2026` | Coimbatore | Assigned Batch #201 - #300 Contacts |
| **General Karur Teacher** | `teacherkarur@123` | `vsbteacher@123` | Karur | General Teacher Portal Access |
| **General Covai Teacher** | `teachercovai@123` | `vsbteacher@1213` | Coimbatore | General Teacher Portal Access |

---

## 🚀 6. Installation & Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm**: `v9.0.0` or higher
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/Nithishkumar-2501/LEAD-MANAGEMENT-SYSTEM.git
cd LEAD-MANAGEMENT-SYSTEM
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables
Create or verify your `.env` file in the root directory:
```env
# Database Connection String
DATABASE_URL="file:./dev.db"

# Resend Email Service Configuration
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM_EMAIL="VSB Admissions <onboarding@resend.dev>"
RESEND_FALLBACK_EMAIL="your_verified_email@gmail.com"
```

### Step 4: Initialize Prisma Database
```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 📱 7. Android Mobile App Build (Capacitor)

The repository includes a ready-to-install Android APK:
- `CRM-Mobile-App.apk` / `SPHEREX.apk`

To rebuild the APK from source:
```bash
# 1. Build mobile static export
npm run build:mobile

# 2. Sync web assets with Capacitor Android shell
npx cap sync android

# 3. Compile Android Debug APK
cd android && ./gradlew.bat assembleDebug
```
The compiled APK will be output at:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🌐 8. Production Deployment Guide (Vercel)

The project includes [vercel.json](vercel.json) pre-configured with Prisma generation:

1. Push your latest code to your GitHub repository.
2. Sign in to **[Vercel](https://vercel.com/new)** and import `Nithishkumar-2501/LEAD-MANAGEMENT-SYSTEM`.
3. Under **Environment Variables**, add:
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `RESEND_FALLBACK_EMAIL`
4. Click **Deploy**. Vercel will automatically build the Next.js production bundle and launch your live URL.

---

## 📁 9. Repository Directory Structure

```text
├── android/                         # Android Studio native project & Gradle configs
├── prisma/
│   ├── schema.prisma                # Relational data schema (Lead, Application, Teacher, Task)
│   └── seed.ts                      # Database seeder script
├── public/                          # Static assets, logos, and campus imagery
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── email/send/route.ts  # Live Resend admission email API handler
│   │   │   ├── contacts/route.ts    # Lead query & ingestion endpoints
│   │   │   └── teachers/route.ts    # Teacher directory endpoints
│   │   ├── dashboard/page.tsx       # Core multi-role Admissions Dashboard
│   │   ├── layout.tsx               # Root application layout
│   │   └── globals.css              # Global styles & glassmorphism utilities
│   ├── components/
│   │   ├── TeacherModule.tsx        # Department-Ordered Faculty Directory
│   │   ├── TeacherStudentAuditModal.tsx # Student call audit modal
│   │   ├── InPortalCommunicationModals.tsx # In-portal email, WhatsApp & call modal
│   │   ├── ApplicationManagerModule.tsx # 3-Sheet student applicant manager
│   │   ├── Header.tsx               # Top navigation bar & campus switcher
│   │   └── Sidebar.tsx              # Role-aware sidebar navigation
│   ├── lib/
│   │   ├── firebaseSync.ts          # Google Firebase live cloud sync
│   │   ├── mockData.ts              # Verified candidate & faculty mock data
│   │   ├── callDialer.ts            # Phone dialer URI sanitization
│   │   └── phoneValidation.ts       # +91 Phone standardizer
│   └── types/
│       └── crm.ts                   # Core TypeScript interfaces & enums
├── webrtc-voice-system/             # Node.js WebRTC audio calling server
├── capacitor.config.json            # Capacitor mobile configuration
├── next.config.mjs                  # Dynamic/static hybrid Next.js build config
├── vercel.json                      # Vercel deployment build hook
├── PROJECT_KNOWLEDGE_BASE.md        # Comprehensive technical master guide
└── package.json                     # Project scripts and dependencies
```

---

## 📄 10. Academic Project & Copyright Information

- **Institution**: V.S.B. Educational Trust, Tamil Nadu
- **Project**: Final Year Engineering Capstone Project (B.E. / B.Tech)
- **Year**: 2026 – 2027
- **License**: Proprietary — Developed exclusively for V.S.B. Engineering College Admissions Office
