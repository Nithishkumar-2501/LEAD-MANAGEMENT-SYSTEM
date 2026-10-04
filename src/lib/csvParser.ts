import { Lead, Application, CampusLocation, LeadStatus, Teacher } from "@/types/crm";
import { formatPhoneWith91 } from "@/lib/phoneValidation";

export function parseCSVToLeads(
  csvText: string,
  selectedCampus: CampusLocation = "KARUR",
  loggedInUsername: string = "adminkarur@123",
  fileName?: string
): (Lead & { application: Application })[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const imported: (Lead & { application: Application })[] = [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
  const firstLineLower = firstLine.toLowerCase();

  const hasHeader =
    firstLineLower.includes("name") ||
    firstLineLower.includes("phone") ||
    firstLineLower.includes("mobile") ||
    firstLineLower.includes("email") ||
    firstLineLower.includes("course") ||
    firstLineLower.includes("school");

  const headerCols = hasHeader
    ? firstLine.split(delimiter).map((c) => c.trim().toLowerCase().replace(/^["']|["']$/g, ""))
    : [];
  const startIndex = hasHeader ? 1 : 0;

  const findColIndex = (keywords: string[]) => {
    return headerCols.findIndex((col) => keywords.some((k) => col.includes(k)));
  };

  const nameIdx = findColIndex(["name", "student", "candidate"]);
  const phoneIdx = findColIndex(["phone", "mobile", "contact", "cell"]);
  const emailIdx = findColIndex(["email", "mail"]);
  const schoolIdx = findColIndex(["school", "institution", "college"]);
  const districtIdx = findColIndex(["district", "city", "location", "town"]);
  const addressIdx = findColIndex(["address", "place"]);
  const courseIdx = findColIndex(["course", "dept", "department", "branch", "interest", "program"]);
  const marks10Idx = findColIndex(["10th", "sslc", "10_mark"]);
  const marks12Idx = findColIndex(["12th", "hsc", "12_mark"]);
  const cutoffIdx = findColIndex(["cutoff", "tnea"]);
  const fatherIdx = findColIndex(["father", "parent"]);
  const motherIdx = findColIndex(["mother"]);
  const genderIdx = findColIndex(["gender", "sex"]);
  const communityIdx = findColIndex(["community", "caste", "category"]);
  const campusIdx = findColIndex(["campus"]);
  const statusIdx = findColIndex(["status", "stage"]);

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 1 || parts.every((p) => p === "")) continue;

    const getVal = (idx: number, positionalIdx: number, fallback: string = "") => {
      if (hasHeader && idx >= 0 && idx < parts.length && parts[idx]) return parts[idx];
      if (!hasHeader && positionalIdx >= 0 && positionalIdx < parts.length && parts[positionalIdx])
        return parts[positionalIdx];
      return fallback;
    };

    const rawName = getVal(nameIdx, 0, "");
    const rawPhone = getVal(phoneIdx, 1, "");
    const email = getVal(emailIdx, 2, "");
    const school = getVal(schoolIdx, 3, "");
    const district = getVal(districtIdx, 4, "");
    const address = getVal(addressIdx, 5, "");
    const courseInterest = getVal(courseIdx, 6, "");
    const marks10Str = getVal(marks10Idx, 7, "");
    const marks12Str = getVal(marks12Idx, 8, "");
    const cutoffStr = getVal(cutoffIdx, 9, "");
    const fatherName = getVal(fatherIdx, 10, "");
    const motherName = getVal(motherIdx, 11, "");
    const gender = getVal(genderIdx, 12, "");
    const community = getVal(communityIdx, 13, "");
    const campusVal = getVal(campusIdx, 14, selectedCampus === "ALL" ? "KARUR" : selectedCampus);
    const statusVal = getVal(statusIdx, 15, "NEW");

    // Standardize phone number with +91- compulsory format
    const formattedPhone = formatPhoneWith91(rawPhone) || (rawPhone ? `+91-${rawPhone}` : `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`);
    const finalName = rawName.trim() || `Candidate Lead #${imported.length + 1}`;

    const leadId = `lead_csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    const appId = `app_csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

    const parsed10 = marks10Str ? (parseFloat(marks10Str) || 0) : 0;
    const parsed12 = marks12Str ? (parseFloat(marks12Str) || 0) : 0;
    const parsedCutoff = cutoffStr ? (parseFloat(cutoffStr) || undefined) : undefined;

    const importedLead: Lead & { application: Application } = {
      id: leadId,
      name: finalName,
      phone: formattedPhone,
      email: email || `${finalName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${leadId.slice(-4)}@admission.vsb.ac.in`,
      source: fileName ? `CSV: ${fileName}` : "CSV Import",
      courseInterest: courseInterest || "Computer Science and Engineering",
      campus: (campusVal.toUpperCase() === "COIMBATORE"
        ? "COIMBATORE"
        : selectedCampus === "ALL"
        ? "KARUR"
        : selectedCampus) as CampusLocation,
      school: school || "Higher Secondary School",
      district: district || (selectedCampus === "COIMBATORE" ? "Coimbatore" : "Karur"),
      state: "Tamil Nadu",
      address: address || "",
      status: (statusVal.toUpperCase() as LeadStatus) || "NEW",
      fatherName,
      motherName,
      gender: gender || "Male",
      community: community || "BC",
      tneaCutoff: parsedCutoff || (marks12Str ? Math.min(200, Math.round((parsed12 / 600) * 200 * 10) / 10) : 175.5),
      leadScore: parsedCutoff ? Math.min(100, Math.round(parsedCutoff / 2)) : 80,
      assignedTo: loggedInUsername || "admin@vsb.ac.in",
      appliedCounselling: false,
      counsellingAppNo: "",
      counsellingCategory: "",
      createdAt: new Date().toISOString(),
      application: {
        id: appId,
        leadId,
        stage: "INQUIRY",
        marks10th: parsed10 || 420,
        marks12th: parsed12 || 510,
        paymentStatus: "PENDING",
        payments: [],
      },
    };

    imported.push(importedLead);
  }

  return imported;
}

/**
 * Downloads an official V.S.B. Student Leads CSV import template with standard headers
 */
export function downloadSampleLeadsCSV(campus: string = "KARUR"): void {
  if (typeof window === "undefined") return;

  const headers = [
    "Student Name",
    "Mobile Number",
    "Email Address",
    "Course Interest",
    "Campus",
    "School Name",
    "District",
    "10th Mark",
    "12th Mark",
    "TNEA Cutoff",
    "Father Name",
    "Gender",
    "Community",
    "Stage",
  ];

  const targetCampus = campus.toUpperCase() === "COIMBATORE" ? "COIMBATORE" : "KARUR";

  const sampleRows = [
    [
      "Aravind Kumar",
      "+91-9876543210",
      "aravind.k@gmail.com",
      "Computer Science and Engineering",
      targetCampus,
      "Govt Model Higher Secondary School",
      "Karur",
      "460",
      "540",
      "185.5",
      "Kumaravel M",
      "Male",
      "BC",
      "INQUIRY",
    ],
    [
      "Priya Dharshini",
      "+91-9876543211",
      "priya.d@gmail.com",
      "Artificial Intelligence and Data Science",
      targetCampus,
      "Bharathi Vidya Bhavan Matriculation",
      "Coimbatore",
      "480",
      "570",
      "192.0",
      "Dharshan S",
      "Female",
      "OC",
      "INTERESTED",
    ],
    [
      "Siddharth M",
      "+91-9876543212",
      "siddharth.m@gmail.com",
      "Information Technology",
      targetCampus,
      "St Joseph Higher Secondary School",
      "Tirupur",
      "450",
      "520",
      "178.0",
      "Murugan P",
      "Male",
      "MBC",
      "INQUIRY",
    ],
    [
      "Kavitha S",
      "+91-9876543213",
      "kavitha.s@gmail.com",
      "Electronics and Communication Engineering",
      targetCampus,
      "Kendriya Vidyalaya Central School",
      "Erode",
      "465",
      "550",
      "186.5",
      "Selvam R",
      "Female",
      "BC",
      "INTERESTED",
    ],
    [
      "Manoj Prabhakar",
      "+91-9876543214",
      "manoj.p@gmail.com",
      "Mechanical Engineering",
      targetCampus,
      "Vivekananda Higher Secondary School",
      "Dindigul",
      "430",
      "490",
      "165.0",
      "Prabhakar K",
      "Male",
      "SC",
      "INQUIRY",
    ],
  ];

  const csvContent = [
    headers.join(","),
    ...sampleRows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `vsb_student_leads_template_${targetCampus.toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSVToTeachers(
  csvText: string,
  defaultCampus: CampusLocation = "KARUR"
): Teacher[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const imported: Teacher[] = [];
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
  const firstLineLower = firstLine.toLowerCase();

  const hasHeader =
    firstLineLower.includes("name") ||
    firstLineLower.includes("email") ||
    firstLineLower.includes("phone") ||
    firstLineLower.includes("department") ||
    firstLineLower.includes("course") ||
    firstLineLower.includes("experience");

  const headerCols = hasHeader
    ? firstLine.split(delimiter).map((c) => c.trim().toLowerCase().replace(/^["']|["']$/g, ""))
    : [];
  const startIndex = hasHeader ? 1 : 0;

  const findColIndex = (keywords: string[]) => {
    return headerCols.findIndex((col) => keywords.some((k) => col.includes(k)));
  };

  const nameIdx = findColIndex(["name", "teacher", "faculty", "professor"]);
  const emailIdx = findColIndex(["email", "mail"]);
  const phoneIdx = findColIndex(["phone", "mobile", "contact"]);
  const deptIdx = findColIndex(["department", "dept", "branch"]);
  const campusIdx = findColIndex(["campus", "location"]);
  const coursesIdx = findColIndex(["course", "courses", "subject", "program"]);
  const expIdx = findColIndex(["experience", "exp", "years"]);
  const quotaIdx = findColIndex(["quota", "contacts", "lead"]);

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 1) continue;

    const getVal = (idx: number, positionalIdx: number, fallback: string = "") => {
      if (hasHeader && idx >= 0 && idx < parts.length && parts[idx]) return parts[idx];
      if (!hasHeader && positionalIdx >= 0 && positionalIdx < parts.length && parts[positionalIdx])
        return parts[positionalIdx];
      return fallback;
    };

    const name = getVal(nameIdx, 0, `Faculty ${i}`);
    if (!name || name.toLowerCase().includes("sample")) continue;

    const email = getVal(emailIdx, 1, `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@vsbec.in`);
    const phone = getVal(phoneIdx, 2, "+91 98765 00000");
    const department = getVal(deptIdx, 3, "Computer Science & Engineering");
    const campusStr = getVal(campusIdx, 4, defaultCampus);
    const campus: CampusLocation = campusStr.toUpperCase().includes("COIMBATORE") ? "COIMBATORE" : defaultCampus;
    const coursesStr = getVal(coursesIdx, 5, "B.E. Computer Science");
    const coursesAssigned = coursesStr.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    const expStr = getVal(expIdx, 6, "5");
    const experienceYears = parseInt(expStr, 10) || 5;
    const quotaStr = getVal(quotaIdx, 7, "1000");
    const assignedQuota = parseInt(quotaStr, 10) || 1000;

    imported.push({
      id: `tch_csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      email,
      phone,
      department,
      campus,
      coursesAssigned: coursesAssigned.length > 0 ? coursesAssigned : ["B.E. Computer Science"],
      experienceYears,
      status: "ACTIVE",
      avatar: name.slice(0, 2).toUpperCase(),
      assignedQuota,
    });
  }

  return imported;
}

