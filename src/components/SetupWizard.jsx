import { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, VolumeX, Sparkles, CheckCircle } from 'lucide-react';
import { chatWithFinanceAI, extractSetupData } from '../geminiService';

const MOCK_DATA = [
  { id: 1, date: "2024-04-01", amount: 450,   category: "Food",          merchant: "Zomato",         type: "expense" },
  { id: 2, date: "2024-04-01", amount: 50000, category: "Other",         merchant: "Salary",         type: "income"  },
  { id: 3, date: "2024-04-02", amount: 2300,  category: "Shopping",      merchant: "Amazon",         type: "expense" },
  { id: 4, date: "2024-04-03", amount: 280,   category: "Transport",     merchant: "Uber",           type: "expense" },
  { id: 5, date: "2024-04-04", amount: 499,   category: "Bills",         merchant: "Netflix",        type: "expense" },
  { id: 6, date: "2024-04-05", amount: 850,   category: "Health",        merchant: "Apollo Pharmacy",type: "expense" },
  { id: 7, date: "2024-04-06", amount: 1200,  category: "Transport",     merchant: "Petrol",         type: "expense" },
  { id: 8, date: "2024-04-07", amount: 340,   category: "Food",          merchant: "Swiggy",         type: "expense" },
  { id: 9, date: "2024-04-08", amount: 2100,  category: "Bills",         merchant: "Electricity",    type: "expense" },
  { id:10, date: "2024-04-09", amount: 560,   category: "Food",          merchant: "Dominos",        type: "expense" },
  { id:11, date: "2024-04-09", amount: 1500,  category: "Shopping",      merchant: "Myntra",         type: "expense" },
  { id:12, date: "2024-04-09", amount: 800,   category: "Entertainment", merchant: "PVR Cinema",     type: "expense" },
];

export function SetupWizard({ onComplete }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome to FinanceAI! I'm your personal financial assistant. To get started, I'll help you set up your profile. What is your average monthly income (salary, business, or other sources)?" }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); 
  
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isSpeaking && messages.length === 1) {
      speak(messages[0].content);
    }
  }, []);

  const speak = (text) => {
    if (!isSpeaking) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = async (textOverride = null) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      let systemPrompt = "You are a friendly financial assistant helping a user with their initial setup. ";
      if (step === 1) {
        systemPrompt += "The user is providing income details. Be encouraging. If they shared income, ask for monthly recurring expenses (rent, utilities, etc.) next. If they didn't provide numbers, ask for them.";
      } else if (step === 2) {
        systemPrompt += "The user is providing expense details. Mention that they are almost done and ask if they have any other recurring bills or debt payments.";
      }

      const response = await chatWithFinanceAI(text, [], newMessages.slice(0, -1), systemPrompt);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speak(response);

      // Transition steps
      if (step === 1 && (text.match(/\d+/) || text.toLowerCase().includes('salary'))) {
        setStep(2);
      } else if (step === 2 && (text.toLowerCase().includes('done') || text.toLowerCase().includes('that\'s all') || text.toLowerCase().includes('nothing else'))) {
        // User indicates completion
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Could you repeat that?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeOnboarding = async () => {
    setIsLoading(true);
    try {
      const allText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const transactions = await extractSetupData(allText);

      onComplete(transactions);
    } catch (err) {
      alert("Failed to finalize setup. Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete(MOCK_DATA);
  };

  return (
    <div className="setup-wizard">
      <div className="wizard-container">
        <div className="wizard-header">
          <div className="logo-icon"><Sparkles size={20} /></div>
          <div style={{ flex: 1 }}>
            <h3>Setup Wizard</h3>
            <p className="text-secondary" style={{ fontSize: '12px' }}>Personalize your profile or skip to use mock data</p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleSkip}>
              Skip
            </button>
            <button className="btn-icon" onClick={() => setIsSpeaking(!isSpeaking)}>
              {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
        
        <div className="wizard-alert">
          💡 This wizard helps set up your initial finances. You can skip this step to jump directly to the dashboard with demo data.
        </div>

        <div className="wizard-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}><span>1</span> Income</div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}><span>2</span> Expenses</div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}><span>3</span> Finish</div>
        </div>

        <div className="wizard-chat" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`wizard-msg ${m.role}`}>
              <div className="msg-bubble">{m.content}</div>
            </div>
          ))}
          {isLoading && <div className="wizard-msg assistant"><div className="msg-bubble loading"><div className="spinner"></div></div></div>}
        </div>

        <div className="wizard-footer">
          <div className="input-group">
            <button className={`btn-icon voice-btn ${isListening ? 'listening' : ''}`} onClick={toggleListening}>
              <Mic size={20} />
            </button>
            <input 
              className="form-input" 
              placeholder="Type your response..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn-primary btn-icon" onClick={() => handleSend()}>
              <Send size={18} />
            </button>
          </div>
          
          {step >= 2 && (
            <button className="btn btn-green w-full mt-4" onClick={finalizeOnboarding} disabled={isLoading}>
              {isLoading ? "Finalizing..." : "Complete Setup"} <CheckCircle size={18} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        .wizard-alert {
          padding: 12px 24px;
          background: rgba(59,130,246,0.1);
          color: var(--accent-blue);
          font-size: 12px;
          border-bottom: 1px solid var(--border);
          line-height: 1.5;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
        .setup-wizard {
          position: fixed;
          inset: 0;
          background: var(--bg-primary);
          z-index: 2000;
          display: flex;
          align-items: center; justify-content: center;
          padding: 20px;
        }
        .wizard-container {
          width: 100%;
          max-width: 600px;
          height: min(800px, 90vh);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 100px rgba(0,0,0,0.8);
          overflow: hidden;
        }
        .wizard-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .wizard-progress {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
        }
        .progress-step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .progress-step span {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
        }
        .progress-step.active { color: var(--accent-blue); }
        .progress-step.active span { background: var(--accent-blue); color: white; }
        
        .progress-line {
          flex: 1;
          height: 2px;
          background: var(--border);
          margin: 0 12px;
        }
        .progress-line.active { background: var(--accent-blue); }

        .wizard-chat {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .wizard-msg {
          display: flex;
          max-width: 85%;
        }
        .wizard-msg.assistant { align-self: flex-start; }
        .wizard-msg.user { align-self: flex-end; }
        
        .msg-bubble {
          padding: 12px 18px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
        }
        .wizard-msg.assistant .msg-bubble {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }
        .wizard-msg.user .msg-bubble {
          background: var(--gradient-main);
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .wizard-footer {
          padding: 24px;
          border-top: 1px solid var(--border);
        }
        .input-group {
          display: flex;
          gap: 8px;
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }
        .input-group:focus-within { border-color: var(--accent-blue); }
        
        .voice-btn.listening {
          background: var(--accent-red);
          color: white;
          animation: pulse-red 1.5s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        
        .loading { display: flex; align-items: center; justify-content: center; }
        .w-full { width: 100%; }
        .mt-4 { margin-top: 16px; }
      `}</style>
    </div>
  );
}
