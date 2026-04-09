import { useState } from 'react';
import { validateApiKey } from '../geminiService';

const MODELS = [
  { id: "gemini-2.0-flash",  label: "Gemini 2.0 Flash",  desc: "Text extraction, insights, predictions, chat" },
  { id: "gemini-2.0-flash",  label: "Gemini Vision",     desc: "Bank statement image OCR" },
  { id: "Web Speech API",    label: "Speech Recognition", desc: "Browser-native voice input + AI correction" },
];

export function SettingsModal({ onClose, apiKey, onSave }) {
  const [key, setKey] = useState(apiKey || '');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(apiKey ? 'connected' : 'disconnected');
  const [checking, setChecking] = useState(false);

  const handleTest = async () => {
    if (!key.trim()) return;
    setChecking(true);
    setStatus('checking');
    const valid = await validateApiKey(key.trim());
    setChecking(false);
    setStatus(valid ? 'connected' : 'disconnected');
  };

  const handleSave = () => {
    onSave(key.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 'min(580px,95vw)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">⚙️ AI Settings</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-label">🔑 Google Gemini API Key</div>
          <div style={{ position: 'relative' }}>
            <input
              id="gemini-api-key-input"
              className="form-input"
              type={show ? "text" : "password"}
              placeholder="AIza…"
              value={key}
              onChange={e => { setKey(e.target.value); setStatus('disconnected'); }}
              style={{ paddingRight: 44 }}
            />
            <button
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
              onClick={() => setShow(!show)}
            >
              {show ? "🙈" : "👁️"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
            Get your free key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
              aistudio.google.com/apikey
            </a>
            {' '}— free tier includes Gemini 2.0 Flash.
          </div>
          {/* Status */}
          <div className={`api-status-bar ${status}`}>
            {status === 'connected'    && <><span>✅</span> API key verified — all AI features active</>}
            {status === 'disconnected' && <><span>🔴</span> No valid key — AI features disabled (using rule-based fallback)</>}
            {status === 'checking'     && <><span className="spinner" style={{ borderTopColor: 'var(--accent-blue)', width: 14, height: 14 }} /> Verifying key…</>}
          </div>
        </div>

        {/* Models info */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-label">🤖 AI Models</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODELS.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--bg-secondary)',
                borderRadius: 10, border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.desc}</div>
                </div>
                <span className={`model-badge ${status === 'connected' || m.id === 'Web Speech API' ? 'active' : 'inactive'}`}>
                  {status === 'connected' || m.id === 'Web Speech API' ? '● Active' : '● Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: '14px', background: 'rgba(59,130,246,0.06)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.15)', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--accent-blue)' }}>🚀 Features unlocked with API key</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              "✨ NLP expense extraction",
              "🖼️ Bank image OCR (Vision)",
              "💡 AI financial insights",
              "📈 Spending predictions",
              "🎯 Goal progress analysis",
              "💬 Conversational AI chat",
              "🎤 AI-corrected speech input",
              "⚠️ Smart overspend alerts",
            ].map((f, i) => (
              <div key={i} style={{ fontSize: 12, color: status === 'connected' ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{f}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={handleTest} disabled={!key.trim() || checking} id="test-api-key-btn">
            {checking ? <span className="spinner" /> : null}
            🔍 Test Key
          </button>
          <button className="btn btn-primary" onClick={handleSave} id="save-api-key-btn">
            💾 Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
