import { Lead, Application, CampusLocation, LeadStatus, Teacher } from "@/types/crm";

export function parseCSVToLeads(
  csvText: string,
  selectedCampus: CampusLocation = "KARUR",
  loggedInUsername: string = "adminkarur@123"
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
  const phoneIdx = findColIndex(["phone", "mobile", "contact"]);
  const emailIdx = findColIndex(["email", "mail"]);
  const schoolIdx = findColIndex(["school", "institution", "college"]);
  const districtIdx = findColIndex(["district", "city", "location"]);
  const addressIdx = findColIndex(["address", "place"]);
  const courseIdx = findColIndex(["course", "dept", "department", "branch", "interest"]);
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
    if (parts.length < 1) continue;

    const getVal = (idx: number, positionalIdx: number, fallback: string = "") => {
      if (hasHeader && idx >= 0 && idx < parts.length && parts[idx]) return parts[idx];
      if (!hasHeader && positionalIdx >= 0 && positionalIdx < parts.length && parts[positionalIdx])
        return parts[positionalIdx];
      return fallback;
    };

    const name = getVal(nameIdx, 0, `Candidate ${i}`);
    const phone = getVal(phoneIdx, 1, "+91 98765 43210");
    const email = getVal(emailIdx, 2, `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@gmail.com`);
    const school = getVal(schoolIdx, 3, "Govt Higher Secondary School");
    const district = getVal(districtIdx, 4, selectedCampus === "KARUR" ? "Karur" : "Coimbatore");
    const address = getVal(addressIdx, 5, "Tamil Nadu");
    const courseInterest = getVal(courseIdx, 6, "B.E. Computer Science and Engineering");
    const marks10Str = getVal(marks10Idx, 7, "85");
    const marks12Str = getVal(marks12Idx, 8, "88");
    const cutoffStr = getVal(cutoffIdx, 9, "185.5");
    const fatherName = getVal(fatherIdx, 10, "Parent / Guardian");
    const motherName = getVal(motherIdx, 11, "");
    const gender = getVal(genderIdx, 12, "Male");
    const community = getVal(communityIdx, 13, "BC");
    const campusVal = getVal(campusIdx, 14, selectedCampus);
    const statusVal = getVal(statusIdx, 15, "NEW");

    const leadId = `lead_csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    const appId = `app_csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

    const parsed10 = parseFloat(marks10Str) || 85;
    const parsed12 = parseFloat(marks12Str) || 88;
    const parsedCutoff = parseFloat(cutoffStr) || 185.5;

    const importedLead: Lead & { application: Application } = {
      id: leadId,
      name,
      phone,
      email,
      source: "CSV Import",
      courseInterest,
      campus: (campusVal.toUpperCase() === "COIMBATORE"
        ? "COIMBATORE"
        : selectedCampus === "ALL"
        ? "KARUR"
        : selectedCampus) as CampusLocation,
      school,
      district,
      state: "Tamil Nadu",
      address,
      status: (statusVal.toUpperCase() as LeadStatus) || "NEW",
      fatherName,
      motherName,
      gender,
      community,
      tneaCutoff: parsedCutoff,
      leadScore: Math.min(100, Math.round(parsedCutoff / 2)),
      assignedTo: loggedInUsername || "adminkarur@123",
      appliedCounselling: true,
      counsellingAppNo: `TNEA2026-${Math.floor(10000 + Math.random() * 90000)}`,
      counsellingCategory: "TNEA General Counselling",
      createdAt: new Date().toISOString(),
      application: {
        id: appId,
        leadId,
        stage: "INQUIRY",
        marks10th: parsed10,
        marks12th: parsed12,
        paymentStatus: "PENDING",
        payments: [],
      },
    };

    imported.push(importedLead);
  }

  return imported;
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

    const email = getVal(emailIdx, 1, `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@vsb.ac.in`);
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

