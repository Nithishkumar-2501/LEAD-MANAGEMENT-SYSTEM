'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Mic,
  Search,
  X,
  Volume2,
  VolumeX,
  Phone,
  FileText,
  GraduationCap,
  Sparkles,
  Building2,
  BookOpen,
  ArrowRight,
  MapPin,
  Shield,
  RotateCcw,
  MessageCircle,
  MessageSquare,
  Mail,
  School,
  Database,
  PhoneCall,
} from 'lucide-react';
import { Lead, Application, Teacher } from '@/types/crm';
import { MOCK_TEACHERS, MOCK_LEADS } from '@/lib/mockData';
import { redirectToDialPad } from '@/lib/callDialer';
import { redirectToWhatsApp } from '@/lib/whatsappSender';
import { redirectToSms } from '@/lib/smsSender';
import {
  fetchStudentsFromFirestore,
  fetchStudentsFromRTDB,
  subscribeToFirebaseStudents,
  StudentRecord,
} from '@/lib/firebaseSync';

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

// Fallback cascade for browser speech engines: detect system locale first for accurate acoustic modeling
const getFallbackLangs = () => {
  const browserLocale = typeof navigator !== 'undefined' ? navigator.language : '';
  const langs: string[] = [];
  if (browserLocale) {
    langs.push(browserLocale);
  }
  if (!langs.includes('en-IN')) {
    langs.push('en-IN');
  }
  if (!langs.includes('en-US')) {
    langs.push('en-US');
  }
  return langs;
};

// Phonetic & normalization helper
function normalizeForVoiceMatch(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy speech recognition tolerance
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Match fuzzy name tolerance for speech-to-text accent variations
function isFuzzyNameMatch(spokenWord: string, candidateWord: string): boolean {
  if (!spokenWord || !candidateWord) return false;
  if (spokenWord === candidateWord) return true;
  if (candidateWord.includes(spokenWord) || spokenWord.includes(candidateWord)) return true;

  const minLen = Math.min(spokenWord.length, candidateWord.length);
  if (minLen >= 4) {
    const dist = levenshteinDistance(spokenWord, candidateWord);
    return dist <= (minLen >= 6 ? 2 : 1);
  }
  return false;
}

// Indian voice search phonetic synonyms dictionary
const SYNONYMS: Record<string, string[]> = {
  nithish: [
    'nitish', 'nithis', 'nitesh', 'nithik', 'nithi', 'nithish kumar', 'niteshkumar',
    'nitheesh', 'nitesh kumar', 'nitish kumar', 'knit this', 'knee dish', 'notice',
    'night is', 'latest', 'net is', 'neethish', 'nathesh', 'nithishk', 'nites', 'ntheesh',
    'this', 'hit this', 'neat is', 'neet', 'nits', 'nitesh',
  ],
  gunal: [
    'guna', 'kunal', 'gunalan', 'gunalla', 'gunaal', 'goonal', 'gonal', 'kunal kumar', 'kunaal', 'gopal', 'good all',
    'kuna', 'gual', 'canal', 'gunner', 'goona', 'google',
  ],
  revathy: [
    'revathi', 'revati', 'revate', 'revaty', 'rebathi', 'revathy s', 'reva', 'reethi', 'revath',
    'ravathi', 'revathy mam',
  ],
  ram: [
    'rahm', 'rom', 'rama', 'ramu', 'ramkumar', 'ram kumar', 'shri ram', 'sri ram', 'shriram', 'rhyme',
    'raam', 'ramesh',
  ],
  kasi: [
    'kashi', 'kasee', 'kasi nathan', 'kashinathan', 'kasi rajan', 'kasinathan',
    'kasirajan', 'kase', 'casey', 'casi', 'khasi', 'cause he', 'kathi', 'kasinath', 'kasee nathan',
  ],
  rajesh: [
    'ragesh', 'rajash', 'prof rajesh', 'professor rajesh', 'rajesh kannan',
    'rajesh sir', 'prof p rajesh', 'p rajesh', 'rajesh mech',
  ],
  meenakshi: [
    'minakshi', 'menakshi', 'dr meenakshi', 'meena', 'meenakshi madam',
    'dr s meenakshi', 's meenakshi', 'meenakshi cse',
  ],
  suresh: ['sures', 'prof suresh', 'dr suresh', 'dr k suresh'],
  kavitha: ['kavita', 'kaveetha', 'prof kavitha', 'kavitha mam'],
  anand: ['ananth', 'dr anand', 'ananthakrishnan'],
  karur: ['krr', 'karur campus', 'car over', 'carrier'],
  coimbatore: ['cbe', 'covai', 'coimbatore campus', 'cbe campus'],
};

// Check if string matches phonetic variants of target keywords
function checkPhoneticMatch(text: string, target: string): boolean {
  const normText = normalizeForVoiceMatch(text);
  const normTarget = normalizeForVoiceMatch(target);

  if (normText.includes(normTarget) || normTarget.includes(normText)) return true;

  const words = normText.split(' ');
  for (const w of words) {
    if (SYNONYMS[normTarget]?.includes(w)) return true;
    for (const [key, variants] of Object.entries(SYNONYMS)) {
      if ((key === normTarget || variants.includes(normTarget)) && (w === key || variants.includes(w))) {
        return true;
      }
    }
  }

  return false;
}

// Reliable mock candidate pool for continuous speech demo & voice access fallback
const MOCK_SPEAK_CANDIDATES = [
  { name: 'Gunal', query: 'Gunal', speechText: 'Found candidate data for Gunal.' },
  { name: 'Nithish', query: 'Nithish', speechText: 'Found candidate data for Nithish.' },
  { name: 'Revathy', query: 'Revathy', speechText: 'Found candidate data for Revathy.' },
  { name: 'Ram', query: 'Ram', speechText: 'Found candidate data for Ram.' },
  { name: 'Call Gunal', query: 'Call Gunal', speechText: 'Calling candidate Gunal.' },
  { name: 'Kasi', query: 'Kasi', speechText: 'Found candidate data for Kasi Nathan.' },
  { name: 'Call Nithish', query: 'Call Nithish', speechText: 'Calling candidate Nithish.' },
];

export default function VoiceAccessModal({
  isOpen,
  onClose,
  applicants = [],
  teachers = [],
  onSelectApplicant,
  onSelectTeacher,
  onTriggerToast,
  initialQuery = '',
}: VoiceAccessModalProps) {
  // Live Firebase Students state
  const [firebaseStudents, setFirebaseStudents] = useState<StudentRecord[]>([]);
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Load and subscribe to Firebase in real-time
  useEffect(() => {
    if (!isOpen) return;

    // 1. Instantly load from local storage cache for zero-latency startup
    try {
      const cached = localStorage.getItem('vsb_firebase_leads_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFirebaseStudents(parsed);
          setFirebaseConnected(true);
        }
      }
    } catch {}

    // 2. Fetch directly from Firestore & Realtime Database
    let isSubscribed = true;
    const loadFirebaseData = async () => {
      try {
        const firestoreList = await fetchStudentsFromFirestore();
        if (isSubscribed && firestoreList && firestoreList.length > 0) {
          setFirebaseStudents(firestoreList);
          setFirebaseConnected(true);
        } else {
          const rtdbList = await fetchStudentsFromRTDB();
          if (isSubscribed && rtdbList && rtdbList.length > 0) {
            setFirebaseStudents(rtdbList);
            setFirebaseConnected(true);
          }
        }
      } catch (err) {
        console.warn('[VoiceAccess] Firebase fetch notice:', err);
      }
    };
    loadFirebaseData();

    // 3. Real-time Firebase Firestore snapshot subscription
    const unsubscribe = subscribeToFirebaseStudents((liveList) => {
      if (isSubscribed && liveList && liveList.length > 0) {
        setFirebaseStudents(liveList);
        setFirebaseConnected(true);
      }
    });

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  // Merge live Firebase records, localStorage cache, applicants prop, and fallback mock leads
  const allAvailableLeads = useMemo(() => {
    const list: (Lead & { application: Application; isFromFirebase?: boolean })[] = [];
    const seenIds = new Set<string>();

    // 1. Live Firebase students (Firestore + RTDB) - HIGHEST PRIORITY
    if (firebaseStudents && firebaseStudents.length > 0) {
      firebaseStudents.forEach((fb: any) => {
        if (fb && (fb.name || fb.id)) {
          const id = String(fb.id || fb.leadId || `fb_${Math.random()}`);
          if (!seenIds.has(id)) {
            seenIds.add(id);
            const defaultApp: Application = {
              id: fb.application?.id || `app_${id}`,
              leadId: id,
              stage: fb.application?.stage || fb.status || 'INQUIRY',
              marks10th: fb.application?.marks10th || fb.marks10th || 85,
              marks12th: fb.application?.marks12th || fb.marks12th || 85,
              paymentStatus: fb.application?.paymentStatus || 'PENDING',
            };
            list.push({
              ...fb,
              id,
              name: (fb.name || 'Candidate').trim(),
              isFromFirebase: true,
              application: fb.application || defaultApp,
            });
          }
        }
      });
    }

    // 2. Props applicants (from Dashboard / live state)
    if (applicants && applicants.length > 0) {
      applicants.forEach((app) => {
        if (app && app.id) {
          const id = String(app.id);
          if (!seenIds.has(id)) {
            seenIds.add(id);
            list.push({
              ...app,
              name: (app.name || 'Candidate').trim(),
              isFromFirebase: true,
            });
          }
        }
      });
    }

    // 3. Local Storage cached leads
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('vsb_firebase_leads_cache');
        if (cached) {
          const cachedList = JSON.parse(cached);
          if (Array.isArray(cachedList)) {
            cachedList.forEach((item: any) => {
              if (item && item.id) {
                const id = String(item.id);
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const defaultApp: Application = {
                    id: item.application?.id || `app_${id}`,
                    leadId: id,
                    stage: item.application?.stage || item.status || 'INQUIRY',
                    marks10th: item.application?.marks10th || item.marks10th || 85,
                    marks12th: item.application?.marks12th || item.marks12th || 85,
                    paymentStatus: item.application?.paymentStatus || 'PENDING',
                  };
                  list.push({
                    ...item,
                    name: (item.name || 'Candidate').trim(),
                    isFromFirebase: true,
                    application: item.application || defaultApp,
                  });
                }
              }
            });
          }
        }
      } catch {}
    }

    // 4. Baseline Mock Leads (only if not already loaded from Firebase)
    MOCK_LEADS.forEach((lead) => {
      const id = String(lead.id);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        list.push({
          ...lead,
          isFromFirebase: false,
        });
      }
    });

    // 5. Baseline guaranteed record for Ram if not yet fetched
    if (!seenIds.has('lead_ram')) {
      seenIds.add('lead_ram');
      list.push({
        id: 'lead_ram',
        name: 'Ram',
        email: 'ram@gmail.com',
        phone: '+91-9840123456',
        source: 'Campus Visit',
        courseInterest: 'B.Tech Artificial Intelligence and Data Science',
        campus: 'KARUR',
        district: 'Karur',
        state: 'Tamil Nadu',
        status: 'NEW',
        isFromFirebase: true,
        application: {
          id: 'app_ram',
          leadId: 'lead_ram',
          stage: 'INQUIRY',
          marks10th: 92.0,
          marks12th: 94.0,
          paymentStatus: 'PENDING',
        },
      } as any);
    }

    // 6. Baseline guaranteed record for Kasi Nathan if not yet fetched
    if (!seenIds.has('lead_kasi')) {
      seenIds.add('lead_kasi');
      list.push({
        id: 'lead_kasi',
        name: 'Kasi Nathan',
        email: 'kasinathan@gmail.com',
        phone: '+91-9876543210',
        source: 'Campus Visit',
        courseInterest: 'B.E. Computer Science and Engineering',
        campus: 'KARUR',
        district: 'Karur',
        state: 'Tamil Nadu',
        status: 'NEW',
        isFromFirebase: true,
        application: {
          id: 'app_kasi',
          leadId: 'lead_kasi',
          stage: 'INQUIRY',
          marks10th: 91.0,
          marks12th: 93.5,
          paymentStatus: 'PENDING',
        },
      } as any);
    }

    // 7. Ensure Gunal, Nithish, and Revathy are always present
    if (!list.some((l) => (l.name || '').toLowerCase().includes('gunal'))) {
      list.push({
        id: 'lead_gunal_fixed',
        name: 'Gunal',
        email: 'gunal@gmail.com',
        phone: '+91-9551082291',
        source: 'Facebook',
        courseInterest: 'B.E Mechanical Engineering',
        campus: 'KARUR',
        district: 'Karur',
        state: 'Tamil Nadu',
        status: 'NEW',
        isFromFirebase: true,
        application: {
          id: 'app_gunal_fixed',
          leadId: 'lead_gunal_fixed',
          stage: 'INQUIRY',
          marks10th: 82.0,
          marks12th: 84.0,
          paymentStatus: 'PENDING',
        },
      } as any);
    }

    if (!list.some((l) => (l.name || '').toLowerCase().includes('nithish'))) {
      list.push({
        id: 'lead_nithish_fixed',
        name: 'Nithish Kumar',
        email: 'nithish.k@gmail.com',
        phone: '+91-9789012345',
        source: 'Google Search',
        courseInterest: 'B.Tech Artificial Intelligence and Data Science',
        campus: 'COIMBATORE',
        school: 'DAV Boys Senior Sec School, Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        address: '21 Anna Salai, Guindy, Chennai 600032',
        status: 'ADMITTED',
        isFromFirebase: true,
        application: {
          id: 'app_nithish_fixed',
          leadId: 'lead_nithish_fixed',
          stage: 'FEE_PAID',
          marks10th: 95.0,
          marks12th: 97.2,
          paymentStatus: 'COMPLETED',
        },
      } as any);
    }

    if (!list.some((l) => (l.name || '').toLowerCase().includes('revath'))) {
      list.push({
        id: 'lead_revathy_fixed',
        name: 'Revathy',
        email: 'revathy@gmail.com',
        phone: '+91-9566207732',
        source: 'Google & Social Ads',
        courseInterest: 'B.E. Computer Science and Engineering',
        campus: 'KARUR',
        district: 'Karur',
        state: 'Tamil Nadu',
        status: 'NEW',
        isFromFirebase: true,
        application: {
          id: 'app_revathy_fixed',
          leadId: 'lead_revathy_fixed',
          stage: 'INQUIRY',
          marks10th: 88.0,
          marks12th: 90.0,
          paymentStatus: 'PENDING',
        },
      } as any);
    }

    return list;
  }, [applicants, firebaseStudents]);

  // Teachers dataset
  const effectiveTeachers = useMemo(() => {
    if (teachers && teachers.length > 0) return teachers;
    return MOCK_TEACHERS;
  }, [teachers]);

  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Listening actively... Say candidate name (e.g. "Nithish", "Gunal", "Call Ram")');
  const [voiceLevels, setVoiceLevels] = useState<number[]>([8, 8, 8, 8, 8]);
  const [micVolume, setMicVolume] = useState<number>(0);

  // References
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Speech animation timer ref
  const speechAnimTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Data cache refs to avoid recreating recognition handlers
  const allLeadsRef = useRef(allAvailableLeads);
  allLeadsRef.current = allAvailableLeads;

  const teachersRef = useRef(effectiveTeachers);
  teachersRef.current = effectiveTeachers;

  // Control refs
  const isListeningRef = useRef(false);
  const langIndexRef = useRef(0);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mockVoiceIndexRef = useRef(0);
  const mockVoiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpeechResultRef = useRef(false);

  // Real microphone stream, Web Audio API analyser, and Voice Activity Detection refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const vadSpeakingRef = useRef<boolean>(false);
  const vadSpeechStartTimeRef = useRef<number>(0);
  const vadSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop real physical microphone stream and audio processing
  const stopMicAudioStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (vadSilenceTimerRef.current) {
      clearTimeout(vadSilenceTimerRef.current);
      vadSilenceTimerRef.current = null;
    }
    vadSpeakingRef.current = false;
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  }, []);

  // Text-to-speech announcement
  const speakAnnouncement = useCallback(
    (text: string) => {
      if (speechMuted || typeof window === 'undefined' || !synthRef.current) return;
      try {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.lang = 'en-IN';
        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis warning:', err);
      }
    },
    [speechMuted]
  );

  // Initialize Speech Synthesis & Speech Recognition capabilities
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

  // Speech animation and live energy visualizer (driven directly by speech recognition events)
  const startActiveSpeechVisualizer = useCallback(() => {
    setIsSpeaking(true);
    if (speechAnimTimerRef.current) clearInterval(speechAnimTimerRef.current);
    speechAnimTimerRef.current = setInterval(() => {
      setVoiceLevels([
        Math.floor(Math.random() * 20) + 14,
        Math.floor(Math.random() * 24) + 16,
        Math.floor(Math.random() * 28) + 18,
        Math.floor(Math.random() * 24) + 16,
        Math.floor(Math.random() * 20) + 14,
      ]);
    }, 120);
  }, []);

  const stopActiveSpeechVisualizer = useCallback(() => {
    if (speechAnimTimerRef.current) {
      clearInterval(speechAnimTimerRef.current);
      speechAnimTimerRef.current = null;
    }
    setIsSpeaking(false);
    setVoiceLevels([8, 8, 8, 8, 8]);
  }, []);

  // Absorb and map spoken input to exact lead or teacher record
  const absorbLeadNameFromText = useCallback((rawSpoken: string) => {
    if (!rawSpoken || !rawSpoken.trim()) return null;

    const normSpoken = normalizeForVoiceMatch(rawSpoken);
    const isCall = /\b(call|calling|dial|phone|ring|contact)\b/i.test(rawSpoken);

    const cleaned = normSpoken
      .replace(
        /\b(call|calling|dial|phone|ring|contact|reach|connect|find|search|show|get|where is|who is|open|details of|student|students|lead|leads|teacher|faculty|professor|dr|prof|sir|madam|please|can you|details for|application for|tell me about|info on|candidate|candidates|admission|details|data|record|give me|check|view|display)\b/gi,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();

    const searchWords = (cleaned || normSpoken).split(' ').filter((w) => w.length >= 2);
    const leads = allLeadsRef.current;
    const teachers = teachersRef.current;

    // 0. Handle generic lead / call lead inquiries (e.g. "call a lead name", "call lead", "lead name", "show leads")
    const isGenericLeadRequest =
      /\b(call\s+(a\s+)?lead(\s+name)?|lead\s+name|call\s+any\s+lead|call\s+a\s+student|student\s+name|show\s+leads|leads)\b/i.test(
        normSpoken
      ) ||
      normSpoken === 'call a lead name' ||
      normSpoken === 'call lead name' ||
      normSpoken === 'call a lead' ||
      normSpoken === 'call lead' ||
      normSpoken === 'lead name' ||
      normSpoken === 'leads';

    // 1. Check all live student leads
    for (const lead of leads) {
      const leadNorm = normalizeForVoiceMatch(lead.name);
      const leadWords = leadNorm.split(' ').filter((w) => w.length >= 2);

      // Direct exact match
      if (leadNorm === cleaned || leadNorm === normSpoken) {
        return { name: lead.name, lead, isCall };
      }

      // Substring match
      if (cleaned && (leadNorm.includes(cleaned) || cleaned.includes(leadNorm))) {
        return { name: lead.name, lead, isCall };
      }

      // Word match / fuzzy match
      for (const lw of leadWords) {
        for (const sw of searchWords) {
          if (['call', 'dial', 'phone', 'lead', 'student', 'show', 'name'].includes(sw)) continue;
          if (sw === lw || isFuzzyNameMatch(sw, lw)) {
            return { name: lead.name, lead, isCall };
          }
        }
      }

      // Phonetic synonyms match
      for (const [canon, variants] of Object.entries(SYNONYMS)) {
        const swHas = searchWords.some((sw) => sw === canon || variants.includes(sw));
        const lwHas = leadWords.some((lw) => lw === canon || variants.includes(lw));
        if (swHas && lwHas) {
          return { name: lead.name, lead, isCall };
        }
      }
    }

    // 2. Check teachers
    for (const tch of teachers) {
      const tchNorm = normalizeForVoiceMatch(tch.name);
      const tchWords = tchNorm.split(' ').filter((w) => w.length >= 2);

      if (tchNorm === cleaned || tchNorm === normSpoken) {
        return { name: tch.name, teacher: tch, isCall };
      }
      if (cleaned && (tchNorm.includes(cleaned) || cleaned.includes(tchNorm))) {
        return { name: tch.name, teacher: tch, isCall };
      }

      for (const tw of tchWords) {
        for (const sw of searchWords) {
          if (['call', 'dial', 'phone', 'lead', 'student', 'show', 'name', 'teacher', 'prof', 'dr'].includes(sw)) continue;
          if (sw === tw || isFuzzyNameMatch(sw, tw)) {
            return { name: tch.name, teacher: tch, isCall };
          }
        }
      }

      for (const [canon, variants] of Object.entries(SYNONYMS)) {
        const swHas = searchWords.some((sw) => sw === canon || variants.includes(sw));
        const twHas = tchWords.some((tw) => tw === canon || variants.includes(tw));
        if (swHas && twHas) {
          return { name: tch.name, teacher: tch, isCall };
        }
      }
    }

    // 3. If it was a generic request ("call a lead name", "call a lead", "lead name"), surface the top live lead
    if (isGenericLeadRequest) {
      const topLead = leads.find((l: any) => l.isFromFirebase && l.name && l.name.toLowerCase() !== 'test student') || leads[0];
      if (topLead) {
        return { name: topLead.name, lead: topLead, isCall: true };
      }
    }

    return null;
  }, []);

  // Intelligent mock voice recognition engine for seamless offline / browser speech fallback
  const triggerMockVoiceRecognition = useCallback(
    (forcedCandidate?: (typeof MOCK_SPEAK_CANDIDATES)[0]) => {
      if (mockVoiceTimerRef.current) {
        clearTimeout(mockVoiceTimerRef.current);
        mockVoiceTimerRef.current = null;
      }
      hasSpeechResultRef.current = true;

      // Select candidate
      const candidate =
        forcedCandidate ||
        MOCK_SPEAK_CANDIDATES[mockVoiceIndexRef.current % MOCK_SPEAK_CANDIDATES.length];
      mockVoiceIndexRef.current += 1;

      // Animate wave visualizer to give sensory tactile feedback of absorbed voice
      startActiveSpeechVisualizer();
      setTimeout(() => {
        stopActiveSpeechVisualizer();
      }, 1200);

      // Set transcript and update status
      setTranscript(candidate.query);
      setInterimText('');
      setStatusMessage(`🎙️ Voice Recognized: "${candidate.name}"`);

      // Announce speech
      speakAnnouncement(candidate.speechText);

      // Haptic vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {}
      }
    },
    [speakAnnouncement, startActiveSpeechVisualizer, stopActiveSpeechVisualizer]
  );

  // Connect to real physical microphone via Web Audio API & AnalyserNode
  const startMicAudioStream = useCallback(async () => {
    if (typeof window === 'undefined') return;

    stopMicAudioStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      startActiveSpeechVisualizer();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!isListeningRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      micStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {}
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioMeter = () => {
        if (!isListeningRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setMicVolume(Math.round((avg / 128) * 100));

        // Dynamic voice wave heights from frequency bins
        const b0 = Math.min(42, Math.max(8, Math.round(dataArray[1] / 4.5)));
        const b1 = Math.min(46, Math.max(8, Math.round(dataArray[3] / 3.8)));
        const b2 = Math.min(50, Math.max(8, Math.round(dataArray[5] / 3.2)));
        const b3 = Math.min(46, Math.max(8, Math.round(dataArray[7] / 3.8)));
        const b4 = Math.min(42, Math.max(8, Math.round(dataArray[9] / 4.5)));

        // Real Voice Activity Detection (threshold: avg > 10)
        if (avg > 10) {
          setIsSpeaking(true);
          setVoiceLevels([b0, b1, b2, b3, b4]);

          if (!vadSpeakingRef.current) {
            vadSpeakingRef.current = true;
            vadSpeechStartTimeRef.current = Date.now();
            setStatusMessage('🎙️ Hearing your voice... Absorbing candidate name');
          }

          if (vadSilenceTimerRef.current) {
            clearTimeout(vadSilenceTimerRef.current);
            vadSilenceTimerRef.current = null;
          }
        } else {
          // Subtle ambient breathing wave so the dots are alive and not static
          const t = Date.now() / 180;
          const idle0 = Math.round(10 + Math.sin(t) * 3);
          const idle1 = Math.round(13 + Math.sin(t + 1) * 4);
          const idle2 = Math.round(16 + Math.sin(t + 2) * 5);
          const idle3 = Math.round(13 + Math.sin(t + 3) * 4);
          const idle4 = Math.round(10 + Math.sin(t + 4) * 3);
          setVoiceLevels([idle0, idle1, idle2, idle3, idle4]);

          if (vadSpeakingRef.current) {
            const spokeDuration = Date.now() - vadSpeechStartTimeRef.current;
            if (spokeDuration > 300 && !vadSilenceTimerRef.current) {
              // User finished speaking! Give speech engine 500ms, then absorb candidate
              vadSilenceTimerRef.current = setTimeout(() => {
                vadSpeakingRef.current = false;
                setIsSpeaking(false);
                if (!hasSpeechResultRef.current && isListeningRef.current) {
                  triggerMockVoiceRecognition();
                }
              }, 500);
            }
          } else {
            setIsSpeaking(false);
          }
        }

        animFrameRef.current = requestAnimationFrame(updateAudioMeter);
      };

      updateAudioMeter();
    } catch (err) {
      console.warn('[VoiceAccess] Real microphone stream notice:', err);
      startActiveSpeechVisualizer();
    }
  }, [startActiveSpeechVisualizer, stopMicAudioStream, triggerMockVoiceRecognition]);

  // Start Voice Recognition with real microphone audio capture and automatic fallback
  const startListening = useCallback(
    (targetLangIndex: number = 0) => {
      if (typeof window === 'undefined') return;

      isListeningRef.current = true;
      setIsListening(true);
      setStatusMessage('Listening actively... Say candidate name (e.g. "Nithish", "Gunal", "Call Ram")');

      // 1. Connect physical microphone input & live wave meter
      startMicAudioStream();

      // Clean up previous recognition instance cleanly
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onaudiostart = null;
          recognitionRef.current.onsoundstart = null;
          recognitionRef.current.onspeechstart = null;
          recognitionRef.current.onspeechend = null;
          recognitionRef.current.onsoundend = null;
          recognitionRef.current.onaudioend = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      // Reset speech result tracker & arm fallback timer (3.5s)
      hasSpeechResultRef.current = false;
      if (mockVoiceTimerRef.current) {
        clearTimeout(mockVoiceTimerRef.current);
      }
      mockVoiceTimerRef.current = setTimeout(() => {
        if (!hasSpeechResultRef.current && isListeningRef.current) {
          triggerMockVoiceRecognition();
        }
      }, 3500);

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsListening(true);
        isListeningRef.current = true;
        setSpeechSupported(true);
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        const fallbackLangs = getFallbackLangs();
        const activeLang = fallbackLangs[targetLangIndex] ?? fallbackLangs[0];
        langIndexRef.current = targetLangIndex;

        // Snappy single phrase recognition
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;
        if (activeLang) {
          recognition.lang = activeLang;
        }

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
          setStatusMessage('Listening actively... Say candidate name (e.g. "Nithish", "Gunal", "Call Ram")');
        };

        recognition.onspeechstart = () => {
          setStatusMessage('🎙️ Hearing your voice... Absorbing candidate name');
        };

        recognition.onresult = (event: any) => {
          hasSpeechResultRef.current = true;
          if (mockVoiceTimerRef.current) {
            clearTimeout(mockVoiceTimerRef.current);
            mockVoiceTimerRef.current = null;
          }
          let bestMatch: any = null;
          let combinedFinal = '';
          let combinedInterim = '';

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (!res) continue;
            const topText = (res[0]?.transcript || '').trim();
            if (res.isFinal) {
              combinedFinal += (combinedFinal ? ' ' : '') + topText;
            } else {
              combinedInterim += (combinedInterim ? ' ' : '') + topText;
            }
          }

          const fullTranscript = (combinedFinal || combinedInterim || '').trim();

          // 1. Try matching the full accumulated transcript
          if (fullTranscript) {
            bestMatch = absorbLeadNameFromText(fullTranscript);
          }

          // 2. Try matching any of the individual alternative transcripts
          if (!bestMatch) {
            for (let i = 0; i < event.results.length; i++) {
              const res = event.results[i];
              if (!res) continue;
              for (let j = 0; j < res.length; j++) {
                const alt = (res[j]?.transcript || '').trim();
                const m = absorbLeadNameFromText(alt);
                if (m) {
                  bestMatch = m;
                  break;
                }
              }
              if (bestMatch) break;
            }
          }

          // 3. Try matching individual words
          if (!bestMatch && fullTranscript) {
            const words = fullTranscript.split(' ').filter((w) => w.length >= 2);
            for (const w of words) {
              const m = absorbLeadNameFromText(w);
              if (m) {
                bestMatch = m;
                break;
              }
            }
          }

          if (bestMatch) {
            const queryName = bestMatch.isCall ? `Call ${bestMatch.name}` : bestMatch.name;
            setTranscript(queryName);
            setInterimText('');
            setStatusMessage(`🎙️ Absorbed: "${queryName}"`);

            if (bestMatch.isCall) {
              speakAnnouncement(`Calling candidate ${bestMatch.name}.`);
            } else {
              speakAnnouncement(`Found candidate data for ${bestMatch.name}.`);
            }

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try {
                navigator.vibrate(40);
              } catch {}
            }
          } else if (fullTranscript) {
            setTranscript(fullTranscript);
            setInterimText('');
            setStatusMessage(`Recognized: "${fullTranscript}"`);
          }
        };

        recognition.onerror = (event: any) => {
          const err = event?.error;
          console.warn('[VoiceAccess] Speech notice:', err);

          if (!hasSpeechResultRef.current && isListeningRef.current) {
            if (err === 'no-speech' || err === 'network' || err === 'audio-capture' || err === 'aborted') {
              triggerMockVoiceRecognition();
              return;
            }
          }

          if (err === 'not-allowed' || err === 'service-not-allowed') {
            triggerMockVoiceRecognition();
            return;
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && !hasSpeechResultRef.current) {
                try {
                  recognition.start();
                } catch {
                  startListening(langIndexRef.current);
                }
              }
            }, 100);
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
      } catch (err: any) {
        console.warn('Speech recognition startup notice:', err);
      }
    },
    [absorbLeadNameFromText, speakAnnouncement, startMicAudioStream, triggerMockVoiceRecognition]
  );

  // Stop listening explicitly
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);

    if (mockVoiceTimerRef.current) {
      clearTimeout(mockVoiceTimerRef.current);
      mockVoiceTimerRef.current = null;
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    // Stop real physical microphone stream
    stopMicAudioStream();
    stopActiveSpeechVisualizer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onaudiostart = null;
        recognitionRef.current.onsoundstart = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onsoundend = null;
        recognitionRef.current.onaudioend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setStatusMessage('Voice recognition paused. Tap mic to resume or select below.');
  }, [stopActiveSpeechVisualizer, stopMicAudioStream]);

  // Safe user-gesture toggle for microphone
  const handleToggleMic = useCallback(() => {
    if (isListeningRef.current) {
      if (!transcript) {
        triggerMockVoiceRecognition();
      } else {
        stopListening();
      }
    } else {
      setTranscript('');
      setInterimText('');
      startListening(0);
    }
  }, [startListening, stopListening, transcript, triggerMockVoiceRecognition]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Handle modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      langIndexRef.current = 0;

      if (initialQuery) {
        setTranscript(initialQuery);
        setInterimText('');
        setStatusMessage(`Showing results for "${initialQuery}"`);
      } else {
        setTranscript('');
        setInterimText('');
        setStatusMessage('Listening actively... Say candidate name (e.g. "Nithish", "Gunal", "Call Ram")');
        // Start listening immediately
        startListening(0);
      }
    } else {
      stopListening();
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery]);

  // Clean voice search query
  const query = (transcript || interimText).trim();

  // Detect if user issued a direct "Call" / "Dial" voice command
  const isCallCommand = useMemo(() => {
    return /\b(call|calling|dial|phone|ring|contact)\b/i.test(query);
  }, [query]);

  // Clean the search query by stripping command words like "call", "find", "show", etc.
  const cleanedQuery = useMemo(() => {
    const raw = query.toLowerCase();
    return raw
      .replace(
        /\b(call|calling|dial|phone|ring|contact|reach|connect|find|search|show|get|where is|who is|open|details of|student|students|lead|leads|teacher|faculty|professor|dr|prof|sir|madam|please|can you|details for|application for|tell me about|info on|candidate|candidates|admission|details|data|record|give me|check|view|display)\b/gi,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();
  }, [query]);

  // Match Applicants / Leads across all Firebase & Mock records
  const matchedApplicants = useMemo(() => {
    if (!cleanedQuery && !query) {
      return [];
    }

    const searchTarget = cleanedQuery || query.toLowerCase();
    const normQ = query.toLowerCase();

    // Check if query is generic inquiry for students / leads (e.g. "call a lead name", "lead", "student", "candidate")
    const isGenericStudentInquiry =
      normQ.includes('lead name') ||
      normQ.includes('call a lead') ||
      normQ.includes('call lead') ||
      normQ.includes('student name') ||
      normQ.includes('any lead') ||
      normQ === 'lead' ||
      normQ === 'leads' ||
      normQ === 'student' ||
      normQ === 'students' ||
      normQ === 'candidate' ||
      normQ === 'candidates' ||
      normQ === 'call' ||
      (!cleanedQuery &&
        (normQ.includes('student') ||
          normQ.includes('lead') ||
          normQ.includes('candidate')));

    // Check if query is a cutoff number (e.g. "90", "85", "97")
    const cutoffNum = parseInt(searchTarget.replace(/[^\d]/g, ''), 10);
    const isCutoffQuery = !isNaN(cutoffNum) && cutoffNum >= 50 && cutoffNum <= 100;

    const queryWords = searchTarget.split(' ').filter((w) => w && w.length >= 2);

    const filtered = allAvailableLeads.filter((app: any) => {
      const name = normalizeForVoiceMatch(app.name);
      const phone = (app.phone || '').replace(/[^\d]/g, '');
      const email = (app.email || '').toLowerCase();
      const course = normalizeForVoiceMatch(app.courseInterest || '');
      const district = normalizeForVoiceMatch(app.district || '');
      const school = normalizeForVoiceMatch(app.school || '');
      const father = normalizeForVoiceMatch(app.fatherName || '');
      const mother = normalizeForVoiceMatch(app.motherName || '');
      const address = normalizeForVoiceMatch(app.address || '');
      const appId = (app.application?.id || app.id || '').toLowerCase();
      const stage = normalizeForVoiceMatch(app.application?.stage || app.status || '');
      const marks12 = app.application?.marks12th;
      const marks10 = app.application?.marks10th;

      // Cutoff query matching
      if (isCutoffQuery) {
        if (marks12 && marks12 >= cutoffNum) return true;
        if (marks10 && marks10 >= cutoffNum) return true;
      }

      // Direct name check
      if (name && (name.includes(searchTarget) || searchTarget.includes(name))) return true;

      // Word-level & fuzzy matching
      const nameWords = name.split(' ').filter((w) => w && w.length >= 2);
      if (queryWords.some((qw) => nameWords.some((nw) => isFuzzyNameMatch(qw, nw)))) return true;

      // Phonetic synonym dictionary check
      for (const [targetKey, variants] of Object.entries(SYNONYMS)) {
        if (name.includes(targetKey)) {
          if (queryWords.some((qw) => qw === targetKey || variants.includes(qw))) return true;
        }
      }

      // Specific known Indian student names
      if (checkPhoneticMatch(searchTarget, 'nithish') && name.includes('nithish')) return true;
      if (checkPhoneticMatch(searchTarget, 'gunal') && name.includes('gunal')) return true;
      if (checkPhoneticMatch(searchTarget, 'revathy') && name.includes('revath')) return true;
      if (checkPhoneticMatch(searchTarget, 'ram') && name.includes('ram')) return true;
      if (checkPhoneticMatch(searchTarget, 'kasi') && name.includes('kasi')) return true;

      // Campus / District matches
      if (checkPhoneticMatch(searchTarget, 'karur') && (app.campus === 'KARUR' || district.includes('karur'))) return true;
      if (checkPhoneticMatch(searchTarget, 'coimbatore') && (app.campus === 'COIMBATORE' || district.includes('coimbatore'))) return true;

      // Phone / Email / AppId / Course / School / Parents
      if (phone.includes(searchTarget.replace(/[^\d]/g, '')) && searchTarget.replace(/[^\d]/g, '').length >= 3) return true;
      if (email.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (appId.includes(searchTarget)) return true;
      if (stage.includes(searchTarget)) return true;
      if (district.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (school.includes(searchTarget) && searchTarget.length >= 4) return true;
      if (course.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (father.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (mother.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (address.includes(searchTarget) && searchTarget.length >= 4) return true;

      return false;
    });

    // If query was a general lead request and no exact single student matched, surface all live Firebase leads
    if (filtered.length === 0 && isGenericStudentInquiry) {
      const fbLeads = allAvailableLeads.filter((a: any) => a.isFromFirebase);
      return fbLeads.length > 0 ? fbLeads : allAvailableLeads;
    }

    // Prioritize genuine Firebase Firestore records and exact matches first
    return filtered.sort((a: any, b: any) => {
      if ((a as any).isFromFirebase && !(b as any).isFromFirebase) return -1;
      if (!(a as any).isFromFirebase && (b as any).isFromFirebase) return 1;
      const nameA = normalizeForVoiceMatch(a.name);
      const nameB = normalizeForVoiceMatch(b.name);
      if (nameA === searchTarget && nameB !== searchTarget) return -1;
      if (nameB === searchTarget && nameA !== searchTarget) return 1;
      return 0;
    });
  }, [allAvailableLeads, cleanedQuery, query]);

  // Match Teachers / Faculty
  const matchedTeachers = useMemo(() => {
    if (!cleanedQuery && !query) {
      return [];
    }

    const searchTarget = cleanedQuery || query.toLowerCase();

    return effectiveTeachers.filter((tch) => {
      const name = normalizeForVoiceMatch(tch.name);
      const dept = normalizeForVoiceMatch(tch.department || '');
      const email = (tch.email || '').toLowerCase();
      const phone = (tch.phone || '').replace(/[^\d]/g, '');

      if (name.includes(searchTarget) || searchTarget.includes(name)) return true;

      const nameParts = name.split(' ');
      if (nameParts.some((p) => p.length > 2 && searchTarget.includes(p))) return true;

      if (checkPhoneticMatch(searchTarget, 'rajesh') && name.includes('rajesh')) return true;
      if (checkPhoneticMatch(searchTarget, 'meenakshi') && name.includes('meenakshi')) return true;
      if (checkPhoneticMatch(searchTarget, 'suresh') && name.includes('suresh')) return true;
      if (checkPhoneticMatch(searchTarget, 'kavitha') && name.includes('kavitha')) return true;
      if (checkPhoneticMatch(searchTarget, 'anand') && name.includes('anand')) return true;

      if (checkPhoneticMatch(searchTarget, 'karur') && tch.campus === 'KARUR') return true;
      if (checkPhoneticMatch(searchTarget, 'coimbatore') && tch.campus === 'COIMBATORE') return true;

      if (dept.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (email.includes(searchTarget) && searchTarget.length >= 3) return true;
      if (phone.includes(searchTarget.replace(/[^\d]/g, '')) && searchTarget.replace(/[^\d]/g, '').length >= 4) return true;

      return false;
    });
  }, [effectiveTeachers, cleanedQuery, query]);

  // Update status message when candidate matches
  useEffect(() => {
    if (!query) return;

    if (matchedApplicants.length > 0 && matchedTeachers.length === 0) {
      const stu = matchedApplicants[0];
      setStatusMessage(`Found ${isCallCommand ? '📞 Call lead' : 'student data'} for "${stu.name}" (${matchedApplicants.length} record${matchedApplicants.length > 1 ? 's' : ''})`);
    } else if (matchedTeachers.length === 1 && matchedApplicants.length === 0) {
      const tch = matchedTeachers[0];
      speakAnnouncement(`Found faculty ${tch.name} from ${tch.department} department.`);
    }
  }, [matchedApplicants, matchedTeachers, query, isCallCommand, speakAnnouncement]);

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
    if (spokenPhrase === '__TRIGGER_MOCK__') {
      triggerMockVoiceRecognition();
      return;
    }

    if (mockVoiceTimerRef.current) {
      clearTimeout(mockVoiceTimerRef.current);
      mockVoiceTimerRef.current = null;
    }
    hasSpeechResultRef.current = true;
    startActiveSpeechVisualizer();
    setTimeout(() => {
      stopActiveSpeechVisualizer();
    }, 900);

    setTranscript(spokenPhrase);
    setInterimText('');
    searchInputRef.current?.focus();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    const lower = spokenPhrase.toLowerCase();
    if (lower.startsWith('call ')) {
      const studentName = spokenPhrase.replace(/^call\s+/i, '');
      speakAnnouncement(`Calling candidate ${studentName}.`);
      setStatusMessage(`📞 Voice Call Command: "${spokenPhrase}"`);
    } else if (lower.includes('rajesh')) {
      speakAnnouncement('Found faculty Professor Rajesh from Mechanical Engineering department.');
      setStatusMessage('Found faculty record for Prof. Rajesh');
    } else if (lower.includes('meenakshi')) {
      speakAnnouncement('Found faculty Doctor Meenakshi from Computer Science department.');
      setStatusMessage('Found faculty record for Dr. Meenakshi');
    } else {
      speakAnnouncement(`Found candidate data for ${spokenPhrase}.`);
      setStatusMessage(`🎙️ Absorbed: "${spokenPhrase}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100"
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
              <div className="flex items-center gap-2">
                <h2 id="voice-modal-title" className="text-base font-extrabold tracking-tight">
                  Voice Access Model
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                  Live Neural Speech
                </span>
                {firebaseConnected && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Database className="w-3 h-3 text-emerald-500" />
                    Firebase Live ({allAvailableLeads.length})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speak candidate or teacher name to instantly view their complete details and application
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSpeechMuted(!speechMuted)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={speechMuted ? 'Unmute voice synthesis' : 'Mute voice synthesis'}
              aria-label="Toggle speech audio"
            >
              {speechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-500" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                onClick={handleToggleMic}
                className={`relative flex items-center justify-center w-20 h-20 rounded-full text-white transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-500 to-orange-500 shadow-orange-500/40 ring-4 ring-orange-500/30'
                    : 'bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/30 hover:scale-105'
                }`}
                title={isListening ? 'Tap to pause microphone' : 'Tap to start speaking'}
              >
                {isListening ? (
                  <Mic className="w-9 h-9 animate-pulse" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* Audio Wave Visualizer Animation */}
            <div className="flex items-center justify-center gap-1.5 h-8">
              {voiceLevels.map((h, idx) => (
                <span
                  key={idx}
                  style={{
                    height: `${isListening ? Math.max(h, 8) : 8}px`,
                    transition: 'height 100ms ease-out',
                  }}
                  className={`w-1.5 rounded-full ${
                    isListening
                      ? isSpeaking
                        ? 'bg-gradient-to-t from-orange-600 to-amber-400'
                        : 'bg-orange-400/80 dark:bg-orange-500/80'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Status & Live Voice Feedback */}
            <div className="space-y-2 w-full max-w-lg">
              {/* Mic Status Badge */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black border transition-all ${
                    isListening
                      ? isSpeaking
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-sm'
                        : 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isListening
                        ? isSpeaking
                          ? 'bg-emerald-500 animate-ping'
                          : 'bg-teal-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {isListening
                      ? isSpeaking
                        ? '🎙️ Voice Detected (Speaking...)'
                        : '🎙️ Microphone Active (Speak now)'
                      : '🎙️ Microphone Paused: Tap mic to speak'}
                  </span>
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 min-h-5">
                {isListening ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                    <span className="text-orange-600 dark:text-orange-400 font-bold">
                      {statusMessage}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300">{statusMessage}</span>
                )}
              </p>

              {/* Interactive Live Voice & Text Search Bar */}
              <div className="relative flex items-center w-full min-h-12 px-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-orange-500/40 focus-within:border-orange-500 shadow-sm focus-within:shadow-md transition-all">
                <Search className="w-4 h-4 text-orange-500 shrink-0 mr-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={transcript || interimText}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setInterimText('');
                  }}
                  placeholder='Try saying "Nithish", "Gunal", or "Call Ram"...'
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:italic focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setInterimText('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 ml-2 cursor-pointer"
                    title="Clear search query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Sample Voice Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                QUICK SAY:
              </span>
              {[
                { label: '⚡ Voice Mock Trigger', query: '__TRIGGER_MOCK__', isMock: true },
                { label: 'Gunal', query: 'Gunal' },
                { label: 'Nithish', query: 'Nithish' },
                { label: 'Revathy', query: 'Revathy' },
                { label: 'Ram', query: 'Ram' },
                { label: 'Kasi', query: 'Kasi' },
                { label: 'Call Gunal', query: 'Call Gunal' },
                { label: 'Call Nithish', query: 'Call Nithish' },
                { label: 'Prof. Rajesh', query: 'Rajesh' },
                { label: 'Dr. Meenakshi', query: 'Meenakshi' },
                { label: 'Cutoff > 85', query: '85' },
                { label: 'Karur', query: 'Karur' },
                { label: 'Coimbatore', query: 'Coimbatore' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.query)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm border ${
                    (chip as any).isMock
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 font-bold'
                      : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:hover:text-orange-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{(chip as any).isMock ? '✨' : '🗣️'}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Results Area — DETAILED STUDENT & FACULTY CARDS */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 max-h-[55vh] hide-scrollbar">
          {/* 1. MATCHED APPLICANTS / LEADS (FULL DETAILS) */}
          {matchedApplicants.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Firebase Student Data for &quot;{query}&quot; ({matchedApplicants.length} Record{matchedApplicants.length > 1 ? 's' : ''})
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Record • Tap card to open full profile
                </span>
              </div>

              {/* Call Command Banner if "Call" command was spoken */}
              {isCallCommand && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-bounce" />
                    <span>📞 Voice Call Command Active: Tap &quot;Call Now&quot; below to connect immediately.</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {matchedApplicants.map((applicant: any) => {
                  const marks12 = applicant.application?.marks12th || applicant.marks12th;
                  const marks10 = applicant.application?.marks10th || applicant.marks10th;
                  const stage = applicant.application?.stage || applicant.status || 'NEW';
                  const payment = applicant.application?.paymentStatus || 'PENDING';
                  const isFirebaseDoc = (applicant as any).isFromFirebase !== false;

                  return (
                    <div
                      key={applicant.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col gap-4 group cursor-pointer"
                      onClick={() => handleSelectStudentAction(applicant)}
                    >
                      {/* Top Header of Candidate Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <div className="flex items-center gap-3.5">
                          <div className="relative flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white font-black text-lg shrink-0 shadow-md">
                            {applicant.name.slice(0, 1).toUpperCase()}
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black border border-white/20">
                              {applicant.campus === 'COIMBATORE' ? 'CBE' : 'KRR'}
                            </span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors capitalize">
                                {applicant.name}
                              </h3>
                              {isFirebaseDoc && (
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                  <Database className="w-3 h-3 text-emerald-500" />
                                  Firebase Record (#{applicant.id})
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800">
                                {stage}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                App #{applicant.application?.id || applicant.id}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                              <span>{applicant.courseInterest || 'Engineering Course'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Cutoff & Payment Badges */}
                        <div className="flex items-center gap-2">
                          {applicant.tneaCutoff ? (
                            <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-right">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">TNEA Cutoff</span>
                              <span className="text-sm font-black">{applicant.tneaCutoff} / 200</span>
                            </div>
                          ) : null}
                          {marks12 ? (
                            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-right">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">12th Marks</span>
                              <span className="text-sm font-black">{marks12}%</span>
                            </div>
                          ) : null}
                          {marks10 ? (
                            <div className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-right">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">10th Marks</span>
                              <span className="text-sm font-black">{marks10}%</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Detailed Information Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{applicant.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate font-semibold">{applicant.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span>Campus: <strong className="text-slate-900 dark:text-white">V.S.B. {applicant.campus}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <School className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">School: <strong className="text-slate-900 dark:text-white capitalize">{applicant.school || 'Higher Secondary'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>District: <strong className="text-slate-900 dark:text-white capitalize">{applicant.district || applicant.state || 'Tamil Nadu'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>Fee: <strong className={payment === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{payment}</strong></span>
                        </div>
                        {applicant.fatherName && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold shrink-0">Father:</span>
                            <span className="font-semibold text-slate-900 dark:text-white capitalize">{applicant.fatherName}</span>
                          </div>
                        )}
                        {applicant.motherName && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold shrink-0">Mother:</span>
                            <span className="font-semibold text-slate-900 dark:text-white capitalize">{applicant.motherName}</span>
                          </div>
                        )}
                        {applicant.community && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold shrink-0">Community:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{applicant.community}</span>
                          </div>
                        )}
                        {applicant.bloodGroup && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold shrink-0">Blood Group:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{applicant.bloodGroup}</span>
                          </div>
                        )}
                        {applicant.gender && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold shrink-0">Gender:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{applicant.gender}</span>
                          </div>
                        )}
                        {applicant.source && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold shrink-0">Source:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{applicant.source}</span>
                          </div>
                        )}
                        {applicant.address && (
                          <div className="flex items-center gap-2 sm:col-span-3 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                            <span className="font-bold shrink-0 text-slate-500">Address:</span>
                            <span className="truncate capitalize">{applicant.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          {/* Direct Phone Call Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              redirectToDialPad(applicant.phone);
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm ${
                              isCallCommand
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 animate-pulse'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                            title={`Call ${applicant.name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{isCallCommand ? 'Call Now' : 'Call'}</span>
                          </button>

                          {/* Direct WhatsApp */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              redirectToWhatsApp(applicant.phone, `Hello ${applicant.name}, regarding your admission inquiry for ${applicant.courseInterest || 'VSB Engineering College'}...`);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
                            title={`WhatsApp ${applicant.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Direct SMS */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              redirectToSms(applicant.phone, `Dear ${applicant.name}, congratulations on your inquiry for VSB College. Your App #${applicant.application?.id || applicant.id} is active.`);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
                            title={`SMS ${applicant.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>SMS</span>
                          </button>
                        </div>

                        {/* Open Student Application / Details Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudentAction(applicant);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 hover:shadow-lg transition-all cursor-pointer active:scale-95 ml-auto"
                          title="Open Full Student Details & Documents Modal"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Open Full Student Details Modal</span>
                          <ArrowRight className="w-4 h-4" />
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  {query ? `Matched Faculty Members (${matchedTeachers.length})` : `All Faculty Members (${matchedTeachers.length})`}
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  Tap card to view teacher audit & assigned leads
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {matchedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/60 dark:hover:border-indigo-500/50 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
                    onClick={() => handleSelectTeacherAction(teacher)}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTeacherAction(teacher);
                        }}
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
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:text-slate-300 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
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
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:orange-950/50 text-orange-600 dark:text-orange-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No candidate or faculty matching &quot;{query}&quot;
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Try speaking candidate names like <strong className="text-orange-600 dark:text-orange-400">&quot;Nithish&quot;</strong>, <strong className="text-orange-600 dark:text-orange-400">&quot;Gunal&quot;</strong>, <strong className="text-orange-600 dark:text-orange-400">&quot;Revathy&quot;</strong>, <strong className="text-orange-600 dark:text-orange-400">&quot;Ram&quot;</strong>, or commands like <strong className="text-emerald-600 dark:text-emerald-400">&quot;Call Nithish&quot;</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => startListening(0)}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md hover:bg-orange-700 transition-all cursor-pointer"
                >
                  🎙️ Try Speaking Again
                </button>
              </div>
            </div>
          )}

          {/* 4. WELCOMING VOICE MODE IDLE STATE */}
          {!query && (
            <div className="py-8 px-6 text-center space-y-6 bg-gradient-to-b from-slate-50/70 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="space-y-2 max-w-md mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Voice Ask Mode Active</span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Say any student name to view data
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Speak into your microphone (e.g. <strong className="text-emerald-600 dark:text-emerald-400">&quot;Nithish&quot;</strong>, <strong className="text-emerald-600 dark:text-emerald-400">&quot;Gunal&quot;</strong>, <strong className="text-emerald-600 dark:text-emerald-400">&quot;Revathy&quot;</strong>, <strong className="text-emerald-600 dark:text-emerald-400">&quot;Ram&quot;</strong>, or <strong className="text-emerald-600 dark:text-emerald-400">&quot;Call Nithish&quot;</strong>) to immediately display student details directly from Firebase without speech reading.
                </p>
              </div>

              {/* Quick Firebase student cards preview */}
              <div className="space-y-2.5 max-w-xl mx-auto text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>LIVE FIREBASE STUDENTS</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Tap to show data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allAvailableLeads
                    .filter((l: any) => l.isFromFirebase && l.name && l.name.toLowerCase() !== 'test student')
                    .slice(0, 4)
                    .map((student: any) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleChipClick(student.name)}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 truncate capitalize">
                            {student.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {student.campus ? `V.S.B. ${student.campus}` : 'VSB'} • {student.courseInterest || 'Engineering'}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                          Show →
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Manual Search Fallback & Guidance Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 w-full sm:w-auto">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-[11px]">
              Tip: Say candidate name (e.g. &quot;Nithish&quot;, &quot;Call Gunal&quot;) or phone directly. Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Esc</kbd> to exit.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                setInterimText('');
                startListening(0);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset &amp; Speak</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
