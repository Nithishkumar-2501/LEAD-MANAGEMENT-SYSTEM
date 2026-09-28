"use client";

import { useState, useMemo } from "react";
import { Lead, Application, AppStage } from "@/types/crm";
import {
  Eye,
  Phone,
  Mail,
  MessageSquare,
  UserCheck,
  Plus,
  Upload,
  Trash2,
  Flame,
  Zap,
  Snowflake,
  Send,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { parseCSVToLeads } from "@/lib/csvParser";
import { getStudentLeadState } from "@/lib/studentLeadState";

import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";
import { redirectToDialPad, getCleanTelUri } from "@/lib/callDialer";
import { redirectToWhatsApp, getDefaultAdmissionWhatsAppText } from "@/lib/whatsappSender";
import { redirectToSms, getDefaultAdmissionSmsText } from "@/lib/smsSender";

import { Checkbox } from "@/components/base-ui/checkbox";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/base-ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/base-ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/base-ui/table";
import { Button } from "@/components/base-ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";

interface ApplicantsTableProps {
  applicants: (Lead & { application: Application })[];
  searchQuery: string;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP" | "SMS", name: string) => void;
  onOpenCreateModal: () => void;
  onOpenQuickLeadModal?: () => void;
  onImportLeads?: (importedLeads: (Lead & { application: Application })[]) => void;
  onDeleteApplicant?: (id: string, name: string) => void;
}

type SortableColumn = "name" | "courseInterest" | "campus" | "marks12th" | "tneaCutoff";

type SortConfig = {
  column: SortableColumn;
  direction: "asc" | "desc";
};

export default function ApplicantsTable({
  applicants,
  searchQuery,
  onSelectApplicant,
  onActionTrigger,
  onOpenCreateModal,
  onOpenQuickLeadModal,
  onImportLeads,
  onDeleteApplicant,
}: ApplicantsTableProps) {
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "name",
    direction: "asc",
  });

  // In-Portal Communication Modal State
  const [activeCommModal, setActiveCommModal] = useState<"CALL" | "MESSAGE" | "EMAIL" | null>(null);
  const [activeCommContact, setActiveCommContact] = useState<ContactTarget | null>(null);

  const handleOpenCommModal = (type: "CALL" | "MESSAGE" | "EMAIL", target: ContactTarget) => {
    setActiveCommContact(target);
    setActiveCommModal(type);
  };

  const handleCommLogSuccess = (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => {
    const triggerType = type === "MESSAGE" ? (details.toLowerCase().includes("sms") ? "SMS" : "WHATSAPP") : type;
    onActionTrigger(triggerType, activeCommContact?.name || "Candidate");
  };

  // Filter Applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const q = (searchQuery || "").toLowerCase().trim();
      const numQ = q.replace(/^(lead\s*#?|#)/i, "").trim();
      const matchesSearch =
        !q ||
        (numQ && String(item.id || "").toLowerCase() === numQ) ||
        String(item.id || "").toLowerCase().includes(numQ || q) ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.courseInterest || "").toLowerCase().includes(q) ||
        (item.email || "").toLowerCase().includes(q) ||
        (item.phone || "").includes(q);

      const stateInfo = getStudentLeadState(item);
      const matchesStage = (() => {
        if (selectedStage === "ALL") return true;
        if (selectedStage === "HOT") return stateInfo.state === "HOT";
        if (selectedStage === "WARM") return stateInfo.state === "WARM";
        if (selectedStage === "COLD") return stateInfo.state === "COLD";
        return (item.application?.stage || "INQUIRY") === selectedStage;
      })();

      return matchesSearch && matchesStage;
    });
  }, [applicants, searchQuery, selectedStage]);

  // Sort Applicants
  const sortedApplicants = useMemo(() => {
    const sorted = [...filteredApplicants];
    sorted.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortConfig.column === "name") {
        aVal = a.name || "";
        bVal = b.name || "";
      } else if (sortConfig.column === "courseInterest") {
        aVal = a.courseInterest || "";
        bVal = b.courseInterest || "";
      } else if (sortConfig.column === "campus") {
        aVal = a.campus || "";
        bVal = b.campus || "";
      } else if (sortConfig.column === "marks12th") {
        aVal = a.application?.marks12th || 0;
        bVal = b.application?.marks12th || 0;
      } else if (sortConfig.column === "tneaCutoff") {
        aVal = a.tneaCutoff || 0;
        bVal = b.tneaCutoff || 0;
      }

      const comparison =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredApplicants, sortConfig]);

  // Pagination Calculations
  const pageCount = Math.max(1, Math.ceil(sortedApplicants.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const currentPage = safePageIndex + 1;
  const pageStart = safePageIndex * pageSize;
  const pageEnd = Math.min(sortedApplicants.length, pageStart + pageSize);
  const paginatedApplicants = sortedApplicants.slice(pageStart, pageEnd);

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages: pageCount,
    paginationItemsToDisplay: 5,
  });

  const allSelectedOnPage =
    paginatedApplicants.length > 0 && paginatedApplicants.every((item) => selectedIds.includes(item.id));
  const someSelectedOnPage =
    paginatedApplicants.some((item) => selectedIds.includes(item.id)) && !allSelectedOnPage;

  const toggleAllOnPage = (checked: boolean) => {
    if (checked) {
      setSelectedIds((current) => Array.from(new Set([...current, ...paginatedApplicants.map((item) => item.id)])));
      return;
    }
    setSelectedIds((current) => current.filter((id) => !paginatedApplicants.some((item) => item.id === id)));
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((item) => item !== id);
    });
  };

  const toggleSort = (column: SortableColumn) => {
    setSortConfig((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        column,
        direction: "asc",
      };
    });
  };

  const changePageSize = (value: string | null) => {
    if (!value) return;
    setPageSize(Number(value));
    setPageIndex(0);
  };

  const stagesList = ["ALL", "HOT", "WARM", "COLD", "INQUIRY", "SUBMITTED", "DOCS_VERIFIED", "OFFER_ISSUED", "FEE_PAID"];

  return (
    <div className="w-full max-w-full space-y-4 font-sans">
      {/* Top Header Card Container matching Image 2 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-all">
        {/* Header Title & Top Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Recent Applicants</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              TNEA & Management intake candidates at V.S.B.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenQuickLeadModal && (
              <button
                type="button"
                onClick={onOpenQuickLeadModal}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Add Quick Lead</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white shrink-0" />
              <span>New Application</span>
            </button>

            <input
              type="file"
              id="csv-dashboard-upload"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  const text = evt.target?.result as string;
                  if (!text) return;
                  const imported = parseCSVToLeads(text);
                  if (imported.length > 0 && onImportLeads) {
                    onImportLeads(imported);
                  }
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => document.getElementById("csv-dashboard-upload")?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span>Import CSV</span>
            </button>
          </div>
        </div>

        {/* Stage Filter Control Pills matching Image 2 */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto hide-scrollbar max-w-full">
          {stagesList.map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStage(st);
                setPageIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 text-xs font-bold cursor-pointer ${
                selectedStage === st
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Data Table styled after data-table-11 and Image 2 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-xs">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="hover:bg-transparent">
                {/* Select All Checkbox */}
                <TableHead className="h-12 w-10 px-3.5 text-center align-middle">
                  <Checkbox
                    checked={allSelectedOnPage}
                    aria-checked={someSelectedOnPage ? "mixed" : allSelectedOnPage}
                    onCheckedChange={(value) => toggleAllOnPage(!!value)}
                    aria-label="Select all applicants on page"
                    className="after:hidden data-checked:border-sky-600 data-checked:bg-sky-600 data-checked:text-white dark:data-checked:border-sky-500 dark:data-checked:bg-sky-500 dark:data-checked:text-white"
                  />
                </TableHead>

                {/* Applicant Name */}
                <TableHead className="h-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer select-none font-extrabold"
                  >
                    <span>Applicant Name</span>
                    {sortConfig.column === "name" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUpIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      ) : (
                        <ChevronDownIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 opacity-60">↑↓</span>
                    )}
                  </button>
                </TableHead>

                {/* Applied Program */}
                <TableHead className="h-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={() => toggleSort("courseInterest")}
                    className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer select-none font-extrabold"
                  >
                    <span>Applied Program</span>
                    {sortConfig.column === "courseInterest" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUpIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      ) : (
                        <ChevronDownIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 opacity-60">↑↓</span>
                    )}
                  </button>
                </TableHead>

                {/* Campus */}
                <TableHead className="h-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => toggleSort("campus")}
                    className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer select-none font-extrabold"
                  >
                    <span>Campus</span>
                    {sortConfig.column === "campus" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUpIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      ) : (
                        <ChevronDownIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 opacity-60">↑↓</span>
                    )}
                  </button>
                </TableHead>

                {/* State & Stage */}
                <TableHead className="h-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  State & Stage
                </TableHead>

                {/* TNEA Cutoff & Counselling */}
                <TableHead className="h-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 hidden md:table-cell">
                  <button
                    type="button"
                    onClick={() => toggleSort("tneaCutoff")}
                    className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer select-none font-extrabold"
                  >
                    <span>TNEA Cutoff & Counselling</span>
                    {sortConfig.column === "tneaCutoff" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUpIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      ) : (
                        <ChevronDownIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 opacity-60">↑↓</span>
                    )}
                  </button>
                </TableHead>

                {/* 12th Marks */}
                <TableHead className="h-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => toggleSort("marks12th")}
                    className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer select-none font-extrabold"
                  >
                    <span>12th Marks</span>
                    {sortConfig.column === "marks12th" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUpIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      ) : (
                        <ChevronDownIcon className="size-3.5 text-blue-600 dark:text-sky-400" />
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 opacity-60">↑↓</span>
                    )}
                  </button>
                </TableHead>

                {/* Quick Actions */}
                <TableHead className="h-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 text-center sticky right-0 z-20 min-w-[200px] w-52 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm border-l border-slate-200 dark:border-slate-800 shadow-[-6px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_12px_rgba(0,0,0,0.3)]">
                  Quick Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedApplicants.length > 0 ? (
                paginatedApplicants.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const stateInfo = getStudentLeadState(item);

                  return (
                    <TableRow
                      key={item.id}
                      data-state={isSelected ? "selected" : undefined}
                      onClick={() => onSelectApplicant(item)}
                      className={cn(
                        "hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group",
                        isSelected && "bg-sky-50/60 dark:bg-sky-950/20"
                      )}
                    >
                      {/* Checkbox Column */}
                      <TableCell className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(value) => toggleRow(item.id, !!value)}
                          aria-label={`Select ${item.name}`}
                          className="after:hidden data-checked:border-sky-600 data-checked:bg-sky-600 data-checked:text-white dark:data-checked:border-sky-500 dark:data-checked:bg-sky-500 dark:data-checked:text-white"
                        />
                      </TableCell>

                      {/* Applicant Name & Email & Lead ID */}
                      <TableCell className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          {/* Round Avatar Initials with Subtle Color */}
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50 shadow-xs">
                            {((item.name || "S").trim().slice(0, 2)).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs">
                                {item.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold">
                                Lead #{item.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Applied Program */}
                      <TableCell className="py-3 px-3.5 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                        {item.courseInterest}
                      </TableCell>

                      {/* Campus Badge matching Image 2 */}
                      <TableCell className="py-3 px-3.5 hidden sm:table-cell">
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold border uppercase tracking-wider inline-block bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60 shadow-2xs">
                          {item.campus || "KARUR"} CAMPUS
                        </span>
                      </TableCell>

                      {/* State & Stage Status Pills matching Image 2 */}
                      <TableCell className="py-3 px-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {stateInfo.state === "HOT" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs">
                              <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                              <span>HOT (Admitted)</span>
                            </span>
                          )}
                          {stateInfo.state === "WARM" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>WARM (Ready)</span>
                            </span>
                          )}
                          {stateInfo.state === "COLD" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-2xs">
                              <Snowflake className="w-3 h-3 text-sky-500" />
                              <span>COLD (Not Interested)</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100/70 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 uppercase shadow-2xs">
                            {(item.application?.stage || "INQUIRY").replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>

                      {/* TNEA Cutoff & Counselling */}
                      <TableCell className="py-3 px-3.5 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {item.tneaCutoff ? (
                            <div className="font-bold text-sky-600 dark:text-sky-400 font-mono text-[11px]">
                              Cutoff: {item.tneaCutoff} / 200
                            </div>
                          ) : null}
                          {item.counsellingAppNo ? (
                            <span className="inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                              ✅ TNEA ({item.counsellingAppNo})
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* 12th Marks */}
                      <TableCell className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-100 hidden sm:table-cell text-sm">
                        {item.application?.marks12th ? `${item.application.marks12th}%` : "—"}
                      </TableCell>

                      {/* Quick Actions Circular Buttons matching Image 2 */}
                      <TableCell
                        className="py-3 px-3.5 text-center sticky right-0 z-10 min-w-[200px] w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm group-hover:bg-slate-50/95 dark:group-hover:bg-slate-800/95 transition-colors border-l border-slate-200 dark:border-slate-800 shadow-[-6px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_12px_rgba(0,0,0,0.3)] whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5 min-w-[185px]">
                          {/* View Detail */}
                          <Tooltip text={`View ${item.name} Details`}>
                            <button
                              type="button"
                              onClick={() => onSelectApplicant(item)}
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          {/* Call Dialer */}
                          <Tooltip text={`Call ${item.name} via Phone Dial Pad`}>
                            <a
                              href={getCleanTelUri(item.phone)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionTrigger("CALL", item.name);
                                redirectToDialPad(item.phone);
                              }}
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </Tooltip>

                          {/* Email */}
                          <Tooltip text={`In-Portal Email ${item.name}`}>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCommModal("EMAIL", {
                                  id: item.id,
                                  name: item.name,
                                  phone: item.phone,
                                  email: item.email,
                                  courseInterest: item.courseInterest,
                                  campus: item.campus,
                                  school: item.school || undefined,
                                  district: item.district || undefined,
                                  state: item.state || undefined,
                                  tneaCutoff: item.tneaCutoff,
                                  counsellingAppNo: item.counsellingAppNo,
                                  marks10th: item.application?.marks10th,
                                  marks12th: item.application?.marks12th,
                                  stage: item.application?.stage,
                                  status: item.status,
                                })
                              }
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          {/* WhatsApp Chat */}
                          <Tooltip text={`WhatsApp Chat with ${item.name}`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionTrigger("WHATSAPP", item.name);
                                redirectToWhatsApp(item.phone, getDefaultAdmissionWhatsAppText(item));
                              }}
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          {/* Delete Applicant */}
                          <Tooltip text={`Delete ${item.name}`}>
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteApplicant) {
                                  onDeleteApplicant(item.id, item.name);
                                } else if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                  fetch(`/api/contacts?id=${item.id}`, { method: "DELETE" });
                                }
                              }}
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                              title={`Delete ${item.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-slate-500 font-medium">
                    No matching applicants found for &quot;{searchQuery}&quot;.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modern Pagination Footer Bar styled after data-table-11 */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-xs max-sm:flex-col">
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm whitespace-nowrap flex-1" aria-live="polite">
          Showing <span className="font-bold text-slate-900 dark:text-white">{sortedApplicants.length > 0 ? pageStart + 1 : 0}</span> -{" "}
          <span className="font-bold text-slate-900 dark:text-white">{pageEnd}</span> of{" "}
          <span className="font-bold text-slate-900 dark:text-white">{sortedApplicants.length}</span> Applicants
        </p>

        <div className="grow flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-40 shadow-xs"
                  onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
                  disabled={safePageIndex === 0}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon className="size-4" aria-hidden="true" />
                </Button>
              </PaginationItem>

              {showLeftEllipsis ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}

              {pages.map((page) => {
                const isActive = page === currentPage;

                return (
                  <PaginationItem key={page}>
                    <Button
                      size="icon"
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "h-8 w-8 rounded-lg font-bold text-xs transition-all shadow-xs",
                        isActive
                          ? "bg-blue-600 hover:bg-blue-700 text-white font-extrabold ring-2 ring-blue-400/30"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                      onClick={() => setPageIndex(page - 1)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                );
              })}

              {showRightEllipsis ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}

              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-40 shadow-xs"
                  onClick={() => setPageIndex((current) => Math.min(current + 1, pageCount - 1))}
                  disabled={safePageIndex >= pageCount - 1}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon className="size-4" aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <div className="flex flex-1 justify-end items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden md:inline">Per page:</span>
          <Select value={pageSize.toString()} onValueChange={changePageSize}>
            <SelectTrigger
              id="results-per-page"
              className="h-8 w-fit text-xs font-semibold whitespace-nowrap border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg px-2.5 shadow-xs"
              aria-label="Results per page"
            >
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* In-Portal Direct Communication Modals */}
      <InPortalCommunicationModals
        activeModal={activeCommModal}
        contact={activeCommContact}
        onClose={() => setActiveCommModal(null)}
        onLogSuccess={handleCommLogSuccess}
      />
    </div>
  );
}
