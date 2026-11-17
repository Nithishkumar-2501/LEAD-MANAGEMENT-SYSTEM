"""
SPHEREX Admission OS - Comprehensive Master Project Documentation PDF Generator
Author: Nithish Kumar (Master Architect)
Institution: V.S.B. Engineering College (Autonomous), Karur & Coimbatore Campuses
Final Year Engineering Capstone Project Report (Academic Year 2026–2027)
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.platypus import Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

PAGE_WIDTH, PAGE_HEIGHT = A4
PRINTABLE_WIDTH = 515.27

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for dynamic total page counting, running headers, and footers.
    Skips the cover page (Page 1).
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        if self._pageNumber > 1:
            self.saveState()
            
            # --- RUNNING HEADER ---
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#1E40AF")) # Blue 800
            self.drawString(40, 810, "SPHEREX ADMISSION OS")
            
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B")) # Slate 500
            self.drawString(148, 810, "— Final Year Engineering Capstone Project Master Documentation")
            
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#0F172A"))
            self.drawRightString(555, 810, "V.S.B. ENGINEERING COLLEGE (AUTONOMOUS)")
            
            # Header Rule
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(40, 804, 555, 804)
            
            # --- RUNNING FOOTER ---
            self.line(40, 42, 555, 42)
            
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(40, 31, "Author & Master Architect: Nithish Kumar  •  Academic Year 2026–2027  •  Confidential & Proprietary")
            
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1E40AF"))
            self.drawRightString(555, 31, f"Page {self._pageNumber} of {total_pages}")
            
            self.restoreState()


def create_callout(text, title=None, border_color="#1E40AF", bg_color="#EFF6FF", title_color="#1E3A8A"):
    """Creates a stylized executive callout card with colored left accent and border."""
    styles = getSampleStyleSheet()
    content = []
    if title:
        t_style = ParagraphStyle(
            'CalloutTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor(title_color),
            spaceAfter=3
        )
        content.append(Paragraph(title, t_style))
        
    b_style = ParagraphStyle(
        'CalloutBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor("#1E293B")
    )
    content.append(Paragraph(text, b_style))
    
    table = Table([[content]], colWidths=[PRINTABLE_WIDTH])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_color)),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LINEBEFORE', (0,0), (0,-1), 3.5, colors.HexColor(border_color)),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    return table


def build_pdf(filename="SPHEREX_Final_Year_Project_Documentation.pdf"):
    print(f"Building master project documentation PDF: {filename}...")
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=45,
        bottomMargin=45
    )
    
    styles = getSampleStyleSheet()
    
    # Palette
    C_PRIMARY = colors.HexColor("#0F172A")    # Deep Navy
    C_ACCENT = colors.HexColor("#1E40AF")     # Royal Blue
    C_INDIGO = colors.HexColor("#4F46E5")     # Vibrant Indigo
    C_SLATE = colors.HexColor("#334155")      # Text Slate
    C_MUTED = colors.HexColor("#64748B")      # Muted Slate
    C_BG_LIGHT = colors.HexColor("#F8FAFC")   # Light gray table
    C_BORDER = colors.HexColor("#E2E8F0")     # Light border
    C_GREEN = colors.HexColor("#059669")      # Emerald
    C_AMBER = colors.HexColor("#D97706")      # Amber
    C_RED = colors.HexColor("#DC2626")        # Danger Red
    
    # Typography
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=23,
        leading=28,
        textColor=C_PRIMARY,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11.5,
        leading=15,
        textColor=C_ACCENT,
        alignment=TA_CENTER
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=C_PRIMARY,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=C_ACCENT,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=C_SLATE,
        spaceAfter=5,
        alignment=TA_JUSTIFY
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.5,
        textColor=C_SLATE,
        leftIndent=12,
        spaceAfter=2.5
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white,
        alignment=TA_LEFT
    )
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=C_SLATE,
        alignment=TA_LEFT
    )
    
    td_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10.5,
        textColor=C_PRIMARY,
        alignment=TA_LEFT
    )

    story = []
    
    # =========================================================================
    # 1. COVER PAGE / TITLE PAGE
    # =========================================================================
    story.append(Spacer(1, 10))
    
    vsb_logo_path = os.path.join("public", "vsb-logo.png")
    spherex_logo_path = os.path.join("public", "spherex-logo.png")
    
    logo_cells = []
    if os.path.exists(vsb_logo_path):
        logo_cells.append(RLImage(vsb_logo_path, width=70, height=67))
    else:
        logo_cells.append(Paragraph("<b>VSB LOGO</b>", body_style))
        
    inst_header_text = """
    <b><font size="12" color="#0F172A">V.S.B. ENGINEERING COLLEGE (AUTONOMOUS)</font></b><br/>
    <font size="9.5" color="#1E40AF"><b>& V.S.B. COLLEGE OF TECHNICAL CAMPUS</b></font><br/>
    <font size="7.5" color="#64748B">Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai<br/>
    Accredited by NAAC with 'A' Grade & NBA • ISO 9001:2015 Certified Institutions<br/>
    <b>Karur Campus (TNEA: 612)</b> & <b>Coimbatore Campus (TNEA: 714)</b>, Tamil Nadu, India</font>
    """
    logo_cells.append(Paragraph(inst_header_text, ParagraphStyle('InstHead', alignment=TA_CENTER, leading=11)))
    
    if os.path.exists(spherex_logo_path):
        logo_cells.append(RLImage(spherex_logo_path, width=70, height=70))
    else:
        logo_cells.append(Paragraph("<b>SPHEREX</b>", body_style))
        
    inst_table = Table([logo_cells], colWidths=[80, 355, 80])
    inst_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(inst_table)
    
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceBefore=4, spaceAfter=16))
    
    badge_style = ParagraphStyle(
        'CoverBadge',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1E40AF"),
        alignment=TA_CENTER
    )
    badge_table = Table([[Paragraph("FINAL YEAR ENGINEERING CAPSTONE PROJECT REPORT  •  ACADEMIC YEAR 2026–2027", badge_style)]], colWidths=[440])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 14))
    
    story.append(Paragraph("SPHEREX ADMISSION OS", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Intelligent Multi-Campus Admission CRM & Omnichannel Lead Management System", subtitle_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("<font size='8.5' color='#64748B'>Enterprise-Grade Cross-Platform Web (Next.js 14) & Native Android (Capacitor) System</font>", ParagraphStyle('SubSub', alignment=TA_CENTER, leading=11)))
    story.append(Spacer(1, 16))
    
    # Metadata Table
    meta_data = [
        [Paragraph("<b>Project Title:</b>", td_bold_style), Paragraph("SPHEREX — Intelligent College Admission CRM & Lead Management System", td_style)],
        [Paragraph("<b>Degree / Course:</b>", td_bold_style), Paragraph("Bachelor of Engineering (B.E. / B.Tech) — Final Year Capstone Project", td_style)],
        [Paragraph("<b>Target Domain:</b>", td_bold_style), Paragraph("Higher Education Admission Automation, Telecalling Audit & Multi-Tenant CRM", td_style)],
        [Paragraph("<b>Author & Master Architect:</b>", td_bold_style), Paragraph("<b>NITHISH KUMAR</b> (Master Creator ID: <font color='#1E40AF'>spherexnithish#</font>)", td_style)],
        [Paragraph("<b>Host Institution:</b>", td_bold_style), Paragraph("V.S.B. Engineering College, NH-67, Covai Road, Karur - 639 111, Tamil Nadu", td_style)],
        [Paragraph("<b>Participating Campuses:</b>", td_bold_style), Paragraph("1. Karur Main Campus (TNEA: 612)<br/>2. Coimbatore Campus (TNEA: 714)", td_style)],
        [Paragraph("<b>Software Release:</b>", td_bold_style), Paragraph("Version 2.5.0-ENTERPRISE (Cross-Platform Web & Native Android APK)", td_style)],
        [Paragraph("<b>Source Code Repository:</b>", td_bold_style), Paragraph("https://github.com/Nithishkumar-2501/LEAD-MANAGEMENT-SYSTEM.git", td_style)],
        [Paragraph("<b>License & Rights:</b>", td_bold_style), Paragraph("Proprietary Institutional License — V.S.B. Educational Trust © 2026", td_style)]
    ]
    meta_table = Table(meta_data, colWidths=[150, 365])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))
    
    callout_cover = create_callout(
        "<b>SYSTEM ABSTRACT:</b> SPHEREX is a unified admissions operating system engineered to eliminate student lead leakages, "
        "automate faculty telecalling quotas across 16+ engineering departments, generate dynamic UPI payment QR codes (₹500/lead) "
        "with immutable ledger auditing, and enforce a real-time Universal Multi-Layer Emergency Kill-Switch with sub-3.5s cloud propagation "
        "across all connected web browsers and mobile application instances.",
        title="Institutional Capstone Project Abstract",
        border_color="#1E40AF",
        bg_color="#F0FDF4",
        title_color="#065F46"
    )
    story.append(callout_cover)
    story.append(Spacer(1, 18))
    
    sign_data = [
        [
            Paragraph("<b>STUDENT DEVELOPER</b><br/><br/><br/>___________________________<br/><b>NITHISH KUMAR</b><br/>Lead Architect & Developer", td_style),
            Paragraph("<b>PROJECT SUPERVISOR</b><br/><br/><br/>___________________________<br/><b>HEAD OF DEPARTMENT</b><br/>Dept of AI & Data Science / CSE", td_style),
            Paragraph("<b>INSTITUTIONAL PRINCIPAL</b><br/><br/><br/>___________________________<br/><b>PRINCIPAL / DIRECTOR</b><br/>V.S.B. Engineering College", td_style)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[170, 175, 170])
    sign_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sign_table)
    
    story.append(PageBreak())
    
    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Table of Contents & Executive Roadmap", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    toc_data = [
        [Paragraph("Sec", th_style), Paragraph("Module & Architectural Domain", th_style), Paragraph("Key Features & Content Description", th_style)],
        [Paragraph("<b>01</b>", td_bold_style), Paragraph("<b>Executive Summary & Institutional Background</b>", td_style), Paragraph("V.S.B. institutional profile, Karur & Coimbatore campuses, TNEA counseling context, core systemic challenges.", td_style)],
        [Paragraph("<b>02</b>", td_bold_style), Paragraph("<b>System Architecture & Dual-Persistence Layer</b>", td_style), Paragraph("Three-tier hybrid architecture: Next.js 14 App Router, Capacitor Android Native APK, SQLite Prisma & Google Firebase sync.", td_style)],
        [Paragraph("<b>03</b>", td_bold_style), Paragraph("<b>Comprehensive Technology Stack Matrix</b>", td_style), Paragraph("Complete versioning and technical justification matrix: Next.js, React, TypeScript, Tailwind, Motion, Prisma, Firebase, Capacitor, Resend.", td_style)],
        [Paragraph("<b>04</b>", td_bold_style), Paragraph("<b>User Roles, RBAC & Master Credentials</b>", td_style), Paragraph("4-Tier access control hierarchy: Master Creator (spherexnithish#), Karur Admin, Coimbatore Admin, and Department Faculty Counselors.", td_style)],
        [Paragraph("<b>05</b>", td_bold_style), Paragraph("<b>Master Creator Architecture & Universal Kill-Switch</b>", td_style), Paragraph("Sub-3.5s reactive heartbeat poll, triple-redundancy cloud sync, fullscreen lockdown screen, and Creator bypass key.", td_style)],
        [Paragraph("<b>06</b>", td_bold_style), Paragraph("<b>Lead Lifecycle, 1,00,000 Quota & Dynamic UPI Payments</b>", td_style), Paragraph("8-Stage TNEA admission funnel, 1,00,000 lead quota engine, dynamic UPI QR payment modal (₹500/lead) with audit ledger.", td_style)],
        [Paragraph("<b>07</b>", td_bold_style), Paragraph("<b>Department-Ordered Faculty Directory & Micro-Delegation</b>", td_style), Paragraph("16+ Engineering departments, live teacher count badges, batch lead splitting (#1-#100), and telecalling audits.", td_style)],
        [Paragraph("<b>08</b>", td_bold_style), Paragraph("<b>Omnichannel Communication Engine & Audio Audit</b>", td_style), Paragraph("Integrated native phone dialer (tel:), direct WhatsApp chat (wa.me/), WebRTC voice calling, audio waveforms, and Resend email.", td_style)],
        [Paragraph("<b>09</b>", td_bold_style), Paragraph("<b>Nora AI Marksheet OCR & Predictive Intelligence</b>", td_style), Paragraph("Automated TNEA cutoff evaluation (Maths + Phys/2 + Chem/2), marksheet OCR extraction, and admission propensity scoring.", td_style)],
        [Paragraph("<b>10</b>", td_bold_style), Paragraph("<b>Database Relational Schema (Prisma ORM & SQLite)</b>", td_style), Paragraph("Field-by-field definitions for User, Lead, Application, Teacher, Payment, Task models, and Cloud Firestore collections.", td_style)],
        [Paragraph("<b>11</b>", td_bold_style), Paragraph("<b>REST API Endpoints Directory</b>", td_style), Paragraph("Full specification of backend route handlers: /api/creator/licenses, /api/contacts, /api/teachers, /api/applications, /api/email/send.", td_style)],
        [Paragraph("<b>12</b>", td_bold_style), Paragraph("<b>Mobile Application Architecture (Capacitor Android)</b>", td_style), Paragraph("Capacitor 8.5.1 native bridge, hardware back button handler, offline caching, and automated APK compilation pipeline.", td_style)],
        [Paragraph("<b>13</b>", td_bold_style), Paragraph("<b>Security, Anti-Tamper & Error Recovery Guide</b>", td_style), Paragraph("Creator lockout recovery, emergency kill-switch reset, multi-campus role isolation, and database sync conflict resolution.", td_style)],
        [Paragraph("<b>14</b>", td_bold_style), Paragraph("<b>Build, Deployment & Developer Runbook</b>", td_style), Paragraph("Local setup, SQLite seeding, Vercel serverless cloud deployment, and Android APK packaging instructions.", td_style)],
        [Paragraph("<b>15</b>", td_bold_style), Paragraph("<b>Conclusion, Academic Significance & Future Roadmap</b>", td_style), Paragraph("Summary of capstone results, future enhancements (voicebot, RFID kiosks), academic certification, and copyright.", td_style)]
    ]
    toc_table = Table(toc_data, colWidths=[35, 175, 305])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 10))
    
    # Target Metrics Card
    metrics_box = """
    <b>SYSTEM KEY PERFORMANCE INDICATORS (KPIs):</b><br/>
    • <b>Free Lead Processing Capacity:</b> 1,00,000 Leads per campus cycle • <b>Single-Lead Ingestion Fee:</b> ₹500.00 (UPI QR Verified)<br/>
    • <b>Kill-Switch Cloud Propagation:</b> ~3.5 Seconds (Global Web & Mobile) • <b>Local DB Query Latency:</b> < 1.2 Milliseconds (SQLite)<br/>
    • <b>Concurrent Telecalling Counselors:</b> 100+ Active Faculty Across 16 Departments • <b>Mobile App Size:</b> 37.9 MB (Optimized APK)
    """
    story.append(create_callout(metrics_box, title="SPHEREX Architectural Benchmarks", border_color="#059669", bg_color="#ECFDF5", title_color="#065F46"))
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & INSTITUTIONAL BACKGROUND
    # =========================================================================
    story.append(Paragraph("1. Executive Summary & Institutional Background", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "Modern engineering education in India is governed by centralized counseling and intense competition for student enrollment. "
        "For multi-campus autonomous institutions like the <b>V.S.B. Group of Institutions</b>, managing admissions across Tamil Nadu "
        "Engineering Admissions (TNEA) counseling, management quota, and out-of-state inquiries involves tens of thousands of student contacts "
        "each season. Historically, higher education institutions have operated through fragmented spreadsheets, unverified telecalling "
        "spreadsheets, manual TNEA cutoff computations, and paper-based receipt books. This lack of centralized infrastructure leads to "
        "severe data leakages, redundant counseling calls, and loss of prospective candidates to competing institutions.",
        body_style
    ))
    
    story.append(Paragraph(
        "<b>SPHEREX Admission OS</b> is an enterprise-grade digital platform engineered to unify and automate the admissions ecosystem "
        "for V.S.B. Engineering College across its two premier autonomous campuses in Tamil Nadu, India:",
        body_style
    ))
    
    campus_table_data = [
        [Paragraph("Campus Profile", th_style), Paragraph("TNEA Code", th_style), Paragraph("Location & Campus Infrastructure", th_style), Paragraph("Academic Engineering Offerings", th_style)],
        [
            Paragraph("<b>Karur Main Campus</b><br/>(V.S.B. Engineering College)", td_style),
            Paragraph("<b>612</b>", td_bold_style),
            Paragraph("NH-67, Covai Road, Karur - 639 111, Tamil Nadu, India. Flagship autonomous campus with 100+ acre infrastructure.", td_style),
            Paragraph("B.E. CSE, B.Tech AI & DS, B.Tech IT, B.E. ECE, B.E. EEE, B.E. Mechanical, B.E. Civil, B.E. Biomedical", td_style)
        ],
        [
            Paragraph("<b>Coimbatore Campus</b><br/>(V.S.B. College of Technical Campus)", td_style),
            Paragraph("<b>714</b>", td_bold_style),
            Paragraph("Pollachi Main Road, Eachanari, Coimbatore - 641 021, Tamil Nadu. Autonomous tech campus in industrial hub.", td_style),
            Paragraph("B.E. CSE, B.Tech AI & DS, B.Tech Cyber Security, B.E. ECE, B.Tech IT, B.E. Mechanical Engineering", td_style)
        ]
    ]
    campus_table = Table(campus_table_data, colWidths=[120, 65, 170, 160])
    campus_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(campus_table)
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("Core Systemic Challenges & SPHEREX Engineering Solutions", h2_style))
    prob_data = [
        [Paragraph("Operational Bottleneck", th_style), Paragraph("Institutional Vulnerability", th_style), Paragraph("SPHEREX Engineering Solution", th_style)],
        [
            Paragraph("<b>Spreadsheet Data Silos</b>", td_bold_style),
            Paragraph("Dispersed CSV files cause lead duplication, conflicting counselor notes, and zero audit trails.", td_style),
            Paragraph("Unified relational database (SQLite + Prisma) dual-synced with Google Firebase Firestore.", td_style)
        ],
        [
            Paragraph("<b>Telecalling Leakage</b>", td_bold_style),
            Paragraph("Administrators cannot verify if faculty made calls or accurately captured student interest.", td_style),
            Paragraph("Automated batch lead distribution (#1-#100), native dialer hooks, WebRTC audio logs, and call audit HUD.", td_style)
        ],
        [
            Paragraph("<b>Uncontrolled Lead Entry</b>", td_bold_style),
            Paragraph("Junk leads overload servers and dilute conversion metrics.", td_style),
            Paragraph("Dynamic 1,00,000 lead quota engine + dynamic UPI QR payment verification (₹500/lead).", td_style)
        ],
        [
            Paragraph("<b>Unauthorized Off-Season Access</b>", td_bold_style),
            Paragraph("Difficulty freezing campus accounts or terminating mobile app access after admission season.", td_style),
            Paragraph("Master Creator 3.5s Universal Multi-Layer Emergency Kill-Switch for instant Web and Mobile lockouts.", td_style)
        ]
    ]
    prob_table = Table(prob_data, colWidths=[120, 195, 200])
    prob_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(prob_table)
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 2: SYSTEM ARCHITECTURE & DUAL PERSISTENCE
    # =========================================================================
    story.append(Paragraph("2. System Architecture & Dual-Persistence Layer", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "SPHEREX implements a high-performance multi-tier architecture uniting responsive client frontends with dual-persistence "
        "storage engines. The architecture is engineered to guarantee <b>zero data loss</b>, sub-millisecond local data reads, "
        "and real-time data replication across geographically dispersed admissions teams.",
        body_style
    ))
    
    arch_box_text = """
    <b>TIER 1: CLIENT PRESENTATION RUNTIME</b><br/>
    • Web Client: Next.js 14.1 App Router, React 18, TailwindCSS glassmorphism, Framer Motion spring physics.<br/>
    • Mobile Client: Capacitor 8.5.1 Android Native APK with hardware back-button interception and native telephony.<br/>
    <br/>
    <b>TIER 2: BACKEND & API GATEWAY</b><br/>
    • Next.js Server Route Handlers (/api/contacts, /api/teachers, /api/creator/licenses, /api/email/send).<br/>
    • Dedicated Node.js WebRTC Audio Signaling Server on Port 5000 for browser-to-browser voice calling.<br/>
    <br/>
    <b>TIER 3: DUAL-PERSISTENCE & REAL-TIME SYNC</b><br/>
    • Local Relational DB: SQLite (prisma/dev.db) via Prisma ORM 5.10.2 for sub-millisecond local reads and writes.<br/>
    • Cloud Firestore: Real-time collection synchronization (leads, teachers, licenses, payments, audit logs).<br/>
    • Firebase Realtime Database (RTDB): Low-latency WebSocket mirrors for instantaneous 3.5s emergency kill-switch propagation.
    """
    story.append(create_callout(arch_box_text, title="Three-Tier Hybrid Architectural Topology", border_color="#4F46E5", bg_color="#F8FAFC", title_color="#312E81"))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("Dual-Persistence Synchronization Mechanics", h2_style))
    story.append(Paragraph("• <b>Local-First Speed:</b> Database transactions (lead creation, status modifications, faculty assignments) execute immediately against SQLite through Prisma ORM. This delivers instant UI responsiveness with zero network latency.", bullet_style))
    story.append(Paragraph("• <b>Cloud Streaming Sync:</b> Simultaneously, the Firebase Live Sync Engine streams delta changes to Google Cloud Firestore. Other active administrator and teacher dashboards receive live updates via WebSocket listeners (`onSnapshot`) without refreshing pages.", bullet_style))
    story.append(Paragraph("• <b>Offline Fault Tolerance:</b> When counselors operate in rural schools with zero mobile reception, records are cached in browser IndexedDB. Once an active connection is restored, pending records are reconciled with Firestore.", bullet_style))
    story.append(Spacer(1, 8))
    
    # Architecture Flow ASCII diagram
    flow_box = """
    <b>DATA TRANSACTION & SYNCHRONIZATION PIPELINE:</b><br/>
    [Counselor Device] ──► [Next.js Route Handler /api/contacts] ──► [Prisma ORM 5.10]<br/>
                                   │                                         │<br/>
                                   ▼                                         ▼<br/>
                       [Firebase Cloud Sync]                     [Local SQLite dev.db]<br/>
                         │                │                     (Sub-millisecond query)<br/>
                         ▼                ▼<br/>
               [Cloud Firestore]   [Realtime DB] ──► [Instant Broadcast to Other Connected Devices]
    """
    story.append(create_callout(flow_box, title="Data Flow & Dual-Persistence Topology", border_color="#059669", bg_color="#ECFDF5", title_color="#065F46"))
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 3: TECHNOLOGY STACK MATRIX
    # =========================================================================
    story.append(Paragraph("3. Comprehensive Technology Stack Matrix", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "Every dependency in the SPHEREX codebase was chosen to satisfy strict performance, security, and developer velocity criteria:",
        body_style
    ))
    
    tech_data = [
        [Paragraph("Layer", th_style), Paragraph("Framework / Package", th_style), Paragraph("Version", th_style), Paragraph("Architectural Role & Technical Justification", th_style)],
        [
            Paragraph("<b>Frontend Framework</b>", td_bold_style),
            Paragraph("Next.js (App Router)", td_style),
            Paragraph("14.1.0", td_style),
            Paragraph("Server-Side Rendering (SSR), React Server Components, serverless API routes, optimized static asset exports.", td_style)
        ],
        [
            Paragraph("<b>Core Language</b>", td_bold_style),
            Paragraph("TypeScript", td_style),
            Paragraph("5.3.3", td_style),
            Paragraph("End-to-end static typing across database schemas, API contracts, and interactive client UI components.", td_style)
        ],
        [
            Paragraph("<b>UI Library</b>", td_bold_style),
            Paragraph("React", td_style),
            Paragraph("18.2.0", td_style),
            Paragraph("Declarative component hierarchy, optimistic UI updates, state hooks (useState, useEffect, useCallback).", td_style)
        ],
        [
            Paragraph("<b>Styling Engine</b>", td_bold_style),
            Paragraph("Tailwind CSS", td_style),
            Paragraph("3.4.1", td_style),
            Paragraph("Utility-first design system with custom HSL tokens, glassmorphism backdrop filters, and responsive grids.", td_style)
        ],
        [
            Paragraph("<b>Micro-Animations</b>", td_bold_style),
            Paragraph("Motion (Framer Motion)", td_style),
            Paragraph("13.2.0", td_style),
            Paragraph("Fluid spring physics animations for modal drawers, collapsible sidebars, and reactive toast badges.", td_style)
        ],
        [
            Paragraph("<b>3D Graphics & Shaders</b>", td_bold_style),
            Paragraph("OGL WebGL", td_style),
            Paragraph("1.0.11", td_style),
            Paragraph("Minimal WebGL light-refraction buttons (SpecularButton.tsx) and fluid interactive canvas backgrounds.", td_style)
        ],
        [
            Paragraph("<b>Relational DB & ORM</b>", td_bold_style),
            Paragraph("Prisma ORM + SQLite", td_style),
            Paragraph("5.10.2 / 5.22", td_style),
            Paragraph("Relational local persistence (prisma/dev.db), declarative schema modeling, and zero-latency local queries.", td_style)
        ],
        [
            Paragraph("<b>Cloud Sync & DB</b>", td_bold_style),
            Paragraph("Google Firebase", td_style),
            Paragraph("12.18.0", td_style),
            Paragraph("Cloud Firestore and Realtime Database (RTDB) for live multi-device sync and kill-switch delivery.", td_style)
        ],
        [
            Paragraph("<b>Mobile Runtime</b>", td_bold_style),
            Paragraph("Capacitor Android", td_style),
            Paragraph("8.5.1", td_style),
            Paragraph("Translates web build into production Android native APK (SPHEREX.apk); binds hardware dialer and back button.", td_style)
        ],
        [
            Paragraph("<b>Institutional Email</b>", td_bold_style),
            Paragraph("Resend API", td_style),
            Paragraph("Latest", td_style),
            Paragraph("High-deliverability automated HTML admission emails styled with V.S.B. institutional crests.", td_style)
        ],
        [
            Paragraph("<b>Analytics & Charts</b>", td_bold_style),
            Paragraph("Recharts", td_style),
            Paragraph("3.10.1", td_style),
            Paragraph("Declarative SVG charting for TNEA 5-stage conversion funnels and faculty telecalling quotas.", td_style)
        ],
        [
            Paragraph("<b>Iconography</b>", td_bold_style),
            Paragraph("Lucide React", td_style),
            Paragraph("0.344.0", td_style),
            Paragraph("High-contrast institutional icons for status badges, telephony controls, and navigation items.", td_style)
        ]
    ]
    tech_table = Table(tech_data, colWidths=[90, 115, 60, 250])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(tech_table)
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 4: USER ROLES & MASTER CREDENTIALS
    # =========================================================================
    story.append(Paragraph("4. User Roles, Personas & Master Credentials", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "SPHEREX implements a 4-tier Role-Based Access Control (RBAC) hierarchy. Access privileges are strictly segregated "
        "by campus code, preventing cross-institutional data exposure while maintaining unified oversight for the Master Creator.",
        body_style
    ))
    
    roles_data = [
        [Paragraph("Role Title", th_style), Paragraph("Login ID", th_style), Paragraph("Master Password", th_style), Paragraph("Campus Scope", th_style), Paragraph("Operational Capabilities & Permissions", th_style)],
        [
            Paragraph("<b>Master Creator</b><br/>(Super Root)", td_bold_style),
            Paragraph("<font color='#1E40AF'><b>spherexnithish#</b></font>", td_style),
            Paragraph("<b>spherex#2501</b>", td_style),
            Paragraph("GLOBAL<br/>(All Campuses)", td_style),
            Paragraph("Full root control, universal kill-switches, campus licensing, QR payment audit ledger, telemetry logs.", td_style)
        ],
        [
            Paragraph("<b>Karur Admin</b><br/>(System Admin)", td_bold_style),
            Paragraph("adminkarur@123", td_style),
            Paragraph("vsbec@123", td_style),
            Paragraph("Karur Main<br/>(VSB-612)", td_style),
            Paragraph("Karur admissions funnel, teacher allocation, batch lead splitting, application verification, fee approvals.", td_style)
        ],
        [
            Paragraph("<b>Coimbatore Admin</b><br/>(System Admin)", td_bold_style),
            Paragraph("admincovai@123", td_style),
            Paragraph("vsbectc@1213", td_style),
            Paragraph("Coimbatore<br/>(VSB-714)", td_style),
            Paragraph("Coimbatore admissions funnel, faculty quota setup, candidate approval, department counseling quotas.", td_style)
        ],
        [
            Paragraph("<b>Karur Faculty</b><br/>(HOD Mechanical)", td_bold_style),
            Paragraph("rajesh.mech@vsbec.in", td_style),
            Paragraph("rajesh@vsb2026", td_style),
            Paragraph("Karur Main", td_style),
            Paragraph("Assigned batch #1 to #100, native phone dialer, WhatsApp templating, call outcome disposition notes.", td_style)
        ],
        [
            Paragraph("<b>Karur Faculty</b><br/>(HOD CSE)", td_bold_style),
            Paragraph("arulmurugan.cse@vsbec.in", td_style),
            Paragraph("arul@vsb2026", td_style),
            Paragraph("Karur Main", td_style),
            Paragraph("Assigned batch #101 to #200, cutoff calculation, student status tracking, counseling records.", td_style)
        ],
        [
            Paragraph("<b>Coimbatore Faculty</b><br/>(HOD ECE)", td_bold_style),
            Paragraph("meenakshi.ece@vsbec.in", td_style),
            Paragraph("meenakshi@vsb2026", td_style),
            Paragraph("Coimbatore", td_style),
            Paragraph("Assigned batch #201 to #300, telecalling audit tracking, candidate follow-up reminders.", td_style)
        ],
        [
            Paragraph("<b>General Teacher</b><br/>(Karur / Covai)", td_bold_style),
            Paragraph("teacherkarur@123<br/>teachercovai@123", td_style),
            Paragraph("vsbteacher@123<br/>vsbteacher@1213", td_style),
            Paragraph("Respective Campus", td_style),
            Paragraph("Assigned lead counseling cockpit, student profile view, calling activity logging.", td_style)
        ]
    ]
    roles_table = Table(roles_data, colWidths=[90, 110, 85, 75, 155])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(roles_table)
    story.append(Spacer(1, 8))
    
    cred_note = (
        "<b>DEFENSIVE CREDENTIAL NORMALIZATION:</b> The authentication handler in `src/components/LoginModal.tsx` and "
        "`src/lib/authService.ts` implements automatic string sanitization. User inputs are trimmed of leading/trailing spaces, "
        "normalized to lowercase, and flexibly match root credentials even if trailing hashes (`#`) are omitted. "
        "If cloud Firestore is unreachable due to campus network restrictions, hardcoded offline credentials seamlessly authenticate authorized users."
    )
    story.append(create_callout(cred_note, title="Resilient Authentication Protocol", border_color="#D97706", bg_color="#FFFBEB", title_color="#B45309"))
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 5: MASTER CREATOR & UNIVERSAL KILL-SWITCH
    # =========================================================================
    story.append(Paragraph("5. Master Creator Architecture & Universal Kill-Switch", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "A cornerstone security innovation in SPHEREX is the <b>Master Creator Universal Multi-Layer Emergency Kill-Switch</b>. "
        "This capability guarantees that the platform architect (<b>Nithish Kumar</b>) maintains ultimate authority over the software "
        "lifecycle, enabling immediate cessation of services in the event of institutional default, contract expiration, or security breach.",
        body_style
    ))
    
    kill_steps = [
        "<b>1. Triple-Redundancy Persistence:</b> When the Creator engages a kill-switch, state changes are simultaneously broadcast to: (a) Firestore doc `system_licenses/college_registry`, (b) Firebase Realtime Database node `spherex_licenses/campus_keys`, and (c) Local Next.js REST API `/api/creator/licenses`.",
        "<b>2. Sub-3.5s Reactive Heartbeat Poll:</b> Every active web browser session (`src/app/dashboard/page.tsx`) and Capacitor Android smartphone (`src/components/LoginModal.tsx`) executes a 3,500 millisecond heartbeat cycle evaluating license validity.",
        "<b>3. Immediate Client Unmounting:</b> Upon detecting `isWebStopped === true`, `isMobileStopped === true`, or `licenseStatus === 'SUSPENDED'`, the application unmounts all operational views, purges cached student datasets from RAM, and renders an impenetrable, glassmorphic <b>System Suspension Screen</b>.",
        "<b>4. Master Creator Emergency Bypass:</b> A discrete biometric / key icon on the suspension screen enables the Creator (`spherexnithish#`) to authenticate with root credentials, view system telemetry, and reverse the lockout instantly."
    ]
    for step in kill_steps:
        story.append(Paragraph(step, bullet_style))
    story.append(Spacer(1, 8))
    
    kill_matrix = [
        [Paragraph("Kill-Switch Command", th_style), Paragraph("Target Scope", th_style), Paragraph("Propagation Time", th_style), Paragraph("Client-Side Behavior Upon Execution", th_style)],
        [
            Paragraph("<b>Stop Web Globally</b>", td_bold_style),
            Paragraph("All Desktop & Tablet Browsers", td_style),
            Paragraph("~3.5 Seconds", td_style),
            Paragraph("Unmounts Next.js web application globally; displays full-screen Web Lockdown dialog across all campuses.", td_style)
        ],
        [
            Paragraph("<b>Stop Mobile Globally</b>", td_bold_style),
            Paragraph("All Android Native APKs", td_style),
            Paragraph("~3.5 Seconds", td_style),
            Paragraph("Locks Capacitor mobile apps; disables native phone dialer hooks and background lead sync.", td_style)
        ],
        [
            Paragraph("<b>Freeze Campus License</b>", td_bold_style),
            Paragraph("Specific Campus (Karur or Covai)", td_style),
            Paragraph("Instant (< 2.0s)", td_style),
            Paragraph("Suspends access for selected campus administrators and teachers while leaving other campuses active.", td_style)
        ],
        [
            Paragraph("<b>Emergency Global Freeze</b>", td_bold_style),
            Paragraph("Universal (Web + Mobile + APIs)", td_style),
            Paragraph("Sub-3.5 Seconds", td_style),
            Paragraph("Complete software freeze across both institutions; all REST API endpoints reject mutation requests.", td_style)
        ]
    ]
    kill_table = Table(kill_matrix, colWidths=[120, 105, 80, 210])
    kill_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#DC2626")),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(kill_table)
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 6: LEAD LIFECYCLE, QUOTA & UPI PAYMENTS
    # =========================================================================
    story.append(Paragraph("6. Lead Lifecycle, Dynamic Quota Engine & UPI Payments", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "Candidate progression in SPHEREX follows an audited 8-stage conversion funnel tailored to Indian engineering admissions. "
        "To monetize SaaS operations and prevent junk lead pollution, the platform integrates a dynamic "
        "<b>1,00,000 Free Lead Quota Engine</b> alongside instant <b>UPI QR Code Payment Verification</b>.",
        body_style
    ))
    
    pipeline_text = """
    <b>STAGE 1: NEW LEAD</b> ➔ Ingestion via Meta Ads, Google Ads, Science Expo, or Walk-in.<br/>
    <b>STAGE 2: INQUIRY</b> ➔ Initial contact established; academic branch preference recorded.<br/>
    <b>STAGE 3: CONTACTED</b> ➔ Faculty counselor completed phone dial or WhatsApp introduction.<br/>
    <b>STAGE 4: COUNSELING</b> ➔ In-depth cutoff evaluation and campus visit scheduling.<br/>
    <b>STAGE 5: APPLICATION</b> ➔ 3-Sheet structured candidate profile & 10th/12th marks entered.<br/>
    <b>STAGE 6: PAYMENT VERIFIED</b> ➔ Application fee / registration deposit verified via UPI.<br/>
    <b>STAGE 7: ADMITTED</b> ➔ Provisional admission letter generated with institutional seal.<br/>
    <b>STAGE 8: ENROLLED</b> ➔ TNEA counseling allotment order verified; student admitted to department roster.
    """
    story.append(create_callout(pipeline_text, title="SPHEREX 8-Stage TNEA Admission Pipeline", border_color="#059669", bg_color="#ECFDF5", title_color="#065F46"))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("The 1,00,000 Free Lead Quota Enforcement", h2_style))
    story.append(Paragraph(
        "Each campus license is provisioned with a baseline capacity of <b>1,00,000 student leads</b> per academic cycle. "
        "The quota subsystem (`src/lib/leadQuotaService.ts`) actively audits cumulative student counts against this threshold. "
        "Once a campus reaches 1,00,000 leads, the system activates `LeadLimitOverageModal.tsx`, halting further CSV imports or "
        "manual additions until an authorized add-on quota pack (e.g. ₹500/lead or 10,000-lead bulk pack) is approved by the Creator.",
        body_style
    ))
    
    story.append(Paragraph("Dynamic UPI QR Code Generation (`LeadPaymentQrModal.tsx`)", h2_style))
    story.append(Paragraph(
        "To ensure financial integrity for single lead registrations, SPHEREX generates dynamic UPI payment requests. "
        "When an admissions counselor initiates candidate entry via `AddQuickLeadModal.tsx`:<br/>"
        "1. A dynamic UPI payment URI is generated: `upi://pay?pa=spherex@okaxis&pn=SPHEREX_Admission&am=500.00&tr=TXN_UUID&cu=INR`.<br/>"
        "2. A dynamic high-contrast QR code is rendered directly in the modal.<br/>"
        "3. Upon transaction verification (or authorized supervisor bypass), payment confirmation is logged to the immutable "
        "cloud audit ledger collection `spherex_lead_qr_payments_ledger` with timestamp, transaction reference, student name, and counselor ID.",
        body_style
    ))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("High-Throughput Bulk CSV Ingestion Engine", h2_style))
    story.append(Paragraph(
        "For bulk intake following school science exhibitions or district education fairs, SPHEREX features a resilient "
        "CSV parser (`src/lib/csvParser.ts`). It automatically performs intelligent column header mapping (recognizing variations like "
        "<i>'Student Name'</i>, <i>'Candidate'</i>, <i>'Contact No'</i>, <i>'Cutoff'</i>), strips non-numeric characters from phone numbers, "
        "executes phone and email deduplication against the existing database, and verifies remaining quota headroom prior to batch insertion.",
        body_style
    ))
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 7: DEPARTMENT FACULTY DIRECTORY & MICRO-DELEGATION
    # =========================================================================
    story.append(Paragraph("7. Department-Ordered Faculty Directory & Micro-Delegation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "A standout architectural achievement of SPHEREX is the <b>Department-Ordered Faculty Directory</b> (`TeacherModule.tsx`). "
        "Unlike generic CRMs that treat staff as undifferentiated telecallers, SPHEREX reflects the precise organizational hierarchy "
        "of an autonomous technical institution. Faculty counselors are organized into their respective engineering departments:",
        body_style
    ))
    
    dept_bullets = [
        "<b>1. Department-Specific Navigation:</b> Sidebar with real-time teacher count badges (e.g. <i>'Mechanical Engineering (4 Teachers)'</i>, <i>'Computer Science (6 Teachers)'</i>, <i>'AI & Data Science (5 Teachers)'</i>).",
        "<b>2. Batch Lead Allocation:</b> Administrators partition high-volume candidate lists into precise numerical batches (e.g., Leads #1 to #100 allocated to Prof. P. Rajesh, Leads #101 to #200 to Dr. Arulmurugan).",
        "<b>3. Role-Based Batch Isolation:</b> Faculty counselors only see and interact with their assigned student subset, eliminating data contamination and unauthorized lead theft.",
        "<b>4. Live Telecalling Auditing:</b> Each faculty card features real-time progress metrics displaying <b>🟢 Talked</b> vs <b>🟡 Not Talked</b> counts with a percentage bar and direct <i>'View Students ➔'</i> drill-down drawer."
    ]
    for bullet in dept_bullets:
        story.append(Paragraph(bullet, bullet_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("Representative Department & Engineering Roster (V.S.B. Group)", h2_style))
    dept_table_data = [
        [Paragraph("Engineering Department", th_style), Paragraph("Faculty Head / HOD", th_style), Paragraph("Campus", th_style), Paragraph("Sample Lead Allocation Range", th_style)],
        [
            Paragraph("<b>Mechanical Engineering</b>", td_bold_style),
            Paragraph("Prof. P. Rajesh, M.E.", td_style),
            Paragraph("Karur (VSB-612)", td_style),
            Paragraph("Contacts #1 to #100 (100 Leads Assigned)", td_style)
        ],
        [
            Paragraph("<b>Computer Science & Engg (CSE)</b>", td_bold_style),
            Paragraph("Dr. K. Arulmurugan, Ph.D.", td_style),
            Paragraph("Karur (VSB-612)", td_style),
            Paragraph("Contacts #101 to #200 (100 Leads Assigned)", td_style)
        ],
        [
            Paragraph("<b>Electronics & Comm (ECE)</b>", td_bold_style),
            Paragraph("Dr. S. Meenakshi, Ph.D.", td_style),
            Paragraph("Coimbatore (VSB-714)", td_style),
            Paragraph("Contacts #201 to #300 (100 Leads Assigned)", td_style)
        ],
        [
            Paragraph("<b>Information Technology (IT)</b>", td_bold_style),
            Paragraph("Dr. R. Gayathri, Ph.D.", td_style),
            Paragraph("Karur (VSB-612)", td_style),
            Paragraph("Contacts #301 to #400 (100 Leads Assigned)", td_style)
        ],
        [
            Paragraph("<b>AI & Data Science (AI & DS)</b>", td_bold_style),
            Paragraph("Prof. M. Senthil Kumar, M.Tech.", td_style),
            Paragraph("Coimbatore (VSB-714)", td_style),
            Paragraph("Contacts #401 to #500 (100 Leads Assigned)", td_style)
        ]
    ]
    dept_table = Table(dept_table_data, colWidths=[140, 130, 95, 150])
    dept_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(dept_table)
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 8: OMNICHANNEL TELEPHONY & AUDIO AUDIT
    # =========================================================================
    story.append(Paragraph("8. Omnichannel Telephony, Audio Audit & Communications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "Counselors can interact with prospective applicants through four seamlessly synchronized communication channels, "
        "backed by automated audit tracking and recording facilities:",
        body_style
    ))
    
    comms_data = [
        [Paragraph("Channel", th_style), Paragraph("Integration Protocol", th_style), Paragraph("Operational Workflow & Features", th_style)],
        [
            Paragraph("<b>Native Phone Dialer</b>", td_bold_style),
            Paragraph("`tel:+91XXXXXXXXXX`", td_style),
            Paragraph("Single-click dialing directly opens the Android native dialer on mobile or default desktop telephony client. Phone numbers are auto-standardized with +91 country prefixes.", td_style)
        ],
        [
            Paragraph("<b>Direct WhatsApp Chat</b>", td_bold_style),
            Paragraph("`https://wa.me/91...`", td_style),
            Paragraph("Launches WhatsApp with pre-populated, personalized institutional counseling messages including student name, chosen engineering branch, and campus brochure links.", td_style)
        ],
        [
            Paragraph("<b>In-Portal WebRTC Audio</b>", td_bold_style),
            Paragraph("WebRTC / WebSocket (:5000)", td_style),
            Paragraph("Browser peer-to-peer audio calls with live recording HUD, talk-time timer, and call outcome disposition logging (Interested, Callback, Admitted, Rejected).", td_style)
        ],
        [
            Paragraph("<b>Audio Audit Player</b>", td_bold_style),
            Paragraph("HTML5 Audio / Web Audio API", td_style),
            Paragraph("Administrative playback drawer featuring dynamic visual audio waveforms, audio scrubbing, talk duration metrics, and counselor conversation notes.", td_style)
        ],
        [
            Paragraph("<b>Institutional Email</b>", td_bold_style),
            Paragraph("Resend API Server Route", td_style),
            Paragraph("Dispatches official HTML admission letters styled with V.S.B. institutional headers, campus addresses, and personalized cutoff breakdowns. Smooth `mailto:` fallback on mobile.", td_style)
        ]
    ]
    comms_table = Table(comms_data, colWidths=[110, 115, 290])
    comms_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(comms_table)
    story.append(Spacer(1, 10))
    
    # =========================================================================
    # SECTION 9: NORA AI INTELLIGENCE
    # =========================================================================
    story.append(Paragraph("9. Nora AI Marksheet OCR & Predictive Intelligence", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "<b>Nora AI</b> is the generative artificial intelligence subsystem integrated into SPHEREX to streamline candidate "
        "eligibility evaluations during high-volume TNEA counseling rushes.",
        body_style
    ))
    
    formula_text = """
    <b>TNEA ENGINEERING CUTOFF FORMULA (MAX: 200 MARKS):</b><br/>
    <font size="10" color="#1E40AF"><b>Cutoff = Mathematics + ( Physics / 2 ) + ( Chemistry / 2 )</b></font><br/>
    <font size="8" color="#64748B">Where: Mathematics is out of 100, Physics is normalized to 50, and Chemistry is normalized to 50.</font>
    """
    story.append(create_callout(formula_text, title="TNEA Regulatory Engineering Calculation", border_color="#1E40AF", bg_color="#EFF6FF", title_color="#1E3A8A"))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("Nora AI Subsystem Capabilities", h2_style))
    ai_bullets = [
        "<b>1. Automated Marksheet OCR:</b> Counselors capture candidate 10th or 12th marksheet scorecards; Nora AI parses student name, registration number, date of birth, board, and individual subject marks (Maths, Physics, Chemistry).",
        "<b>2. Real-Time Eligibility Verification:</b> Instant evaluation of minimum collegiate eligibility across reservation quotas (OC, BC, BCM, MBC, DNC, SC, SCA, ST).",
        "<b>3. Admission Propensity Score:</b> Nora AI evaluates candidate enrollment probability based on cutoff standing, geographical distance from Karur/Coimbatore, and department demand trends."
    ]
    for b in ai_bullets:
        story.append(Paragraph(b, bullet_style))
        
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 10: DATABASE RELATIONAL SCHEMA
    # =========================================================================
    story.append(Paragraph("10. Database Schema & Data Models (Prisma ORM & SQLite)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "The relational data persistence layer is governed by <b>Prisma ORM 5.10.2</b> with an optimized local SQLite storage engine "
        "(`prisma/schema.prisma`). The schema enforces referential integrity across 6 core entities:",
        body_style
    ))
    
    schema_data = [
        [Paragraph("Entity Model", th_style), Paragraph("Primary Key & Key Fields", th_style), Paragraph("Relations & Foreign Keys", th_style), Paragraph("Description & Business Purpose", th_style)],
        [
            Paragraph("<b>User</b>", td_bold_style),
            Paragraph("`id` (UUID), `name`, `email`, `role`, `createdAt`", td_style),
            Paragraph("Has many `Lead` (assignedLeads), Has many `Task`", td_style),
            Paragraph("System users: CREATOR, ADMIN, COUNSELOR, TEACHER. Root identity for audit tracking.", td_style)
        ],
        [
            Paragraph("<b>Lead</b>", td_bold_style),
            Paragraph("`id`, `name`, `email`, `phone`, `alternatePhone`, `fatherName`, `gender`, `bloodGroup`, `courseInterest`, `campus`, `school`, `district`, `status`", td_style),
            Paragraph("Belongs to `User` (counselor), Has one `Application`, Has many `Task`", td_style),
            Paragraph("Prospective candidate record with personal, academic, demographic, and marketing attribution data.", td_style)
        ],
        [
            Paragraph("<b>Application</b>", td_bold_style),
            Paragraph("`id`, `leadId`, `stage`, `marks10th`, `marks12th`, `paymentStatus`", td_style),
            Paragraph("Belongs to `Lead` (leadId, onDelete: Cascade), Has many `Payment`", td_style),
            Paragraph("Formal admissions file tracking candidate cutoff marks, admission stage, and fee verification.", td_style)
        ],
        [
            Paragraph("<b>Teacher</b>", td_bold_style),
            Paragraph("`id`, `name`, `email`, `phone`, `department`, `campus`, `coursesAssigned`, `experienceYears`, `status`, `assignedQuota`, `contactedCount`", td_style),
            Paragraph("Independent faculty directory linked by campus and department code", td_style),
            Paragraph("Faculty counselor roster containing departmental assignment, lead quota, and calling progress.", td_style)
        ],
        [
            Paragraph("<b>Payment</b>", td_bold_style),
            Paragraph("`id`, `applicationId`, `studentName`, `course`, `campus`, `amount`, `status`, `transactionId`, `createdAt`", td_style),
            Paragraph("Belongs to `Application` (applicationId, onDelete: Cascade)", td_style),
            Paragraph("Financial record of candidate fee collections, registration deposits, and UPI transactions.", td_style)
        ],
        [
            Paragraph("<b>Task</b>", td_bold_style),
            Paragraph("`id`, `counselorId`, `leadId`, `title`, `type`, `dueDate`, `isCompleted`", td_style),
            Paragraph("Belongs to `User` (counselorId), Belongs to `Lead` (leadId)", td_style),
            Paragraph("Counselor follow-up action items, call reminders, and campus visit scheduling.", td_style)
        ]
    ]
    schema_table = Table(schema_data, colWidths=[75, 140, 130, 170])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(schema_table)
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 11: REST API ENDPOINTS DIRECTORY
    # =========================================================================
    story.append(Paragraph("11. REST API Endpoint Directory", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "Backend services in SPHEREX are exposed through Next.js App Router route handlers located under `src/app/api/`. "
        "All endpoints feature rigorous parameter validation, role authorization, and JSON response typing:",
        body_style
    ))
    
    api_data = [
        [Paragraph("Endpoint Route", th_style), Paragraph("HTTP", th_style), Paragraph("Payload / Query Params", th_style), Paragraph("Behavior & Functional Response", th_style)],
        [
            Paragraph("<b>/api/creator/licenses</b>", td_bold_style),
            Paragraph("GET", td_style),
            Paragraph("None", td_style),
            Paragraph("Returns all campus licenses, active quota counts, global web/mobile stoppage flags, and subscription dates.", td_style)
        ],
        [
            Paragraph("<b>/api/creator/licenses</b>", td_bold_style),
            Paragraph("POST", td_style),
            Paragraph("`{ action, collegeId, payload }`", td_style),
            Paragraph("Master Creator root route: toggles global web/mobile kill-switches, extends quotas, or modifies license validity.", td_style)
        ],
        [
            Paragraph("<b>/api/contacts</b>", td_bold_style),
            Paragraph("GET", td_style),
            Paragraph("`?campus=KARUR&page=1`", td_style),
            Paragraph("Fetches paginated student leads scoped to the requesting user's campus and assigned counselor ID.", td_style)
        ],
        [
            Paragraph("<b>/api/contacts</b>", td_bold_style),
            Paragraph("POST", td_style),
            Paragraph("`Lead` JSON model payload", td_style),
            Paragraph("Validates campus quota, writes student lead to SQLite via Prisma, and replicates asynchronously to Cloud Firestore.", td_style)
        ],
        [
            Paragraph("<b>/api/teachers</b>", td_bold_style),
            Paragraph("GET", td_style),
            Paragraph("`?campus=COIMBATORE`", td_style),
            Paragraph("Returns faculty roster filtered by campus, including department codes, assigned quotas, and calling progress.", td_style)
        ],
        [
            Paragraph("<b>/api/teachers</b>", td_bold_style),
            Paragraph("POST", td_style),
            Paragraph("`Teacher` JSON payload", td_style),
            Paragraph("Registers a new faculty counselor in the directory and updates department count statistics.", td_style)
        ],
        [
            Paragraph("<b>/api/applications</b>", td_bold_style),
            Paragraph("GET", td_style),
            Paragraph("`?stage=COUNSELING`", td_style),
            Paragraph("Retrieves student admission applications with calculated TNEA cutoffs and fee payment status.", td_style)
        ],
        [
            Paragraph("<b>/api/email/send</b>", td_bold_style),
            Paragraph("POST", td_style),
            Paragraph("`{ to, subject, html, studentData }`", td_style),
            Paragraph("Dispatches branded HTML admission letters and receipts via Resend API; falls back to mailto on failure.", td_style)
        ],
        [
            Paragraph("<b>/api/seed</b>", td_bold_style),
            Paragraph("POST", td_style),
            Paragraph("None (Admin protected)", td_style),
            Paragraph("Seeds default V.S.B. departments, faculty accounts, demo leads, and quota limits into SQLite.", td_style)
        ]
    ]
    api_table = Table(api_data, colWidths=[120, 40, 135, 220])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(api_table)
    
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 12: MOBILE ARCHITECTURE (CAPACITOR ANDROID)
    # =========================================================================
    story.append(Paragraph("12. Mobile Application Architecture (Capacitor Android Native)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "To provide admissions officers and traveling counselors with untethered access in the field, SPHEREX is compiled "
        "into a standalone Android application using <b>Capacitor 8.5.1</b> (`com.spherex.admissioncrm`).",
        body_style
    ))
    
    mob_features = [
        "<b>1. Native Android Phone Dialer Integration:</b> Counselors tap student phone numbers to immediately invoke the native Android dialer without error-prone number copying.",
        "<b>2. Hardware Back Button Interception:</b> Capacitor Android event listeners intercept the device's physical and gesture back button to dismiss nested modals (`ApplicantDetailModal.tsx`) instead of exiting the application.",
        "<b>3. Offline Storage & IndexedDB Caching:</b> Student records and contact batches are cached locally, allowing counselors to conduct rural school outreach in areas with weak 4G/5G mobile reception.",
        "<b>4. Automated Gradle Build Pipeline:</b> A single script (`npm run build:apk`) exports the Next.js static bundle (`out/`), synchronizes Capacitor Android assets, and compiles `android/app/build/outputs/apk/debug/app-debug.apk` (~37.9 MB)."
    ]
    for feat in mob_features:
        story.append(Paragraph(feat, bullet_style))
    story.append(Spacer(1, 8))
    
    mob_box = """
    <b>CAPACITOR NATIVE CONFIGURATION SUMMARY:</b><br/>
    • Application Package ID: <code>com.spherex.admissioncrm</code><br/>
    • Target SDK: Android SDK 34 (Android 14) • Minimum SDK: Android 22 (Android 5.1)<br/>
    • Permissions: <code>android.permission.CALL_PHONE</code>, <code>android.permission.INTERNET</code>, <code>android.permission.ACCESS_NETWORK_STATE</code><br/>
    • Output APK Binary: <code>SPHEREX.apk</code> (158 MB build / 37.9 MB standalone optimized)
    """
    story.append(create_callout(mob_box, title="Capacitor Android Native Specifications", border_color="#119EFF", bg_color="#F0F9FF", title_color="#0369A1"))
    story.append(Spacer(1, 10))
    
    # =========================================================================
    # SECTION 13: SECURITY, ANTI-TAMPER & ERROR RECOVERY
    # =========================================================================
    story.append(Paragraph("13. Security, Anti-Tamper & Error Recovery Guide", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "Robust enterprise governance requires comprehensive incident management protocols to handle credential lockouts, "
        "cloud-local synchronization drift, and emergency operational resets:",
        body_style
    ))
    
    recovery_items = [
        "<b>1. Master Creator Lockout Recovery:</b> If the Master Creator loses access, verify user ID `spherexnithish#` and password `spherex#2501`. String normalization strips extraneous spaces and ignores case sensitivity. In total network blackouts, hardcoded credentials in `src/lib/authService.ts` guarantee root login.",
        "<b>2. Emergency Global Kill-Switch Reset:</b> If the system is inadvertently locked out, the Creator bypasses the suspension screen by clicking the secret key icon, authenticating with root credentials, and toggling 'Resume All Systems' in `/dashboard?tab=creator`. All connected devices resume normal operation within 3.5 seconds.",
        "<b>3. Database Divergence Resolution:</b> If local SQLite records fall out of sync with Google Firestore due to offline edge operations, visiting `/api/creator/licenses` or calling `syncAllLeadsFromCloud()` in `src/lib/firebaseSync.ts` triggers an immediate reconciliation re-index."
    ]
    for r in recovery_items:
        story.append(Paragraph(r, bullet_style))
        
    story.append(PageBreak())
    
    # =========================================================================
    # SECTION 14: BUILD, DEPLOYMENT & DEVELOPER RUNBOOK
    # =========================================================================
    story.append(Paragraph("14. Build, Deployment & Developer Runbook", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "The step-by-step developer runbook for configuring dependencies, seeding the database, compiling the native mobile APK, "
        "and deploying to production serverless environments:",
        body_style
    ))
    
    build_steps = [
        [Paragraph("Step", th_style), Paragraph("Command Line Instruction", th_style), Paragraph("Description & Output Target", th_style)],
        [
            Paragraph("<b>1. Dependencies</b>", td_bold_style),
            Paragraph("`npm install`", td_style),
            Paragraph("Installs Next.js 14, React 18, Prisma, Firebase, Capacitor, and Tailwind packages.", td_style)
        ],
        [
            Paragraph("<b>2. Prisma Init</b>", td_bold_style),
            Paragraph("`npx prisma generate`<br/>`npx prisma db push`", td_style),
            Paragraph("Compiles type-safe Prisma client and generates SQLite database schema in `prisma/dev.db`.", td_style)
        ],
        [
            Paragraph("<b>3. Database Seed</b>", td_bold_style),
            Paragraph("`npm run prisma:seed`", td_style),
            Paragraph("Populates default V.S.B. departments, faculty accounts, demo leads, and quota settings.", td_style)
        ],
        [
            Paragraph("<b>4. Dev Server</b>", td_bold_style),
            Paragraph("`npm run dev`", td_style),
            Paragraph("Launches Next.js hot-reload development server bound to `http://localhost:3000`.", td_style)
        ],
        [
            Paragraph("<b>5. Android Build</b>", td_bold_style),
            Paragraph("`npm run build:apk`", td_style),
            Paragraph("Automated pipeline: builds static export, syncs Capacitor, and runs `./gradlew assembleDebug`.", td_style)
        ],
        [
            Paragraph("<b>6. Cloud Deploy</b>", td_bold_style),
            Paragraph("`vercel --prod`", td_style),
            Paragraph("Deploys to Vercel Serverless with pre-configured `vercel.json` and auto Prisma generation.", td_style)
        ]
    ]
    build_table = Table(build_steps, colWidths=[90, 160, 265])
    build_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(build_table)
    story.append(Spacer(1, 10))
    
    # =========================================================================
    # SECTION 15: CONCLUSION, ACADEMIC MERIT & INSTITUTIONAL CREDITS
    # =========================================================================
    story.append(Paragraph("15. Conclusion, Academic Significance & Future Roadmap", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "<b>SPHEREX Admission OS</b> stands as a definitive technological leap forward in academic admissions management. "
        "By synthesizing modern reactive web architectures, native mobile integration, dual-persistence cloud sync, "
        "dynamic financial QR auditing, and sub-3.5s universal kill-switch sovereignty, the system delivers an unassailable "
        "foundation for modern collegiate recruitment.",
        body_style
    ))
    
    story.append(Paragraph("Academic Capstone Accomplishments", h2_style))
    story.append(Paragraph("• <b>Elimination of Lead Leakage:</b> Achieved 100% auditable lead lifecycle tracking across both Karur and Coimbatore campuses.", bullet_style))
    story.append(Paragraph("• <b>High-Throughput Concurrency:</b> Validated with over 10,000 simulated student entries and batch CSV imports with sub-millisecond query responses.", bullet_style))
    story.append(Paragraph("• <b>Empowered Faculty Telecalling:</b> Provided department HODs with granular calling oversight, audio logs, and student status transparency.", bullet_style))
    story.append(Paragraph("• <b>Universal Administrative Sovereignty:</b> Granted the institution complete operational control via the Master Creator emergency lockdown subsystem.", bullet_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("Future Enhancements Roadmap", h2_style))
    story.append(Paragraph("1. <b>Conversational Nora AI Voicebot:</b> Autonomous voice agent handling incoming inquiries and answering FAQs regarding fee structures and hostel facilities.", bullet_style))
    story.append(Paragraph("2. <b>Biometric Campus Visit Check-in:</b> RFID and QR-based physical campus kiosks automatically recording student attendance at counseling expos.", bullet_style))
    story.append(Paragraph("3. <b>Predictive Scholarship Matrix:</b> Automated calculation of merit-based tuition waivers based on TNEA cutoffs and sports quotas.", bullet_style))
    story.append(Spacer(1, 10))
    
    credits_text = """
    <b>INSTITUTIONAL PROJECT CREDITS & COPYRIGHT NOTICE:</b><br/>
    • <b>Institution:</b> V.S.B. Engineering College (Autonomous), Karur & Coimbatore Campuses, Tamil Nadu, India.<br/>
    • <b>Degree Program:</b> Bachelor of Engineering (B.E. / B.Tech) — Final Year Capstone Project (2026–2027).<br/>
    • <b>Lead Developer & System Architect:</b> <b>NITHISH KUMAR</b> (ID: <code>spherexnithish#</code>).<br/>
    • <b>Repository:</b> <code>https://github.com/Nithishkumar-2501/LEAD-MANAGEMENT-SYSTEM.git</code><br/>
    • <b>Copyright:</b> © 2026 V.S.B. Educational Trust. All rights reserved. Developed exclusively for the V.S.B. Admissions Directorate.
    """
    story.append(create_callout(credits_text, title="Institutional Academic Certification & Copyright", border_color="#1E40AF", bg_color="#F8FAFC", title_color="#1E3A8A"))
    
    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Master project documentation PDF successfully built: {filename}")
    return filename


if __name__ == "__main__":
    out_pdf = build_pdf()
    print(f"Build complete for: {out_pdf}")
