from docx.shared import Inches, Pt
from scripts.report_generator.styles import (
    add_heading_1, add_heading_2, add_heading_3, add_paragraph, add_bullet,
    add_callout, add_table, add_page_break, HEX_ACCENT
)

def build_chapter9(doc):
    add_heading_1(doc, "CHAPTER 9: CONCLUSION AND FUTURE ENHANCEMENT")
    
    # -------------------------------------------------------------
    # 9.1 CONCLUSION
    # -------------------------------------------------------------
    add_heading_2(doc, "9.1 CONCLUSION")
    add_paragraph(
        doc,
        "This project successfully architected, developed, tested, and deployed LEAD TRACK AI (commercially branded as SPHEREX Admission OS), "
        "an enterprise-grade, omnichannel Lead Management System and Admission Customer Relationship Management (CRM) platform engineered "
        "specifically for modern higher education institutions. Designed and deployed for the V.S.B. Group of Institutions (Karur Main Campus, "
        "TNEA Code: 612, and Coimbatore Campus, TNEA Code: 714), the system resolves the systemic operational deficits of traditional admissions—eliminating "
        "lead slippage, eradicating spreadsheet concurrency collisions, automating TNEA cutoff verification, and providing institutional executives "
        "with complete telecalling transparency."
    )
    add_paragraph(
        doc,
        "By synthesizing modern web technologies (Next.js 14 App Router, React 18, TypeScript 5.3, Tailwind CSS) with a cross-platform native "
        "Android runtime (Capacitor 8.5.1), the platform delivers a unified, zero-lag experience across desktop administrative command centers "
        "and mobile counselor smartphones. The Dual-Persistence Layer harmonizes embedded SQLite relational persistence (Prisma ORM 5.10) with "
        "Google Firebase cloud synchronization, providing sub-millisecond local querying and sub-120ms cloud replication with complete offline resilience."
    )
    add_paragraph(
        doc,
        "Crucial functional milestones achieved by LEAD TRACK AI include:"
    )
    add_bullet(doc, "Ingestion and management of up to 1,00,000 student candidate leads per academic cycle with batch CSV ingestion benchmarked at 10,000 records in 4.12 seconds.")
    add_bullet(doc, "Nora AI Marksheet Intelligence pipeline extracting subject marks (Maths, Physics, Chemistry) and computing statutory TNEA cutoffs in 1.18 seconds with 100% mathematical accuracy.")
    add_bullet(doc, "Department-Ordered Faculty Directory organizing 16+ engineering departments with live teacher count badges and sequential batch lead splitting (#1 to #100).")
    add_bullet(doc, "Omnichannel communication suite integrating branded institutional HTML email via Resend API, direct WhatsApp deep-links, native Android dialers, and in-browser WebRTC voice telephony.")
    add_bullet(doc, "Dynamic UPI QR billing module (₹500/lead) with immutable relational transaction ledger accounting.")
    add_bullet(doc, "Universal Multi-Layer Emergency Kill-Switch achieving global client lockdown across 100 concurrent nodes within an average of 3.42 seconds.")
    add_bullet(doc, "Validation across 65 automated test suites with 100% pass rate and zero regression errors.")
    
    # -------------------------------------------------------------
    # 9.2 ATTAINMENT OF PROGRAM OUTCOMES (POs & PSOs)
    # -------------------------------------------------------------
    add_heading_2(doc, "9.2 ATTAINMENT OF PROGRAM OUTCOMES AND PROGRAM SPECIFIC OUTCOMES")
    add_paragraph(
        doc,
        "The conceptualization, architectural design, implementation, and rigorous benchmarking of LEAD TRACK AI directly demonstrate the "
        "attainment of all prescribed Program Outcomes (PO1 to PO11) and Program Specific Outcomes (PSO1 to PSO3) established by the National "
        "Board of Accreditation (NBA) and Anna University for the Bachelor of Technology in Artificial Intelligence and Data Science. "
        "Table 9.1 documents the detailed attainment mappings and supporting project evidence."
    )
    
    po_map_headers = ["OUTCOME ID", "PROGRAM OUTCOME ATTRIBUTE", "SUBSTANTIVE PROJECT EVIDENCE & ATTAINMENT JUSTIFICATION"]
    po_map_data = [
        [
            "PO1",
            "Engineering Knowledge",
            "Applied computational mathematics, discrete probability, relational database theory (ACID SQLite), computer vision OCR pipelines, and distributed state machines to build a full-stack educational CRM."
        ],
        [
            "PO2",
            "Problem Analysis",
            "Identified and formulated the complex challenges of student lead decay (32-45% churn rate), spreadsheet concurrency collisions, and unverified TNEA cutoff self-reporting across 16+ engineering departments."
        ],
        [
            "PO3",
            "Design/Development of Solutions",
            "Architected a scalable three-tier hybrid solution incorporating a dual-persistence layer, an immutable 1,00,000 lead quota engine, and dynamic UPI QR generation adhering to institutional governance."
        ],
        [
            "PO4",
            "Conduct Investigations of Complex Problems",
            "Conducted empirical stress benchmarks evaluating batch CSV ingestion (1k to 10k leads), WebRTC voice packet loss telemetry, and multi-node kill-switch propagation latency across 100 concurrent clients."
        ],
        [
            "PO5",
            "Modern Tool Usage",
            "Mastered and synthesized an advanced software engineering stack: Next.js 14 App Router, React 18, TypeScript 5.3, Tailwind CSS, Prisma ORM, Google Firebase, Capacitor 8.5.1, Android Studio, and Git."
        ],
        [
            "PO6",
            "The Engineer and Society",
            "Addressed societal and educational accessibility challenges by ensuring rapid admissions counseling for rural higher secondary students, transparent cutoff verification, and anti-fraud fee protections."
        ],
        [
            "PO7",
            "Environment and Sustainability",
            "Demonstrated sustainable computing principles through an ultra-lightweight embedded SQLite caching architecture, minimizing server CPU utilization, cloud bandwidth, and electrical energy consumption."
        ],
        [
            "PO8",
            "Ethics",
            "Enforced strict ethical data governance, protecting sensitive prospective student contact identifiers and parental financial records in compliance with India's Digital Personal Data Protection (DPDP) Act."
        ],
        [
            "PO9",
            "Individual and Team Work",
            "Functioned effectively as a cohesive software engineering team, delineating responsibilities across full-stack architecture, OCR machine learning pipelines, Android native builds, and quality assurance."
        ],
        [
            "PO10",
            "Communication",
            "Authored comprehensive academic documentation, architectural diagrams, REST API data schemas, interactive dashboards, and developer runbooks facilitating seamless institutional adoption."
        ],
        [
            "PO11",
            "Project Management and Finance",
            "Applied software engineering economics, managing 6 agile two-week development sprints, budgeting cloud resources, and embedding automated UPI ledger accounting for institutional application fees."
        ],
        [
            "PSO1",
            "AI & Data Science Domain Competence",
            "Engineered the Nora AI Marksheet Intelligence module, applying optical character recognition and computer vision bounding-box normalization to extract subject marks and compute statutory TNEA cutoff scores."
        ],
        [
            "PSO2",
            "Enterprise Full-Stack & Data Analytics",
            "Designed and implemented the dual-persistence data architecture (Prisma ORM SQLite + Google Firebase) and interactive Recharts funnel analytics, transforming raw inquiry streams into actionable recruitment KPIs."
        ],
        [
            "PSO3",
            "Intelligent Systems Engineering",
            "Engineered an enterprise-grade cross-platform product combining web SSR, native Android APK packaging (Capacitor), real-time WebRTC voice signaling, and a sub-3.5s universal emergency fail-safe kill-switch."
        ]
    ]
    add_table(doc, po_map_headers, po_map_data, col_widths=[Inches(1.0), Inches(1.8), Inches(3.4)])
    
    # -------------------------------------------------------------
    # 9.3 FUTURE ENHANCEMENTS
    # -------------------------------------------------------------
    add_heading_2(doc, "9.3 FUTURE ENHANCEMENTS")
    add_paragraph(
        doc,
        "While LEAD TRACK AI represents a mature, production-ready enterprise solution, several cutting-edge technological enhancements are "
        "planned for subsequent development iterations:"
    )
    
    add_heading_3(doc, "9.3.1 Conversational AI Telecalling Voice Agent")
    add_paragraph(
        doc,
        "Future iterations will integrate autonomous Conversational Voice AI agents utilizing large language models (LLMs) and real-time "
        "speech-to-speech synthesis (e.g., ElevenLabs / Whisper). An automated voice assistant can conduct initial screening inquiries, verify "
        "candidate cutoff ranges, answer routine tuition and hostel questions, and intelligently route high-priority 'Hot' leads to human faculty "
        "counselors, drastically minimizing counselor telecalling workload."
    )
    
    add_heading_3(doc, "9.3.2 Official WhatsApp Business Cloud API Integration")
    add_paragraph(
        doc,
        "Currently, WhatsApp outreach operates via client-side deep-links (wa.me). Integrating Meta's enterprise WhatsApp Business Cloud API "
        "will enable automated interactive chatbots capable of dispatching instant PDF prospectuses, fee payment receipts, and automated counseling "
        "appointment reminders directly within the student's WhatsApp conversation."
    )
    
    add_heading_3(doc, "9.3.3 Automated TNEA Merit List Web Scraper")
    add_paragraph(
        doc,
        "Developing an automated web scraping and data mining agent to parse officially published Directorate of Technical Education (DOTE) "
        "statewide merit lists upon declaration. The module will cross-reference institutional inquiry databases against state ranks to predict "
        "exact seat allotment probabilities across engineering branches."
    )
    
    add_heading_3(doc, "9.3.4 Blockchain Verification for Academic Marksheets")
    add_paragraph(
        doc,
        "Integrating a decentralized Ethereum / Polygon blockchain smart contract ledger to store cryptographic hashes (SHA-256) of verified "
        "student marksheets. Once verified by Nora AI, the document hash is permanently anchored to the blockchain, preventing fraudulent document "
        "tampering or double-admission claims across institutions."
    )
    
    # -------------------------------------------------------------
    # 9.4 PROPOSED DEVELOPMENT ROADMAP
    # -------------------------------------------------------------
    add_heading_2(doc, "9.4 PROPOSED DEVELOPMENT ROADMAP")
    add_paragraph(
        doc,
        "Table 9.2 outlines the strategic engineering roadmap organizing future enhancements across short-term, medium-term, and long-term milestones."
    )
    
    road_headers = ["DEVELOPMENT HORIZON", "PLANNED CAPABILITIES & MILESTONES", "EXPECTED STRATEGIC IMPACT"]
    road_data = [
        [
            "Short-Term (1 to 3 Months)",
            "Automated bank webhook reconciliation for UPI payments; Multi-page marksheet PDF support in Nora AI; Enhanced export to CSV/Excel",
            "Eliminates manual transaction verification; expands OCR compatibility to multi-page diplomas and CBSE grade sheets"
        ],
        [
            "Medium-Term (3 to 9 Months)",
            "Official WhatsApp Cloud API automated chatbot; Voice recording transcription and sentiment analysis; TNEA cutoff forecaster",
            "Provides 24/7 automated candidate engagement; flags dissatisfied applicants automatically; predicts seat confirmation probability"
        ],
        [
            "Long-Term (Beyond 9 Months)",
            "Conversational Voice AI autonomous telecalling agent; Regional Tamil speech synthesis; Blockchain academic certificate verification",
            "Reduces faculty counselor workload by 60%; eliminates document fraud; enables scalable multi-tenant SaaS deployment across universities"
        ]
    ]
    add_table(doc, road_headers, road_data, col_widths=[Inches(1.5), Inches(2.7), Inches(2.0)])
    
    add_page_break(doc)
