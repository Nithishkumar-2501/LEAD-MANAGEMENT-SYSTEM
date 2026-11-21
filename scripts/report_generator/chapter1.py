from docx.shared import Inches, Pt
from scripts.report_generator.styles import (
    add_heading_1, add_heading_2, add_heading_3, add_paragraph, add_bullet,
    add_callout, add_table, add_page_break, HEX_ACCENT
)

def build_chapter1(doc):
    add_heading_1(doc, "CHAPTER 1: INTRODUCTION")
    
    # -------------------------------------------------------------
    # 1.1 BACKGROUND
    # -------------------------------------------------------------
    add_heading_2(doc, "1.1 BACKGROUND")
    add_paragraph(
        doc,
        "In the contemporary landscape of tertiary technical education in India, student recruitment and admission governance have evolved "
        "from localized, periodic administrative tasks into massive, high-throughput, year-round operational ecosystems. In Tamil Nadu, "
        "engineering admissions are governed predominantly by the Tamil Nadu Engineering Admissions (TNEA) single-window counseling system "
        "administered by the Directorate of Technical Education (DOTE), alongside institutional management quota allocations. Autonomous institutions, "
        "such as V.S.B. Engineering College (Karur Main Campus, TNEA Counseling Code: 612) and V.S.B. College of Technical Campus (Coimbatore Campus, "
        "TNEA Counseling Code: 714), manage thousands of prospective candidate inquiries annually across more than 16 specialized engineering, "
        "technology, and postgraduate degree programs."
    )
    add_paragraph(
        doc,
        "Prospective applicants discover technical colleges through a multitude of disparate marketing channels: targeted social media campaigns "
        "(Meta, Instagram, Facebook), Google Search and Display Ads, regional education fairs, higher secondary school outreach expos, direct campus "
        "walk-ins, alumni referrals, and statewide counseling database directories. Each inquiry generates vital prospective student data: "
        "student personal identifiers, parental contact details, secondary school academic records (10th standard board percentages), higher "
        "secondary performance (12th standard marks in Mathematics, Physics, and Chemistry), TNEA aggregate cutoffs (evaluated out of 200), "
        "preferred degree programs (e.g., Artificial Intelligence & Data Science, Computer Science & Engineering, Mechanical Engineering, Electronics "
        "& Communication Engineering), and geographical residential origins."
    )
    add_paragraph(
        doc,
        "Despite the rapid modernization of campus academic learning management systems (LMS) and enterprise ERPs, the initial student acquisition "
        "and lead management phase within technical institutions remains overwhelmingly obsolete, uncoordinated, and manual. Raw contact lists "
        "are frequently compiled across disconnected desktop spreadsheets (Microsoft Excel, CSV sheets), paper-bound visitor logbooks, and untracked "
        "personal mobile telephone calls made by academic faculty members pressed into counseling duties. In the absence of an integrated, "
        "enterprise-grade Customer Relationship Management (CRM) platform, institutions suffer massive prospective candidate churn, fragmented "
        "communication, delayed response times, unverified cutoff assessments, and zero executive transparency."
    )
    add_paragraph(
        doc,
        "To decisively overcome these operational deficits, this project engineers LEAD TRACK AI (commercially branded as SPHEREX Admission OS). "
        "LEAD TRACK AI is an enterprise-grade, omnichannel Lead Management System and Admission CRM engineered specifically for multi-campus higher "
        "education institutions. It provides end-to-end management of the student enrollment lifecycle—from high-volume multi-channel inquiry "
        "ingestion and automated faculty quota splitting, to artificial intelligence-assisted marksheet OCR cutoff evaluation, dynamic Unified "
        "Payments Interface (UPI) QR fee collection, live telecalling audio verification, and an ultra-rapid universal emergency kill-switch."
    )
    
    # -------------------------------------------------------------
    # 1.2 CAUSES OF ADMISSION INEFFICIENCY
    # -------------------------------------------------------------
    add_heading_2(doc, "1.2 CAUSES OF ADMISSION INEFFICIENCY AND LEAD LEAKAGE")
    add_paragraph(
        doc,
        "A rigorous empirical analysis of traditional institutional admission processes reveals several critical systemic causes behind "
        "operational inefficiency, counselor fatigue, and lead abandonment:"
    )
    add_bullet(
        doc,
        "Spreadsheet Concurrency Conflicts and Data Silos: Different academic departments maintain separate, un-synchronized Excel workbooks. "
        "When multiple admissions counselors update identical records simultaneously, data overwrites, version collisions, and missing student "
        "updates occur routinely.",
        "1. Data Fragmentation:"
    )
    add_bullet(
        doc,
        "Lead Slippage and Abandonment: Industry studies indicate that prospective students contacted within 15 minutes of initial inquiry "
        "exhibit a 380% higher conversion probability. In manual workflows, inquiry lists often sit unattended for 3 to 7 days before being "
        "distributed, causing students to enroll in competing institutions.",
        "2. Response Latency:"
    )
    add_bullet(
        doc,
        "Unverified Academic Eligibility: Admission counselors manually compute TNEA cutoffs from self-reported student figures over phone calls. "
        "Self-reported figures frequently contain human memory errors or intentional exaggeration. When verified during physical document verification "
        "months later, discrepancies result in seat cancellations, administrative chaos, and regulatory embarrassment.",
        "3. Eligibility Inaccuracy:"
    )
    add_bullet(
        doc,
        "Zero Telecalling Auditability: In traditional setups, institutional management has no empirical mechanism to verify whether assigned "
        "leads were legitimately contacted by faculty counselors, what conversation occurred, or how long the interaction lasted. "
        "Subjective verbal reports from counselors lead to gross misrepresentation of recruitment funnels.",
        "4. Lack of Accountability:"
    )
    add_bullet(
        doc,
        "Rogue Access and Emergency Vulnerabilities: In scenarios involving campus administrative transitions, disputed lead quotas, or compromised "
        "staff accounts, traditional systems have no mechanism to instantly freeze mobile or web access across all devices, exposing sensitive student "
        "contact lists to competitive theft.",
        "5. Security Deficits:"
    )
    
    # -------------------------------------------------------------
    # 1.3 MOTIVATIONS
    # -------------------------------------------------------------
    add_heading_2(doc, "1.3 MOTIVATIONS")
    add_paragraph(
        doc,
        "The overarching motivation of this project is to construct an intelligent, tamper-proof, and accessible technological infrastructure "
        "that empowers educational administrators, faculty counselors, and prospective students through real-time automation. The specific technical "
        "and institutional drivers include:"
    )
    add_bullet(
        doc,
        "Designing an ultra-responsive, server-side rendered web platform using Next.js 14 App Router, TypeScript, and Tailwind CSS, coupled with "
        "a native Android compilation via Capacitor 8.5.1, providing faculty with seamless mobile dialer and WhatsApp outreach on the go.",
        "1. Unified Omnichannel Experience:"
    )
    add_bullet(
        doc,
        "Implementing a dual-persistence layer that combines high-performance local relational caching (SQLite via Prisma ORM 5.10) with cloud-scale "
        "real-time synchronization (Google Firebase Firestore and Realtime Database), ensuring offline tolerance and sub-120ms cloud replication.",
        "2. Resilient Cloud-Local Architecture:"
    )
    add_bullet(
        doc,
        "Integrating an AI-assisted Optical Character Recognition (OCR) pipeline (Nora AI) capable of reading uploaded 12th standard marksheets, "
        "extracting subject marks (Mathematics, Physics, Chemistry), and mathematically validating TNEA eligibility within 1.2 seconds.",
        "3. Automated Cognitive Verification:"
    )
    add_bullet(
        doc,
        "Establishing an immutable ledger-backed quota engine enforcing a strict 1,00,000 lead ceiling per academic cycle, complete with dynamic "
        "UPI QR payment generation (₹500/lead) and a sub-3.5s universal emergency kill-switch governed by the Master Creator.",
        "4. Institutional Governance & Security:"
    )
    
    # -------------------------------------------------------------
    # 1.4 USAGES AND TARGET PERSONAS
    # -------------------------------------------------------------
    add_heading_2(doc, "1.4 USAGES AND TARGET PERSONAS")
    add_paragraph(
        doc,
        "LEAD TRACK AI operates across four distinct institutional tiers, each tailored with dedicated interfaces, granular permissions, "
        "and targeted operational workflows:"
    )
    add_bullet(
        doc,
        "Holds root administrative authority across the entire platform ecosystem. The Master Creator utilizes the Creator Control Module "
        "to monitor multi-campus revenue telemetry, generate institutional licenses, configure lead creation fees (₹500/lead), adjust global quota "
        "ceilings, and trigger the universal Web or Mobile Emergency Kill-Switches in critical scenarios.",
        "1. Master Creator (Super Administrator):"
    )
    add_bullet(
        doc,
        "Assigned to specific campus entities (e.g., Karur Main Campus, Code: 612, or Coimbatore Campus, Code: 714). Campus Administrators oversee "
        "bulk CSV lead ingestion (up to 1,00,000 leads), monitor real-time recruitment conversion funnels, divide leads into sequential batches, "
        "assign quotas to departmental faculty, and approve candidate stage transitions.",
        "2. Campus Admissions Administrators:"
    )
    add_bullet(
        doc,
        "Department professors and admissions counselors (e.g., Mechanical, CSE, ECE, AI&DS, IT, Civil, EEE) who receive dedicated batches "
        "(e.g., Contacts #1 to #100). They interact via web or the Android native app to dial students directly, initiate official WhatsApp chats, "
        "conduct WebRTC voice calls, record telecalling audio notes, and mark follow-up dispositions ('Talked' vs 'Not Talked').",
        "3. Department Faculty Counselors:"
    )
    add_bullet(
        doc,
        "Prospective engineering candidates and their parents who submit inquiries through web landing portals, upload academic marksheets, "
        "receive branded institutional admissions emails via Resend API, and review fee structures and seat allotments.",
        "4. Prospective Student Applicants:"
    )
    
    # -------------------------------------------------------------
    # 1.5 CLASSIFICATIONS AND FUNNEL STAGES
    # -------------------------------------------------------------
    add_heading_2(doc, "1.5 CLASSIFICATIONS AND FUNNEL STAGES")
    add_paragraph(
        doc,
        "To ensure deterministic tracking and mathematical modeling of the student conversion lifecycle, LEAD TRACK AI implements an 8-stage "
        "state machine governing lead progression:"
    )
    
    stage_data = [
        ["STAGE IDENTIFIER", "SYSTEM STATUS", "OPERATIONAL DEFINITION & CRITERIA"],
        ["Stage 01", "NEW / UNASSIGNED", "Lead ingested into database via web form, CSV bulk import, or walk-in. No counselor assigned."],
        ["Stage 02", "ASSIGNED", "Lead allocated to a specific departmental faculty batch (e.g., Contacts #1 to #100) with assigned counselor ID."],
        ["Stage 03", "CONTACTED", "Faculty counselor has initiated contact via phone dialer, WhatsApp, or WebRTC voice call. Call duration logged."],
        ["Stage 04", "CAMPUS_VISIT", "Candidate expresses high interest; campus visit or laboratory tour scheduled at Karur or Coimbatore campus."],
        ["Stage 05", "IN_REVIEW", "Candidate submits 10th and 12th marksheet; Nora AI OCR performs cutoff verification and subject normalization."],
        ["Stage 06", "ADMITTED", "Candidate satisfies TNEA cutoff criteria; seat confirmed; application fee or initial tuition fee paid via UPI QR."],
        ["Stage 07", "REJECTED", "Candidate fails minimum eligibility criteria, cutoff requirements, or declines seat offer."],
        ["Stage 08", "WITHDRAWN", "Candidate cancels provisional application or withdraws seat before counseling deadline."]
    ]
    add_table(doc, ["STAGE IDENTIFIER", "SYSTEM STATUS", "OPERATIONAL DEFINITION & CRITERIA"], stage_data, col_widths=[Inches(1.2), Inches(1.8), Inches(3.0)])
    
    add_paragraph(
        doc,
        "Leads are additionally classified into three dynamic priority temperatures: (1) HOT: TNEA cutoff > 175/200, highly responsive, parent contacted, "
        "campus visit scheduled; (2) WARM: Cutoff between 140 and 175, inquiries about scholarship and hostel facilities, follow-up scheduled; "
        "and (3) COLD: Cutoff < 140, unresponsive to multiple phone calls, or interested only in distant alternative courses."
    )
    
    # -------------------------------------------------------------
    # 1.6 OBJECTIVES
    # -------------------------------------------------------------
    add_heading_2(doc, "1.6 OBJECTIVES OF LEAD TRACK AI")
    add_paragraph(
        doc,
        "The primary objective of this project is to architect, develop, test, and deploy an enterprise-ready, cross-platform intelligent lead "
        "management system tailored for higher education institutions. The project fulfills ten specific, measurable engineering objectives:"
    )
    add_bullet(doc, "Develop an ultra-fast, server-side rendered web portal utilizing Next.js 14 App Router, React 18, and TypeScript with strict static typing.", "Objective 1:")
    add_bullet(doc, "Engineer a high-performance Native Android mobile application using Capacitor 8.5.1 with deep hooks for Android telephony dialers and WhatsApp intents.", "Objective 2:")
    add_bullet(doc, "Architect a resilient Dual-Persistence Layer pairing local SQLite persistence via Prisma ORM 5.10 with Google Firebase (Firestore and Realtime DB) for sub-120ms cloud sync.", "Objective 3:")
    add_bullet(doc, "Design and implement the Nora AI Marksheet Intelligence module for automated OCR mark extraction and TNEA cutoff computation (Maths + Physics/2 + Chemistry/2).", "Objective 4:")
    add_bullet(doc, "Build a Department-Ordered Faculty Directory organizing 16+ engineering departments with real-time counselor count badges and batch lead splitting (#1 to #100).", "Objective 5:")
    add_bullet(doc, "Construct an immutable 1,00,000 Lead Quota Engine enforcing institutional capacity constraints with dynamic UPI QR payment generation (₹500/lead) and ledger auditing.", "Objective 6:")
    add_bullet(doc, "Develop the Universal Multi-Layer Emergency Kill-Switch with sub-3.5s reactive heartbeat polling for instant web, mobile, or campus-wide access lockdown.", "Objective 7:")
    add_bullet(doc, "Integrate an in-portal Omnichannel Communication Suite combining branded HTML email dispatch via Resend API and peer-to-peer WebRTC voice calling with audio recording.", "Objective 8:")
    add_bullet(doc, "Enforce strict Role-Based Access Control (RBAC) across four administrative tiers: Master Creator, Karur Admin, Coimbatore Admin, and Department Counselors.", "Objective 9:")
    add_bullet(doc, "Verify the entire platform through 65 automated test suites spanning unit, integration, stress, and security vectors, demonstrating zero data loss and sub-2s API response.", "Objective 10:")
    
    # -------------------------------------------------------------
    # 1.7 SCOPE AND LIMITATIONS
    # -------------------------------------------------------------
    add_heading_2(doc, "1.7 SCOPE AND LIMITATIONS")
    add_paragraph(
        doc,
        "The project delivers a fully functioning, production-tested software system deployed across web and native Android environments. "
        "The defined scope and intentional operational boundaries are established as follows:"
    )
    add_heading_3(doc, "Within Project Scope:")
    add_bullet(doc, "Complete student lead ingestion via single manual modal, batch CSV upload (up to 1,00,000 records), and web inquiry forms.")
    add_bullet(doc, "Automated TNEA cutoff calculation and document OCR verification for Tamil Nadu State Board and CBSE 12th standard marksheets.")
    add_bullet(doc, "Multi-campus operational isolation between Karur Main Campus (Code: 612) and Coimbatore Campus (Code: 714).")
    add_bullet(doc, "Sequential batch lead splitting across 16 academic engineering departments with counselor telecalling audit trails.")
    add_bullet(doc, "Universal emergency kill-switch mechanism with dual-heartbeat polling across web browsers and mobile application instances.")
    add_bullet(doc, "Dynamic UPI QR code generation formatted for Indian banking protocols with simulated and ledger-validated payment confirmation.")
    add_bullet(doc, "Native Android build compilation outputting ready-to-install binaries (CRM-Mobile-App.apk / SPHEREX.apk).")
    
    add_heading_3(doc, "Outside Project Scope (Limitations):")
    add_bullet(doc, "Automated bank reconciliation via direct Reserve Bank of India (RBI) payment gateway webhooks (simulated via UPI QR ledger).")
    add_bullet(doc, "Support for non-English and regional dialect handwritten marksheets (restricted to printed state board and CBSE marksheets).")
    add_bullet(doc, "Direct bi-directional synchronization with Anna University's proprietary centralized counseling database (DOTE portal).")
    add_bullet(doc, "Telecom carrier-grade SMS gateway integration (delegated to native device SMS intents and WhatsApp deep-links).")
    
    # -------------------------------------------------------------
    # 1.8 ORGANISATION OF THE REPORT
    # -------------------------------------------------------------
    add_heading_2(doc, "1.8 ORGANISATION OF THE REPORT")
    add_paragraph(
        doc,
        "The remainder of this project report is structured into eight detailed chapters followed by technical appendices: "
        "Chapter 2 presents an exhaustive Literature Survey of 16 research papers and enterprise CRM paradigms. "
        "Chapter 3 provides the System Analysis, contrasting existing manual workflows with the proposed LEAD TRACK AI architecture. "
        "Chapter 4 delineates the Hardware, Software, and Environment Specifications. "
        "Chapter 5 details the core Implementation across all ten architectural modules and persistence engines. "
        "Chapter 6 presents the System Design diagrams (Class, Use Case, Sequence, Activity, and DFDs). "
        "Chapter 7 delivers the System Testing outcomes, performance telemetry, and a 65-suite Test Case Catalogue. "
        "Chapter 8 reports the Feasibility Study, engineering methodology, and risk mitigation strategies. "
        "Chapter 9 concludes the report, provides Program Outcome (PO/PSO) mapping, and outlines future enhancements. "
        "Appendices A through G provide source code excerpts, application screenshots, API payloads, user SOPs, and glossaries."
    )
    
    add_page_break(doc)
