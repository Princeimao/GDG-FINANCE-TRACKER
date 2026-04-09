import { useState, useCallback, useRef, useEffect } from 'react';
import { correctSpeechWithAI } from './geminiService';

// ---- useToast ----
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return { toasts, addToast };
}

// ---- useSpeechRecognition (enhanced with AI correction) ----
export function useSpeechRecognition(onResult) {
  const [isRecording, setIsRecording]   = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported. Use Chrome or Edge.");
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => { setIsRecording(true); setTranscript(''); };
    recognition.onerror = (e) => {
      setIsRecording(false);
      console.warn("Speech error:", e.error);
    };
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = async (e) => {
      const results = Array.from(e.results);
      const best = results[results.length - 1];
      const raw = best[0].transcript;
      setTranscript(raw);

      if (best.isFinal) {
        setIsProcessing(true);
        try {
          // background key is used within correctSpeechWithAI
          const corrected = await correctSpeechWithAI(raw);
          onResult(corrected.trim());
        } catch {
          onResult(raw); // fallback to raw
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  return { isRecording, isProcessing, transcript, startRecording, stopRecording };
}

// ---- useLocalStorage ----
export function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    const resolved = typeof value === 'function' ? value(state) : value;
    setState(resolved);
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
    } catch {}
  }, [state]);

  return [state, setValue];
}

// ---- useThinkingIndicator ----
export function useThinking() {
  const [thinking, setThinking] = useState(false);
  const [thinkingMsg, setThinkingMsg] = useState('');
  
  const startThinking = (msg = 'Analyzing…') => {
    setThinking(true);
    setThinkingMsg(msg);
  };
  const stopThinking = () => {
    setThinking(false);
    setThinkingMsg('');
  };
  return { thinking, thinkingMsg, startThinking, stopThinking };
}
