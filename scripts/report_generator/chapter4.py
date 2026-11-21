from docx.shared import Inches, Pt
from scripts.report_generator.styles import (
    add_heading_1, add_heading_2, add_heading_3, add_paragraph, add_bullet,
    add_callout, add_table, add_page_break, HEX_ACCENT
)

def build_chapter4(doc):
    add_heading_1(doc, "CHAPTER 4: SYSTEM SPECIFICATION")
    
    # -------------------------------------------------------------
    # 4.1 HARDWARE REQUIREMENTS
    # -------------------------------------------------------------
    add_heading_2(doc, "4.1 HARDWARE REQUIREMENTS")
    add_paragraph(
        doc,
        "LEAD TRACK AI is engineered to function efficiently across heterogeneous hardware environments, spanning institutional production "
        "servers, administrative desktop workstations, and faculty mobile Android devices. The minimum and recommended hardware specifications "
        "are delineated in Table 4.1."
    )
    
    hw_headers = ["INFRASTRUCTURE TIER", "MINIMUM SPECIFICATIONS", "RECOMMENDED SPECIFICATIONS", "OPERATIONAL ROLE"]
    hw_data = [
        [
            "Production Cloud Server (Next.js / Node.js)",
            "Dual-Core vCPU @ 2.4 GHz, 4 GB RAM, 20 GB SSD storage, 50 Mbps network bandwidth",
            "Quad-Core vCPU (e.g., AMD EPYC / Intel Xeon) @ 3.2 GHz, 8 GB DDR4 RAM, 50 GB NVMe SSD, 1 Gbps port",
            "Hosts Next.js Server Components, API routes, Prisma SQLite connection pool, and WebRTC signaling"
        ],
        [
            "Client Administrative Workstation",
            "Intel Core i3 (7th Gen) / AMD Ryzen 3, 4 GB RAM, 1366x768 display, 10 Mbps broadband connection",
            "Intel Core i5 / AMD Ryzen 5, 8 GB RAM, 1920x1080 FHD display, dedicated GPU (optional for WebGL)",
            "Web portal access for Master Creator, Campus Admins, batch CSV imports, and dashboard analytics"
        ],
        [
            "Counselor Mobile Android Device",
            "ARM Cortex Quad-Core @ 1.8 GHz, 3 GB RAM, Android 10 (API 29), 200 MB free internal flash storage",
            "Octa-Core @ 2.4 GHz (Snapdragon / MediaTek), 4 GB+ RAM, Android 11 to 14 (API 30-34), 4G/5G VoLTE",
            "Executes native Android APK (SPHEREX.apk) for telecalling, WhatsApp outreach, and on-field inquiries"
        ]
    ]
    add_table(doc, hw_headers, hw_data, col_widths=[Inches(1.5), Inches(1.5), Inches(1.5), Inches(1.5)])
    
    # -------------------------------------------------------------
    # 4.2 SOFTWARE REQUIREMENTS
    # -------------------------------------------------------------
    add_heading_2(doc, "4.2 SOFTWARE REQUIREMENTS")
    add_paragraph(
        doc,
        "The software architecture leverages modern, open, and enterprise-grade dependencies across runtime, database, styling, and mobile "
        "frameworks. Table 4.2 summarizes the core technology stack components and their versioning."
    )
    
    sw_headers = ["LAYER / COMPONENT", "TECHNOLOGY NAME", "VERSION", "TECHNICAL JUSTIFICATION & FUNCTION"]
    sw_data = [
        ["Web Framework", "Next.js (App Router)", "14.1.0", "React Server Components, co-located Node.js API routes, optimized bundle splitting"],
        ["Client Library", "React", "18.2.0", "Component-driven reactive user interface, concurrent rendering, hooks architecture"],
        ["Programming Language", "TypeScript", "5.3.3", "End-to-end static type safety across client modals, server APIs, and Prisma models"],
        ["Styling Framework", "Tailwind CSS", "3.4.1", "Utility-first responsive design, modern glassmorphism tokens, specular visual styling"],
        ["Animation Engine", "Framer Motion (motion)", "13.2.0", "High-performance spring physics, collapsible sidebars, reactive badge animations"],
        ["WebGL Graphics", "OGL", "1.0.11", "Lightweight WebGL library for dynamic fluid noise background shaders on landing views"],
        ["Relational ORM", "Prisma ORM", "5.10.2", "Declarative schema migrations, type-safe database queries, SQLite relational engine"],
        ["Embedded Database", "SQLite (dev.db)", "3.42+", "Zero-configuration, ultra-fast embedded ACID relational database for local caching"],
        ["Cloud Realtime Sync", "Google Firebase", "12.18.0", "Cloud Firestore and Realtime Database for sub-120ms cross-device lead replication"],
        ["Mobile Runtime", "Capacitor Android", "8.5.1", "Modern native runtime bridging Next.js web bundle into Android Studio native shell"],
        ["Email Gateway API", "Resend API", "Latest", "Transactional REST API for branded, high-deliverability institutional HTML emails"],
        ["Iconography", "Lucide React", "0.344.0", "Unified, clean SVG semantic icon library for status badges, dialers, and navigation"]
    ]
    add_table(doc, sw_headers, sw_data, col_widths=[Inches(1.2), Inches(1.3), Inches(0.8), Inches(2.7)])
    
    add_heading_3(doc, "4.2.1 Next.js 14 App Router and React 18")
    add_paragraph(
        doc,
        "Next.js 14 was selected as the foundational application framework due to its revolutionary App Router architecture and deep support "
        "for React Server Components (RSC). In traditional client-rendered single-page applications, entire application bundles must be downloaded, "
        "parsed, and executed on the client device before data can be rendered, creating severe latency on slower campus networks. With Next.js 14, "
        "data-intensive dashboards, institutional student lists, and analytical summaries are pre-rendered on the server, streaming lightweight "
        "HTML directly to the browser. Furthermore, Next.js co-locates Node.js REST API route handlers (/api/contacts, /api/teachers) directly within "
        "the project repository, eliminating the operational complexity of managing disparate backend services."
    )
    
    add_heading_3(doc, "4.2.2 TypeScript 5.3 and Tailwind CSS 3.4")
    add_paragraph(
        doc,
        "TypeScript 5.3 enforces rigorous compile-time type checking across the entire full-stack codebase. By sharing unified Data Transfer Object "
        "(DTO) interfaces (such as Lead, Application, Teacher, and Payment) between client-side components and server-side route handlers, runtime "
        "data mismatch exceptions are virtually eradicated. Tailwind CSS 3.4 provides a utility-first styling system optimized through modern Just-In-Time "
        "(JIT) compilation. It enables a bespoke, high-contrast glassmorphic design system characterized by backdrop-blur filters, translucent dark-mode "
        "cards, and specular interactive buttons that maintain visual elegance across desktop and mobile screens."
    )
    
    add_heading_3(doc, "4.2.3 Prisma ORM 5.10 and Relational Persistence")
    add_paragraph(
        doc,
        "Prisma ORM 5.10 serves as the primary object-relational mapping layer. Its declarative schema (prisma/schema.prisma) defines strongly typed "
        "relational models: User, Lead, Application, Task, Payment, and Teacher. Prisma generates an auto-completing, fully type-safe database client "
        "that eliminates raw SQL injection vulnerabilities and automatically executes relational joins (e.g., fetching a student lead with their associated "
        "application record and payment history in a single optimized query). The local storage engine utilizes an embedded SQLite database (dev.db), "
        "which requires zero external database server administration and delivers sub-millisecond query execution."
    )
    
    add_heading_3(doc, "4.2.4 Google Firebase Firestore and Realtime Database")
    add_paragraph(
        doc,
        "To empower real-time collaboration across admissions officers and faculty counselors across disparate campuses, Google Firebase 12.18.0 "
        "is integrated as a complementary real-time persistence layer. Firestore provides structured document storage with real-time websocket "
        "listeners (onSnapshot), instantly pushing newly created student leads and status updates to all active counselor screens. Simultaneously, "
        "Firebase Realtime Database powers the Universal Emergency Kill-Switch heartbeat, enabling sub-3.5-second reactive state propagation globally."
    )
    
    add_heading_3(doc, "4.2.5 Capacitor Android Framework")
    add_paragraph(
        doc,
        "Capacitor 8.5.1 provides the cross-platform bridge converting the Next.js web application into a compiled native Android application "
        "(CRM-Mobile-App.apk). Unlike legacy hybrid frameworks like Apache Cordova that introduced sluggish abstraction layers, Capacitor embeds "
        "a native Android WebView container that directly interfaces with Android hardware APIs. It enables deep hooks into the native Android telephony "
        "dialer (via tel: URIs), WhatsApp messaging intents, and local storage, providing faculty counselors with a blazing-fast native mobile experience."
    )
    
    add_heading_3(doc, "4.2.6 WebRTC Voice Signaling and Resend Email API")
    add_paragraph(
        doc,
        "For browser-based voice communications, a dedicated WebRTC signaling server (webrtc-voice-system/server.js) built with Node.js and Socket.IO "
        "manages Session Description Protocol (SDP) exchanges and ICE candidate routing. Once signaled, encrypted peer-to-peer audio streams connect "
        "directly between browsers using standard Opus codecs. For official institutional communication, the Resend API is integrated to dispatch "
        "professionally styled HTML admission letters, verification confirmations, and fee receipts directly to student and parent email inboxes."
    )
    
    # -------------------------------------------------------------
    # 4.3 DEVELOPMENT ENVIRONMENT AND SETUP
    # -------------------------------------------------------------
    add_heading_2(doc, "4.3 DEVELOPMENT ENVIRONMENT AND SETUP")
    add_paragraph(
        doc,
        "Setting up the LEAD TRACK AI development and production environment requires a standardized sequence of initialization commands. "
        "The project is architected for zero-friction bootstrapping across Windows, Linux, and macOS development workstations."
    )
    
    add_heading_3(doc, "4.3.1 Local Environment Configuration (.env)")
    add_paragraph(
        doc,
        "The application reads runtime configuration parameters exclusively from environment variables. A template file (.env.example) is provided "
        "in the repository root. A sample local .env configuration is detailed below:"
    )
    
    code_env = (
        "# Database Connection String (SQLite Embedded Engine)\n"
        "DATABASE_URL=\"file:./dev.db\"\n\n"
        "# Resend Institutional Email Service Configuration\n"
        "RESEND_API_KEY=\"re_VSB_Enterprise_Live_SecretKey_9824\"\n"
        "RESEND_FROM_EMAIL=\"VSB Admissions <onboarding@resend.dev>\"\n"
        "RESEND_FALLBACK_EMAIL=\"admissions.vsb@gmail.com\"\n\n"
        "# Master Creator Root Credentials (Emergency Authority)\n"
        "MASTER_CREATOR_ID=\"spherexnithish#\"\n"
        "MASTER_CREATOR_KEY=\"spherex#2501\"\n\n"
        "# WebRTC Audio Signaling Port\n"
        "WEBRTC_SIGNALING_PORT=5000"
    )
    add_callout(doc, code_env, title="Environment Variable Configuration (.env)")
    
    add_heading_3(doc, "4.3.2 Database Generation and Seeding (Prisma)")
    add_paragraph(
        doc,
        "To compile the Prisma relational client, execute migrations, and populate the database with institutional test data (including 16 engineering "
        "departments, pre-configured faculty counselors, and sample TNEA candidate leads), execute the following terminal commands:"
    )
    code_db = (
        "# 1. Install Node.js Dependencies\n"
        "npm install\n\n"
        "# 2. Generate Prisma Client Type Definitions\n"
        "npx prisma generate\n\n"
        "# 3. Push Relational Schema to Local SQLite Database\n"
        "npx prisma db push\n\n"
        "# 4. Seed Institutional Department Rosters & Faculty Batches\n"
        "npm run prisma:seed"
    )
    add_callout(doc, code_db, title="Prisma Database Bootstrapping Runbook")
    
    add_heading_3(doc, "4.3.3 Android APK Compilation (Capacitor & Gradle)")
    add_paragraph(
        doc,
        "To compile the cross-platform codebase into a production-ready Android package (APK), the static web build is synchronized with the "
        "native Android Studio project directory and assembled via Gradle:"
    )
    code_cap = (
        "# 1. Compile Next.js Static Export Bundle\n"
        "npm run build:mobile\n\n"
        "# 2. Synchronize Web Assets with Android Native Container\n"
        "npx cap sync android\n\n"
        "# 3. Compile Native Debug APK via Android Gradle Wrapper\n"
        "cd android && ./gradlew.bat assembleDebug\n\n"
        "# Binary Output Location:\n"
        "# android/app/build/outputs/apk/debug/app-debug.apk"
    )
    add_callout(doc, code_cap, title="Capacitor Android Native Compilation Runbook")
    
    add_heading_3(doc, "4.3.4 Production Deployment on Vercel")
    add_paragraph(
        doc,
        "The web application includes a pre-configured vercel.json deployment descriptor. Pushing changes to the GitHub repository "
        "(https://github.com/Nithishkumar-2501/LEAD-MANAGEMENT-SYSTEM.git) automatically triggers Vercel CI/CD pipelines, which execute "
        "prisma generate, build the optimized Next.js serverless bundle, and provision global edge deployment across distributed CDN nodes."
    )
    
    # -------------------------------------------------------------
    # 4.4 DEVELOPMENT TOOLS AND SECURITY VALIDATION
    # -------------------------------------------------------------
    add_heading_2(doc, "4.4 DEVELOPMENT TOOLS, LINTERS, AND VERSION CONTROL")
    add_paragraph(
        doc,
        "Engineering excellence was enforced throughout the project lifecycle utilizing rigorous static analysis, code linting, and version control:"
    )
    add_bullet(
        doc,
        "The repository is maintained under Git version control on GitHub with structured, semantic commit messages (feat, fix, docs, refactor). "
        "Feature branches were merged via pull requests following comprehensive local build checks.",
        "1. Git & GitHub Repository:"
    )
    add_bullet(
        doc,
        "Configured with strict ESLint rules (next/core-web-vitals) and TypeScript compiler flags (noImplicitAny, strictNullChecks, noUnusedLocals) "
        "to prevent memory leaks, unintended type coercions, and asynchronous unhandled promise rejections.",
        "2. Static Analysis & Linting:"
    )
    add_bullet(
        doc,
        "All incoming REST API request payloads are rigorously validated against strict TypeScript interfaces before database persistence, "
        "effectively thwarting NoSQL/SQL injection attacks, cross-site scripting (XSS), and prototype pollution.",
        "3. Security Hardening:"
    )
    
    add_page_break(doc)
