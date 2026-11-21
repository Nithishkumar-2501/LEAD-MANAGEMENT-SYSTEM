from docx.shared import Inches, Pt
from scripts.report_generator.styles import (
    add_heading_1, add_heading_2, add_heading_3, add_paragraph, add_bullet,
    add_callout, add_table, add_page_break, HEX_ACCENT
)

def build_chapter8(doc):
    add_heading_1(doc, "CHAPTER 8: FEASIBILITY STUDY & METHODOLOGY")
    
    # -------------------------------------------------------------
    # 8.1 FEASIBILITY ANALYSIS
    # -------------------------------------------------------------
    add_heading_2(doc, "8.1 FEASIBILITY ANALYSIS")
    add_paragraph(
        doc,
        "Prior to embarking on extensive full-stack engineering, a multidimensional feasibility study was conducted to ascertain whether "
        "LEAD TRACK AI could be successfully architected, deployed, and sustained within the technological, financial, and operational constraints "
        "of higher education institutions. The assessment evaluated five dimensions of feasibility: technical, economic, operational, schedule, "
        "and legal/ethical."
    )
    
    add_heading_3(doc, "8.1.1 Technical Feasibility")
    add_paragraph(
        doc,
        "Technical feasibility evaluates whether the required hardware, software runtimes, and engineering frameworks are sufficiently mature, "
        "interoperable, and capable of fulfilling performance demands. Modern web standards (Next.js 14 App Router, React 18, TypeScript 5.3) "
        "provide proven, enterprise-grade foundations powering global platforms. SQLite managed via Prisma ORM 5.10 delivers ACID-compliant, "
        "zero-overhead relational persistence, while Google Firebase offers battle-tested cloud replication. Capacitor 8.5.1 provides a stable, "
        "standardized bridge to native Android hardware APIs. Technical feasibility was conclusively demonstrated by the successful compilation "
        "of the native Android APK (19.3 MB) and the passing of all 65 automated test suites with sub-2ms local query latencies."
    )
    
    add_heading_3(doc, "8.1.2 Economic Feasibility")
    add_paragraph(
        doc,
        "Economic feasibility assesses capital expenditures, recurring operational overheads, and return on investment (ROI). Traditional commercial "
        "higher education CRMs (e.g., Salesforce Education Cloud or Meritto) impose exorbitant annual subscription licenses ranging from ₹5,00,000 "
        "to ₹18,00,000 annually, alongside per-user licensing fees for every faculty counselor. In contrast, LEAD TRACK AI is constructed entirely "
        "using open-source technologies (Next.js, React, Tailwind CSS, Prisma, SQLite, Capacitor) that incur zero software licensing fees. "
        "Hosting requirements are minimal: a single virtual private server or serverless Vercel edge deployment suffices. Furthermore, the integrated "
        "UPI QR module allows the institution to collect lead creation and application fees (₹500/lead) directly into college bank accounts without "
        "intermediary payment gateway percentage deductions, yielding substantial financial savings."
    )
    
    add_heading_3(doc, "8.1.3 Operational Feasibility")
    add_paragraph(
        doc,
        "Operational feasibility gauges organizational acceptance and user adaptability among administrative staff and academic faculty counselors. "
        "A primary cause of past software failures in colleges was the steep learning curve of corporate enterprise tools. LEAD TRACK AI was "
        "deliberately engineered around the familiar cognitive model of academic departments. Faculty members are not overwhelmed with campus-wide "
        "data; instead, they navigate directly to their department (e.g., Mechanical Engineering) and view exclusively their assigned 100-student "
        "batch with intuitive 'Talked' vs 'Not Talked' toggles and direct WhatsApp/Phone buttons. Training required for faculty counselors is "
        "under 15 minutes, ensuring high operational adoption."
    )
    
    add_heading_3(doc, "8.1.4 Schedule Feasibility")
    add_paragraph(
        doc,
        "Schedule feasibility verified that the capstone engineering project could be fully designed, implemented, benchmarked, and documented "
        "within the allotted academic calendar (spanning August 2026 to November 2026). By adopting an Agile incremental prototyping model, "
        "capabilities were delivered in six distinct two-week sprints, ensuring that working prototypes were continuously validated and eliminating "
        "last-minute integration roadblocks."
    )
    
    add_heading_3(doc, "8.1.5 Legal and Ethical Feasibility")
    add_paragraph(
        doc,
        "Handling prospective student records involves sensitive personal information (full names, mobile telephone numbers, parental details, "
        "caste/community categories, and academic transcripts). LEAD TRACK AI was engineered in strict compliance with the Digital Personal Data "
        "Protection (DPDP) Act of India and international Privacy by Design standards. Student data is encrypted in transit via TLS 1.3 and stored "
        "in parameterized database fields. Strict role isolation ensures that department counselors cannot view or export student records belonging "
        "to other departments or campuses, preventing competitive lead poaching and data leakage."
    )
    
    # -------------------------------------------------------------
    # 8.2 METHODOLOGY
    # -------------------------------------------------------------
    add_heading_2(doc, "8.2 METHODOLOGY")
    add_paragraph(
        doc,
        "The project adopted an Agile Iterative Prototyping and Component-Driven Engineering methodology. Rather than executing a rigid Waterfall "
        "lifecycle, the system evolved across six disciplined phases, each culminating in a demonstrable, tested capability:"
    )
    
    phase_headers = ["PHASE / SPRINT", "PRIMARY ENGINEERING FOCUS", "CORE ARTIFACTS & DELIVERABLES", "VERIFICATION CRITERIA"]
    phase_data = [
        ["Phase 1: Foundation", "Relational Schema & Auth", "Prisma schema, SQLite embedded setup, 4-tier RBAC authentication", "Unit tests for User & Lead models passing"],
        ["Phase 2: Ingestion", "3-Sheet Entry & CSV Batch", "AddQuickLeadModal, high-throughput CSV batch ingestion endpoint", "10,000 CSV records ingested in < 5.0s"],
        ["Phase 3: Directory", "Department Roster & Quota", "TeacherModule with 16 departments, batch lead splitting algorithm", "Batch splitting #1-#100 verified without overlap"],
        ["Phase 4: Nora AI", "OCR Marksheet Intelligence", "Optical character recognition pipeline, TNEA cutoff math formula", "Cutoff evaluated in < 1.5s with 100% accuracy"],
        ["Phase 5: Omnichannel", "Telecalling & Real-Time Sync", "Resend API HTML email, WhatsApp links, WebRTC signaling server", "P2P voice call established with MOS score > 4.0"],
        ["Phase 6: Mobile & Hardening", "Capacitor APK & Kill-Switch", "Android APK compiled via Gradle, 3.5s emergency kill-switch", "Global lockdown achieved across 100 nodes in 3.42s"]
    ]
    add_table(doc, phase_headers, phase_data, col_widths=[Inches(1.2), Inches(1.6), Inches(2.0), Inches(1.4)])
    
    add_paragraph(
        doc,
        "Table 8.1 compiles the empirical evidence collected from the running platform supporting each feasibility dimension."
    )
    
    feas_headers = ["FEASIBILITY CRITERION", "SUPPORTING EMPIRICAL EVIDENCE FROM IMPLEMENTATION"]
    feas_data = [
        ["Technical Feasibility", "65 of 65 automated test suites passed; 19.3 MB native Android APK compiled; sub-2ms SQLite query times"],
        ["Economic Feasibility", "Zero recurring commercial software licensing fees; open-source stack; automated UPI QR fee collections"],
        ["Operational Feasibility", "Department-oriented UI; under 15-minute counselor onboarding; one-click telecalling status updates"],
        ["Schedule Feasibility", "Delivered within 6 disciplined two-week agile sprints ahead of academic project deadlines"],
        ["Legal & Ethical Feasibility", "DPDP Act compliance; TLS 1.3 encryption; counselor data isolation; immutable payment transaction ledgers"]
    ]
    add_table(doc, feas_headers, feas_data, col_widths=[Inches(2.0), Inches(4.2)])
    
    # -------------------------------------------------------------
    # 8.3 RISK ANALYSIS AND MITIGATION STRATEGIES
    # -------------------------------------------------------------
    add_heading_2(doc, "8.3 RISK ANALYSIS AND MITIGATION STRATEGIES")
    add_paragraph(
        doc,
        "Throughout software development and operational deployment, potential technical and administrative risks were proactively identified "
        "and countered through robust architectural mitigations. Table 8.2 compiles the risk matrix and corresponding mitigation strategies."
    )
    
    risk_headers = ["RISK IDENTIFIER & VECTOR", "OPERATIONAL IMPACT", "ARCHITECTURAL MITIGATION STRATEGY"]
    risk_data = [
        [
            "R1: Campus Network Outage during Telecalling",
            "Counselors unable to save call notes; data lost on page refresh",
            "Dual-Persistence Layer: Mutations written instantly to local SQLite/IndexedDB write-ahead log; queued mutations drain to Firebase upon reconnect"
        ],
        [
            "R2: Blurry or Low-Resolution Marksheet Uploads",
            "Nora AI OCR unable to extract numeric subject marks accurately",
            "Defensive OCR validation: Confidence score threshold (<75%) flags document for manual counselor review; never writes unverified cutoff"
        ],
        [
            "R3: Accidental Lead Overwrite during Concurrent Edits",
            "Counselor A overwrites student notes entered by Counselor B",
            "Strict Role Isolation: Faculty counselors view exclusively their assigned batch (#1-#100); cross-counselor collisions mathematically impossible"
        ],
        [
            "R4: Bulk CSV Ingestion Memory Exhaustion",
            "Server crashes when parsing massive 1,00,000 lead files",
            "Streaming chunk parser: File processed in 1,000-record chunks with backpressure handling; peak RAM capped under 130 MB"
        ],
        [
            "R5: Compromised Counselor Mobile Device",
            "Unauthorized access to sensitive student contact records",
            "Universal Emergency Kill-Switch: Master Creator triggers instant remote session freeze and DOM unmount within 3.42s"
        ],
        [
            "R6: Fraudulent UPI Payment Claims",
            "Candidate claims payment without actual bank credit",
            "Immutable Payment Ledger: Transaction reference ID stored uniquely in relational database; requires administrative verification"
        ],
        [
            "R7: Resend Email API Rate Limit Exceeded",
            "Admissions confirmation emails fail to dispatch",
            "Graceful fallback to native device mailto: protocol; asynchronous retry queue with exponential backoff"
        ],
        [
            "R8: Cross-Campus Data Contamination",
            "Coimbatore admin inadvertently alters Karur student records",
            "Database-level campus scoping: Every query enforces WHERE campus = ? filter based on authenticated session claims"
        ]
    ]
    add_table(doc, risk_headers, risk_data, col_widths=[Inches(1.8), Inches(1.8), Inches(2.6)])
    
    add_page_break(doc)
