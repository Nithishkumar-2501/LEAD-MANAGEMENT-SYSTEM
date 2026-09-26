'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface VoiceSearchBarProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onClear?: () => void;
  onVoiceSearchStart?: () => void;
  onVoiceSearchEnd?: (transcript: string) => void;
  onOpenVoiceModal?: () => void;
  ariaLabel?: string;
  containerWidth?: string;
}

export default function VoiceSearchBar({
  id = 'voice-search-input',
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = 'Search candidate applications...',
  className = '',
  inputClassName = '',
  autoFocus = false,
  onClear,
  onVoiceSearchStart,
  onVoiceSearchEnd,
  onOpenVoiceModal,
  ariaLabel = 'Search',
  containerWidth,
}: VoiceSearchBarProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check Web Speech API availability
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showTemporaryFeedback = (msg: string, durationMs = 3000) => {
    setFeedbackMessage(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
    }, durationMs);
  };

  const handleMicToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onOpenVoiceModal) {
      onOpenVoiceModal();
      return;
    }

    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setFeedbackMessage(null);
      return;
    }

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      showTemporaryFeedback('Voice input not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Default to Indian English for college CRM

      recognition.onstart = () => {
        setIsListening(true);
        showTemporaryFeedback('🎙️ Listening... Speak candidate name or phone', 6000);
        onVoiceSearchStart?.();
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript) {
          onChange(transcript);
        }

        const isFinal = event.results[event.results.length - 1].isFinal;
        if (isFinal) {
          onVoiceSearchEnd?.(transcript);
          showTemporaryFeedback(`Searched: "${transcript}"`, 2500);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showTemporaryFeedback('Microphone access blocked. Please enable it in browser.');
        } else if (event.error === 'no-speech') {
          showTemporaryFeedback('No speech detected. Please try again.');
        } else {
          showTemporaryFeedback(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      showTemporaryFeedback('Unable to start microphone.');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} style={{ width: containerWidth }}>
      <div
        className={`InputContainer ${isListening ? 'is-listening ring-2 ring-orange-500/40' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          name="text"
          className={`input ${inputClassName}`}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={isListening ? 'Listening... speak now' : placeholder}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck="false"
        />

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            title="Clear search"
            aria-label="Clear search"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <label htmlFor={id} className="labelforsearch" title="Search">
            <svg viewBox="0 0 512 512" className="searchIcon" aria-hidden="true">
              <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
            </svg>
          </label>
        )}

        <div className="border" />

        <button
          type="button"
          className={`micButton ${isListening ? 'listening' : ''}`}
          onClick={handleMicToggle}
          title={
            isListening
              ? 'Listening... Click to stop'
              : speechSupported
              ? 'Voice Search (Click and speak)'
              : 'Voice search not supported'
          }
          aria-label="Voice Search"
        >
          <svg viewBox="0 0 384 512" className="micIcon" aria-hidden="true">
            <path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z" />
          </svg>
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Floating feedback tooltip for listening status or alerts */}
      {feedbackMessage && (
        <div className="absolute left-0 top-full mt-1.5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/95 text-white dark:bg-slate-800 dark:text-slate-100 text-[11px] font-semibold shadow-xl border border-orange-500/30 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150 whitespace-nowrap">
          {isListening && (
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          )}
          <span>{feedbackMessage}</span>
        </div>
      )}
    </div>
  );
}
