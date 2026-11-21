import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath("."))

from scripts.report_generator.styles import init_document
from scripts.report_generator.frontmatter import build_frontmatter
from scripts.report_generator.chapter1 import build_chapter1
from scripts.report_generator.chapter2 import build_chapter2
from scripts.report_generator.chapter3 import build_chapter3
from scripts.report_generator.chapter4 import build_chapter4
from scripts.report_generator.chapter5 import build_chapter5
from scripts.report_generator.chapter6 import build_chapter6
from scripts.report_generator.chapter7 import build_chapter7
from scripts.report_generator.chapter8 import build_chapter8
from scripts.report_generator.chapter9 import build_chapter9
from scripts.report_generator.appendices import build_appendices

def generate_report(output_filename="LEAD_TRACK_AI_Final_Year_Project_Report.docx"):
    print(f"================================================================================")
    print(f"LEAD TRACK AI: INTELLIGENT LEAD MANAGEMENT FOR INSTITUTION")
    print(f"Final Year Engineering Capstone Project Report Generator (.docx)")
    print(f"Institution: V.S.B. Engineering College (Autonomous), Karur - 639 111")
    print(f"Affiliated to: Anna University, Chennai")
    print(f"Target Output: {output_filename}")
    print(f"================================================================================")
    
    start_time = time.time()
    
    print("\n[1/12] Initializing document layout and margins...")
    doc = init_document()
    
    # Configure Document Core Metadata Properties
    props = doc.core_properties
    props.title = "LEAD TRACK AI: INTELLIGENT LEAD MANAGEMENT FOR INSTITUTION"
    props.author = "NITHISH KUMAR P (922524243144), PRAVEEN P (922524243153), RAM PRADEEP R P (922524243164)"
    props.subject = "Final Year Engineering Capstone Project Report - B.Tech Artificial Intelligence and Data Science"
    props.keywords = "Lead Management System, Admission CRM, TNEA Cutoff, Nora AI OCR, Next.js 14, Capacitor Android, Prisma ORM, Firebase, WebRTC, V.S.B. Engineering College, Anna University"
    props.comments = "Submitted in partial fulfillment for the award of Bachelor of Technology in Artificial Intelligence and Data Science at V.S.B. Engineering College (Autonomous), Karur - 639 111, affiliated to Anna University, Chennai."
    props.category = "Academic Capstone Project Documentation"
    
    print("[2/12] Building frontmatter (Cover, Bonafide, Acknowledgement, Vision/Mission, Abstract, TOC, Lists)...")
    build_frontmatter(doc)
    
    print("[3/12] Building Chapter 1: Introduction...")
    build_chapter1(doc)
    
    print("[4/12] Building Chapter 2: Literature Survey...")
    build_chapter2(doc)
    
    print("[5/12] Building Chapter 3: System Analysis...")
    build_chapter3(doc)
    
    print("[6/12] Building Chapter 4: System Specification...")
    build_chapter4(doc)
    
    print("[7/12] Building Chapter 5: Implementation...")
    build_chapter5(doc)
    
    print("[8/12] Building Chapter 6: System Design...")
    build_chapter6(doc)
    
    print("[9/12] Building Chapter 7: System Testing (65 test suites catalogue)...")
    build_chapter7(doc)
    
    print("[10/12] Building Chapter 8: Feasibility Study & Methodology...")
    build_chapter8(doc)
    
    print("[11/12] Building Chapter 9: Conclusion and Future Enhancement...")
    build_chapter9(doc)
    
    print("[12/12] Building Appendices (A-G), References (IEEE), and Bibliography...")
    build_appendices(doc)
    
    print(f"\nSaving final Word document: {output_filename}...")
    doc.save(output_filename)
    
    elapsed = time.time() - start_time
    file_size_kb = os.path.getsize(output_filename) / 1024
    
    print(f"\n================================================================================")
    print(f"SUCCESS! Report successfully generated in {elapsed:.2f} seconds.")
    print(f"File Path: {os.path.abspath(output_filename)}")
    print(f"File Size: {file_size_kb:.2f} KB")
    print(f"================================================================================")

if __name__ == "__main__":
    generate_report()
