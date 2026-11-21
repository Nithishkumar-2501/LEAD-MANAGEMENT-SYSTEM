from docx.shared import Inches, Pt
from scripts.report_generator.styles import (
    add_heading_1, add_heading_2, add_heading_3, add_paragraph, add_bullet,
    add_callout, add_table, add_page_break, HEX_ACCENT
)

def build_chapter6(doc):
    add_heading_1(doc, "CHAPTER 6: SYSTEM DESIGN")
    
    # -------------------------------------------------------------
    # 6.1 INTRODUCTION
    # -------------------------------------------------------------
    add_heading_2(doc, "6.1 INTRODUCTION")
    add_paragraph(
        doc,
        "System Design is the critical engineering phase that translates system requirements and operational specifications into rigorous, "
        "coherent software models. It defines the software architecture, data models, component interactions, and behavioral workflows "
        "necessary to construct a reliable, high-throughput educational enterprise system. In this chapter, LEAD TRACK AI is formally modeled "
        "through five standard Unified Modeling Language (UML) representations alongside structured Data Flow Diagrams (DFDs): "
        "Class Diagram, Use Case Diagram, Sequence Diagram, Activity Diagram, and multi-level Data Flow Diagrams."
    )
    
    # -------------------------------------------------------------
    # 6.2 CLASS DIAGRAM
    # -------------------------------------------------------------
    add_heading_2(doc, "6.2 CLASS DIAGRAM AND ENTITY RELATIONSHIPS")
    add_paragraph(
        doc,
        "The Class Diagram (Fig 6.1) models the structural static topology of the LEAD TRACK AI object domain, defining classes, attributes, "
        "operational methods, and relational multiplicities across the application architecture:"
    )
    add_bullet(
        doc,
        "Encapsulates system user credentials, cryptographic authorization tokens, and administrative roles (CREATOR, ADMIN, COUNSELOR). "
        "Maintains a 1-to-Many association with assigned Lead entities and assigned Task follow-ups.",
        "1. User Entity Class:"
    )
    add_bullet(
        doc,
        "The core prospective candidate model containing personal demographics, residential addresses, TNEA counseling codes, marketing sources, "
        "campus designations (KARUR / COIMBATORE), and enrollment lifecycle stages. Maintains a 1-to-1 composition with Application.",
        "2. Lead Entity Class:"
    )
    add_bullet(
        doc,
        "Manages formal admission applications, 10th and 12th standard academic scores, verified Nora AI TNEA cutoff values, and payment status flags. "
        "Maintains a 1-to-Many relationship with Payment transactions.",
        "3. Application Entity Class:"
    )
    add_bullet(
        doc,
        "Represents individual financial transactions, capturing student name, enrolled engineering discipline, allocated campus, amount in INR, "
        "unique banking transaction reference IDs, and timestamp audit stamps.",
        "4. Payment Entity Class:"
    )
    add_bullet(
        doc,
        "Encapsulates academic department faculty counselors, department affiliations (e.g., AI&DS, Mech, CSE), assigned student quota ranges "
        "(e.g., Contacts #1 to #100), and real-time telecalling disposition counts ('Talked' vs 'Not Talked').",
        "5. Teacher Entity Class:"
    )
    add_bullet(
        doc,
        "Encapsulates counselor outreach activities, follow-up deadlines, call notes, and boolean completion flags.",
        "6. Task Entity Class:"
    )
    
    code_class = (
        "+-------------------------------------------------------------------------+\n"
        "|                                 User                                    |\n"
        "+-------------------------------------------------------------------------+\n"
        "| - id: String (UUID)                                                     |\n"
        "| - name: String                                                          |\n"
        "| - email: String (Unique)                                                |\n"
        "| - role: RoleEnum [CREATOR, ADMIN, COUNSELOR]                            |\n"
        "| - createdAt: DateTime                                                   |\n"
        "+-------------------------------------------------------------------------+\n"
        "| + authenticate(password: String): Boolean                               |\n"
        "| + getAssignedLeads(): List<Lead>                                        |\n"
        "| + getTasks(): List<Task>                                                |\n"
        "+-------------------------------------------------------------------------+\n"
        "                                     | 1\n"
        "                                     | assigns (1..*)\n"
        "                                     v\n"
        "+-------------------------------------------------------------------------+\n"
        "|                                 Lead                                    |\n"
        "+-------------------------------------------------------------------------+\n"
        "| - id: String (UUID)                                                     |\n"
        "| - name: String                                                          |\n"
        "| - email: String                                                         |\n"
        "| - phone: String                                                         |\n"
        "| - campus: CampusEnum [KARUR, COIMBATORE]                                |\n"
        "| - status: StageEnum [NEW, CONTACTED, IN_REVIEW, ADMITTED]               |\n"
        "| - counselorId: String (FK)                                              |\n"
        "+-------------------------------------------------------------------------+\n"
        "| + updateStatus(newStatus: StageEnum): Void                              |\n"
        "| + calculateTNEACutoff(): Float                                          |\n"
        "| + initiateWhatsAppChat(): Void                                          |\n"
        "+-------------------------------------------------------------------------+\n"
        "             | 1                                            | 1\n"
        "             | has (1..1)                                   | creates (0..*)\n"
        "             v                                              v\n"
        "+----------------------------------------+     +--------------------------+\n"
        "|              Application               |     |           Task           |\n"
        "+----------------------------------------+     +--------------------------+\n"
        "| - id: String                           |     | - id: String             |\n"
        "| - leadId: String (FK)                  |     | - counselorId: String    |\n"
        "| - stage: String                        |     | - leadId: String         |\n"
        "| - marks10th: Float                     |     | - title: String          |\n"
        "| - marks12th: Float                     |     | - isCompleted: Boolean   |\n"
        "| - paymentStatus: String                |     +--------------------------+\n"
        "+----------------------------------------+     | + markCompleted(): Void  |\n"
        "| + verifyNoraAI(image: File): Boolean   |     +--------------------------+\n"
        "+----------------------------------------+\n"
        "             | 1\n"
        "             | generates (0..*)\n"
        "             v\n"
        "+----------------------------------------+\n"
        "|                Payment                 |\n"
        "+----------------------------------------+\n"
        "| - id: String                           |\n"
        "| - applicationId: String (FK)           |\n"
        "| - amount: Float                        |\n"
        "| - transactionId: String (Unique)       |\n"
        "| - status: String                       |\n"
        "+----------------------------------------+\n"
        "| + generateUPIQr(): String (URI)        |\n"
        "| + verifyTransaction(): Boolean         |\n"
        "+----------------------------------------+"
    )
    add_callout(doc, code_class, title="Fig 6.1 Relational Class Diagram Architecture")
    
    # -------------------------------------------------------------
    # 6.3 USE CASE DIAGRAM
    # -------------------------------------------------------------
    add_heading_2(doc, "6.3 USE CASE DIAGRAM AND ACTOR SPECIFICATIONS")
    add_paragraph(
        doc,
        "The Use Case Diagram defines functional boundaries and system interactions across four primary operational actors: "
        "(1) Master Creator, (2) Campus Administrator, (3) Department Faculty Counselor, and (4) Prospective Student Applicant."
    )
    
    uc_headers = ["ACTOR NAME", "CORE USE CASES / CAPABILITIES", "SECURITY & ACCESSIBILITY CONSTRAINTS"]
    uc_data = [
        [
            "Master Creator (Super Admin)",
            "Trigger Universal Emergency Kill-Switch (Web/Mobile/Campus); Generate Institutional Licenses; Inspect Revenue Telemetry; Configure Quota Fees; Execute Global Database Purge",
            "Root authority; Accessible via master credentials (spherexnithish# / spherex#2501); Unrestricted cross-campus visibility"
        ],
        [
            "Campus Administrator",
            "Ingest High-Volume Batch CSV Leads (up to 1,00,000); Allocate Faculty Batches (#1-#100); Monitor Conversion Funnels; Audit Telecalling Duration Logs; Approve Admissions",
            "Restricted to designated campus (Karur TNEA 612 or Coimbatore TNEA 714); Full write permissions for campus records"
        ],
        [
            "Department Faculty Counselor",
            "View Assigned Student Batch Range (e.g. #1-#100); Execute In-Portal Phone Dialing; Initiate Pre-filled WhatsApp Chats; Mark Call Disposition ('Talked'/'Not Talked'); Schedule Visits",
            "Strict role isolation; Shielded from non-assigned leads; Access via web dashboard or native Android APK"
        ],
        [
            "Prospective Student Applicant",
            "Submit Web Inquiries; Upload 12th Marksheets for Nora AI OCR; Scan Dynamic UPI QR Code for Application Fee; Receive Branded VSB Confirmation Email",
            "Public client access via responsive web landing portal; Read access to own provisional admission status"
        ]
    ]
    add_table(doc, uc_headers, uc_data, col_widths=[Inches(1.5), Inches(3.0), Inches(1.7)])
    
    # -------------------------------------------------------------
    # 6.4 SEQUENCE DIAGRAM
    # -------------------------------------------------------------
    add_heading_2(doc, "6.4 SEQUENCE DIAGRAM (END-TO-END LEAD LIFECYCLE)")
    add_paragraph(
        doc,
        "The Sequence Diagram (Fig 6.3) chronicles the chronological interaction lifecycle across system components during a complete student "
        "admission workflow: Inquiry Submission -> Batch Allocation -> Counselor Outreach -> Nora AI Verification -> Dynamic UPI Payment."
    )
    
    code_seq = (
        "Applicant         Web/Mobile Portal         Next.js API           Prisma DB           Firebase Sync        Counselor Phone\n"
        "    |                     |                      |                     |                    |                 |\n"
        "    |-- 1. Submit Inquiry |                      |                     |                    |                 |\n"
        "    |-------------------->|                      |                     |                    |                 |\n"
        "    |                     |-- 2. POST /contacts->|                     |                    |                 |\n"
        "    |                     |                      |-- 3. Ingest Lead -->|                    |                 |\n"
        "    |                     |                      |<-- 4. Lead Stored --|                    |                 |\n"
        "    |                     |                      |-- 5. Broadcast Mutation -------------->|                 |\n"
        "    |                     |                      |                                          |-- 6. Live Sync >|\n"
        "    |                     |                      |<-- 7. 201 Created ---                    |                 |\n"
        "    |                     |<---------------------|                                                            |\n"
        "    |                                                                                                         |\n"
        "    |                                         [Admin Executes Batch Allocation]                               |\n"
        "    |                                                    |                     |                    |         |\n"
        "    |                                                    |-- 8. Allocate Range>|                    |         |\n"
        "    |                                                    |   (Contacts #1-#100)|                    |         |\n"
        "    |                                                                                               |         |\n"
        "    |                                         [Faculty Initiates Telecalling Outreach]                        |\n"
        "    |<======================================== 9. Native Cellular Call / WhatsApp Chat =====================|\n"
        "    |                                                                                               |         |\n"
        "    |                                                                          |-- 10. Mark 'Talked' -------->|\n"
        "    |                                                                          |<-- 11. Status Updated -------|\n"
        "    |                                                                                                         |\n"
        "    |-- 12. Upload Marksheet Image --------------------->|                     |                    |         |\n"
        "    |                     |-- 13. POST /ai/ocr-cutoff -->|                     |                    |         |\n"
        "    |                     |                              |-- 14. Nora AI OCR ->|                    |         |\n"
        "    |                     |                              |<-- 15. Cutoff Valid |                    |         |\n"
        "    |                     |<-- 16. Return Cutoff (186.0)-|                                                    |\n"
        "    |                                                                                                         |\n"
        "    |<-- 17. Render Dynamic UPI QR Code (₹500.00) --------|                                                   |\n"
        "    |-- 18. Scan QR via GPay / PhonePe / Paytm ---------->|                                                   |\n"
        "    |                     |-- 19. Confirm Transaction -->|-- 20. Update Payment|                    |         |\n"
        "    |<-- 21. Dispatch Branded VSB Confirmation Email ----|                     |                    |         |\n"
        "    |                                                    |                     |                    |         |"
    )
    add_callout(doc, code_seq, title="Fig 6.3 End-to-End Admission Workflow Sequence Diagram")
    
    # -------------------------------------------------------------
    # 6.5 ACTIVITY DIAGRAM
    # -------------------------------------------------------------
    add_heading_2(doc, "6.5 ACTIVITY DIAGRAM (LEAD INGESTION & QUOTA ENFORCEMENT)")
    add_paragraph(
        doc,
        "The Activity Diagram models the conditional logic and state transitions executed during candidate intake and quota validation: "
        "(1) Ingestion initiated; (2) System verifies active Emergency Kill-Switch heartbeat; if active, request rejected with 423 Locked; "
        "(3) System evaluates current campus quota against 1,00,000 lead capacity; if exceeded, overage authorization modal triggered; "
        "(4) Candidate academic records parsed; if marksheet uploaded, Nora AI computes normalized TNEA cutoff; (5) Dynamic UPI QR generated; "
        "(6) Upon payment verification, record persisted in local SQLite and asynchronously replicated to Google Cloud Firestore."
    )
    
    # -------------------------------------------------------------
    # 6.6 DATA FLOW DIAGRAMS
    # -------------------------------------------------------------
    add_heading_2(doc, "6.6 DATA FLOW DIAGRAMS (LEVEL 0, LEVEL 1, LEVEL 2)")
    add_paragraph(
        doc,
        "Data Flow Diagrams (DFDs) illustrate the logical movement, transformation, and storage of data across LEAD TRACK AI subsystems:"
    )
    add_bullet(
        doc,
        "Represents the macro-level boundary between external entities (Student Applicant, Faculty Counselor, Campus Administrator, Master Creator) "
        "and the centralized Lead Track AI core processing engine.",
        "1. DFD Level 0 (Context Diagram):"
    )
    add_bullet(
        doc,
        "Decomposes the core system into four primary sub-processes: (1.0) Lead Ingestion & Quota Validation, (2.0) Faculty Batch Allocation & "
        "Telecalling Audit, (3.0) Nora AI Document OCR & Cutoff Intelligence, and (4.0) Dynamic UPI Billing & Cloud Synchronization.",
        "2. DFD Level 1 (Subsystem Decomposed Diagram):"
    )
    add_bullet(
        doc,
        "Explodes Process 3.0 (Nora AI OCR Engine) into atomic operational sub-processes: (3.1) Image Bounding-Box Normalization, (3.2) Text & Numeric "
        "Glyph Extraction, (3.3) Subject Key-Value Pair Mapping (Maths, Physics, Chemistry), and (3.4) TNEA Normalization Formula Computation.",
        "3. DFD Level 2 (Nora AI OCR Deep Process Flow):"
    )
    
    add_page_break(doc)
