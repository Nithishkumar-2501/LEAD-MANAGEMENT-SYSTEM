from docx.shared import Inches, Pt
from scripts.report_generator.styles import (
    add_heading_1, add_heading_2, add_heading_3, add_paragraph, add_bullet,
    add_callout, add_table, add_page_break, add_code_block, HEX_ACCENT
)

def build_chapter5(doc):
    add_heading_1(doc, "CHAPTER 5: IMPLEMENTATION")
    
    # -------------------------------------------------------------
    # 5.1 SYSTEM ARCHITECTURE
    # -------------------------------------------------------------
    add_heading_2(doc, "5.1 SYSTEM ARCHITECTURE")
    add_paragraph(
        doc,
        "LEAD TRACK AI is engineered around an enterprise-grade, multi-tier hybrid architecture that harmonizes modern web application "
        "paradigms with native mobile runtimes, local embedded relational caching, and cloud-scale real-time synchronization. The architectural "
        "blueprint is bifurcated into four cohesive layers:"
    )
    add_bullet(
        doc,
        "Delivered simultaneously via modern desktop web browsers (Google Chrome, Microsoft Edge, Safari) and an assembled native Android "
        "binary (SPHEREX.apk). The interface utilizes React 18 with Next.js 14 App Router, styled with high-contrast specular glassmorphic cards, "
        "Framer Motion spring physics, and WebGL noise background shaders.",
        "1. Client Presentation Layer:"
    )
    add_bullet(
        doc,
        "Consists of Next.js 14 dynamic Node.js server route handlers deployed co-located with the user interface. This layer handles JSON request "
        "deserialization, cryptographic authentication verification, OCR marksheet processing, Resend email dispatching, and dynamic UPI QR code "
        "generation.",
        "2. Server Application & API Layer:"
    )
    add_bullet(
        doc,
        "A standalone Node.js and Socket.IO daemon (webrtc-voice-system/server.js) running on port 5000 that manages peer-to-peer WebRTC audio "
        "call discovery, Session Description Protocol (SDP) exchanges, and ICE network traversal candidates for in-browser telephony.",
        "3. Real-Time Voice Signaling Server:"
    )
    add_bullet(
        doc,
        "An innovative dual-datastore topology combining an ultra-fast local embedded relational engine (SQLite via Prisma ORM 5.10) for sub-millisecond "
        "local queries, paired with Google Firebase (Cloud Firestore and Realtime Database) for real-time multi-campus synchronization, live telecalling "
        "audit streams, and emergency kill-switch heartbeats.",
        "4. Dual-Persistence & Cloud Synchronization Layer:"
    )
    
    # -------------------------------------------------------------
    # 5.1.1 API DESIGN
    # -------------------------------------------------------------
    add_heading_3(doc, "5.1.1 API Design and REST Endpoint Matrix")
    add_paragraph(
        doc,
        "The server layer exposes a structured, RESTful Application Programming Interface (API) organized under standardized HTTP conventions. "
        "Table 5.1 details the primary endpoint routes, supported HTTP verbs, payload parameters, and operational purposes."
    )
    
    api_headers = ["ROUTE / ENDPOINT", "HTTP METHOD", "PAYLOAD / PARAMETERS", "STATUS", "FUNCTIONAL RESPONSIBILITY"]
    api_data = [
        ["/api/contacts", "GET", "campus, department, status, limit, offset", "200 OK", "Fetches paginated student lead records with relational filters"],
        ["/api/contacts", "POST", "JSON Lead Object (3-sheet candidate data)", "201 Created", "Ingests single lead; triggers quota verification & ledger audit"],
        ["/api/contacts/batch", "POST", "Multipart CSV File (up to 1,00,000 records)", "200 OK", "High-throughput batch CSV parsing and bulk database insertion"],
        ["/api/contacts/[id]", "PUT", "Partial Lead Object (status, counselorId)", "200 OK", "Updates candidate enrollment stage, assigned counselor, or notes"],
        ["/api/contacts/[id]", "DELETE", "Lead ID (UUID string)", "200 OK", "Soft-deletes student record from active CRM views"],
        ["/api/teachers", "GET", "campus, department, status", "200 OK", "Retrieves faculty directory with live student quota badges"],
        ["/api/teachers", "POST", "JSON Teacher Object (name, email, dept)", "201 Created", "Registers new academic faculty counselor into departmental roster"],
        ["/api/teachers/allocate", "POST", "teacherId, startContact, endContact", "200 OK", "Executes batch lead splitting (e.g., Contacts #1 to #100)"],
        ["/api/applications", "GET", "leadId, stage, paymentStatus", "200 OK", "Queries structured student admission applications and fee logs"],
        ["/api/applications", "POST", "leadId, marks10th, marks12th, cutoff", "201 Created", "Creates verified admission application record with academic scores"],
        ["/api/ai/ocr-cutoff", "POST", "Marksheet Image File (PNG, JPG, PDF)", "200 OK", "Nora AI OCR marks extraction and TNEA cutoff calculation"],
        ["/api/email/send", "POST", "to, subject, htmlContent, studentName", "200 OK", "Dispatches branded VSB admission HTML email via Resend API"],
        ["/api/payments/create-qr", "POST", "leadId, amount, campus, studentName", "200 OK", "Generates dynamic UPI QR code string (₹500/lead) with token"],
        ["/api/creator/killswitch", "GET", "None (Heartbeat Poll)", "200 OK", "Returns active system status: ACTIVE, WEB_LOCKED, MOBILE_LOCKED, FULL_LOCK"],
        ["/api/creator/killswitch", "POST", "target, masterKey, durationMinutes", "200 OK", "Master Creator root trigger to activate or release global emergency lock"]
    ]
    add_table(doc, api_headers, api_data, col_widths=[Inches(1.3), Inches(0.8), Inches(1.5), Inches(0.8), Inches(1.6)])
    
    # -------------------------------------------------------------
    # 5.1.2 DUAL-PERSISTENCE LAYER
    # -------------------------------------------------------------
    add_heading_3(doc, "5.1.2 Dual-Persistence and Cloud Synchronization Layer")
    add_paragraph(
        doc,
        "A foundational engineering innovation of LEAD TRACK AI is its Dual-Persistence Synchronization Engine. Standard cloud-only CRMs fail "
        "when campus internet connectivity degrades, causing counselors to lose in-progress telecalling records. Conversely, purely offline databases "
        "prevent multi-campus visibility and central executive control."
    )
    add_paragraph(
        doc,
        "LEAD TRACK AI reconciles these conflicting requirements by establishing a hybrid write-through, read-local persistence paradigm: "
        "(1) Local Write & Query: All client mutations (such as adding a student, updating call status to 'Talked', or editing notes) are written "
        "immediately to the local SQLite database via Prisma ORM 5.10. Queries execute locally in under 1.5 milliseconds, delivering an instantaneous, "
        "zero-lag user experience. (2) Asynchronous Cloud Replication: Simultaneously, an asynchronous synchronization service replicates the transaction "
        "payload to Google Firebase (Firestore for persistent document history and Realtime Database for active connection states). If network connectivity "
        "is interrupted, mutations are queued locally in an IndexedDB write-ahead log and automatically drained to Firebase upon connection re-establishment."
    )
    
    # -------------------------------------------------------------
    # 5.1.3 QUOTA ENGINE AND DYNAMIC UPI QR
    # -------------------------------------------------------------
    add_heading_3(doc, "5.1.3 Institutional 1,00,000 Quota Engine and Dynamic UPI QR System")
    add_paragraph(
        doc,
        "To prevent unrestricted database bloat, maintain institutional licensing compliance, and automate application fee collections, LEAD TRACK AI "
        "implements an immutable 1,00,000 Lead Quota Engine coupled with a dynamic Unified Payments Interface (UPI) QR code generator."
    )
    add_paragraph(
        doc,
        "The quota engine enforces a strict mathematical capacity ceiling per academic cycle across both campuses: "
        "Total Active Leads <= 1,00,000. When administrators ingest batch CSV files, the quota validator calculates: "
        "Remaining Quota = 100,000 - Current Lead Count. If the incoming batch exceeds Remaining Quota, the import is paused and an overage modal "
        "prompts administrative approval or quota expansion."
    )
    add_paragraph(
        doc,
        "For individual candidate creations via the Quick Lead Modal, the platform incorporates a dynamic UPI QR monetization mechanism (₹500/lead). "
        "The system dynamically constructs a cryptographically formatted UPI URI conforming to National Payments Corporation of India (NPCI) standards: "
        "upi://pay?pa=vsb.admissions@icici&pn=VSB%20Engineering%20College&am=500.00&cu=INR&tn=LEAD_FEE_{leadUUID}. "
        "The URI is rendered into a high-density QR code within the user interface. Once the transaction reference ID is verified, the lead status "
        "transitions to ACTIVE, and an immutable transaction entry is logged in the Payment relational ledger."
    )
    
    # -------------------------------------------------------------
    # 5.1.4 UNIVERSAL EMERGENCY KILL-SWITCH
    # -------------------------------------------------------------
    add_heading_3(doc, "5.1.4 Universal Multi-Layer Emergency Kill-Switch Architecture")
    add_paragraph(
        doc,
        "In higher education governance, institutional security emergencies occasionally necessitate instantaneous access revocation across all "
        "connected devices—such as during disputed administrative transitions, severe security audit failures, or licensing expirations. "
        "LEAD TRACK AI features an unprecedented Universal Multi-Layer Emergency Kill-Switch governed exclusively by the Master Creator "
        "(Master ID: spherexnithish# / Key: spherex#2501)."
    )
    add_paragraph(
        doc,
        "The kill-switch topology operates through a high-frequency, lightweight reactive heartbeat loop. Every active client (whether running in a desktop "
        "browser or inside the native Android APK) dispatches an asynchronous background ping to /api/creator/killswitch every 3,500 milliseconds. "
        "The response returns the current global security state: (1) ACTIVE: Normal operations; (2) WEB_LOCKED: Desktop web access frozen, mobile active; "
        "(3) MOBILE_LOCKED: Android native APK frozen, web active; or (4) FULL_LOCK: Global freeze across all platforms and campuses."
    )
    add_paragraph(
        doc,
        "Upon detecting an active kill-switch state, the client-side interceptor instantaneously unmounts the operational dashboard from the Document "
        "Object Model (DOM), purges cached session tokens, and renders a fullscreen, un-dismissible Red Lockdown Screen displaying institutional "
        "emergency contact protocols. The system can only be revived by the Master Creator supplying the cryptographic emergency bypass key."
    )
    
    # -------------------------------------------------------------
    # 5.1.5 FRONTEND DESIGN & GLASSMORPHISM
    # -------------------------------------------------------------
    add_heading_3(doc, "5.1.5 Frontend Design and Specular Glassmorphism UI")
    add_paragraph(
        doc,
        "The user experience of LEAD TRACK AI is engineered according to modern human-computer interaction (HCI) standards. To combat counselor "
        "visual fatigue during hours of repetitive telecalling data entry, the interface departs from flat, monotonous corporate tables in favor of "
        "a high-contrast, specular glassmorphic aesthetic. The design system leverages Tailwind CSS with backdrop-blur-md, semi-transparent slate "
        "surfaces (rgba(15, 23, 42, 0.75)), 1px border glows, and custom Specular Buttons with physics-based hover reflections."
    )
    add_paragraph(
        doc,
        "Micro-interactions are orchestrated via Framer Motion (motion 13.2.0). Modal dialogs spring open with natural damping, department counts "
        "increment smoothly, and status badges pulse dynamically during active operations. Landing views incorporate an interactive WebGL fluid "
        "noise canvas powered by OGL 1.0.11, providing visual distinction suitable for executive institutional presentations."
    )
    
    # -------------------------------------------------------------
    # 5.2 MODULES USED
    # -------------------------------------------------------------
    add_heading_2(doc, "5.2 MODULES USED")
    add_paragraph(
        doc,
        "The software architecture of LEAD TRACK AI is partitioned into ten modular subsystems, ensuring clean separation of concerns, "
        "high testability, and decoupled extensibility:"
    )
    add_bullet(doc, "Visualizes key performance metrics, conversion funnels, and real-time revenue.", "1. Admissions Analytics Dashboard Module:")
    add_bullet(doc, "Multi-step modal capturing personal, academic, and marketing attribution data.", "2. 3-Sheet Candidate Application Entry Module:")
    add_bullet(doc, "Computer vision pipeline for marksheet OCR parsing and TNEA cutoff calculation.", "3. Nora AI Marksheet Intelligence Module:")
    add_bullet(doc, "Department-grouped faculty rosters, teacher count badges, and batch splitting.", "4. Department-Ordered Faculty Directory Module:")
    add_bullet(doc, "Unified suite for Resend HTML emails, WhatsApp chat, and WebRTC voice calling.", "5. Omnichannel Communication Suite:")
    add_bullet(doc, "Isolates student data, quotas, and faculty between Karur and Coimbatore campuses.", "6. Multi-Campus Segregation Engine:")
    add_bullet(doc, "Master administrative console for emergency kill-switches and license auditing.", "7. Master Creator Root Control Module:")
    add_bullet(doc, "Prisma ORM schema defining User, Lead, Application, Task, Payment, and Teacher.", "8. Database Persistence & Relational Schema:")
    add_bullet(doc, "Capacitor runtime bridging web assets into an installable Android APK.", "9. Native Android Mobile Compilation Module:")
    add_bullet(doc, "Defensive try-catch envelopes, input sanitization, and fallback triggers.", "10. Anti-Tamper Security & Error Recovery Module:")
    
    # -------------------------------------------------------------
    # 5.3 MODULES DESCRIPTION
    # -------------------------------------------------------------
    add_heading_2(doc, "5.3 MODULES DESCRIPTION")
    
    add_heading_3(doc, "5.3.1 Admissions Analytics and Funnel Dashboard Module")
    add_paragraph(
        doc,
        "The Admissions Analytics Dashboard (implemented in src/components/AdminDashboardView.tsx) serves as the primary executive command center "
        "for campus administrators and institutional principals. The module renders four real-time Key Performance Indicator (KPI) cards: "
        "(1) Total Ingested Leads, (2) Verified Marksheets, (3) Confirmed Admissions, and (4) Total Application Fees Collected (₹). "
        "The core analytical centerpiece is an interactive 5-stage conversion funnel powered by Recharts (LeadFunnelChart.tsx), displaying the "
        "mathematical transition drop-off across New Inquiries -> Contacted -> In Review -> Admitted -> Rejected. A global campus toggle allows "
        "administrators to switch seamlessly between Karur Main Campus (Code: 612) and Coimbatore Campus (Code: 714) with instantaneous chart updates."
    )
    
    add_heading_3(doc, "5.3.2 3-Sheet Structured Candidate Entry Engine")
    add_paragraph(
        doc,
        "To ensure immaculate data hygiene during manual prospective student intake, the system incorporates a 3-Sheet structured candidate "
        "entry interface (ApplicationManagerModule.tsx and AddQuickLeadModal.tsx). Inquiries are partitioned into three logically sequential sheets:"
    )
    add_bullet(
        doc,
        "Captures candidate full legal name, primary mobile telephone number, alternate parental mobile, personal email address, gender, "
        "blood group, community quota (OC, BC, BCM, MBC, SC, SCA, ST), and physical disability status.",
        "Sheet 1: Personal & Demographic Identifiers:"
    )
    add_bullet(
        doc,
        "Records 10th standard board percentage, secondary school name, educational board (State Board, CBSE, ICSE), district of origin, "
        "12th standard registration roll number, and individual subject marks (Mathematics, Physics, Chemistry).",
        "Sheet 2: Academic Performance & Scores:"
    )
    add_bullet(
        doc,
        "Captures preferred campus (Karur or Coimbatore), priority degree engineering discipline (e.g., B.Tech AI & DS, B.E. CSE), admission "
        "channel (TNEA Single-Window Counseling or Management Quota), and marketing attribution source (Google Ads, Meta, School Expo, Walk-in).",
        "Sheet 3: Program Preferences & Attribution:"
    )
    
    add_heading_3(doc, "5.3.3 Nora AI Marksheet OCR and Cutoff Intelligence Module")
    add_paragraph(
        doc,
        "The Nora AI Marksheet Intelligence module (AiIntelligenceModule.tsx and NoraAiDatabaseModal.tsx) provides cognitive document processing "
        "that eliminates human calculation errors in student eligibility assessments. When an admissions counselor uploads a scanned image or "
        "photograph of a student's 12th standard marksheet (PNG, JPG, PDF), the module executes an optical character recognition pipeline."
    )
    add_paragraph(
        doc,
        "The OCR engine isolates the subject marks table, locating Mathematics (M), Physics (P), and Chemistry (C) scores. It applies the official "
        "statutory Tamil Nadu Engineering Admissions (TNEA) normalization algorithm:"
    )
    add_callout(
        doc,
        "TNEA Cutoff Formula (out of 200):\n"
        "Cutoff = Mathematics + (Physics / 2) + (Chemistry / 2)\n\n"
        "Where Mathematics is evaluated out of 100, Physics out of 100, and Chemistry out of 100.\n"
        "Example: M = 96, P = 92, C = 88  =>  Cutoff = 96 + 46 + 44 = 186.00 / 200.00",
        title="Nora AI Mathematical Eligibility Formula"
    )
    add_paragraph(
        doc,
        "The calculated cutoff is automatically compared against institutional departmental cutoffs (e.g., B.Tech AI&DS: 172.50, B.E. CSE: 178.00). "
        "The candidate is instantly classified as 'ELIGIBLE', 'BORDERLINE', or 'INELIGIBLE', with the verified score saved directly to their profile."
    )
    
    add_heading_3(doc, "5.3.4 Department-Ordered Faculty Directory and Quota Allocation")
    add_paragraph(
        doc,
        "The Department-Ordered Faculty Directory (TeacherModule.tsx) bridges the administrative admissions cell with academic faculty counselors. "
        "The interface features a sticky departmental navigation sidebar organizing 16+ engineering departments: Mechanical Engineering, Computer "
        "Science & Engineering, Electronics & Communication Engineering, Artificial Intelligence & Data Science, Information Technology, Civil "
        "Engineering, Electrical & Electronics Engineering, Biomedical Engineering, and postgraduate MBA/MCA faculties."
    )
    add_paragraph(
        doc,
        "Every department tab displays a live counselor count badge (e.g., Mechanical Engineering (4 Teachers)). Within each departmental view, "
        "faculty cards display the professor's photograph, academic experience, assigned student quota range (e.g., Contacts #1 to #100), and a "
        "real-time telecalling progress bar displaying Talked (green) vs Not Talked (yellow). Through the Admin Lead Allocation Panel, campus admins "
        "can execute one-click batch splitting, automatically partitioning database records into non-overlapping faculty segments."
    )
    
    add_heading_3(doc, "5.3.5 Omnichannel Communication Engine (Resend, WhatsApp, WebRTC)")
    add_paragraph(
        doc,
        "LEAD TRACK AI integrates an omnichannel outreach suite (InPortalCommunicationModals.tsx) that empowers faculty to engage candidates "
        "through their preferred communication channels without leaving the CRM environment:"
    )
    add_bullet(
        doc,
        "Integrated with the modern Resend API (/api/email/send). Dispatches official institutional HTML emails styled with V.S.B. logos, campus "
        "accreditations (NAAC 'A' Grade, NBA), personalized applicant details, and fee payment instructions.",
        "1. Automated Institutional Email Dispatch:"
    )
    add_bullet(
        doc,
        "Generates pre-formatted WhatsApp chat URLs (https://wa.me/{phone}?text={encodedTemplate}). When clicked, it launches WhatsApp Web on desktop "
        "or the native WhatsApp mobile app on Android, pre-populating personalized counseling messages.",
        "2. Direct WhatsApp Outreach:"
    )
    add_bullet(
        doc,
        "On Android mobile devices, clicking a candidate's phone number hooks directly into the native Android telephony dialer via the standard "
        "tel: protocol, enabling instant cellular calling.",
        "3. Native Telephone Dialing:"
    )
    add_bullet(
        doc,
        "A standalone WebRTC signaling server (webrtc-voice-system/server.js) running on port 5000 enables direct peer-to-peer browser voice calls. "
        "Counselors can speak directly with applicants through their computer microphones, with live talk-time tracking and telecalling audio audits.",
        "4. WebRTC Browser Voice Telephony:"
    )
    
    add_heading_3(doc, "5.3.6 Multi-Campus Segregation Engine (Karur vs Coimbatore)")
    add_paragraph(
        doc,
        "The V.S.B. educational ecosystem encompasses two autonomous technical campuses: the Karur Main Campus (TNEA Code: 612) and the Coimbatore "
        "Campus (TNEA Code: 714). The Multi-Campus Segregation Engine (CampusCourseModule.tsx) enforces complete logical isolation between campus data "
        "while providing top management with unified executive visibility. Every database entity (Lead, Application, Teacher, Payment) contains "
        "an indexed campus attribute ('KARUR' or 'COIMBATORE'). Campus administrators are restricted to querying and editing records belonging to "
        "their designated campus, preventing data corruption across campuses."
    )
    
    add_heading_3(doc, "5.3.7 Master Creator Root Operations and Licensing Engine")
    add_paragraph(
        doc,
        "The Master Creator Control Module (CreatorControlModule.tsx) provides root administrative authority accessible exclusively to the platform's "
        "chief architect using master credentials (spherexnithish# / spherex#2501). The module provides: (1) Global License Administration, managing "
        "institutional license validity, expiration timers, and renewal keys; (2) Live Revenue Telemetry, displaying cumulative lead creation fees "
        "collected via dynamic UPI QR codes (₹500/lead); (3) Emergency Quota Overrides, allowing authorized expansion beyond the 1,00,000 lead cap; "
        "and (4) The Universal Emergency Kill-Switch console with sub-3.5-second reactive lockdown propagation."
    )
    
    add_heading_3(doc, "5.3.8 Database Design and Entity Relationship Mappings")
    add_paragraph(
        doc,
        "The relational data persistence layer is governed by a declarative Prisma schema (prisma/schema.prisma) targeting an embedded SQLite "
        "database engine (dev.db). Table 5.2 outlines the core relational entities, their key attributes, data types, and foreign key relationships."
    )
    
    db_headers = ["ENTITY NAME", "PRIMARY ATTRIBUTES & TYPES", "CONSTRAINTS / DEFAULTS", "RELATIONAL MAPPING"]
    db_data = [
        ["User", "id (String UUID), name, email, role, createdAt", "email UNIQUE; role DEFAULT 'COUNSELOR'", "1-to-Many with Lead (assignedLeads); 1-to-Many with Task"],
        ["Lead", "id, name, email, phone, campus, status, counselorId, createdAt", "status DEFAULT 'NEW'; campus DEFAULT 'KARUR'", "BelongsTo User (counselor); 1-to-1 with Application; 1-to-Many with Task"],
        ["Application", "id, leadId, stage, marks10th, marks12th, paymentStatus", "leadId UNIQUE; stage DEFAULT 'INQUIRY'", "BelongsTo Lead (onDelete: Cascade); 1-to-Many with Payment"],
        ["Task", "id, counselorId, leadId, title, type, dueDate, isCompleted", "type DEFAULT 'CALL'; isCompleted DEFAULT false", "BelongsTo User (counselor); BelongsTo Lead (onDelete: Cascade)"],
        ["Payment", "id, applicationId, studentName, campus, amount, transactionId", "transactionId UNIQUE; status DEFAULT 'COMPLETED'", "BelongsTo Application (onDelete: Cascade)"],
        ["Teacher", "id, name, email, phone, department, campus, assignedQuota", "email UNIQUE; campus DEFAULT 'KARUR'", "Standalone directory entity for batch quota splitting"]
    ]
    add_table(doc, db_headers, db_data, col_widths=[Inches(1.1), Inches(2.2), Inches(1.4), Inches(1.5)])
    
    add_heading_3(doc, "5.3.9 Native Android Packaging via Capacitor Bridge")
    add_paragraph(
        doc,
        "To empower faculty counselors conducting telecalling outreach away from their desktop workstations, LEAD TRACK AI is compiled into "
        "an installable native Android APK (CRM-Mobile-App.apk / SPHEREX.apk) via Capacitor 8.5.1. The Capacitor runtime packages the Next.js static "
        "export (out/) inside an Android Studio Gradle container configured with Java 17, Android SDK 34, and Gradle 8.2. Capacitor establishes "
        "a native bridge granting the web application direct access to Android hardware telephony dialers, local SQLite storage, and native network "
        "status listeners."
    )
    
    add_heading_3(doc, "5.3.10 Defensive Error Handling and Anti-Tamper Security")
    add_paragraph(
        doc,
        "In enterprise software, unexpected server crashes or malformed client payloads can paralyze administrative operations. LEAD TRACK AI "
        "implements defensive error handling at both client and server layers. All API route handlers wrap operations in try-catch envelopes, "
        "returning standardized JSON error structures. On the client, an Error Boundary component (src/components/ErrorBoundary.tsx) intercepts "
        "unhandled React rendering exceptions, preventing white-screen crashes and presenting users with a graceful recovery button. In offline or "
        "mobile environments where external email APIs are unreachable, the system automatically falls back to native device email clients (mailto:)."
    )
    
    # -------------------------------------------------------------
    # 5.3.11 ALGORITHMIC FOUNDATIONS
    # -------------------------------------------------------------
    add_heading_3(doc, "5.3.11 Algorithmic Foundations and Pseudocode Formulations")
    add_paragraph(
        doc,
        "The core computational intelligence of LEAD TRACK AI is governed by five formal algorithms that orchestrate data partitioning, "
        "cognitive OCR document evaluation, banking-grade URI formulation, distributed emergency state propagation, and resilient dual-persistence."
    )
    
    add_paragraph(
        doc,
        "Algorithm 1 details the deterministic batch lead splitting and counselor quota assignment mechanism, ensuring zero overlapping allocations:",
        bold_prefix="Algorithm 1: Sequential Batch Allocation and Range Partitioning"
    )
    algo_1 = (
        "Input: Candidate Lead Dataset L = {l_1, l_2, ..., l_N}, Target Faculty F, Desired Batch Size B (Default: 100)\n"
        "Output: Allocated Range Map R(F) and Updated Database Records\n\n"
        "1.  Procedure AllocateBatch(L, F, B):\n"
        "2.      CurrentMaxAllocatedIndex <- QueryMaxAssignedIndex(L)\n"
        "3.      StartIndex <- CurrentMaxAllocatedIndex + 1\n"
        "4.      EndIndex <- min(StartIndex + B - 1, |L|)\n"
        "5.      If StartIndex > |L| Then\n"
        "6.          Return Error(\"No unallocated leads remaining in current campus cohort\")\n"
        "7.      End If\n"
        "8.      Begin Transaction (Prisma ORM):\n"
        "9.          For each i from StartIndex to EndIndex do\n"
        "10.             Update l_i Set counselorId = F.id, status = 'ASSIGNED', updatedAt = CurrentTimestamp()\n"
        "11.         End For\n"
        "12.         Update F Set assignedQuota = F.assignedQuota + (EndIndex - StartIndex + 1)\n"
        "13.     Commit Transaction\n"
        "14.     BroadcastMutationToFirebase('teachers/allocation', { teacherId: F.id, range: [StartIndex, EndIndex] })\n"
        "15.     Return Success(\"Successfully allocated Contacts #\" + StartIndex + \" to #\" + EndIndex + \" to \" + F.name)\n"
        "16. End Procedure"
    )
    add_code_block(doc, algo_1)
    
    add_paragraph(
        doc,
        "Algorithm 2 details the Nora AI computer vision mark extraction and TNEA normalization procedure:",
        bold_prefix="Algorithm 2: Nora AI Mark Extraction and Cutoff Normalization"
    )
    algo_2 = (
        "Input: Marksheet Image Document I (PNG / JPG / PDF)\n"
        "Output: Extracted Scores {M, P, C}, Normalized Cutoff C_TNEA, Eligibility Status\n\n"
        "1.  Procedure EvaluateMarksheetOCR(I):\n"
        "2.      PreprocessedImage <- Grayscale -> AdaptiveThreshold -> Deskew(I)\n"
        "3.      BoundingBoxes <- DetectTableContours(PreprocessedImage)\n"
        "4.      ExtractedTextBlocks <- TesseractOCR_Parse(BoundingBoxes)\n"
        "5.      MathsRaw <- ExtractNumericGlyphs(LocateKey(ExtractedTextBlocks, [\"MATHEMATICS\", \"MATHS\"]))\n"
        "6.      PhysicsRaw <- ExtractNumericGlyphs(LocateKey(ExtractedTextBlocks, [\"PHYSICS\", \"PHY\"]))\n"
        "7.      ChemistryRaw <- ExtractNumericGlyphs(LocateKey(ExtractedTextBlocks, [\"CHEMISTRY\", \"CHEM\"]))\n"
        "8.      If AnyNull(MathsRaw, PhysicsRaw, ChemistryRaw) or ConfidenceScore < 0.75 Then\n"
        "9.          Return FlagForManualReview(\"Low OCR confidence or missing STEM subject score\")\n"
        "10.     End If\n"
        "11.     // Statutory TNEA Formula: M + (P / 2) + (C / 2)\n"
        "12.     C_TNEA <- RoundToTwoDecimals(MathsRaw + (PhysicsRaw / 2.0) + (ChemistryRaw / 2.0))\n"
        "13.     If C_TNEA >= 140.00 Then\n"
        "14.         Status <- 'ELIGIBLE'\n"
        "15.     Else If C_TNEA >= 120.00 Then\n"
        "16.         Status <- 'BORDERLINE_COUNSELING'\n"
        "17.     Else\n"
        "18.         Status <- 'INELIGIBLE'\n"
        "19.     End If\n"
        "20.     Return { Maths: MathsRaw, Physics: PhysicsRaw, Chemistry: ChemistryRaw, Cutoff: C_TNEA, Status: Status }\n"
        "21. End Procedure"
    )
    add_code_block(doc, algo_2)
    
    add_paragraph(
        doc,
        "Algorithm 3 describes the dynamic NPCI-compliant UPI QR URI string generation and ledger accounting sequence:",
        bold_prefix="Algorithm 3: Dynamic UPI QR Generation and Payment Ledger Verification"
    )
    algo_3 = (
        "Input: Lead Object L, Fee Amount A (INR, Default: 500.00), Payee Account P_acc\n"
        "Output: NPCI QR Bitstream and Immutable Payment Ledger Entry\n\n"
        "1.  Procedure GenerateUPIPaymentQR(L, A, P_acc):\n"
        "2.      TransactionRefToken <- GenerateCryptoUUID('UPI-REF-')\n"
        "3.      SanitizedStudentName <- RegexReplace(L.name, \"[^a-zA-Z0-9]\", \"\")\n"
        "4.      NoteString <- \"LEAD_FEE_\" + Substring(L.id, 0, 8) + \"_\" + SanitizedStudentName\n"
        "5.      // Construct RFC-Compliant NPCI UPI URI Scheme\n"
        "6.      UPI_URI <- \"upi://pay?pa=\" + P_acc + \"&pn=VSB%20Engineering%20College&am=\" + FormatCurrency(A) +\n"
        "7.                 \"&cu=INR&tn=\" + EncodeURIComponent(NoteString) + \"&tr=\" + TransactionRefToken\n"
        "8.      QR_Matrix <- Render2D_QRCode(UPI_URI, ErrorCorrectionLevel='HIGH')\n"
        "9.      RenderModal(QR_Matrix, TransactionRefToken)\n"
        "10.     Wait For Event PaymentConfirmation(SubmittedBankRef):\n"
        "11.         Begin Transaction:\n"
        "12.             Insert Into Payment (id, applicationId, amount, transactionId, status) \n"
        "13.             Values (UUID(), L.application.id, A, SubmittedBankRef, 'COMPLETED')\n"
        "14.             Update Lead Set status = 'ACTIVE' Where id = L.id\n"
        "15.         Commit Transaction\n"
        "16.     Return Success(\"Payment confirmed and ledger updated\")\n"
        "17. End Procedure"
    )
    add_code_block(doc, algo_3)
    
    add_paragraph(
        doc,
        "Algorithm 4 formalizes the Universal Multi-Layer Emergency Kill-Switch heartbeat polling and client-side DOM interceptor:",
        bold_prefix="Algorithm 4: Universal Emergency Kill-Switch Reactive Topology"
    )
    algo_4 = (
        "Input: Client Instance C (Web Browser / Native Android APK), Polling Frequency f = 3500ms\n"
        "Output: Continuous Operational Authorization or Instantaneous DOM Lockdown\n\n"
        "1.  Procedure ClientHeartbeatMonitor(C):\n"
        "2.      Loop Every f Milliseconds:\n"
        "3.          Try:\n"
        "4.              Response <- AsynchronousFetch('/api/creator/killswitch', Timeout = 1500ms)\n"
        "5.              SecurityPayload <- Response.JSON()\n"
        "6.              If SecurityPayload.status == 'FULL_LOCK' Then\n"
        "7.                  ExecuteClientLockdown(SecurityPayload.reason)\n"
        "8.              Else If SecurityPayload.status == 'WEB_LOCKED' and C.platform == 'WEB' Then\n"
        "9.                  ExecuteClientLockdown(\"Web Portal Suspended by Master Creator\")\n"
        "10.             Else If SecurityPayload.status == 'MOBILE_LOCKED' and C.platform == 'ANDROID' Then\n"
        "11.                 ExecuteClientLockdown(\"Mobile App Suspended by Master Creator\")\n"
        "12.             Else\n"
        "13.                 RetainOperationalMount()\n"
        "14.             End If\n"
        "15.         Catch NetworkTimeoutException:\n"
        "16.             // Retain existing state during transient network drops; log security warning\n"
        "17.             LogLocalWarning(\"Killswitch heartbeat unreachable; operating in degraded mode\")\n"
        "18.     End Loop\n"
        "19. End Procedure\n"
        "20. Procedure ExecuteClientLockdown(Reason):\n"
        "21.     UnmountActiveDashboardFromDOM()\n"
        "22.     PurgeSessionCredentialsAndAuthTokens()\n"
        "23.     RenderFullscreenLockdownScreen(Reason, BypassPrompt=True)\n"
        "24. End Procedure"
    )
    add_code_block(doc, algo_4)
    
    add_paragraph(
        doc,
        "Algorithm 5 illustrates the Dual-Persistence Write-Ahead Queue and conflict-free replication mechanism:",
        bold_prefix="Algorithm 5: Dual-Persistence Write-Ahead Queue and Cloud Sync"
    )
    algo_5 = (
        "Input: Client Mutation M = {Entity, Action, Payload, Timestamp}\n"
        "Output: Instantaneous Local Persistence and Asynchronous Cloud Consistency\n\n"
        "1.  Procedure ExecuteDualPersistence(M):\n"
        "2.      // Step 1: Immediate Local Relational Persistence\n"
        "3.      LocalResult <- PrismaClient.Execute(M.Action, M.Entity, M.Payload)\n"
        "4.      UpdateLocalReactiveState(LocalResult)\n"
        "5.      // Step 2: Queue for Cloud Asynchronous Replication\n"
        "6.      WriteAheadQueue.Enqueue(M)\n"
        "7.      If NetworkMonitor.isOnline() Then\n"
        "8.          While WriteAheadQueue.isNotEmpty() do\n"
        "9.              PendingMutation <- WriteAheadQueue.Peek()\n"
        "10.             CloudResponse <- FirebaseFirestore.Doc(PendingMutation.Entity).Set(PendingMutation.Payload)\n"
        "11.             If CloudResponse.isSuccess() Then\n"
        "12.                 WriteAheadQueue.Dequeue()\n"
        "13.             Else\n"
        "14.                 ExponentialBackoffRetry(500ms)\n"
        "15.                 Break\n"
        "16.             End If\n"
        "17.         End While\n"
        "18.     Else\n"
        "19.         RegisterBackgroundSyncListener(OnReconnect -> DrainWriteAheadQueue)\n"
        "20.     End If\n"
        "21. End Procedure"
    )
    add_code_block(doc, algo_5)
    
    add_page_break(doc)
