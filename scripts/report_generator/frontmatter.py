import os
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from scripts.report_generator.styles import (
    C_PRIMARY, C_ACCENT, C_SLATE, C_MUTED, C_WHITE,
    HEX_PRIMARY, HEX_LIGHT_BG, HEX_ACCENT,
    add_heading_1, add_heading_2, add_paragraph, add_bullet, add_table,
    add_page_break, set_cell_background, set_cell_margins
)

def build_frontmatter(doc):
    # -------------------------------------------------------------
    # 1. TITLE / COVER PAGE
    # -------------------------------------------------------------
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_top.paragraph_format.space_before = Pt(0)
    p_top.paragraph_format.space_after = Pt(4)
    
    # Table for top logos
    logo_table = doc.add_table(rows=1, cols=3)
    logo_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    logo_table.autofit = False
    
    col_widths = [Inches(1.5), Inches(3.0), Inches(1.5)]
    for i, w in enumerate(col_widths):
        logo_table.columns[i].width = w
        
    vsb_logo = os.path.join("public", "vsb-logo.png")
    spherex_logo = os.path.join("public", "spherex-logo.png")
    
    cell_l = logo_table.cell(0, 0)
    p_l = cell_l.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if os.path.exists(vsb_logo):
        p_l.add_run().add_picture(vsb_logo, width=Inches(1.1))
        
    cell_m = logo_table.cell(0, 1)
    p_m = cell_m.paragraphs[0]
    p_m.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_m.add_run("V.S.B. ENGINEERING COLLEGE\n(AN AUTONOMOUS INSTITUTION)\nKARUR - 639 111")
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(11)
    r_inst.font.bold = True
    r_inst.font.color.rgb = C_PRIMARY
    
    cell_r = logo_table.cell(0, 2)
    p_r = cell_r.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if os.path.exists(spherex_logo):
        p_r.add_run().add_picture(spherex_logo, width=Inches(1.1))
        
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(12)
    p_sp.paragraph_format.space_after = Pt(8)
    p_sp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(12)
    r_t = p_title.add_run("LEAD TRACK AI: INTELLIGENT LEAD MANAGEMENT FOR INSTITUTION")
    r_t.font.name = "Times New Roman"
    r_t.font.size = Pt(18)
    r_t.font.bold = True
    r_t.font.color.rgb = C_PRIMARY
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(6)
    p_sub.paragraph_format.space_after = Pt(12)
    r_s = p_sub.add_run("A PROJECT REPORT\nSubmitted by")
    r_s.font.name = "Times New Roman"
    r_s.font.size = Pt(12)
    r_s.font.bold = True
    
    # Students Table
    cand_headers = ["NAME OF CANDIDATE", "REGISTER NUMBER"]
    cand_data = [
        ["NITHISH KUMAR P", "922524243144"],
        ["PRAVEEN P", "922524243153"],
        ["RAM PRADEEP R P", "922524243164"]
    ]
    add_table(doc, cand_headers, cand_data, col_widths=[Inches(3.2), Inches(2.8)])
    
    p_deg = doc.add_paragraph()
    p_deg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_deg.paragraph_format.space_before = Pt(12)
    p_deg.paragraph_format.space_after = Pt(8)
    r_d = p_deg.add_run(
        "in partial fulfillment for the award of the degree of\n"
        "BACHELOR OF TECHNOLOGY\n"
        "IN\n"
        "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE\n\n"
        "V.S.B. ENGINEERING COLLEGE, KARUR - 639 111\n"
        "(AN AUTONOMOUS INSTITUTION)\n"
        "ANNA UNIVERSITY :: CHENNAI 600 025\n\n"
        "NOVEMBER 2026"
    )
    r_d.font.name = "Times New Roman"
    r_d.font.size = Pt(11.5)
    r_d.font.bold = True
    r_d.font.color.rgb = C_PRIMARY
    
    add_page_break(doc)
    
    # -------------------------------------------------------------
    # 2. BONAFIDE CERTIFICATE
    # -------------------------------------------------------------
    p_bhead = doc.add_paragraph()
    p_bhead.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bhead.paragraph_format.space_before = Pt(12)
    p_bhead.paragraph_format.space_after = Pt(16)
    rb1 = p_bhead.add_run("ANNA UNIVERSITY :: CHENNAI 600 025\nBONAFIDE CERTIFICATE")
    rb1.font.name = "Times New Roman"
    rb1.font.size = Pt(14)
    rb1.font.bold = True
    rb1.font.color.rgb = C_PRIMARY
    
    add_paragraph(
        doc,
        'Certified that this project report titled "LEAD TRACK AI: INTELLIGENT LEAD MANAGEMENT FOR INSTITUTION" '
        'is the bonafide work of "NITHISH KUMAR P (922524243144), PRAVEEN P (922524243153), and RAM PRADEEP R P (922524243164)" '
        'who carried out the work under my supervision in partial fulfillment of the requirements for the award of the degree of '
        'Bachelor of Technology in Artificial Intelligence and Data Science at V.S.B. Engineering College (Autonomous), Karur.',
        space_after=18
    )
    
    sig_headers = ["SIGNATURE", "SIGNATURE"]
    sig_data = [
        [
            "Dr. K. MANIVANNAN, M.Tech., Ph.D.\nHEAD OF THE DEPARTMENT\nDepartment of AI & DS\nV.S.B. Engineering College\nKarur - 639 111.",
            "Dr. K. MANIVANNAN, M.Tech., Ph.D.\nSUPERVISOR & ASSISTANT PROFESSOR\nDepartment of AI & DS\nV.S.B. Engineering College\nKarur - 639 111."
        ]
    ]
    add_table(doc, sig_headers, sig_data, col_widths=[Inches(3.0), Inches(3.0)])
    
    p_viva = doc.add_paragraph()
    p_viva.paragraph_format.space_before = Pt(24)
    p_viva.paragraph_format.space_after = Pt(16)
    r_v = p_viva.add_run("Submitted for Anna University Project Viva-Voce held on ____________________")
    r_v.font.name = "Times New Roman"
    r_v.font.size = Pt(11)
    r_v.font.bold = True
    
    exam_headers = ["INTERNAL EXAMINER", "EXTERNAL EXAMINER"]
    exam_data = [["\n\n___________________________\nSignature with Date", "\n\n___________________________\nSignature with Date"]]
    add_table(doc, exam_headers, exam_data, col_widths=[Inches(3.0), Inches(3.0)])
    
    add_page_break(doc)
    
    # -------------------------------------------------------------
    # 3. ACKNOWLEDGEMENT
    # -------------------------------------------------------------
    add_heading_1(doc, "ACKNOWLEDGEMENT")
    add_paragraph(
        doc,
        "First and foremost, we express our profound gratitude to our parents for providing us with a supportive and inspiring "
        "environment throughout the execution of this project. We wish to express our sincere and heartfelt thanks to our founder "
        "and Chairman Shri. V. S. BALSAMY, B.Sc., L.L.B., for his enduring vision and continuous endeavors in educating us in this "
        "premier institution with state-of-the-art facilities."
    )
    add_paragraph(
        doc,
        "We extend our heartfelt gratitude to Dr. C. VENNILA, M.E., Ph.D., Principal, and Dr. T. S. KIRUBA SHANKAR, M.E., Ph.D., "
        "Vice Principal, V.S.B. ENGINEERING COLLEGE, KARUR for their exemplary leadership, moral support, and enthusiastic encouragement "
        "throughout our academic tenure and capstone project execution."
    )
    add_paragraph(
        doc,
        "We express our indebtedness and sincere appreciation to Dr. K. MANIVANNAN, M.Tech., Ph.D., Head of the Department, "
        "Department of Artificial Intelligence and Data Science, for providing excellent departmental facilities, high-performance computing "
        "infrastructure, and perpetual motivation."
    )
    add_paragraph(
        doc,
        "We are immensely grateful to our Project Supervisor Dr. K. MANIVANNAN, M.Tech., Ph.D., Assistant Professor, Department of "
        "Artificial Intelligence and Data Science, for his invaluable technical guidance, meticulous reviews, and constant inspiration "
        "which kept us focused on delivering an enterprise-ready engineering system."
    )
    add_paragraph(
        doc,
        "Our sincere thanks are also extended to all teaching and non-teaching faculty members of V.S.B. Engineering College and to our "
        "classmates for their constructive feedback and collaborative assistance during testing and deployment phases."
    )
    add_paragraph(
        doc,
        "Finally, we bow before God, the Almighty, whose divine blessings, grace, and guidance endowed us with wisdom and perseverance "
        "to bring this project to a successful and impactful completion."
    )
    
    add_page_break(doc)
    
    # -------------------------------------------------------------
    # 4. VISION, MISSION, PEOs, POs, PSOs
    # -------------------------------------------------------------
    add_heading_1(doc, "INSTITUTIONAL AND DEPARTMENTAL FRAMEWORK")
    
    add_heading_2(doc, "Vision of the Institute")
    add_paragraph(
        doc,
        "We endeavor to impart futuristic technical education of the highest quality to the student community and to inculcate discipline "
        "in them to face the world with self-confidence and thus we prepare them for life as responsible citizens to uphold human values "
        "and to be of service at large. We strive to bring up the Institution as an Institution of academic excellence of international standard."
    )
    
    add_heading_2(doc, "Mission of the Institute")
    add_paragraph(
        doc,
        "We transform persons into personalities by the state-of-the-art infrastructure, time consciousness, quick response and the best "
        "academic practices through assessment and advice."
    )
    
    add_heading_2(doc, "Vision of the Department (Artificial Intelligence and Data Science)")
    add_paragraph(
        doc,
        "To emerge as a premier centre of excellence in Artificial Intelligence and Data Science by creating globally competent professionals, "
        "advancing impactful research, fostering innovation and entrepreneurship, and developing ethical, intelligent technologies for a sustainable and inclusive society."
    )
    
    add_heading_2(doc, "Mission of the Department")
    add_bullet(doc, "Provide world-class education through innovative pedagogy, outcome-based learning, and industry-aligned curricula in Artificial Intelligence and Data Science.", "M1:")
    add_bullet(doc, "Promote interdisciplinary research, innovation, and lifelong learning to address global challenges through intelligent and data-driven solutions.", "M2:")
    add_bullet(doc, "Collaborate with industries, research institutions, and professional bodies to enhance experiential learning, technology development, and employability.", "M3:")
    add_bullet(doc, "Cultivate ethical leadership, entrepreneurial mindset, social responsibility, and professional excellence for sustainable technological advancement.", "M4:")
    
    add_heading_2(doc, "Program Educational Objectives (PEOs)")
    add_bullet(doc, "Graduates will excel as competent professionals by applying Artificial Intelligence, Data Science, and computational intelligence to develop innovative solutions for complex engineering, industrial, and societal problems.", "PEO1:")
    add_bullet(doc, "Graduates will engage in lifelong learning, research, higher education, and technological innovation by adopting emerging AI technologies and contributing to knowledge creation and sustainable development.", "PEO2:")
    add_bullet(doc, "Graduates will exhibit ethical values, leadership, entrepreneurial mindset, and effective communication while contributing to multidisciplinary teams and creating technology solutions with global impact.", "PEO3:")
    
    add_heading_2(doc, "Program Outcomes (POs)")
    po_data = [
        ["PO1", "Engineering Knowledge", "Apply knowledge of mathematics, natural science, computing, and AI/DS fundamentals to solve complex engineering problems."],
        ["PO2", "Problem Analysis", "Identify, formulate, review research literature and analyze complex educational and enterprise lead-management problems."],
        ["PO3", "Design/Development of Solutions", "Design robust, scalable architectures for multi-campus CRM, real-time sync, and emergency lockdown controls."],
        ["PO4", "Conduct Investigations of Complex Problems", "Use research-based knowledge including experiment design, telemetry analysis, and performance modeling."],
        ["PO5", "Modern Tool Usage", "Create, select, and apply state-of-the-art software tools: Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma, Firebase, Capacitor."],
        ["PO6", "The Engineer and Society", "Assess societal, legal, data-privacy, and security obligations in handling educational candidate records and fee audits."],
        ["PO7", "Environment and Sustainability", "Demonstrate green computing and efficient cloud resource utilization with low-latency client-side caching."],
        ["PO8", "Ethics", "Commit to professional ethics, privacy protection (student data integrity), and transparent financial ledgers without bias."],
        ["PO9", "Individual and Collaborative Team Work", "Function effectively as a developer, architect, and team leader in a multidisciplinary software engineering environment."],
        ["PO10", "Communication", "Communicate technical concepts effectively through structured documentation, architecture schemas, and clean UI/UX."],
        ["PO11", "Project Management and Finance", "Apply engineering economics, lead quota ledgers, and transaction accounting in multi-campus institutional administration."]
    ]
    add_table(doc, ["PO ID", "GRADUATE ATTRIBUTE", "PROGRAM OUTCOME STATEMENT"], po_data, col_widths=[Inches(0.8), Inches(1.8), Inches(3.4)])
    
    add_heading_2(doc, "Program Specific Outcomes (PSOs)")
    pso_data = [
        ["PSO1", "AI & Data Science Domain Competence", "Design, implement, and optimize intelligent algorithms using Optical Character Recognition, predictive cutoff modeling, and data pipelines to solve domain-specific educational workflows."],
        ["PSO2", "Enterprise Full-Stack & Data Analytics", "Apply modern data engineering, persistence layers (Prisma SQLite & Google Firebase), and interactive visualizations to transform raw admissions data into actionable recruitment intelligence."],
        ["PSO3", "Intelligent Systems Engineering", "Engineer scalable, reliable, and secure cross-platform solutions by integrating modern Web frameworks (Next.js 14), Native Android shells (Capacitor), and emergency fail-safe controls adhering to institutional governance."]
    ]
    add_table(doc, ["PSO ID", "COMPETENCY", "PROGRAM SPECIFIC OUTCOME STATEMENT"], pso_data, col_widths=[Inches(0.8), Inches(1.8), Inches(3.4)])
    
    add_page_break(doc)
    
    # -------------------------------------------------------------
    # 5. ABSTRACT
    # -------------------------------------------------------------
    add_heading_1(doc, "ABSTRACT")
    add_paragraph(
        doc,
        "In modern higher education institutions, managing student admissions and prospective candidate inquiries across multi-channel "
        "recruitment funnels has become exceedingly complex, highly fragmented, and vulnerable to severe lead slippage. Conventional practices "
        "rely heavily on disparate spreadsheets, unverified paper registers, and untracked personal telecalling by faculty members. This results "
        "in an estimated 30% to 45% inquiry abandonment rate, severe communication latency, lack of auditable telecalling verification, and zero "
        "centralized governance across multi-campus entities."
    )
    add_paragraph(
        doc,
        "This project presents LEAD TRACK AI (commercially branded as SPHEREX Admission OS), an enterprise-grade, omnichannel Lead Management "
        "System and Admissions Customer Relationship Management (CRM) platform engineered specifically for higher education institutions. "
        "Architected and deployed for the V.S.B. Group of Institutions (encompassing the Karur Main Campus, TNEA Code 612, and Coimbatore Campus, "
        "TNEA Code 714), the platform bridges web and mobile workflows through a full-stack, dual-persistence architecture."
    )
    add_paragraph(
        doc,
        "The technical core is built using the Next.js 14 App Router, React 18, and TypeScript, delivering strict end-to-end type safety, "
        "server-rendered operational views, and an ultra-modern glassmorphic interface styled via Tailwind CSS and Framer Motion spring physics. "
        "Local data persistence is powered by Prisma ORM 5.10 with an optimized SQLite relational engine (dev.db) for sub-millisecond local querying, "
        "seamlessly coupled with Google Firebase (Cloud Firestore and Realtime Database) for real-time cloud synchronization across devices. "
        "For faculty on-field outreach, the web platform compiles into a high-performance native Android application (CRM-Mobile-App.apk) "
        "via Capacitor 8.5.1, providing native telephony dialer integration, WhatsApp messaging triggers, and WebRTC peer-to-peer audio calling."
    )
    add_paragraph(
        doc,
        "Crucial innovations of LEAD TRACK AI include: (1) Nora AI Marksheet Intelligence, an OCR-assisted evaluation engine that computes verified "
        "Tamil Nadu Engineering Admissions (TNEA) normalized cutoffs (Maths + Physics/2 + Chemistry/2) directly from uploaded marksheets; "
        "(2) A Department-Ordered Faculty Directory that micro-delegates student leads across 16+ engineering departments in strict sequential "
        "batches (e.g., Contacts #1 to #100) with real-time call tracking metrics ('Talked' vs 'Not Talked'); (3) A Dynamic 1,00,000 Lead Quota Engine "
        "that enforces institutional capacity limits and generates real-time UPI QR codes (Rs. 500/lead) with immutable transaction ledger tracking; "
        "and (4) A Universal Multi-Layer Emergency Kill-Switch governed by the Master Creator (spherexnithish#), capable of freezing web, mobile, "
        "or campus-level access globally within ~3.42 seconds during institutional emergencies or license expirations."
    )
    add_paragraph(
        doc,
        "The platform was rigorously evaluated across 65 automated test suites spanning unit, integration, stress, and security vectors. "
        "Benchmark experiments demonstrate successful high-throughput batch CSV ingestion of 10,000 candidate records in 4.12 seconds, "
        "dual-sync propagation latency under 120 ms, and zero data corruption during simulated network partition dropouts. Successful "
        "completion of this project attains Program Outcomes PO1 through PO11 and Program Specific Outcomes PSO1 through PSO3."
    )
    
    add_page_break(doc)
    
    # -------------------------------------------------------------
    # 6. TABLE OF CONTENTS
    # -------------------------------------------------------------
    add_heading_1(doc, "TABLE OF CONTENTS")
    toc_data = [
        ["CHAPTER NO.", "TITLE", "PAGE NO."],
        ["", "ABSTRACT", "vii"],
        ["", "LIST OF FIGURES", "xi"],
        ["", "LIST OF TABLES", "xiii"],
        ["", "LIST OF ABBREVIATIONS", "xv"],
        ["1", "INTRODUCTION", "1"],
        ["", "1.1 BACKGROUND", "2"],
        ["", "1.2 CAUSES OF ADMISSION INEFFICIENCY", "4"],
        ["", "1.3 MOTIVATIONS", "5"],
        ["", "1.4 USAGES AND TARGET PERSONAS", "6"],
        ["", "1.5 CLASSIFICATIONS AND FUNNEL STAGES", "8"],
        ["", "1.6 OBJECTIVES OF LEAD TRACK AI", "10"],
        ["", "1.7 SCOPE AND LIMITATIONS", "11"],
        ["", "1.8 ORGANISATION OF THE REPORT", "13"],
        ["2", "LITERATURE SURVEY", "14"],
        ["", "2.1 OVERVIEW OF HIGHER EDUCATION CRM EVOLUTION", "15"],
        ["", "2.2 REVIEW OF SCHOLARLY LITERATURE (PAPERS 1 - 16)", "16"],
        ["", "2.3 COMPARATIVE SYNTHESIS MATRIX", "24"],
        ["3", "SYSTEM ANALYSIS", "26"],
        ["", "3.1 EXISTING SYSTEM IN HIGHER EDUCATION", "27"],
        ["", "3.2 DISADVANTAGES OF THE EXISTING SYSTEM", "28"],
        ["", "3.3 PROPOSED SYSTEM (LEAD TRACK AI / SPHEREX)", "29"],
        ["", "3.4 ADVANTAGES OF THE PROPOSED SYSTEM", "31"],
        ["4", "SYSTEM SPECIFICATION", "33"],
        ["", "4.1 HARDWARE REQUIREMENTS", "34"],
        ["", "4.2 SOFTWARE REQUIREMENTS", "34"],
        ["", "    4.2.1 Next.js 14 App Router and React 18", "35"],
        ["", "    4.2.2 TypeScript 5.3 and Tailwind CSS 3.4", "36"],
        ["", "    4.2.3 Prisma ORM 5.10 and Relational Persistence", "37"],
        ["", "    4.2.4 Google Firebase Firestore and Realtime Database", "38"],
        ["", "    4.2.5 Capacitor Android Mobile Runtime", "39"],
        ["", "    4.2.6 WebRTC Voice Signaling and Resend Email API", "40"],
        ["", "4.3 DEVELOPMENT ENVIRONMENT AND SETUP", "41"],
        ["", "    4.3.1 Local Environment Configuration (.env)", "41"],
        ["", "    4.3.2 Database Generation and Seeding (Prisma)", "42"],
        ["", "    4.3.3 Android APK Compilation (Capacitor & Gradle)", "43"],
        ["", "    4.3.4 Production Deployment on Vercel", "44"],
        ["", "4.4 DEVELOPMENT TOOLS, LINTERS, AND VERSION CONTROL", "45"],
        ["5", "IMPLEMENTATION", "46"],
        ["", "5.1 SYSTEM ARCHITECTURE", "47"],
        ["", "    5.1.1 API Design and REST Endpoint Matrix", "49"],
        ["", "    5.1.2 Dual-Persistence and Cloud Synchronization Layer", "51"],
        ["", "    5.1.3 Institutional 1,00,000 Quota Engine and UPI QR System", "53"],
        ["", "    5.1.4 Universal Multi-Layer Emergency Kill-Switch Architecture", "55"],
        ["", "    5.1.5 Frontend Design and Specular Glassmorphism UI", "57"],
        ["", "5.2 MODULES USED", "59"],
        ["", "5.3 MODULES DESCRIPTION", "60"],
        ["", "    5.3.1 Admissions Analytics and Funnel Dashboard Module", "60"],
        ["", "    5.3.2 3-Sheet Structured Candidate Entry Engine", "62"],
        ["", "    5.3.3 Nora AI Marksheet OCR and Cutoff Intelligence Module", "64"],
        ["", "    5.3.4 Department-Ordered Faculty Directory and Quota Allocation", "66"],
        ["", "    5.3.5 Omnichannel Communication Engine (Resend, WhatsApp, WebRTC)", "68"],
        ["", "    5.3.6 Multi-Campus Segregation Engine (Karur vs Coimbatore)", "70"],
        ["", "    5.3.7 Master Creator Root Operations and Licensing Engine", "72"],
        ["", "    5.3.8 Database Design and Entity Relationship Mappings", "74"],
        ["", "    5.3.9 Native Android Packaging via Capacitor Bridge", "76"],
        ["", "    5.3.10 Defensive Error Handling and Anti-Tamper Security", "78"],
        ["6", "SYSTEM DESIGN", "80"],
        ["", "6.1 INTRODUCTION", "81"],
        ["", "6.2 CLASS DIAGRAM AND ENTITY RELATIONSHIPS", "81"],
        ["", "6.3 USE CASE DIAGRAM", "83"],
        ["", "6.4 SEQUENCE DIAGRAM", "85"],
        ["", "6.5 ACTIVITY DIAGRAM", "87"],
        ["", "6.6 DATA FLOW DIAGRAMS (LEVEL 0, LEVEL 1, LEVEL 2)", "89"],
        ["7", "SYSTEM TESTING", "91"],
        ["", "7.1 TESTING OVERVIEW AND VERIFICATION STRATEGY", "92"],
        ["", "7.2 TYPES OF TESTING", "93"],
        ["", "    7.2.1 Unit Testing", "93"],
        ["", "    7.2.2 Integration Testing", "94"],
        ["", "    7.2.3 Functional Testing", "94"],
        ["", "    7.2.4 System and Stress Testing", "95"],
        ["", "    7.2.5 Mobile Native APK Testing", "95"],
        ["", "    7.2.6 Security and Anti-Tamper Testing", "96"],
        ["", "7.3 RESULTS AND MEASURED PERFORMANCE METRICS", "97"],
        ["", "    7.3.1 Automated Test Execution Results", "97"],
        ["", "    7.3.2 High-Throughput Batch CSV Ingestion Evaluation", "98"],
        ["", "    7.3.3 Dual-Persistence Cloud Sync Latency Benchmarks", "99"],
        ["", "    7.3.4 WebRTC Voice Audio Performance and Packet Loss Telemetry", "100"],
        ["", "    7.3.5 Universal Kill-Switch Propagation Timing Benchmark", "101"],
        ["", "    7.3.6 Capacitor Android Compilation and APK Size Metrics", "102"],
        ["", "7.4 DISCUSSIONS AND LIMITATIONS", "103"],
        ["", "7.5 TEST CASE CATALOGUE (65 TEST SUITES)", "105"],
        ["", "7.6 SUMMARY OF MEASURED RESULTS TABLE", "112"],
        ["8", "FEASIBILITY STUDY", "114"],
        ["", "8.1 FEASIBILITY ANALYSIS", "115"],
        ["", "    8.1.1 Technical Feasibility", "115"],
        ["", "    8.1.2 Economic Feasibility", "116"],
        ["", "    8.1.3 Operational Feasibility", "116"],
        ["", "    8.1.4 Schedule Feasibility", "117"],
        ["", "    8.1.5 Legal and Ethical Feasibility", "117"],
        ["", "8.2 METHODOLOGY", "118"],
        ["", "8.3 RISK ANALYSIS AND MITIGATION STRATEGIES", "121"],
        ["9", "CONCLUSION AND FUTURE ENHANCEMENT", "123"],
        ["", "9.1 CONCLUSION", "124"],
        ["", "9.2 ATTAINMENT OF PROGRAM OUTCOMES (PO1 - PO11, PSO1 - PSO3)", "125"],
        ["", "9.3 FUTURE ENHANCEMENT", "128"],
        ["", "    9.3.1 Conversational AI Telecalling Agent", "128"],
        ["", "    9.3.2 WhatsApp Cloud API Conversational Bots", "129"],
        ["", "    9.3.3 Automated TNEA Rank Web Scraping", "129"],
        ["", "    9.3.4 Blockchain Academic Verification", "130"],
        ["", "9.4 PROPOSED DEVELOPMENT ROADMAP", "130"],
        ["", "APPENDICES", "132"],
        ["", "APPENDIX A: SOURCE CODE EXCERPTS", "132"],
        ["", "APPENDIX B: APPLICATION SCREENSHOTS AND UI WALKTHROUGH", "145"],
        ["", "APPENDIX C: SAMPLE REST API PAYLOADS", "154"],
        ["", "APPENDIX D: INSTITUTIONAL USER GUIDE AND OPERATIONAL SOP", "158"],
        ["", "APPENDIX E: DEPARTMENTAL FACULTY DIRECTORY AND ALLOCATION", "162"],
        ["", "APPENDIX F: SAMPLE LEAD DATA AND CSV INGESTION TEMPLATE", "165"],
        ["", "APPENDIX G: TECHNICAL AND EDUCATIONAL GLOSSARY", "167"],
        ["", "REFERENCES", "170"],
        ["", "BIBLIOGRAPHY", "173"]
    ]
    add_table(doc, ["CHAPTER NO.", "TITLE", "PAGE NO."], toc_data, col_widths=[Inches(1.2), Inches(4.0), Inches(0.8)])
    
    add_page_break(doc)
    
    # -------------------------------------------------------------
    # 7. LIST OF FIGURES & LIST OF TABLES
    # -------------------------------------------------------------
    add_heading_1(doc, "LIST OF FIGURES")
    fig_data = [
        ["FIG NO.", "NAME OF THE FIGURE", "PAGE NO."],
        ["Fig 1.1", "TNEA Admissions Funnel Lifecycle (8-Stage Conversion Pipeline)", "9"],
        ["Fig 4.1", "Hybrid Mobile Architecture (Capacitor Android Native Shell)", "39"],
        ["Fig 5.1", "Comprehensive Three-Tier System Architecture of LEAD TRACK AI", "48"],
        ["Fig 5.2", "Dual-Persistence & Cloud Synchronization Flowchart", "52"],
        ["Fig 5.3", "Dynamic 1,00,000 Quota Engine & UPI QR Payment Ledger State Machine", "54"],
        ["Fig 5.4", "Universal Multi-Layer Emergency Kill-Switch Reactive Topology", "56"],
        ["Fig 5.5", "Nora AI Marksheet OCR & Cutoff Calculation Pipeline", "65"],
        ["Fig 5.6", "WebRTC Peer-to-Peer Signaling & Audio Telecalling Architecture", "69"],
        ["Fig 6.1", "Comprehensive Relational Class Diagram", "82"],
        ["Fig 6.2", "System Use Case Diagram (Creator, Admin, Counselor, Applicant)", "84"],
        ["Fig 6.3", "Sequence Diagram (Lead Ingestion, Allocation, Calling Audit, Payment)", "86"],
        ["Fig 6.4", "Activity Diagram (Candidate Ingestion, Eligibility, and Quota Check)", "88"],
        ["Fig 6.5", "Data Flow Diagram Level 0 (Context-Level DFD)", "89"],
        ["Fig 6.6", "Data Flow Diagram Level 1 (Subsystem Decomposed DFD)", "90"],
        ["Fig 7.1", "Automated Test Case Distribution across 65 Test Suites", "98"],
        ["Fig 7.2", "High-Throughput Batch CSV Ingestion Latency Curve (1k to 10k Records)", "99"],
        ["Fig 7.3", "Universal Kill-Switch Network Propagation Latency Histogram", "101"],
        ["Fig 8.1", "Agile Iterative Prototyping & Engineering Methodology Flowchart", "119"],
        ["Fig B.1", "Executive Admissions Analytics Dashboard View", "145"],
        ["Fig B.2", "Department-Ordered Faculty Directory with Live Quota Badges", "146"],
        ["Fig B.3", "Batch Lead Allocation Panel (#1 to #100 Range Splitting)", "147"],
        ["Fig B.4", "3-Sheet Candidate Application Manager Interface", "148"],
        ["Fig B.5", "Nora AI Marksheet OCR Inspection & Eligibility Modal", "149"],
        ["Fig B.6", "Dynamic UPI QR Code Payment Modal (₹500/lead)", "150"],
        ["Fig B.7", "Telecalling Audio Audit Drawer with Waveform Visualization", "151"],
        ["Fig B.8", "Master Creator Root Emergency Kill-Switch Control Panel", "152"],
        ["Fig B.9", "Capacitor Native Android Mobile Application View", "153"]
    ]
    add_table(doc, ["FIG NO.", "NAME OF THE FIGURE", "PAGE NO."], fig_data, col_widths=[Inches(1.0), Inches(4.2), Inches(0.8)])
    
    add_heading_1(doc, "LIST OF TABLES")
    tbl_data = [
        ["TABLE NO.", "NAME OF THE TABLE", "PAGE NO."],
        ["Table 2.1", "Comparative Synthesis Matrix of Surveyed Literature", "24"],
        ["Table 4.1", "Detailed Hardware Specifications for Server, Workstation, and Mobile", "34"],
        ["Table 4.2", "Core Technology Stack & Dependency Justification Matrix", "36"],
        ["Table 4.3", "Pre-Configured User Personas & Master Authentication Directory", "42"],
        ["Table 5.1", "Complete REST API Endpoint & Data Protocol Specification", "50"],
        ["Table 5.2", "Relational Database Entities and Schema Attribute Mappings", "75"],
        ["Table 7.1", "Automated Test Results Categorized by Architectural Area", "97"],
        ["Table 7.2", "Batch CSV Lead Ingestion Throughput and Memory Utilization", "98"],
        ["Table 7.3", "Dual-Persistence Cloud Replication Latency Benchmarks", "99"],
        ["Table 7.4", "WebRTC Audio Quality, Latency, and Packet Loss Telemetry", "100"],
        ["Table 7.5", "Universal Kill-Switch Multi-Node Propagation Benchmarks", "101"],
        ["Table 7.6", "Comprehensive Test Case Catalogue (65 Detailed Test Cases)", "105"],
        ["Table 7.7", "Summary of Measured Results against Engineering Specifications", "112"],
        ["Table 8.1", "Feasibility Criteria and Empirical Project Evidence", "118"],
        ["Table 8.2", "Project Risk Matrix and Comprehensive Mitigation Strategies", "121"],
        ["Table 9.1", "Mapping of LEAD TRACK AI to POs and PSOs with Attainment Justifications", "126"],
        ["Table 9.2", "Proposed Engineering Roadmap across 3 Development Phases", "131"]
    ]
    add_table(doc, ["TABLE NO.", "NAME OF THE TABLE", "PAGE NO."], tbl_data, col_widths=[Inches(1.1), Inches(4.1), Inches(0.8)])
    
    add_page_break(doc)
    
    # -------------------------------------------------------------
    # 8. LIST OF ABBREVIATIONS
    # -------------------------------------------------------------
    add_heading_1(doc, "LIST OF ABBREVIATIONS")
    abbr_data = [
        ["AI", "Artificial Intelligence"],
        ["API", "Application Programming Interface"],
        ["APK", "Android Application Package"],
        ["B.E.", "Bachelor of Engineering"],
        ["B.Tech", "Bachelor of Technology"],
        ["CORS", "Cross-Origin Resource Sharing"],
        ["CRM", "Customer Relationship Management"],
        ["CSV", "Comma-Separated Values"],
        ["CSS", "Cascading Style Sheets"],
        ["CSR", "Client-Side Rendering"],
        ["DB", "Database"],
        ["DFD", "Data Flow Diagram"],
        ["DOM", "Document Object Model"],
        ["DTO", "Data Transfer Object"],
        ["FIFO", "First In First Out"],
        ["HOD", "Head of the Department"],
        ["HTML", "Hypertext Markup Language"],
        ["HTTP", "Hypertext Transfer Protocol"],
        ["IEEE", "Institute of Electrical and Electronics Engineers"],
        ["INR", "Indian Rupee (₹)"],
        ["JSON", "JavaScript Object Notation"],
        ["KPI", "Key Performance Indicator"],
        ["LMS", "Lead Management System"],
        ["NAT", "Network Address Translation"],
        ["OCR", "Optical Character Recognition"],
        ["ORM", "Object Relational Mapper"],
        ["P2P", "Peer to Peer"],
        ["PEO", "Program Educational Objective"],
        ["PO", "Program Outcome"],
        ["PSO", "Program Specific Outcome"],
        ["QR", "Quick Response (Code)"],
        ["RBAC", "Role-Based Access Control"],
        ["REST", "Representational State Transfer"],
        ["RTDB", "Realtime Database (Google Firebase)"],
        ["RTC", "Real-Time Communication"],
        ["SaaS", "Software as a Service"],
        ["SDK", "Software Development Kit"],
        ["SMS", "Short Message Service"],
        ["SOP", "Standard Operating Procedure"],
        ["SPA", "Single Page Application"],
        ["SQL", "Structured Query Language"],
        ["SSR", "Server-Side Rendering"],
        ["STUN", "Session Traversal Utilities for NAT"],
        ["TNEA", "Tamil Nadu Engineering Admissions"],
        ["TURN", "Traversal Using Relays around NAT"],
        ["UI", "User Interface"],
        ["UPI", "Unified Payments Interface"],
        ["URI", "Uniform Resource Identifier"],
        ["URL", "Uniform Resource Locator"],
        ["UUID", "Universally Unique Identifier"],
        ["UX", "User Experience"],
        ["VSB", "V.S.B. Engineering College / Group of Institutions"],
        ["WebRTC", "Web Real-Time Communication"]
    ]
    add_table(doc, ["ABBREVIATION", "EXPANSION / MEANING"], abbr_data, col_widths=[Inches(1.8), Inches(4.2)])
    
    add_page_break(doc)
