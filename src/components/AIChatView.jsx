import { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithFinanceAI } from '../geminiService';
import { useSpeechRecognition } from '../hooks';

const QUICK_QUESTIONS = [
  "Where am I spending the most?",
  "Am I on track to save this month?",
  "What should I cut to save ₹5000?",
  "How much did I spend on food?",
  "What's my savings rate?",
];

const WELCOME_MSG = {
  role: 'assistant',
  content: "👋 Hi! I'm **FinanceAI**, your personal finance advisor. I have full access to your transaction data and can answer questions like:\n\n• *Where am I overspending?*\n• *Can I afford to buy X?*\n• *How do I reach my savings goal?*\n\nAsk me anything about your finances!",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

function ThinkingBubble() {
  return (
    <div className="chat-bubble assistant">
      <div className="chat-avatar ai">🤖</div>
      <div className="chat-typing">
        <div className="thinking-dots">
          <span /><span /><span />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Analyzing your data…</span>
      </div>
    </div>
  );
}

function formatMessage(text) {
  // Basic markdown-ish formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/\n/g, '<br/>');
}

export function AIChatView({ transactions, addToast }) {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSpeechResult = useCallback((transcript) => {
    setInput(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const { isRecording, isProcessing, startRecording, stopRecording } =
    useSpeechRecognition(handleSpeechResult);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q) return;

    const userMsg = {
      role: 'user',
      content: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history excluding welcome msg
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const reply = await chatWithFinanceAI(q, transactions, history);
      const aiMsg = {
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      addToast(`Chat error: ${err.message}`, "error");
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err.message}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    setMessages([WELCOME_MSG]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>🤖</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16 }}>FinanceAI Chat</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 6px var(--accent-green)' }} />
              Gemini 3 Powered • Online
            </div>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleClear}>🗑️ Clear Chat</button>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ background: 'var(--bg-primary)' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <div className={`chat-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div>
              <div
                className="chat-content"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
              <div className="chat-time">{msg.time}</div>
            </div>
          </div>
        ))}
        {loading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div style={{ padding: '8px 20px 0', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {QUICK_QUESTIONS.map((q, i) => (
          <button key={i} className="chat-chip" onClick={() => sendMessage(q)} disabled={loading}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          id="chat-input"
          ref={textareaRef}
          placeholder="Ask about your finances… (Enter to send)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
        />

        <button
          className={`mic-btn ${isRecording ? 'recording' : 'idle'}`}
          onClick={isRecording ? stopRecording : startRecording}
          title="Voice input"
        >
          {isRecording ? (
            <div className="voice-wave">
              <span/><span/><span/><span/><span/>
            </div>
          ) : isProcessing ? (
            <span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--accent-blue)' }} />
          ) : "🎤"}
        </button>

        <button
          className="chat-send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          id="chat-send-btn"
        >
          {loading ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> : "➤"}
        </button>
      </div>
    </div>
  );
}
