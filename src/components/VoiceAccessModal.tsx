'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Search,
  X,
  Volume2,
  VolumeX,
  Phone,
  FileText,
  UserCheck,
  GraduationCap,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Building2,
  BookOpen,
  ArrowRight,
  Award,
  CheckCircle2,
  MapPin,
  Clock,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { Lead, Application, Teacher } from '@/types/crm';
import { MOCK_TEACHERS } from '@/lib/mockData';
import { getCleanTelUri, redirectToDialPad } from '@/lib/callDialer';

interface VoiceAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants?: (Lead & { application: Application })[];
  teachers?: Teacher[];
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
  onSelectTeacher?: (teacher: Teacher) => void;
  onTriggerToast?: (msg: string) => void;
  initialQuery?: string;
}

// Phonetic & normalization helper
function normalizeForVoiceMatch(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if string matches phonetic variants of target keywords
function checkPhoneticMatch(text: string, target: string): boolean {
  const normText = normalizeForVoiceMatch(text);
  const normTarget = normalizeForVoiceMatch(target);

  if (normText.includes(normTarget) || normTarget.includes(normText)) return true;

  // Custom phonetic synonyms common in Indian voice search
  const synonyms: Record<string, string[]> = {
    nithish: ['nitish', 'nithis', 'nitesh', 'nithik', 'nithi', 'nithish kumar'],
    kasi: ['kashi', 'kasee', 'kasi nathan', 'kashinathan', 'kasi rajan', 'kasinathan'],
    rajesh: ['ragesh', 'rajash', 'prof rajesh', 'professor rajesh'],
    meenakshi: ['minakshi', 'menakshi', 'dr meenakshi'],
    suresh: ['sures', 'prof suresh'],
    kavitha: ['kavita', 'kaveetha', 'prof kavitha'],
    anand: ['ananth', 'dr anand'],
  };

  const words = normText.split(' ');
  for (const w of words) {
    if (synonyms[normTarget]?.includes(w)) return true;
    for (const [key, variants] of Object.entries(synonyms)) {
      if ((key === normTarget || variants.includes(normTarget)) && (w === key || variants.includes(w))) {
        return true;
      }
    }
  }

  return false;
}

export default function VoiceAccessModal({
  isOpen,
  onClose,
  applicants = [],
  teachers = MOCK_TEACHERS,
  onSelectApplicant,
  onSelectTeacher,
  onTriggerToast,
  initialQuery = '',
}: VoiceAccessModalProps) {
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Click microphone or speak a candidate or faculty name');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Text to speech announcement
  const speakAnnouncement = (text: string) => {
    if (speechMuted || typeof window === 'undefined' || !synthRef.current) return;
    try {
      synthRef.current.cancel(); // cancel previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis warning:', err);
    }
  };

  // Start voice recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Voice recognition is not supported in this browser. You can type below.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('🎙️ Listening... Say student name (e.g., "Nithish", "Kasi") or teacher (e.g., "Rajesh")');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimText(currentInterim);
        }

        if (currentFinal) {
          setTranscript(currentFinal);
          setInterimText('');
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access blocked. Please enable permissions in your browser address bar.');
        } else if (event.error === 'no-speech') {
          setStatusMessage('No speech detected. Tap the mic to try again.');
        } else {
          setStatusMessage(`Speech status: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition start error:', err);
      setIsListening(false);
      setStatusMessage('Unable to access microphone.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // Trigger speech recognition on modal open
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setTranscript(initialQuery);
      } else {
        setTranscript('');
        setInterimText('');
        const timer = setTimeout(() => {
          startListening();
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      stopListening();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery]);

  // Clean voice search query
  const query = (transcript || interimText).trim();
  const cleanedQuery = useMemo(() => {
    const raw = query.toLowerCase();
    return raw
      .replace(/\b(find|search|show|get|where is|open|details of|student|lead|teacher|faculty|professor|dr|prof|sir|madam|please|can you|details for|application for)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [query]);

  // Match Applicants / Leads
  const matchedApplicants = useMemo(() => {
    if (!cleanedQuery && !query) return [];
    const searchTarget = cleanedQuery || query.toLowerCase();

    return applicants.filter((app) => {
      const name = normalizeForVoiceMatch(app.name);
      const phone = (app.phone || '').replace(/[^\d]/g, '');
      const email = (app.email || '').toLowerCase();
      const course = normalizeForVoiceMatch(app.courseInterest || '');
      const district = normalizeForVoiceMatch(app.district || '');
      const appId = (app.application?.id || app.id || '').toLowerCase();

      // Direct name check
      if (name.includes(searchTarget) || searchTarget.includes(name)) return true;

      // First name / Last name split
      const nameParts = name.split(' ');
      if (nameParts.some((p) => p && searchTarget.includes(p))) return true;

      // Special phonetic matching (e.g., Nithish, Kasi)
      if (checkPhoneticMatch(searchTarget, 'nithish') && name.includes('nithish')) return true;
      if (checkPhoneticMatch(searchTarget, 'kasi') && name.includes('kasi')) return true;

      // Phone / Email / AppId
      if (phone.includes(searchTarget.replace(/[^\d]/g, '')) && searchTarget.replace(/[^\d]/g, '').length >= 3) return true;
      if (email.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (appId.includes(searchTarget)) return true;
      if (district.includes(searchTarget) && searchTarget.length >= 4) return true;
      if (course.includes(searchTarget) && searchTarget.length >= 4) return true;

      return false;
    });
  }, [applicants, cleanedQuery, query]);

  // Match Teachers / Faculty
  const matchedTeachers = useMemo(() => {
    if (!cleanedQuery && !query) return [];
    const searchTarget = cleanedQuery || query.toLowerCase();

    return teachers.filter((tch) => {
      const name = normalizeForVoiceMatch(tch.name);
      const dept = normalizeForVoiceMatch(tch.department || '');
      const email = (tch.email || '').toLowerCase();
      const phone = (tch.phone || '').replace(/[^\d]/g, '');

      // Direct checks
      if (name.includes(searchTarget) || searchTarget.includes(name)) return true;

      const nameParts = name.split(' ');
      if (nameParts.some((p) => p.length > 2 && searchTarget.includes(p))) return true;

      // Specific teacher phonetic matches
      if (checkPhoneticMatch(searchTarget, 'rajesh') && name.includes('rajesh')) return true;
      if (checkPhoneticMatch(searchTarget, 'meenakshi') && name.includes('meenakshi')) return true;
      if (checkPhoneticMatch(searchTarget, 'suresh') && name.includes('suresh')) return true;
      if (checkPhoneticMatch(searchTarget, 'kavitha') && name.includes('kavitha')) return true;
      if (checkPhoneticMatch(searchTarget, 'anand') && name.includes('anand')) return true;

      // Department matches (e.g. "mechanical", "cse", "civil")
      if (dept.includes(searchTarget) && searchTarget.length >= 4) return true;
      if (email.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (phone.includes(searchTarget.replace(/[^\d]/g, '')) && searchTarget.replace(/[^\d]/g, '').length >= 4) return true;

      return false;
    });
  }, [teachers, cleanedQuery, query]);

  // Read aloud first match confirmation once settled
  useEffect(() => {
    if (!query) return;

    if (matchedApplicants.length === 1 && matchedTeachers.length === 0) {
      const stu = matchedApplicants[0];
      const cutoff = stu.application?.marks12th || stu.application?.marks10th || 'Good';
      speakAnnouncement(`Found student ${stu.name}. Cutoff marks ${cutoff} percent in ${stu.courseInterest || 'Engineering'}.`);
    } else if (matchedTeachers.length === 1 && matchedApplicants.length === 0) {
      const tch = matchedTeachers[0];
      speakAnnouncement(`Found faculty ${tch.name} from ${tch.department} department.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedApplicants.length, matchedTeachers.length, query]);

  if (!isOpen) return null;

  const handleSelectStudentAction = (student: Lead & { application: Application }) => {
    stopListening();
    onClose();
    if (onSelectApplicant) {
      onSelectApplicant(student);
    }
  };

  const handleSelectTeacherAction = (teacher: Teacher) => {
    stopListening();
    onClose();
    if (onSelectTeacher) {
      onSelectTeacher(teacher);
    }
  };

  const handleChipClick = (spokenPhrase: string) => {
    setTranscript(spokenPhrase);
    setInterimText('');
    stopListening();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-modal-title"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
              <Mic className="w-5 h-5" />
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              )}
            </div>
            <div>
              <h2 id="voice-modal-title" className="text-base font-extrabold flex items-center gap-2 tracking-tight">
                Voice Access Model
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                  Live Neural Speech
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speak candidate or teacher name to instantly view their details and application
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSpeechMuted(!speechMuted)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title={speechMuted ? 'Unmute voice synthesis' : 'Mute voice synthesis'}
              aria-label="Toggle speech audio"
            >
              {speechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-500" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close voice assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Control & Live Visualizer Hub */}
        <div className="px-5 pt-6 pb-4 bg-gradient-to-b from-orange-50/50 via-white to-white dark:from-orange-950/10 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Pulsing Mic Button */}
            <div className="relative group">
              {isListening && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-orange-500/20 blur-md animate-pulse"></div>
                  <div className="absolute -inset-6 rounded-full bg-amber-500/10 blur-xl animate-pulse"></div>
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative flex items-center justify-center w-20 h-20 rounded-full text-white transition-all transform active:scale-95 shadow-xl ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-500 to-orange-500 shadow-orange-500/40 ring-4 ring-orange-500/30'
                    : 'bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/30 hover:scale-105'
                }`}
                title={isListening ? 'Tap to pause listening' : 'Tap to start speaking'}
              >
                {isListening ? (
                  <Mic className="w-9 h-9 animate-pulse" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* Audio Wave Visualizer Animation */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-6">
                <span className="w-1 bg-orange-500 rounded-full animate-bounce [animation-delay:0ms] h-3"></span>
                <span className="w-1 bg-orange-500 rounded-full animate-bounce [animation-delay:150ms] h-6"></span>
                <span className="w-1 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms] h-4"></span>
                <span className="w-1 bg-orange-500 rounded-full animate-bounce [animation-delay:450ms] h-5"></span>
                <span className="w-1 bg-orange-400 rounded-full animate-bounce [animation-delay:200ms] h-2"></span>
              </div>
            )}

            {/* Status & Live Transcript */}
            <div className="space-y-1 w-full max-w-lg">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                {isListening ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                    <span className="text-orange-600 dark:text-orange-400 font-bold">Listening actively...</span>
                  </>
                ) : (
                  <span>{statusMessage}</span>
                )}
              </p>

              {/* Transcribed bubble */}
              <div className="min-h-11 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <Search className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-sm font-bold truncate text-slate-900 dark:text-white">
                    {query ? (
                      <>
                        <span>{transcript}</span>
                        {interimText && <span className="text-slate-400 italic"> {interimText}...</span>}
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal italic">
                        Try saying "Nithish", "Kasi", or "Teacher Rajesh"...
                      </span>
                    )}
                  </span>
                </div>
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setInterimText('');
                      textInputRef.current?.focus();
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                    title="Clear voice query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Sample Voice Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Quick Say:
              </span>
              {[
                { label: 'Nithish', query: 'Nithish' },
                { label: 'Kasi', query: 'Kasi' },
                { label: 'Prof. Rajesh', query: 'Rajesh' },
                { label: 'Dr. Meenakshi', query: 'Meenakshi' },
                { label: 'Cutoff > 90', query: '90' },
                { label: 'Karur Leads', query: 'Karur' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.query)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>🗣️</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Results Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 max-h-[55vh] hide-scrollbar">
          {/* 1. MATCHED APPLICANTS / LEADS */}
          {matchedApplicants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  Matched Candidate Leads ({matchedApplicants.length})
                </span>
                <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                  Tap card to view full student details
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {matchedApplicants.map((applicant) => {
                  const marks12 = applicant.application?.marks12th;
                  const marks10 = applicant.application?.marks10th;
                  const stage = applicant.application?.stage || applicant.status || 'NEW';

                  return (
                    <div
                      key={applicant.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-orange-500/60 dark:hover:border-orange-500/50 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      {/* Left: Avatar & Candidate Info */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-base shrink-0 shadow-md">
                          {applicant.name.slice(0, 1).toUpperCase()}
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-slate-900 text-white text-[9px] font-black border border-white/20">
                            {applicant.campus === 'COIMBATORE' ? 'CBE' : 'KRR'}
                          </span>
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">
                              {applicant.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800">
                              {stage}
                            </span>
                            {marks12 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                12th Cutoff: {marks12}%
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{applicant.courseInterest || 'Engineering Course'}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {applicant.phone}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {applicant.district || applicant.school || 'Tamil Nadu'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-400">App #{applicant.application?.id || applicant.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                        {/* Open Student Application / Details Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectStudentAction(applicant)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/30 hover:shadow-lg transition-all cursor-pointer active:scale-95"
                          title="Open Full Student Details & Application"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Student Details / Application</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Call candidate button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            redirectToDialPad(applicant.phone);
                          }}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:text-slate-300 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors"
                          title={`Call ${applicant.name}`}
                          aria-label={`Call ${applicant.name}`}
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MATCHED TEACHERS / FACULTY */}
          {matchedTeachers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Matched Faculty Members ({matchedTeachers.length})
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  Tap card to view teacher audit & assigned leads
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {matchedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/60 dark:hover:border-indigo-500/50 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Left: Avatar & Teacher Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-base shrink-0 shadow-md">
                        {teacher.name.replace(/^(Prof\.|Dr\.)\s*/i, '').slice(0, 1).toUpperCase()}
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-slate-900 text-white text-[9px] font-black border border-white/20">
                          {teacher.campus === 'COIMBATORE' ? 'CBE' : 'KRR'}
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                            {teacher.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {teacher.campus} Campus
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{teacher.department}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {teacher.phone}
                          </span>
                          <span>•</span>
                          <span>{teacher.email}</span>
                          {teacher.coursesAssigned && teacher.coursesAssigned.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-500">{teacher.coursesAssigned[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Teacher Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSelectTeacherAction(teacher)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 hover:shadow-lg transition-all cursor-pointer active:scale-95"
                        title="View Faculty Audit, Assigned Candidates & Performance"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Teacher Audit & Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          redirectToDialPad(teacher.phone);
                        }}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:text-slate-300 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors"
                        title={`Call ${teacher.name}`}
                        aria-label={`Call ${teacher.name}`}
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. NO RESULTS EMPTY STATE */}
          {query && matchedApplicants.length === 0 && matchedTeachers.length === 0 && (
            <div className="py-12 px-4 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No student or faculty matching &quot;{query}&quot;
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Try speaking student names like <strong className="text-orange-600 dark:text-orange-400">&quot;Nithish&quot;</strong>, <strong className="text-orange-600 dark:text-orange-400">&quot;Kasi&quot;</strong>, or faculty names like <strong className="text-indigo-600 dark:text-indigo-400">&quot;Rajesh&quot;</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={startListening}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md hover:bg-orange-700 transition-all cursor-pointer"
                >
                  🎙️ Try Speaking Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Manual Search Fallback & Guidance Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 w-full sm:w-auto">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-[11px]">
              Tip: Say candidate name or phone directly. Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Esc</kbd> to exit.
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInputRef.current?.value) {
                setTranscript(textInputRef.current.value);
              }
            }}
            className="flex items-center gap-1.5 w-full sm:w-auto"
          >
            <input
              ref={textInputRef}
              type="text"
              placeholder="Or type name manually..."
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 w-full sm:w-48"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
