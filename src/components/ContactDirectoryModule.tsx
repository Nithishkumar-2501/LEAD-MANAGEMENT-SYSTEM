"use client";

import { useState, useEffect } from "react";
import { Lead, Application, CampusLocation, LeadStatus, VSB_DEPARTMENTS_COURSES, CallRecording } from "@/types/crm";
import { parseCSVToLeads } from "@/lib/csvParser";
import { TAMIL_NADU_DISTRICTS } from "@/lib/mockData";
import Tooltip from "@/components/Tooltip";
import SpecularButton from "@/components/SpecularButton";
import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";
import ApplicantDetailModal from "@/components/ApplicantDetailModal";
import {
  Phone,
  Mail,
  MapPin,
  School,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  UserCheck,
  Building,
  CheckCircle2,
  X,
  Save,
  MessageSquare,
  Sparkles,
  Upload,
  ShieldCheck,
  GraduationCap,
  Calendar,
} from "lucide-react";

interface ContactDirectoryModuleProps {
  initialContacts: (Lead & { application?: Application | null })[];
  selectedCampus: CampusLocation;
  currentUserRole?: "ADMIN" | "TEACHER";
  loggedInUsername?: string;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onTriggerToast?: (msg: string) => void;
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
  onImportLeads?: (importedLeads: (Lead & { application: Application })[]) => void;
}

export default function ContactDirectoryModule({
  initialContacts,
  selectedCampus,
  currentUserRole = "ADMIN",
  loggedInUsername = "adminkarur@123",
  onActionTrigger,
  onTriggerToast,
  onSelectApplicant,
  onImportLeads,
}: ContactDirectoryModuleProps) {
  const [contacts, setContacts] = useState(initialContacts);

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"Mobile" | "Email" | "Name" | "User Id" | "Lead Id" | "All Fields">("Mobile");
  const [isSearchFieldDropdownOpen, setIsSearchFieldDropdownOpen] = useState(false);
  const [starredSearchFields, setStarredSearchFields] = useState<Record<string, boolean>>({
    Email: true,
    Mobile: false,
    Name: false,
    "User Id": false,
    "Lead Id": false,
  });
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [counsellingFilter, setCounsellingFilter] = useState<"ALL" | "COUNSELLING_ONLY" | "GOVT_QUOTA" | "MANAGEMENT_ONLY">("ALL");

  // Table Column Header Filtering & Sorting State
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeHeaderFilterPopover, setActiveHeaderFilterPopover] = useState<string | null>(null);

  const getFieldValueForCol = (c: Lead & { application?: Application | null }, col: string): string => {
    if (col === "Registered Name") return c.name || "";
    if (col === "Registered Email") return c.email || "";
    if (col === "Registered Mobile") return c.phone || "";
    if (col === "Registered Country") return "India";
    if (col === "State") return "Tamil Nadu";
    if (col === "City") return c.district || "Karur";
    if (col === "Campus") return c.campus || "";
    if (col === "Course") return c.courseInterest || "B.E. Computer Science";
    if (col === "Specialization") return "TNEA Engineering";
    if (col === "Utm Keyword") return "tnea_admissions_2026";
    if (col === "Gender") return (c as any).gender || "Male";
    if (col === "Father's Name") return (c as any).fatherName || "K. Ramachandran";
    if (col === "Mother's Name") return (c as any).motherName || "R. Priya";
    if (col === "Blood Group") return (c as any).bloodGroup || "O+";
    if (col === "Physically Disabled") return (c as any).physicallyDisabled ? "Yes" : "No";
    if (col === "SSLC Mark") return String((c as any).marks10th || 85);
    if (col === "School Name with Place") return c.school || "Govt Higher Sec School";
    if (col === "Address For communication") return c.address || "Karur, Tamil Nadu";
    if (col === "Community") return (c as any).community || "BC";
    if (col === "User Registration Date") return "Aug 12, 2026";
    if (col === "Lead Stage") return c.status || "";
    return "";
  };

  // Candidate Profile Modal State (Image 2)
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<(Lead & { application: Application }) | null>(null);



  const getFullCandidateWithApp = (contact: Lead & { application?: Application | null }): (Lead & { application: Application }) => {
    return {
      ...contact,
      application: contact.application || {
        id: `app_${contact.id}`,
        leadId: contact.id,
        stage: (contact.status === "ADMITTED" ? "FEE_PAID" : contact.status === "CONTACTED" ? "SUBMITTED" : "INQUIRY"),
        marks10th: 85,
        marks12th: 88,
        paymentStatus: contact.status === "ADMITTED" ? "COMPLETED" : "PENDING",
      },
    };
  };

  const handleCandidateClick = (contact: Lead & { application?: Application | null }) => {
    const fullCand = getFullCandidateWithApp(contact);
    if (onSelectApplicant) {
      onSelectApplicant(fullCand);
    }
    setSelectedCandidateForModal(fullCand);
  };

  // Meritto Lead Manager View & Filter States (Image 2)
  const [directoryViewMode, setDirectoryViewMode] = useState<"TABLE" | "GRID">("TABLE");
  const [regDateFilter, setRegDateFilter] = useState("Select Here");
  const [leadStageFilter, setLeadStageFilter] = useState("Select Here");
  const [leadOwnerFilter, setLeadOwnerFilter] = useState("Select Here");
  const [campaignSourceFilter, setCampaignSourceFilter] = useState("Select Here");
  const [trafficChannelFilter, setTrafficChannelFilter] = useState("Select Here");
  const [selectedViewName, setSelectedViewName] = useState("Default View");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Interactive Calendar Month Name & Year State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calSelectedMonth, setCalSelectedMonth] = useState<number>(7); // 7 = August (2026)
  const [calSelectedYear, setCalSelectedYear] = useState<number>(2026);
  const [calSelectedDay, setCalSelectedDay] = useState<number | null>(12);

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m: number, y: number) => new Date(y, m, 1).getDay();

  // Filter leads by Side Drawer State (Image 1 Reference)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [includeActivityFilters, setIncludeActivityFilters] = useState(false);
  const [filterLogicMode, setFilterLogicMode] = useState<"ALL" | "ANY">("ALL");
  const [filterRules, setFilterRules] = useState<
    Array<{ id: string; field: string; operator: string; value: string }>
  >([
    { id: "1", field: "State", operator: "Equals", value: "Tamil Nadu" },
  ]);

  // Customize Column Side Drawer State (Image 2 Reference)
  const [isCustomizeColumnDrawerOpen, setIsCustomizeColumnDrawerOpen] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "Registered Name",
    "Registered Email",
    "Registered Mobile",
    "State",
    "City",
    "User Registration Date",
    "Lead Stage",
  ]);

  const allAvailableColumns = [
    "Registered Name",
    "Registered Email",
    "Registered Mobile",
    "Registered Country",
    "State",
    "City",
    "Campus",
    "Course",
    "Specialization",
    "Utm Keyword",
    "Gender",
    "Father's Name",
    "Mother's Name",
    "Blood Group",
    "Physically Disabled",
    "SSLC Mark",
    "School Name with Place",
    "Address For communication",
    "Community",
    "User Registration Date",
    "Lead Stage",
  ];

  // Visibility Controls States
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showAddress, setShowAddress] = useState(true);

  // Admin Split Contacts to Teacher Modal State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitTargetTeacher, setSplitTargetTeacher] = useState("teacher_rajesh@123");
  const [splitQuantity, setSplitQuantity] = useState(100);
  const [splitStartNumber, setSplitStartNumber] = useState(1);

  const FACULTY_MEMBERS = [
    { id: "rajesh.mech@vsbec.in", name: "Prof. P. Rajesh", department: "Mechanical Engineering", campus: "KARUR" },
    { id: "arulmurugan.cse@vsbec.in", name: "Dr. K. Arulmurugan", department: "Computer Science", campus: "KARUR" },
    { id: "meenakshi.ece@vsbec.in", name: "Dr. S. Meenakshi", department: "Electronics & Communication", campus: "COIMBATORE" },
    { id: "gayathri.it@vsbec.in", name: "Dr. N. Gayathri", department: "Information Technology", campus: "KARUR" },
    { id: "karthik.ai@vsbec.in", name: "Prof. M. Karthik", department: "Artificial Intelligence & Data Science", campus: "KARUR" },
    { id: "saravanan.eee@vsbec.in", name: "Dr. R. Saravanan", department: "Electrical & Electronics Engg", campus: "KARUR" },
    { id: "anitha.bme@vsbec.in", name: "Prof. V. Anitha", department: "Biomedical Engineering", campus: "KARUR" },
    { id: "senthil.civil@vsbec.in", name: "Dr. T. Senthil", department: "Civil Engineering", campus: "KARUR" },
    { id: "kavitha.cyber@vsbec.in", name: "Prof. P. Kavitha", department: "Cyber Security", campus: "COIMBATORE" },
    { id: "ramesh.robotics@vsbec.in", name: "Dr. G. Ramesh", department: "Robotics & Automation", campus: "KARUR" },
    { id: "divya.chem@vsbec.in", name: "Prof. S. Divya", department: "Chemical Engineering", campus: "KARUR" },
    { id: "manikandan.aero@vsbec.in", name: "Dr. A. Manikandan", department: "Aeronautical Engineering", campus: "COIMBATORE" },
    { id: "priya.biotech@vsbec.in", name: "Prof. R. Priya", department: "Biotechnology", campus: "KARUR" },
    { id: "suresh.ds@vsbec.in", name: "Dr. K. Suresh", department: "Data Science", campus: "KARUR" },
    { id: "deepa.it@vsbec.in", name: "Prof. N. Deepa", department: "Information Technology", campus: "COIMBATORE" },
    { id: "prakash.cse@vsbec.in", name: "Dr. M. Prakash", department: "Computer Science & Engineering", campus: "COIMBATORE" },
  ];

  const handlePerformLeadSplit = () => {
    const startIndex = Math.max(0, splitStartNumber - 1);
    const count = Math.max(1, splitQuantity);
    const endIndex = Math.min(contacts.length, startIndex + count);

    const facultyObj = FACULTY_MEMBERS.find((f) => f.id === splitTargetTeacher || f.name === splitTargetTeacher);
    const facultyName = facultyObj ? facultyObj.name : splitTargetTeacher;
    const facultyId = facultyObj ? facultyObj.id : splitTargetTeacher;

    const updated = contacts.map((c, idx) => {
      if (idx >= startIndex && idx < endIndex) {
        return {
          ...c,
          assignedTo: facultyId,
          assignedRangeText: `Batch #${startIndex + 1} - #${endIndex}`,
        };
      }
      return c;
    });

    setContacts(updated);
    setIsSplitModalOpen(false);

    if (onTriggerToast) {
      onTriggerToast(
        `⚡ Successfully split & allocated Contacts #${startIndex + 1} to #${endIndex} (${endIndex - startIndex} Leads) to ${facultyName}!`
      );
    }
  };

  // Call Recordings State & 30-Day Auto Retention Engine
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([
    {
      id: "rec_1001",
      leadId: "lead_1",
      leadName: "Revathy",
      leadPhone: "+91 95662 07732",
      teacherId: "teacher_rajesh@123",
      teacherName: "Prof. P. Rajesh",
      recordingDate: "2026-08-22",
      timestamp: "09:45 AM",
      durationSeconds: 95,
      durationText: "01:35",
      studentInterestStatus: "INTERESTED",
      teacherNotes: "Candidate has 192.5 TNEA cutoff. Very interested in B.E. BioMedical at Karur Campus. Scheduled campus visit for Aug 25.",
      callTranscript: "[00:02] Prof. Rajesh: Good morning Revathy, this is Prof. Rajesh from V.S.B. Admissions Desk.\n[00:08] Revathy: Hello sir! I wanted to check my cutoff eligibility for BioMedical Engineering.\n[00:15] Prof. Rajesh: Your 192.5 cutoff score is well within our merit rank scholarship bracket! We are offering 50% tuition waiver.\n[00:24] Revathy: That's wonderful sir! I am very interested to join V.S.B. Karur campus.",
      audioUrl: "/audio/sample_call_recording.mp3",
      expiresAt: "2026-09-21",
      autoDeleted: false,
    },
    {
      id: "rec_1002",
      leadId: "lead_2",
      leadName: "Gunal",
      leadPhone: "+91 95510 82291",
      teacherId: "teacher_rajesh@123",
      teacherName: "Prof. P. Rajesh",
      recordingDate: "2026-08-22",
      timestamp: "10:15 AM",
      durationSeconds: 110,
      durationText: "01:50",
      studentInterestStatus: "ADMITTED",
      teacherNotes: "Student paid initial admission token fee. Confirmed B.E. Computer Science enrollment.",
      callTranscript: "[00:03] Prof. Rajesh: Hello Gunal, congratulations on your 188.0 TNEA cutoff!\n[00:10] Gunal: Thank you sir! I have submitted my online application for CSE.\n[00:18] Prof. Rajesh: Excellent! Your seat allocation is confirmed under General Counselling quota.",
      audioUrl: "/audio/sample_call_recording.mp3",
      expiresAt: "2026-09-21",
      autoDeleted: false,
    },
    {
      id: "rec_1003",
      leadId: "lead_3",
      leadName: "Manivel",
      leadPhone: "+91 88831 58493",
      teacherId: "teacherkarur@123",
      teacherName: "Dr. K. Arulmurugan",
      recordingDate: "2026-08-22",
      timestamp: "10:30 AM",
      durationSeconds: 84,
      durationText: "01:24",
      studentInterestStatus: "INTERESTED",
      teacherNotes: "Inquired about AI & Data Science labs and hostel facilities.",
      callTranscript: "[00:02] Dr. Arulmurugan: Hello Manivel, calling from V.S.B. CSE Department.\n[00:08] Manivel: Hello sir! Does V.S.B. have NVIDIA AI deep learning labs?\n[00:15] Dr. Arulmurugan: Yes! We have dedicated AI/ML center of excellence with 100% placement record.",
      audioUrl: "/audio/sample_call_recording.mp3",
      expiresAt: "2026-09-21",
      autoDeleted: false,
    },
    {
      id: "rec_1004",
      leadId: "lead_4",
      leadName: "S. Vignesh",
      leadPhone: "+91 98765 43210",
      teacherId: "teachercovai@123",
      teacherName: "Dr. S. Meenakshi",
      recordingDate: "2026-08-22",
      timestamp: "11:00 AM",
      durationSeconds: 125,
      durationText: "02:05",
      studentInterestStatus: "INTERESTED",
      teacherNotes: "Cutoff 194.2. Interested in ECE Coimbatore campus.",
      callTranscript: "[00:03] Dr. Meenakshi: Hello Vignesh, congratulation on 96.8% in 12th marks!\n[00:09] S. Vignesh: Thank you ma'am! I am interested in ECE at Coimbatore campus.\n[00:16] Dr. Meenakshi: We have top tier Core VLSI & Telecom company tie-ups.",
      audioUrl: "/audio/sample_call_recording.mp3",
      expiresAt: "2026-09-21",
      autoDeleted: false,
    },
  ]);

  // 30-Day Auto Retention Purge Engine (Deletes recordings older than 30 days)
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setCallRecordings((prev) => prev.filter((rec) => rec.expiresAt >= todayStr && !rec.autoDeleted));
  }, []);

  // Admin Daily Call Analytics & Audio Audit Modal State
  const [isAdminAuditDrawerOpen, setIsAdminAuditDrawerOpen] = useState(false);
  const [selectedAuditDate, setSelectedAuditDate] = useState("2026-08-22");
  const [playingAudioRecId, setPlayingAudioRecId] = useState<string | null>(null);

  const handleSaveCallRecording = (rec: CallRecording) => {
    setCallRecordings((prev) => [rec, ...prev]);
  };

  // Add Contact Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    school: "",
    district: "Karur",
    address: "",
    campus: "KARUR" as CampusLocation,
    courseInterest: VSB_DEPARTMENTS_COURSES[0] as string,
    appliedCounselling: true,
    counsellingAppNo: `TNEA2026-${Math.floor(10000 + Math.random() * 90000)}`,
    tneaCutoff: 185.0,
    counsellingCategory: "TNEA General Counselling",
  });

  // Edit Contact Modal State
  const [editingContact, setEditingContact] = useState<(Lead & { application?: Application | null }) | null>(null);

  // In-Portal Communication Modal State
  const [activeCommModal, setActiveCommModal] = useState<"CALL" | "MESSAGE" | "EMAIL" | null>(null);
  const [activeCommContact, setActiveCommContact] = useState<ContactTarget | null>(null);

  const handleOpenCommModal = (type: "CALL" | "MESSAGE" | "EMAIL", target: ContactTarget) => {
    setActiveCommContact(target);
    setActiveCommModal(type);
  };

  const handleCommLogSuccess = (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => {
    if (onTriggerToast) {
      onTriggerToast(`✨ In-Portal ${type} completed: ${details}`);
    }
    onActionTrigger(type === "MESSAGE" ? "WHATSAPP" : type, activeCommContact?.name || "Candidate");
  };

  // Teacher Assignment Handler (Admin action)
  const handleAssignTeacher = (contactId: string, teacherUsername: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, assignedTo: teacherUsername } : c))
    );
    if (onTriggerToast) {
      onTriggerToast(`Contact assigned to teacher (${teacherUsername})!`);
    }
  };

  // Render Helper for Dynamic Table Columns (Image 2 Customize Column)
  const renderCellContent = (
    contact: Lead & { application?: Application | null },
    col: string
  ) => {
    if (col === "Registered Name") {
      return (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#0f172a] dark:text-blue-600 text-sm hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); handleCandidateClick(contact); }}>
              {contact.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCandidateClick(contact);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-80 group-hover:opacity-100"
            title="View Lead Details"
          >
            ⋮
          </button>
        </div>
      );
    }
    if (col === "Registered Email") {
      return <span className="font-mono text-[11px] text-slate-600">{showEmail ? contact.email : "•••••@•••••.•••"}</span>;
    }
    if (col === "Registered Mobile") {
      return (
        <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCommModal("MESSAGE", {
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                courseInterest: contact.courseInterest,
                campus: contact.campus,
              });
            }}
            className="p-1 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
            title={`WhatsApp Chat with ${contact.name}`}
          >
            💬
          </button>
          <span>{showPhone ? contact.phone : "+91 ••••• •••••"}</span>
        </div>
      );
    }
    if (col === "Registered Country") return <span className="font-semibold text-slate-700">India</span>;
    if (col === "State") return <span className="font-semibold text-slate-700">Tamil Nadu</span>;
    if (col === "City") return <span className="font-semibold text-slate-700">{contact.district || "Karur"}</span>;
    if (col === "Campus") return <span className="font-bold text-sky-700">{contact.campus} CAMPUS</span>;
    if (col === "Course") return <span className="font-bold text-indigo-700">{contact.courseInterest || "B.E. Computer Science"}</span>;
    if (col === "Specialization") return <span className="text-slate-600">TNEA Engineering</span>;
    if (col === "Utm Keyword") return <span className="font-mono text-[11px] text-slate-500">tnea_admissions_2026</span>;
    if (col === "Gender") return <span className="text-slate-700 font-semibold">{(contact as any).gender || "Male"}</span>;
    if (col === "Father's Name") return <span className="text-slate-700">{(contact as any).fatherName || "K. Ramachandran"}</span>;
    if (col === "Mother's Name") return <span className="text-slate-700">{(contact as any).motherName || "R. Priya"}</span>;
    if (col === "Blood Group") return <span className="font-bold text-rose-600">{(contact as any).bloodGroup || "O+"}</span>;
    if (col === "Physically Disabled") return <span className="text-slate-700">{(contact as any).physicallyDisabled ? "Yes" : "No"}</span>;
    if (col === "SSLC Mark") return <span className="font-bold text-emerald-600">{(contact as any).marks10th || 85}%</span>;
    if (col === "School Name with Place") return <span className="text-slate-700 font-medium">{contact.school || "Govt Higher Sec School"}</span>;
    if (col === "Address For communication") return <span className="text-slate-600 font-medium">{showAddress ? contact.address || "Karur, Tamil Nadu" : "•••••••••••••"}</span>;
    if (col === "Community") return <span className="font-extrabold text-blue-600">{(contact as any).community || "BC"}</span>;
    if (col === "User Registration Date") return <span className="text-slate-600 font-medium">Aug 12, 2026</span>;
    if (col === "Lead Stage") {
      const statusText =
        contact.status === "NEW"
          ? "Untouched"
          : contact.status === "CONTACTED"
            ? "Interested to Study Engin..."
            : contact.status === "IN_REVIEW"
              ? "Not Reachable"
              : contact.status === "ADMITTED"
                ? "Admitted"
                : contact.status === "REJECTED"
                  ? "Closed"
                  : contact.status || "Untouched";

      const badgeStyle =
        statusText === "Untouched"
          ? "bg-red-50 text-red-600 border-red-200 font-bold"
          : statusText.startsWith("Interested")
            ? "bg-sky-50 text-sky-700 border-sky-200 font-bold"
            : statusText === "Not Reachable"
              ? "bg-slate-100 text-slate-600 border-slate-200 font-medium"
              : statusText === "Admitted"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                : "bg-slate-100 text-slate-700 border-slate-300 font-medium";

      return (
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] border whitespace-nowrap inline-block ${badgeStyle}`}>
          {statusText}
        </span>
      );
    }
    return <span className="text-slate-600">N/A</span>;
  };

  // Dynamic Side Drawer Rule Evaluator (Image 1 Filter leads by)
  const evaluateRule = (
    c: Lead & { application?: Application | null },
    rule: { field: string; operator: string; value: string }
  ) => {
    if (!rule.value || rule.value === "Select Here") return true;

    let fieldValue = "";
    if (rule.field === "State") fieldValue = "Tamil Nadu";
    else if (rule.field === "City") fieldValue = c.district || "Karur";
    else if (rule.field === "Registered Name") fieldValue = c.name;
    else if (rule.field === "Registered Email") fieldValue = c.email;
    else if (rule.field === "Registered Mobile") fieldValue = c.phone;
    else if (rule.field === "Lead Stage") fieldValue = c.status;
    else if (rule.field === "Campus") fieldValue = c.campus;
    else if (rule.field === "Course") fieldValue = c.courseInterest || "";
    else if (rule.field === "Gender") fieldValue = (c as any).gender || "Male";
    else if (rule.field === "TNEA Cutoff") fieldValue = String((c as any).tneaCutoff || 180);
    else if (rule.field === "Community") fieldValue = (c as any).community || "BC";
    else fieldValue = "";

    const targetVal = rule.value.toLowerCase().trim();
    const actualVal = fieldValue.toLowerCase().trim();

    if (rule.operator === "Equals") return actualVal === targetVal;
    if (rule.operator === "Contains") return actualVal.includes(targetVal);
    if (rule.operator === "Not Equals") return actualVal !== targetVal;
    if (rule.operator === "Greater Than") return parseFloat(actualVal) > parseFloat(targetVal);
    if (rule.operator === "Less Than") return parseFloat(actualVal) < parseFloat(targetVal);
    return true;
  };

  // Filter Contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = (() => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      if (searchField === "Mobile") return c.phone.toLowerCase().includes(q);
      if (searchField === "Email") return c.email.toLowerCase().includes(q);
      if (searchField === "Name") return c.name.toLowerCase().includes(q);
      if (searchField === "User Id" || searchField === "Lead Id") return (c.id || "").toLowerCase().includes(q);
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.id || "").toLowerCase().includes(q) ||
        (c.school && c.school.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    })();

    const matchesCampus = selectedCampus === "ALL" || c.campus === selectedCampus;

    const matchesDistrict =
      selectedDistrict === "ALL" ||
      (c.district && c.district.toLowerCase() === selectedDistrict.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || c.status === selectedStatus;

    const matchesCounselling =
      counsellingFilter === "ALL"
        ? true
        : counsellingFilter === "COUNSELLING_ONLY"
          ? c.appliedCounselling === true || c.source?.includes("TNEA")
          : counsellingFilter === "GOVT_QUOTA"
            ? c.counsellingCategory?.includes("7.5%")
            : c.appliedCounselling === false || c.counsellingCategory?.includes("Management");

    const matchesTeacherAssignment =
      currentUserRole === "ADMIN"
        ? true
        : Boolean(
            c.assignedTo &&
              (c.assignedTo.toLowerCase().trim() === loggedInUsername.toLowerCase().trim() ||
                (c.assignedTo === "teacher_rajesh@123" && loggedInUsername.includes("rajesh")) ||
                (c.assignedTo === "teacherkarur@123" && loggedInUsername.includes("arul")) ||
                (c.assignedTo === "teachercovai@123" && loggedInUsername.includes("meenakshi")))
          );

    const matchesDrawerRules =
      filterRules.length === 0
        ? true
        : filterLogicMode === "ALL"
          ? filterRules.every((r) => evaluateRule(c, r))
          : filterRules.some((r) => evaluateRule(c, r));

    const matchesColumnFilters = Object.entries(columnFilters).every(([col, filterVal]) => {
      if (!filterVal || filterVal === "ALL") return true;
      const actual = getFieldValueForCol(c, col).toLowerCase();
      const filter = filterVal.toLowerCase().trim();
      if (col === "Lead Stage" || col === "Campus" || col === "Gender" || col === "Community" || col === "State") {
        return actual === filter;
      }
      return actual.includes(filter);
    });

    const matchesRegDate = () => {
      if (!regDateFilter || regDateFilter === "Select Here" || regDateFilter === "All Time") return true;
      if (regDateFilter === "Today" || regDateFilter === "Yesterday" || regDateFilter === "Last 7 Days") return true;

      const yearMatch = regDateFilter.match(/\b(2024|2025|2026|2027|2028|2029|2030)\b/);
      const selectedYear = yearMatch ? yearMatch[1] : null;

      const monthLowerNames = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
      ];
      const selectedMonth = monthLowerNames.find((m) => regDateFilter.toLowerCase().includes(m));

      const leadDateObj = c.createdAt ? new Date(c.createdAt) : new Date(2026, 7, 12);
      const leadYear = leadDateObj.getFullYear().toString();
      const leadMonth = monthLowerNames[leadDateObj.getMonth()];

      if (selectedYear && selectedMonth) {
        return leadYear === selectedYear && leadMonth === selectedMonth;
      }
      if (selectedYear) {
        return leadYear === selectedYear;
      }
      if (selectedMonth) {
        return leadMonth === selectedMonth;
      }
      return true;
    };

    const matchesSelectedView = () => {
      if (!selectedViewName || selectedViewName === "Default View") return true;
      if (selectedViewName === "Karur Intake View") {
        return (
          c.campus === "KARUR" ||
          (c.district && c.district.toLowerCase().includes("karur")) ||
          (c.address && c.address.toLowerCase().includes("karur")) ||
          (c.school && c.school.toLowerCase().includes("karur"))
        );
      }
      if (selectedViewName === "TNEA Candidates") {
        return (
          c.appliedCounselling === true ||
          (c.counsellingCategory && c.counsellingCategory.toLowerCase().includes("tnea")) ||
          (c.counsellingAppNo && c.counsellingAppNo.toLowerCase().includes("tnea")) ||
          (c.source && c.source.toLowerCase().includes("tnea"))
        );
      }
      if (selectedViewName === "High Cutoff Leads") {
        const cutoff = (c as any).tneaCutoff ?? (c as any).cutoff ?? 180;
        return cutoff >= 170;
      }
      return true;
    };

    const matchesLeadStage = () => {
      if (!leadStageFilter || leadStageFilter === "Select Here" || leadStageFilter === "ALL") return true;
      const statusUpper = (c.status || "").toUpperCase();
      const valLower = leadStageFilter.toLowerCase();

      if (valLower === "untouched") {
        return statusUpper === "NEW" || statusUpper === "UNTOUCHED" || !c.assignedTo;
      }
      if (valLower === "new inquiry") {
        return statusUpper === "NEW" || statusUpper === "INQUIRY" || statusUpper === "IN_REVIEW";
      }
      if (valLower === "contacted") {
        return statusUpper === "CONTACTED";
      }
      if (valLower === "cutoff review") {
        return statusUpper === "IN_REVIEW" || statusUpper === "CUTOFF_REVIEW" || ((c as any).tneaCutoff && (c as any).tneaCutoff > 0);
      }
      if (valLower === "admitted") {
        return statusUpper === "ADMITTED";
      }
      return statusUpper.includes(valLower.toUpperCase());
    };

    const matchesLeadOwner = () => {
      if (!leadOwnerFilter || leadOwnerFilter === "Select Here") return true;
      const ownerLower = leadOwnerFilter.toLowerCase();
      const assignedLower = (c.assignedTo || "").toLowerCase();
      if (ownerLower.includes("karur")) return assignedLower.includes("karur") || c.campus === "KARUR";
      if (ownerLower.includes("covai") || ownerLower.includes("coimbatore")) return assignedLower.includes("covai") || assignedLower.includes("coimbatore") || c.campus === "COIMBATORE";
      return assignedLower.includes(ownerLower);
    };

    const matchesCampaignSource = () => {
      if (!campaignSourceFilter || campaignSourceFilter === "Select Here") return true;
      const srcLower = (c.source || "").toLowerCase();
      const filterLower = campaignSourceFilter.toLowerCase();
      return srcLower.includes(filterLower) || filterLower.includes(srcLower);
    };

    const matchesTrafficChannel = () => {
      if (!trafficChannelFilter || trafficChannelFilter === "Select Here") return true;
      return true;
    };

    return (
      matchesSearch &&
      matchesCampus &&
      matchesDistrict &&
      matchesStatus &&
      matchesCounselling &&
      matchesTeacherAssignment &&
      matchesDrawerRules &&
      matchesColumnFilters &&
      matchesRegDate() &&
      matchesSelectedView() &&
      matchesLeadStage() &&
      matchesLeadOwner() &&
      matchesCampaignSource() &&
      matchesTrafficChannel()
    );
  });

  const sortedAndFilteredContacts = [...filteredContacts].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = getFieldValueForCol(a, sortColumn).toLowerCase();
    const valB = getFieldValueForCol(b, sortColumn).toLowerCase();
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Table Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredContacts.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const dirStartIndex = (safeCurrentPage - 1) * rowsPerPage;
  const dirEndIndex = Math.min(sortedAndFilteredContacts.length, dirStartIndex + rowsPerPage);
  const paginatedContacts = sortedAndFilteredContacts.slice(dirStartIndex, dirEndIndex);

  // Tamil Nadu Districts list (All 38 Districts)
  const districts = ["ALL", ...TAMIL_NADU_DISTRICTS];

  // Add New Contact Submit Handler
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });

      const data = await res.json();
      setContacts([data, ...contacts]);
      setIsAddModalOpen(false);
      setNewContact({
        name: "",
        phone: "",
        email: "",
        school: "",
        district: "Karur",
        address: "",
        campus: "KARUR",
        courseInterest: "B.E. Computer Science",
        appliedCounselling: true,
        counsellingAppNo: `TNEA2026-${Math.floor(10000 + Math.random() * 90000)}`,
        tneaCutoff: 185.0,
        counsellingCategory: "TNEA General Counselling",
      });
    } catch (err) {
      // Local fallback insert
      const fallback: Lead = {
        id: `lead_${Date.now()}`,
        name: newContact.name,
        email: newContact.email || `${newContact.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
        phone: newContact.phone,
        source: "Direct Entry",
        courseInterest: newContact.courseInterest,
        campus: newContact.campus,
        school: newContact.school || "Govt Higher Secondary School",
        district: newContact.district,
        address: newContact.address || "Tamil Nadu",
        status: "NEW",
        createdAt: new Date().toISOString(),
      };
      setContacts([fallback, ...contacts]);
      setIsAddModalOpen(false);
    }
  };

  // CSV File Importer Handler with Smart Column Mapping & Student Database Detail Sync
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const imported = parseCSVToLeads(text, selectedCampus, loggedInUsername);

      if (imported.length > 0) {
        setContacts((prev) => [...imported, ...prev]);

        if (onImportLeads) {
          onImportLeads(imported);
        }

        if (onTriggerToast) {
          onTriggerToast(
            `📥 Successfully imported ${imported.length} student contact(s) from File Manager!`
          );
        }
      } else {
        if (onTriggerToast) {
          onTriggerToast("⚠️ No valid candidate details found in the CSV file.");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Edit Contact Submit Handler
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      const res = await fetch("/api/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingContact),
      });

      const updated = await res.json();
      setContacts(contacts.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setEditingContact(null);
    } catch (err) {
      setContacts(contacts.map((c) => (c.id === editingContact.id ? editingContact : c)));
      setEditingContact(null);
    }
  };

  // Delete Contact Handler
  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete contact record for ${name}?`)) return;

    try {
      await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    } catch (err) { }

    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* ADMIN PORTAL LEAD ALLOCATION & BATCH RANGE SPLITTING CONTROL CARD */}
      {currentUserRole === "ADMIN" && (
        <div className="bubble-card p-4 sm:p-5 border border-indigo-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                Admin Lead Allocation Control Panel
              </span>
              <span className="text-xs text-slate-300 font-bold">1,000 Total Database Contacts</span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="text-xl">⚡</span> Total Database Leads: <span className="text-indigo-400 font-black">1,000 Contacts</span>
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <span>Admin can split database leads into specific teacher batches (e.g. 100 contacts to Prof. P. Rajesh). Teachers exclusively view & edit their assigned batch while remaining 900 leads stay protected.</span>
            </p>

            {/* Allocated Batches Summary Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 flex items-center gap-1 font-bold">
                <span>👤 P. Rajesh:</span>
                <span className="text-emerald-400">100 Leads (#1 - #100)</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-200 border border-sky-400/30 flex items-center gap-1 font-bold">
                <span>👤 Dr. Arulmurugan:</span>
                <span className="text-sky-400">100 Leads (#101 - #200)</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-200 border border-pink-400/30 flex items-center gap-1 font-bold">
                <span>👤 Dr. Meenakshi:</span>
                <span className="text-pink-400">100 Leads (#201 - #300)</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-400/30 flex items-center gap-1 font-bold">
                <span>👤 Dr. Gayathri:</span>
                <span className="text-purple-400">100 Leads (#301 - #400)</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                <span>⏳ 600 Unassigned Leads</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              onClick={() => setIsAdminAuditDrawerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 border border-emerald-300/40 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
            >
              <Phone className="w-4 h-4 text-emerald-200" />
              <span>📞 Daily Call Analytics & Audio Audit</span>
            </button>

            <button
              onClick={() => setIsSplitModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 border border-indigo-300/40 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
            >
              <span className="text-base">⚡</span>
              <span>Split Contacts to Teacher</span>
            </button>
          </div>
        </div>
      )}

      {/* Teacher Quota & Strict Scoping Banner */}
      {currentUserRole === "TEACHER" && (
        <div className="bubble-card p-4 sm:p-5 border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                Faculty Lead Allocation Portal
              </span>
              <span className="text-xs text-slate-300 font-bold">Assigned by Admin</span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Faculty Portal: <span className="text-emerald-300 font-black">{FACULTY_MEMBERS.find((f) => f.id === loggedInUsername || f.id.toLowerCase() === loggedInUsername.toLowerCase())?.name || loggedInUsername} ({loggedInUsername})</span>
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>You have exclusive permission to view, edit & update your assigned 100 contacts. The remaining 900 database contacts are protected and restricted to Admin view.</span>
            </p>
          </div>

          <div className="w-full md:w-64 bg-slate-950/90 p-3.5 rounded-2xl border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-slate-400">Assigned Batch Progress</span>
              <span className="text-emerald-400 font-extrabold">14 / 100 (14%)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[14%]" />
            </div>
            <p className="text-[10px] text-slate-400 text-right">86 Assigned Leads Remaining</p>
          </div>
        </div>
      )}

      {/* MERITTO LEAD MANAGER TOP HEADER BAR (Matching Image 2 Reference) */}
      <div className="bg-[#ffffff] text-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-sans">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Lead Manager
          </h2>

          {/* Default View Selector */}
          <div className="relative">
            <select
              value={selectedViewName}
              onChange={(e) => {
                const newView = e.target.value;
                setSelectedViewName(newView);
                if (onTriggerToast) {
                  onTriggerToast(`Applied View Filter: ${newView}`);
                }
              }}
              className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Default View">Default View ∨</option>
              <option value="Karur Intake View">Karur Intake View</option>
              <option value="TNEA Candidates">TNEA Candidates</option>
              <option value="High Cutoff Leads">High Cutoff Leads</option>
            </select>
          </div>

          {/* Save View Button */}
          <button
            onClick={() => onTriggerToast?.("Saved custom view configuration!")}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-blue-600 font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save View
          </button>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Last sync on Aug 12, 2026 11:36 AM</span>
            <button onClick={() => onTriggerToast?.("Synced latest candidate leads from server!")} title="Sync Now" className="hover:rotate-180 transition-transform ml-1">
              🔄
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* View Mode Toggle: Table View (Image 2) vs Cards View (Image 1) */}
          <div className="flex items-center bg-slate-200 p-0.5 rounded-xl border border-slate-300">
            <button
              onClick={() => setDirectoryViewMode("TABLE")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${directoryViewMode === "TABLE" ? "bg-blue-600 text-white shadow" : "text-slate-700 hover:text-slate-900"
                }`}
            >
              📋 Lead Manager Table
            </button>
            <button
              onClick={() => setDirectoryViewMode("GRID")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${directoryViewMode === "GRID" ? "bg-blue-600 text-white shadow" : "text-slate-700 hover:text-slate-900"
                }`}
            >
              🎴 Cards View
            </button>
          </div>

          <input
            type="file"
            id="csv-file-upload"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
          <button
            onClick={() => document.getElementById("csv-file-upload")?.click()}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/40 border border-purple-300/40 flex items-center gap-1.5 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-white shrink-0" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-lg shadow-pink-500/40 border border-pink-300/40 flex items-center gap-1.5 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* District & Metric Summary Cards (Image 2 Top) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Contacts</p>
            <h4 className="text-lg font-black text-white">{contacts.length}</h4>
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Districts Covered</p>
            <h4 className="text-lg font-black text-white">8 Tamil Nadu Districts</h4>
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 flex items-center justify-center font-bold">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Schools Tracked</p>
            <h4 className="text-lg font-black text-white">7 Higher Sec Schools</h4>
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Campus</p>
            <h4 className="text-lg font-black text-amber-300">{selectedCampus} CAMPUS</h4>
          </div>
        </div>
      </div>

      {/* V.S.B. TNEA & Lead Stage Icon Filters (Image 2 Bottom) */}
      <div className="bubble-card p-4 space-y-3.5 border border-sky-400/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" /> V.S.B. TNEA & Lead Stage Filters
            </h3>
            <p className="text-xs text-slate-400">Filter candidate inquiries by stage or TNEA counselling category</p>
          </div>

          {/* Counselling Status Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider shrink-0 mr-1">Counselling Intake:</span>
            <button
              onClick={() => setCounsellingFilter("ALL")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 ${counsellingFilter === "ALL"
                ? "bg-slate-800 text-white border-white/30 font-black"
                : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
                }`}
            >
              All Intake
            </button>
            <button
              onClick={() => setCounsellingFilter("COUNSELLING_ONLY")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${counsellingFilter === "COUNSELLING_ONLY"
                ? "bg-emerald-500/30 text-emerald-300 border-emerald-400/60 shadow-md font-black"
                : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
                }`}
            >
              <span>✅ Applied TNEA</span>
            </button>
            <button
              onClick={() => setCounsellingFilter("GOVT_QUOTA")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${counsellingFilter === "GOVT_QUOTA"
                ? "bg-indigo-500/30 text-indigo-300 border-indigo-400/60 shadow-md font-black"
                : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
                }`}
            >
              <span>🏛️ 7.5% Govt Quota</span>
            </button>
            <button
              onClick={() => setCounsellingFilter("MANAGEMENT_ONLY")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${counsellingFilter === "MANAGEMENT_ONLY"
                ? "bg-purple-500/30 text-purple-300 border-purple-400/60 shadow-md font-black"
                : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
                }`}
            >
              <span>💼 Management Quota</span>
            </button>
          </div>
        </div>

        {/* One by One Icon Status Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${selectedStatus === "ALL"
              ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-300 shadow-xl shadow-indigo-500/40 font-black scale-[1.03] ring-2 ring-indigo-400/50"
              : "bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-800/90 shadow-md"
              }`}
          >
            <span className="text-lg">🌟</span>
            <div className="text-left leading-tight">
              <span className="block text-xs font-black">All Leads</span>
              <span className="text-[10px] font-bold opacity-80">{contacts.length} Total</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("NEW")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${selectedStatus === "NEW"
              ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-300 shadow-xl shadow-indigo-500/40 font-black scale-[1.03] ring-2 ring-indigo-400/50"
              : "bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-800/90 shadow-md"
              }`}
          >
            <span className="text-lg">🆕</span>
            <div className="text-left leading-tight">
              <span className="block text-xs font-black">New Inquiry</span>
              <span className="text-[10px] font-bold opacity-80">{contacts.filter(c => c.status === "NEW").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("CONTACTED")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${selectedStatus === "CONTACTED"
              ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-300 shadow-xl shadow-indigo-500/40 font-black scale-[1.03] ring-2 ring-indigo-400/50"
              : "bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-800/90 shadow-md"
              }`}
          >
            <span className="text-lg">📞</span>
            <div className="text-left leading-tight">
              <span className="block text-xs font-black">Contacted</span>
              <span className="text-[10px] font-bold opacity-80">{contacts.filter(c => c.status === "CONTACTED").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("IN_REVIEW")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${selectedStatus === "IN_REVIEW"
              ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-300 shadow-xl shadow-indigo-500/40 font-black scale-[1.03] ring-2 ring-indigo-400/50"
              : "bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-800/90 shadow-md"
              }`}
          >
            <span className="text-lg">📊</span>
            <div className="text-left leading-tight">
              <span className="block text-xs font-black">Cutoff Review</span>
              <span className="text-[10px] font-bold opacity-80">{contacts.filter(c => c.status === "IN_REVIEW").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("ADMITTED")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${selectedStatus === "ADMITTED"
              ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-300 shadow-xl shadow-indigo-500/40 font-black scale-[1.03] ring-2 ring-indigo-400/50"
              : "bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-800/90 shadow-md"
              }`}
          >
            <span className="text-lg">🎓</span>
            <div className="text-left leading-tight">
              <span className="block text-xs font-black">Admitted</span>
              <span className="text-[10px] font-bold opacity-80">{contacts.filter(c => c.status === "ADMITTED").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("REJECTED")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${selectedStatus === "REJECTED"
              ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-300 shadow-xl shadow-indigo-500/40 font-black scale-[1.03] ring-2 ring-indigo-400/50"
              : "bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-800/90 shadow-md"
              }`}
          >
            <span className="text-lg">❌</span>
            <div className="text-left leading-tight">
              <span className="block text-xs font-black">Rejected</span>
              <span className="text-[10px] font-bold opacity-80">{contacts.filter(c => c.status === "REJECTED").length} Leads</span>
            </div>
          </button>
        </div>
      </div>

      {/* MERITTO LEAD MANAGER QUICK FILTER PILLS & FIELD SEARCH BAR (MATCHING SCREENSHOT) */}
      <div className="bg-[#ffffff] border border-slate-200 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-slate-800">
        {/* Left: Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* User Registration Date */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 hidden xl:inline">User Registration Date:</span>
            <select
              value={regDateFilter}
              onChange={(e) => setRegDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-full px-3.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="Select Here">Select Here 📅</option>
              <optgroup label="Quick Filters">
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="All Time">All Time</option>
              </optgroup>
              <optgroup label="Academic Years">
                <option value="2026">Academic Year 2026</option>
                <option value="2027">Academic Year 2027</option>
              </optgroup>
            </select>
          </div>

          {/* Lead Stage */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 hidden xl:inline">Lead Stage:</span>
            <select
              value={leadStageFilter}
              onChange={(e) => {
                const val = e.target.value;
                setLeadStageFilter(val);
                if (onTriggerToast) {
                  onTriggerToast(`Filtered leads by Lead Stage: ${val}`);
                }
              }}
              className="bg-slate-50 border border-slate-300 rounded-full px-3.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Untouched">Untouched</option>
              <option value="New Inquiry">New Inquiry</option>
              <option value="Contacted">Contacted</option>
              <option value="Cutoff Review">Cutoff Review</option>
              <option value="Admitted">Admitted</option>
            </select>
          </div>

          {/* Lead Owner / Teams */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 hidden xl:inline">Lead Owner / Teams:</span>
            <select
              value={leadOwnerFilter}
              onChange={(e) => setLeadOwnerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-full px-3.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Admin Karur">Admin Karur</option>
              <option value="Admin Covai">Admin Covai</option>
              <option value="Counselor Team A">Counselor Team A</option>
            </select>
          </div>

          {/* Campaign Source */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 hidden xl:inline">Campaign Source:</span>
            <select
              value={campaignSourceFilter}
              onChange={(e) => setCampaignSourceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-full px-3.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Organic">Organic Search</option>
              <option value="TNEA Counselling">TNEA Counselling</option>
              <option value="Facebook Ads">Facebook Ads</option>
            </select>
          </div>

          {/* Traffic Channel */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 hidden xl:inline">Traffic Channel:</span>
            <select
              value={trafficChannelFilter}
              onChange={(e) => setTrafficChannelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-full px-3.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Direct Intake">Direct Intake</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>

          <button className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-semibold hover:bg-slate-200 transition-colors">
            +2 more
          </button>
        </div>

        {/* Right: Quick Search Dropdown & Field Search Input (Matching Meritto Screenshot) */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Combined Field Selector + Search Input Bar */}
          <div className="relative flex items-center bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            {/* Field Dropdown Selector Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSearchFieldDropdownOpen(!isSearchFieldDropdownOpen)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 border-r border-slate-300 flex items-center gap-1.5 hover:bg-slate-100 rounded-l-lg transition-colors"
              >
                <span>{searchField}</span>
                <span className="text-[10px] text-slate-400">∧</span>
              </button>

              {/* Popover Dropdown for Field Selection (Matching Screenshot) */}
              {isSearchFieldDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1.5 text-xs font-sans text-slate-800 animate-in fade-in zoom-in-95">
                  {(["Email", "Mobile", "Name", "User Id", "Lead Id"] as const).map((field) => (
                    <div
                      key={field}
                      onClick={() => {
                        setSearchField(field);
                        setIsSearchFieldDropdownOpen(false);
                      }}
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${searchField === field ? "bg-blue-50/80 font-bold text-blue-600" : "text-slate-700 font-medium"
                        }`}
                    >
                      <span>{field}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStarredSearchFields((prev) => ({ ...prev, [field]: !prev[field] }));
                        }}
                        className={`text-sm hover:scale-110 transition-transform ${starredSearchFields[field] ? "text-amber-400" : "text-slate-300 hover:text-amber-400"
                          }`}
                        title="Toggle Favorite Search Field"
                      >
                        ★
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="relative flex items-center w-48 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by ${searchField}`}
                className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 pl-3 pr-8 py-1.5 focus:outline-none"
              />
              <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-slate-600 text-xs font-bold px-1"
                    title="Clear Search"
                  >
                    ✕
                  </button>
                )}
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Grid Layout Toggle Icon */}
          <button
            onClick={() => setIsCustomizeColumnDrawerOpen(true)}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
            title="Customize Grid Columns"
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5 items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-sm" />
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-sm" />
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-sm" />
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-sm" />
            </div>
          </button>

          {/* Advanced Filter Funnel Button with Active Count Badge */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs">Advanced Filter</span>
            <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {filterRules.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search & District Filter Bar */}
      <div className="bubble-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, school, district, address..."
              className="w-full bg-slate-950/80 border border-white/20 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-sky-400" /> District:
            </span>
            <div className="relative w-full md:w-56">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-xl cursor-pointer shadow-md appearance-none pr-8 transition-all hover:border-white/30"
              >
                <option value="ALL" className="bg-slate-900 text-white font-bold">
                  ALL DISTRICTS ({districts.length - 1})
                </option>
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 text-xs font-bold">
                ▼
              </div>
            </div>
            {selectedDistrict !== "ALL" && (
              <button
                onClick={() => setSelectedDistrict("ALL")}
                className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-500/30 shrink-0 flex items-center gap-1 transition-all shadow-sm active:scale-95"
                title="Reset District Filter"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>


      </div>

      {/* MAIN CONTENT VIEW: LEAD MANAGER TABLE (Image 2) OR CARDS GRID (Image 1) */}
      {directoryViewMode === "TABLE" ? (
        /* MERITTO LEAD MANAGER DATA TABLE (Exact Image 2 Implementation) */
        <div className="bg-[#ffffff] text-slate-800 rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                {/* Row 1: Header Titles with Sort & Interactive Filter Icon Popovers */}
                <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === sortedAndFilteredContacts.length && sortedAndFilteredContacts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(sortedAndFilteredContacts.map((c) => c.id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  {selectedColumns.map((col) => {
                    const isSortedThisCol = sortColumn === col;
                    return (
                      <th key={col} className="p-3 font-semibold text-slate-600 whitespace-nowrap">
                        <span
                          onClick={() => {
                            if (sortColumn === col) {
                              if (sortDirection === "asc") setSortDirection("desc");
                              else {
                                setSortColumn(null);
                                setSortDirection("asc");
                              }
                            } else {
                              setSortColumn(col);
                              setSortDirection("asc");
                            }
                          }}
                          className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors select-none"
                          title={`Click to sort by ${col}`}
                        >
                          <span>{col}</span>
                          <span className={`text-[10px] ${isSortedThisCol ? "text-blue-600 font-extrabold" : "text-slate-400"}`}>
                            {isSortedThisCol ? (sortDirection === "asc" ? "▲" : "▼") : "↑↓"}
                          </span>
                        </span>
                      </th>
                    );
                  })}
                </tr>

                {/* Row 2: Sub-Header Filter Bar Row (Direct Inline Filter Options under Column Headers) */}
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-normal normal-case">
                  <td className="p-2 text-center text-[10px] font-bold text-slate-400">
                    <Filter className="w-3.5 h-3.5 mx-auto text-blue-500" />
                  </td>
                  {selectedColumns.map((col) => {
                    const filterVal = columnFilters[col] || "";
                    if (col === "City") {
                      return (
                        <td key={`filter_${col}`} className="p-1.5">
                          <select
                            value={filterVal || "ALL"}
                            onChange={(e) =>
                              setColumnFilters({ ...columnFilters, [col]: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">All Cities</option>
                            {TAMIL_NADU_DISTRICTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }
                    if (col === "Lead Stage") {
                      return (
                        <td key={`filter_${col}`} className="p-1.5">
                          <select
                            value={filterVal || "ALL"}
                            onChange={(e) =>
                              setColumnFilters({ ...columnFilters, [col]: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">All Stages</option>
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="IN_REVIEW">IN_REVIEW</option>
                            <option value="ADMITTED">ADMITTED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                      );
                    }
                    if (col === "Campus") {
                      return (
                        <td key={`filter_${col}`} className="p-1.5">
                          <select
                            value={filterVal || "ALL"}
                            onChange={(e) =>
                              setColumnFilters({ ...columnFilters, [col]: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">All Campuses</option>
                            <option value="KARUR">KARUR</option>
                            <option value="COIMBATORE">COIMBATORE</option>
                          </select>
                        </td>
                      );
                    }
                    if (col === "State") {
                      return (
                        <td key={`filter_${col}`} className="p-1.5">
                          <select
                            value={filterVal || "ALL"}
                            onChange={(e) =>
                              setColumnFilters({ ...columnFilters, [col]: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">All States</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                          </select>
                        </td>
                      );
                    }
                    if (col === "Community") {
                      return (
                        <td key={`filter_${col}`} className="p-1.5">
                          <select
                            value={filterVal || "ALL"}
                            onChange={(e) =>
                              setColumnFilters({ ...columnFilters, [col]: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">All</option>
                            <option value="OC">OC</option>
                            <option value="BC">BC</option>
                            <option value="MBC">MBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                          </select>
                        </td>
                      );
                    }
                    if (col === "Gender") {
                      return (
                        <td key={`filter_${col}`} className="p-1.5">
                          <select
                            value={filterVal || "ALL"}
                            onChange={(e) =>
                              setColumnFilters({ ...columnFilters, [col]: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">All</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </td>
                      );
                    }
                    return (
                      <td key={`filter_${col}`} className="p-1.5">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={filterVal}
                            onChange={(e) =>
                              setColumnFilters({ ...columnFilters, [col]: e.target.value })
                            }
                            placeholder="Filter..."
                            className="w-full bg-white border border-slate-300 rounded-md pl-2 pr-5 py-1 text-[11px] text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                          {filterVal && (
                            <button
                              onClick={() => {
                                const updated = { ...columnFilters };
                                delete updated[col];
                                setColumnFilters(updated);
                              }}
                              className="absolute right-1 text-slate-400 hover:text-slate-600 text-[10px] font-bold px-1"
                              title="Clear Filter"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => handleCandidateClick(contact)}
                    className="hover:bg-blue-50/60 transition-colors group cursor-pointer"
                  >
                    {/* Select Checkbox */}
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, contact.id]);
                          } else {
                            setSelectedRows(selectedRows.filter((id) => id !== contact.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Dynamically Render Data Cells for Each Selected Column */}
                    {selectedColumns.map((col) => (
                      <td
                        key={col}
                        className={`p-3 ${col === "Registered Name" ? "font-bold text-blue-600 hover:underline" : ""
                          }`}
                      >
                        {renderCellContent(contact, col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER CONTROLS BAR WITH FULL PAGINATION */}
          <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-700 font-sans shadow-inner">
            {/* Left: Classic View & Record Range Indicator */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setDirectoryViewMode("GRID")}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Classic View</span>
              </button>
              <span className="font-extrabold text-slate-800 bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-300">
                Showing {sortedAndFilteredContacts.length > 0 ? dirStartIndex + 1 : 0} - {dirEndIndex} of {sortedAndFilteredContacts.length} Leads
              </span>
            </div>

            {/* Center: Full Page Navigation Pills */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 cursor-pointer shadow-sm"
                title="First Page"
              >
                ⏮ First
              </button>

              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 cursor-pointer shadow-sm"
              >
                ◀ Prev
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {(() => {
                  const maxVisible = 5;
                  let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
                  let end = start + maxVisible - 1;
                  if (end > totalPages) {
                    end = totalPages;
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  const pages = [];
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  return pages.map((pNum) => {
                    const isActive = pNum === safeCurrentPage;
                    return (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/40 scale-105"
                            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {pNum}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 cursor-pointer shadow-sm"
              >
                Next ▶
              </button>

              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 cursor-pointer shadow-sm"
                title="Last Page"
              >
                Last ⏭
              </button>
            </div>

            {/* Right: Show Rows Selector */}
            <div className="flex items-center gap-2 font-extrabold text-slate-800">
              <span>Show Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-black focus:outline-none cursor-pointer shadow-sm"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* CARDS VIEW (Image 1 Layout) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bubble-card p-5 border border-white/20 hover:border-sky-400/60 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-500/20 cursor-pointer"
              >
                <div>
                  {/* Header: Name & Campus Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-500 text-white font-black flex items-center justify-center shadow-md text-sm border border-white/20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#0f172a] dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                          {contact.name}
                        </h3>
                        <p className="text-[11px] text-sky-300 font-semibold">{contact.courseInterest}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {/* Stage Status Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${contact.status === "NEW"
                        ? "bg-sky-500/20 text-sky-300 border-sky-400/50 animate-pulse"
                        : contact.status === "CONTACTED"
                          ? "bg-teal-500/20 text-teal-300 border-teal-400/50"
                          : contact.status === "IN_REVIEW"
                            ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
                            : contact.status === "ADMITTED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                              : "bg-rose-500/20 text-rose-300 border-rose-400/50"
                        }`}>
                        {contact.status === "NEW" && "🆕 New Inquiry"}
                        {contact.status === "CONTACTED" && "📞 Contacted"}
                        {contact.status === "IN_REVIEW" && "📊 Cutoff Review"}
                        {contact.status === "ADMITTED" && "🎓 Admitted"}
                        {contact.status === "REJECTED" && "❌ Rejected"}
                      </span>

                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-950 border border-white/20 text-sky-300">
                        {contact.campus || "KARUR"}
                      </span>
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-2xl border border-white/10 mb-4">
                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono font-bold text-white">
                        {showPhone ? contact.phone : "+91 ••••• •••••"}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">
                        {showEmail ? contact.email : "•••••@•••••.•••"}
                      </span>
                    </div>

                    {/* School */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-medium text-amber-200 truncate">{contact.school || "Govt HSS"}</span>
                    </div>

                    {/* District */}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="font-bold text-pink-300">{contact.district || "Karur"} District</span>
                    </div>

                    {/* TNEA Counselling Details Box */}
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-sky-400" /> TNEA Counselling:
                        </span>
                        {contact.appliedCounselling !== false ? (
                          <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                            ✅ Applied ({contact.counsellingAppNo || "TNEA2026-61201"})
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                            ⏳ Direct Management Intake
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10">
                        <span className="text-slate-300">
                          Cutoff: <strong className="text-sky-300 font-mono font-bold">{contact.tneaCutoff || 188.5} / 200</strong>
                        </span>
                        <span className="text-indigo-300 text-[10px]">
                          {contact.counsellingCategory || "TNEA General"}
                        </span>
                      </div>
                    </div>

                    {/* Admin Teacher Assignment Dropdown */}
                    {currentUserRole === "ADMIN" && (
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                          🧑‍🏫 Assign Faculty:
                        </span>
                        <select
                          value={contact.assignedTo || (contact.campus === "COIMBATORE" ? "teachercovai@123" : "teacherkarur@123")}
                          onChange={(e) => handleAssignTeacher(contact.id, e.target.value)}
                          className="bg-slate-900 border border-white/20 text-sky-300 font-bold px-2 py-0.5 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer"
                        >
                          <option value="teacherkarur@123">Dr. K. Arulmurugan (Karur)</option>
                          <option value="teachercovai@123">Dr. S. Meenakshi (Coimbatore)</option>
                          <option value="teacher_general">Prof. P. Rajesh (Mechanical)</option>
                          <option value="teacher_it">Dr. N. Gayathri (IT)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Edit, Call, Email, WhatsApp, Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
                  <div className="flex items-center gap-1.5">

                    <Tooltip text={`In-Portal Call ${contact.name}`} position="bottom">
                      <button
                        onClick={() => handleOpenCommModal("CALL", {
                          name: contact.name,
                          phone: contact.phone,
                          email: contact.email,
                          courseInterest: contact.courseInterest,
                          campus: contact.campus,
                          school: contact.school || undefined,
                          district: contact.district || undefined,
                        })}
                        className="p-2 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-emerald-500/40"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip text={`In-Portal Email ${contact.name}`} position="bottom">
                      <button
                        onClick={() => handleOpenCommModal("EMAIL", {
                          name: contact.name,
                          phone: contact.phone,
                          email: contact.email,
                          courseInterest: contact.courseInterest,
                          campus: contact.campus,
                          school: contact.school || undefined,
                          district: contact.district || undefined,
                        })}
                        className="p-2 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-indigo-500/40"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip text={`In-Portal Message ${contact.name}`} position="bottom">
                      <button
                        onClick={() => handleOpenCommModal("MESSAGE", {
                          name: contact.name,
                          phone: contact.phone,
                          email: contact.email,
                          courseInterest: contact.courseInterest,
                          campus: contact.campus,
                          school: contact.school || undefined,
                          district: contact.district || undefined,
                        })}
                        className="p-2 rounded-full bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-white border border-teal-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-teal-500/40"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Button */}
                    <Tooltip text={`Edit ${contact.name}`} position="bottom">
                      <button
                        onClick={() => setEditingContact(contact)}
                        className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border border-sky-400/40 text-xs font-bold transition-all flex items-center gap-1 shadow-md transform hover:-translate-y-1 hover:scale-110 active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </Tooltip>

                    {/* Delete Button */}
                    <Tooltip text={`Delete ${contact.name}`} position="bottom">
                      <button
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                        className="p-1.5 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 bubble-card">
              No contacts match the search or district filter.
            </div>
          )}
        </div>
      )}

      {/* ADD NEW CONTACT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in">
          <div className="bubble-card w-full max-w-lg p-6 border border-white/30 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-sky-400" />
              Add New Candidate Contact
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter candidate phone number, school name, district, and address.
            </p>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="e.g. S. Vignesh"
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="candidate@gmail.com"
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Higher Secondary School</label>
                  <input
                    type="text"
                    value={newContact.school}
                    onChange={(e) => setNewContact({ ...newContact, school: e.target.value })}
                    placeholder="Govt HSS Karur / St. Joseph Coimbatore"
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">District</label>
                  <select
                    value={newContact.district}
                    onChange={(e) => setNewContact({ ...newContact, district: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {districts.filter(d => d !== "ALL").map((d) => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  placeholder="Street Address, City/Town, Pincode"
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Preferred VSB Campus</label>
                  <select
                    value={newContact.campus}
                    onChange={(e) => setNewContact({ ...newContact, campus: e.target.value as CampusLocation })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="KARUR" className="bg-slate-900">KARUR CAMPUS</option>
                    <option value="COIMBATORE" className="bg-slate-900">COIMBATORE CAMPUS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course Interest</label>
                  <select
                    value={newContact.courseInterest}
                    onChange={(e) => setNewContact({ ...newContact, courseInterest: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {VSB_DEPARTMENTS_COURSES.map((course) => (
                      <option key={course} value={course} className="bg-slate-900">
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-900 text-slate-300 text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glossy-btn px-5 py-2 text-xs font-bold"
                >
                  Save New Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CONTACT MODAL */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in">
          <div className="bubble-card w-full max-w-lg p-6 border border-white/30 shadow-2xl relative">
            <button
              onClick={() => setEditingContact(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
              <Edit3 className="w-5 h-5 text-sky-400" />
              Edit Contact Record: {editingContact.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update phone number, school affiliation, district, and address.
            </p>

            <form onSubmit={handleUpdateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingContact.email}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">School Name</label>
                  <input
                    type="text"
                    value={editingContact.school || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, school: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">District</label>
                  <select
                    value={editingContact.district || "Karur"}
                    onChange={(e) => setEditingContact({ ...editingContact, district: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {districts.filter(d => d !== "ALL").map((d) => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editingContact.address || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, address: e.target.value })}
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Campus</label>
                  <select
                    value={editingContact.campus}
                    onChange={(e) => setEditingContact({ ...editingContact, campus: e.target.value as CampusLocation })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="KARUR" className="bg-slate-900">KARUR CAMPUS</option>
                    <option value="COIMBATORE" className="bg-slate-900">COIMBATORE CAMPUS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course Interest</label>
                  <select
                    value={editingContact.courseInterest}
                    onChange={(e) => setEditingContact({ ...editingContact, courseInterest: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {VSB_DEPARTMENTS_COURSES.map((course) => (
                      <option key={course} value={course} className="bg-slate-900">
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 rounded-full bg-slate-900 text-slate-300 text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glossy-btn px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-PORTAL DIRECT COMMUNICATION MODALS (Call, Message, Email) */}
      <InPortalCommunicationModals
        activeModal={activeCommModal}
        contact={activeCommContact}
        onClose={() => setActiveCommModal(null)}
        onLogSuccess={handleCommLogSuccess}
        onSaveCallRecording={handleSaveCallRecording}
      />

      {/* APPLICANT PROFILE / LEAD DETAILS MODAL (Image 2) */}
      {selectedCandidateForModal && (
        <ApplicantDetailModal
          applicant={selectedCandidateForModal}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedCandidateForModal(null)}
          onActionTrigger={onActionTrigger}
          onSave={(updated) => {
            setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedCandidateForModal(null);
            onTriggerToast?.(`Updated profile for candidate ${updated.name}`);
          }}
        />
      )}
      {/* SIDE DRAWER 1: FILTER LEADS BY (Image 1 Reference) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white text-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Filter leads by</h3>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              {/* Include Activity Filters Toggle */}
              <div className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="text-slate-400">ⓘ</span> Include Activity filters
                </span>
                <button
                  type="button"
                  onClick={() => setIncludeActivityFilters(!includeActivityFilters)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${includeActivityFilters ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Lead Filters Container */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                {/* Mode Selector & Filter Count Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFilterLogicMode("ALL")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLogicMode === "ALL" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterLogicMode("ANY")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLogicMode === "ANY" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        Any
                      </button>
                    </div>
                    <span className="text-slate-700 font-bold">
                      {filterLogicMode === "ALL" ? "Meet All Criteria" : "Meet Any Criteria"}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500">
                    Lead Filter(s)
                  </span>
                </div>

                {/* Filter Rule Rows */}
                <div className="space-y-3">
                  {filterRules.map((rule) => (
                    <div key={rule.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs shrink-0">▶</span>

                        {/* Field Select */}
                        <select
                          value={rule.field}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFilterRules(
                              filterRules.map((r) => (r.id === rule.id ? { ...r, field: val } : r))
                            );
                          }}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="State">State</option>
                          <option value="City">City</option>
                          <option value="Registered Name">Registered Name</option>
                          <option value="Registered Email">Registered Email</option>
                          <option value="Registered Mobile">Registered Mobile</option>
                          <option value="Lead Stage">Lead Stage</option>
                          <option value="Campus">Campus</option>
                          <option value="Course">Course</option>
                          <option value="Gender">Gender</option>
                          <option value="TNEA Cutoff">TNEA Cutoff</option>
                          <option value="Community">Community</option>
                        </select>

                        {/* Operator Select */}
                        <select
                          value={rule.operator}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFilterRules(
                              filterRules.map((r) => (r.id === rule.id ? { ...r, operator: val } : r))
                            );
                          }}
                          className="w-28 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Equals">Equals</option>
                          <option value="Contains">Contains</option>
                          <option value="Not Equals">Not Equals</option>
                          <option value="Greater Than">Greater Than</option>
                          <option value="Less Than">Less Than</option>
                        </select>

                        {/* Value Select / Input */}
                        {rule.field === "State" ? (
                          <select
                            value={rule.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFilterRules(
                                filterRules.map((r) => (r.id === rule.id ? { ...r, value: val } : r))
                              );
                            }}
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                          </select>
                        ) : rule.field === "City" ? (
                          <select
                            value={rule.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFilterRules(
                                filterRules.map((r) => (r.id === rule.id ? { ...r, value: val } : r))
                              );
                            }}
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {TAMIL_NADU_DISTRICTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFilterRules(
                                filterRules.map((r) => (r.id === rule.id ? { ...r, value: val } : r))
                              );
                            }}
                            placeholder="Enter value..."
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}

                        {/* Action Buttons (+ / -) */}
                        {filterRules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFilterRules(filterRules.filter((r) => r.id !== rule.id))}
                            className="p-1.5 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                            title="Remove Filter"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setFilterRules([
                              ...filterRules,
                              { id: String(Date.now()), field: "City", operator: "Equals", value: "Karur" },
                            ])
                          }
                          className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="Add Sub-Rule"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {rule.field === "City" && (
                        <p className="text-[10px] text-blue-600 font-medium pl-6">
                          This field is dependent on State
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add More Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFilterRules([
                        ...filterRules,
                        { id: String(Date.now()), field: "Lead Stage", operator: "Equals", value: "New Inquiry" },
                      ])
                    }
                    className="px-4 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add More
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
              <button
                type="button"
                onClick={() =>
                  setFilterRules([
                    { id: "1", field: "State", operator: "Equals", value: "Tamil Nadu" },
                    { id: "2", field: "City", operator: "Equals", value: "Karur" },
                  ])
                }
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
              >
                ↺ Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFilterDrawerOpen(false);
                  onTriggerToast?.(`Applied ${filterRules.length} custom lead criteria filters!`);
                }}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDE DRAWER 2: CUSTOMIZE COLUMN (Image 2 Reference) */}
      {isCustomizeColumnDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white text-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Customize Column</h3>
              <button
                onClick={() => setIsCustomizeColumnDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body: 2 Columns */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {/* Search Column Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={columnSearchQuery}
                  onChange={(e) => setColumnSearchQuery(e.target.value)}
                  placeholder="Search Column Here"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 2-Column Select & Reorder Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                {/* Left Side: Available Lead Details Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2">
                    Lead Details
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {allAvailableColumns
                      .filter((col) => col.toLowerCase().includes(columnSearchQuery.toLowerCase()))
                      .map((col) => {
                        const isChecked = selectedColumns.includes(col);
                        return (
                          <label
                            key={col}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                          >
                            <span>{col}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedColumns([...selectedColumns, col]);
                                } else {
                                  setSelectedColumns(selectedColumns.filter((c) => c !== col));
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Right Side: Selected Columns Chips (Drag / Remove) */}
                <div className="space-y-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-800">
                      Selected Columns
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">(Drag to reorder)</span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {selectedColumns.map((col) => (
                      <div
                        key={col}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 cursor-grab">⋮⋮</span>
                          <span>{col}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedColumns(selectedColumns.filter((c) => c !== col))}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Remove Column"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
              <button
                type="button"
                onClick={() =>
                  setSelectedColumns([
                    "Registered Name",
                    "Registered Email",
                    "Registered Mobile",
                    "State",
                    "City",
                    "User Registration Date",
                    "Lead Stage",
                  ])
                }
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
              >
                ↺ Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCustomizeColumnDrawerOpen(false);
                  onTriggerToast?.(`Updated table column layout with ${selectedColumns.length} fields!`);
                }}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}


      {/* INTERACTIVE CALENDAR (MONTH NAME & YEAR PICKER) MODAL */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl text-slate-100 space-y-4 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Academic Calendar & Date Filter
                  </h3>
                  <p className="text-xs text-sky-300 font-medium">Select Month Name & Year (2026, 2027, etc.)</p>
                </div>
              </div>
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Intake Year Selection Buttons */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Intake Years
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setCalSelectedYear(2026);
                    setRegDateFilter("2026");
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${calSelectedYear === 2026
                      ? "bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/40 font-black"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                >
                  📅 Year 2026
                </button>
                <button
                  onClick={() => {
                    setCalSelectedYear(2027);
                    setRegDateFilter("2027");
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${calSelectedYear === 2027
                      ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40 font-black"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                >
                  🚀 Year 2027 (Next)
                </button>
                <button
                  onClick={() => {
                    setCalSelectedYear(2025);
                    setRegDateFilter("2025");
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${calSelectedYear === 2025
                      ? "bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/40 font-black"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                >
                  ⏪ Year 2025
                </button>
              </div>
            </div>

            {/* Month Name & Year Selector Controls */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-2xl border border-white/10">
              {/* Month Name Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Month Name
                </label>
                <select
                  value={calSelectedMonth}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setCalSelectedMonth(m);
                    setRegDateFilter(`${MONTH_NAMES[m]} ${calSelectedYear}`);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                >
                  {MONTH_NAMES.map((month, idx) => (
                    <option key={month} value={idx}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Select Year
                </label>
                <select
                  value={calSelectedYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setCalSelectedYear(y);
                    setRegDateFilter(`${MONTH_NAMES[calSelectedMonth]} ${y}`);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>
                      {y} {y === 2026 ? "(Current Year)" : y === 2027 ? "(Next Year)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month Header Banner with Previous / Next controls */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-sky-900/60 to-indigo-900/60 rounded-xl border border-sky-500/30">
              <button
                onClick={() => {
                  if (calSelectedMonth === 0) {
                    setCalSelectedMonth(11);
                    setCalSelectedYear(calSelectedYear - 1);
                  } else {
                    setCalSelectedMonth(calSelectedMonth - 1);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                ◀ Prev
              </button>
              <span className="font-extrabold text-sm text-sky-200 tracking-wide">
                {MONTH_NAMES[calSelectedMonth]} {calSelectedYear}
              </span>
              <button
                onClick={() => {
                  if (calSelectedMonth === 11) {
                    setCalSelectedMonth(0);
                    setCalSelectedYear(calSelectedYear + 1);
                  } else {
                    setCalSelectedMonth(calSelectedMonth + 1);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Next ▶
              </button>
            </div>

            {/* Visual Calendar Grid Days (Sun-Sat) */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/10">
              <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 mb-2 uppercase">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: getFirstDayOfMonth(calSelectedMonth, calSelectedYear) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}
                {Array.from({ length: getDaysInMonth(calSelectedMonth, calSelectedYear) }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelectedDay = calSelectedDay === dayNum;
                  return (
                    <button
                      key={dayNum}
                      onClick={() => {
                        setCalSelectedDay(dayNum);
                        const selectedFilterText = `${MONTH_NAMES[calSelectedMonth]} ${calSelectedYear}`;
                        setRegDateFilter(selectedFilterText);
                        if (onTriggerToast) {
                          onTriggerToast(`📅 Filtered by Date: ${MONTH_NAMES[calSelectedMonth]} ${dayNum}, ${calSelectedYear}`);
                        }
                      }}
                      className={`h-8 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${isSelectedDay
                          ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/40 scale-105"
                          : "hover:bg-slate-800 text-slate-300 hover:text-white"
                        }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selection Summary Badge */}
            <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-500/30 flex items-center justify-between text-xs font-bold">
              <span className="text-sky-300 flex items-center gap-1.5">
                <span>✨ Active Filter:</span>
                <span className="text-white font-extrabold">
                  {regDateFilter === "Select Here" ? "None (All Time)" : regDateFilter}
                </span>
              </span>
              <button
                onClick={() => {
                  setRegDateFilter("Select Here");
                  setCalSelectedDay(null);
                }}
                className="text-[10px] text-rose-400 hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsCalendarModalOpen(false);
                  if (onTriggerToast) {
                    onTriggerToast(`✅ Applied Calendar Filter: ${regDateFilter}`);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/30 cursor-pointer"
              >
                Apply Calendar Date Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPLIT CONTACTS TO TEACHER MODAL (Admin Feature) */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white font-sans animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 font-extrabold text-xl shadow-inner">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Split Contacts to Faculty Member</h3>
                  <p className="text-xs text-slate-400">Allocate lead batches (e.g. 100 contacts) out of 1,000 total leads</p>
                </div>
              </div>
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Database Overview */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-400 font-bold">Total Contacts in Database:</span>
                <span className="text-indigo-400 font-black text-sm">1,000 Leads</span>
              </div>

              {/* Select Faculty Member */}
              <div>
                <label className="block text-slate-300 font-extrabold mb-1">
                  Select Target Faculty / Teacher:
                </label>
                <select
                  value={splitTargetTeacher}
                  onChange={(e) => setSplitTargetTeacher(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white font-black focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {FACULTY_MEMBERS.map((f) => (
                    <option key={f.id} value={f.id} className="text-black bg-white dark:bg-slate-900 dark:text-white font-black">
                      {f.name} ({f.department} - {f.campus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Range Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Start Contact No (#):</label>
                  <input
                    type="number"
                    min={1}
                    max={contacts.length}
                    value={splitStartNumber}
                    onChange={(e) => setSplitStartNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Split Batch Quantity:</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={splitQuantity}
                    onChange={(e) => setSplitQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Batch Presets */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Quick Batch Presets:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitQuantity(50)}
                    className="px-3 py-1 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                  >
                    50 Leads
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitQuantity(100)}
                    className="px-3 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 font-bold cursor-pointer"
                  >
                    100 Leads
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitQuantity(200)}
                    className="px-3 py-1 rounded-lg bg-purple-600/30 border border-purple-400/40 text-purple-300 font-bold cursor-pointer"
                  >
                    200 Leads
                  </button>
                </div>
              </div>

              {/* Calculated Range Summary Box */}
              <div className="bg-indigo-950/70 p-4 rounded-2xl border border-indigo-400/30 text-xs space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between font-bold text-indigo-200">
                  <span>Computed Allocation Range:</span>
                  <span className="text-emerald-400 font-black text-sm">
                    Contacts #{splitStartNumber} to #{Math.min(contacts.length, splitStartNumber + splitQuantity - 1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The selected teacher will get exclusive permission to view and edit these {Math.min(contacts.length, splitStartNumber + splitQuantity - 1) - splitStartNumber + 1} contacts. Remaining contacts stay hidden from this teacher on the portal.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformLeadSplit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 border border-indigo-300/40 cursor-pointer"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DAILY CALL ANALYTICS & AUDIO RECORDING AUDIT MODAL */}
      {isAdminAuditDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-white font-sans overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-inner">
                  📞
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Daily Faculty Call Analytics & Voice Recordings Audit
                  </h3>
                  <p className="text-xs text-emerald-300 font-medium">
                    Inspect teacher call activities, student interest responses, audio playback & transcripts (30-Day Auto Retention)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminAuditDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* Date Filter Toolbar */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Select Audit Date:</span>
                  </label>
                  <input
                    type="date"
                    value={selectedAuditDate}
                    onChange={(e) => setSelectedAuditDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={() => setSelectedAuditDate("2026-08-22")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer border ${selectedAuditDate === "2026-08-22"
                        ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    Today (Aug 22, 2026)
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] bg-rose-500/20 text-rose-300 border border-rose-400/40 px-3 py-1.5 rounded-xl font-bold">
                  <span>⏳ 30-Day Retention Policy:</span>
                  <span>Audio recordings auto-delete after 30 days</span>
                </div>
              </div>

              {/* Daily Overview Stat Cards */}
              {(() => {
                const dateRecs = callRecordings.filter((r) => r.recordingDate === selectedAuditDate);
                const interestedCount = dateRecs.filter((r) => r.studentInterestStatus === "INTERESTED").length;
                const admittedCount = dateRecs.filter((r) => r.studentInterestStatus === "ADMITTED").length;
                const totalCalls = dateRecs.length;
                const efficiencyRate = totalCalls > 0 ? Math.round(((interestedCount + admittedCount) / totalCalls) * 100) : 0;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Calls Recorded</p>
                      <h4 className="text-2xl font-black text-white flex items-center justify-between">
                        <span>{totalCalls} Calls</span>
                        <span className="text-base text-emerald-400">📞</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Recorded on {selectedAuditDate}</p>
                    </div>

                    <div className="bg-slate-950/80 border border-emerald-500/40 p-4 rounded-2xl space-y-1">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Interested Students</p>
                      <h4 className="text-2xl font-black text-emerald-300 flex items-center justify-between">
                        <span>{interestedCount} Students</span>
                        <span className="text-base">🌟</span>
                      </h4>
                      <p className="text-[10px] text-emerald-400 font-semibold">Positive Join Intent</p>
                    </div>

                    <div className="bg-slate-950/80 border border-sky-500/40 p-4 rounded-2xl space-y-1">
                      <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Admitted Students</p>
                      <h4 className="text-2xl font-black text-sky-300 flex items-center justify-between">
                        <span>{admittedCount} Students</span>
                        <span className="text-base">🎓</span>
                      </h4>
                      <p className="text-[10px] text-sky-400 font-semibold">Fees Paid / Confirmed</p>
                    </div>

                    <div className="bg-slate-950/80 border border-purple-500/40 p-4 rounded-2xl space-y-1">
                      <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Outreach Efficiency</p>
                      <h4 className="text-2xl font-black text-purple-300 flex items-center justify-between">
                        <span>{efficiencyRate}%</span>
                        <span className="text-base">⚡</span>
                      </h4>
                      <p className="text-[10px] text-purple-400 font-semibold">Interested Ratio</p>
                    </div>
                  </div>
                );
              })()}

              {/* Faculty-wise Outreach Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>📊 Faculty-wise Daily Outreach Breakdown ({selectedAuditDate})</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400">
                      <tr>
                        <th className="p-3">Faculty Member</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Total Calls Made</th>
                        <th className="p-3">Interested Students</th>
                        <th className="p-3">Admitted Students</th>
                        <th className="p-3">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {FACULTY_MEMBERS.map((fac) => {
                        const facRecs = callRecordings.filter(
                          (r) => r.recordingDate === selectedAuditDate && (r.teacherId === fac.id || r.teacherName === fac.name)
                        );
                        const facInterested = facRecs.filter((r) => r.studentInterestStatus === "INTERESTED").length;
                        const facAdmitted = facRecs.filter((r) => r.studentInterestStatus === "ADMITTED").length;
                        const facTotal = facRecs.length || (fac.name === "Prof. P. Rajesh" ? 2 : fac.name === "Dr. K. Arulmurugan" ? 1 : 1);
                        const rate = Math.round(((facInterested + facAdmitted) / Math.max(1, facTotal)) * 100);

                        return (
                          <tr key={fac.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3 font-extrabold text-black dark:text-white flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                                {fac.name.slice(0, 2)}
                              </span>
                              <span className="text-black dark:text-white font-extrabold">{fac.name}</span>
                            </td>
                            <td className="p-3 text-slate-800 dark:text-slate-300 font-bold">{fac.department}</td>
                            <td className="p-3 font-mono font-bold text-black dark:text-slate-200">{facTotal} Calls</td>
                            <td className="p-3 font-bold text-emerald-400 flex items-center gap-1">
                              <span>🌟</span>
                              <span>{facInterested || (fac.name === "Prof. P. Rajesh" ? 1 : 1)} Interested</span>
                            </td>
                            <td className="p-3 font-bold text-sky-400">
                              🎓 {facAdmitted || (fac.name === "Prof. P. Rajesh" ? 1 : 0)} Admitted
                            </td>
                            <td className="p-3 font-bold text-purple-300 font-mono">{rate}% Efficiency</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recorded Calls List & Audio Player Inspector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>🎙️ Voice Call Audio Recordings & Transcripts ({selectedAuditDate})</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Click to Play Voice Call Audio & Read Transcripts</span>
                </div>

                <div className="space-y-3">
                  {callRecordings.filter((r) => r.recordingDate === selectedAuditDate).length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 font-medium">
                      No call recordings logged on {selectedAuditDate}. Make an In-Portal call to record audio & view transcripts.
                    </div>
                  ) : (
                    callRecordings
                      .filter((r) => r.recordingDate === selectedAuditDate)
                      .map((rec) => {
                        const isPlaying = playingAudioRecId === rec.id;

                        return (
                          <div
                            key={rec.id}
                            className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-emerald-500/50 transition-all shadow-lg"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                                  {rec.leadName.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h5 className="font-extrabold text-white text-sm flex items-center gap-2">
                                    <span>{rec.leadName}</span>
                                    <span className="text-xs text-emerald-400 font-mono font-bold">({rec.leadPhone})</span>
                                  </h5>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    Contacted by: <span className="text-indigo-300 font-bold">{rec.teacherName}</span> • {rec.timestamp}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-black border ${rec.studentInterestStatus === "INTERESTED"
                                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                      : rec.studentInterestStatus === "ADMITTED"
                                        ? "bg-sky-950 text-sky-300 border-sky-800"
                                        : "bg-amber-950 text-amber-300 border-amber-800"
                                    }`}
                                >
                                  {rec.studentInterestStatus === "INTERESTED" && "🌟 Interested to Join"}
                                  {rec.studentInterestStatus === "ADMITTED" && "🎓 Admitted / Fee Paid"}
                                  {rec.studentInterestStatus === "REVIEWING" && "⏳ Reviewing Cutoff"}
                                </span>

                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                                  ⏳ Auto-deletes in 29 days
                                </span>
                              </div>
                            </div>

                            {/* Simulated Audio Call Player Bar */}
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                              <button
                                onClick={() => setPlayingAudioRecId(isPlaying ? null : rec.id)}
                                className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                              >
                                {isPlaying ? "⏸" : "▶"}
                              </button>

                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                                  <span>{isPlaying ? "▶ Playing Voice Recording..." : "Recorded Call Audio"}</span>
                                  <span>{rec.durationText}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ${isPlaying ? "w-2/3 animate-pulse" : "w-1/4"
                                      }`}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Transcript & Teacher Call Notes */}
                            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl space-y-1.5 text-[11px]">
                              <p className="font-extrabold text-slate-300 flex items-center gap-1.5">
                                <span>📝 Teacher Notes:</span>
                                <span className="text-white font-medium">{rec.teacherNotes}</span>
                              </p>
                              <div className="pt-2 border-t border-slate-800 space-y-1">
                                <p className="font-extrabold text-indigo-400 uppercase tracking-wider text-[10px]">
                                  Verbatim Conversation Call Transcript:
                                </p>
                                <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                                  {rec.callTranscript}
                                </pre>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Admin Privilege: Direct calling enabled for all 1,000 student leads.
              </span>
              <button
                onClick={() => setIsAdminAuditDrawerOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs cursor-pointer transition-all"
              >
                Close Audit Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
