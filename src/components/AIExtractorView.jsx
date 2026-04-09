import { useState, useCallback } from 'react';
import { parseExpensesFromText, CATEGORIES, CATEGORY_ICONS } from '../financeEngine';
import { extractExpensesWithAI } from '../geminiService';
import { useSpeechRecognition } from '../hooks';
import { LoadingBtn, CategoryBadge } from './UI';

const EXAMPLES = [
  "I spent ₹450 at Zomato and ₹200 at Starbucks",
  "paid 1200 EMI and 500 for Netflix subscription",
  "80 for metro ride, bought shoes for 2500 at Myntra",
  "doctor visit cost 800 and medicines 350",
  "bought groceries for 1500 at BigBasket",
];

function AIPoweredBadge() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      <div className="ai-badge">🤖 Gemini 3 AI Active</div>
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.2)' }}>
        🎤 AI Speech Correction Enabled
      </span>
    </div>
  );
}

export function AIExtractorView({ onAddTransactions, addToast }) {
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState([]);
  const [transcriptPreview, setTranscriptPreview] = useState('');

  const handleSpeechResult = useCallback((transcript) => {
    setText(prev => prev ? `${prev} ${transcript}` : transcript);
    setTranscriptPreview(transcript);
    setTimeout(() => setTranscriptPreview(''), 3000);
    addToast("Voice captured + AI corrected! ✨", "info");
  }, [addToast]);

  const { isRecording, isProcessing, startRecording, stopRecording } =
    useSpeechRecognition(handleSpeechResult);

  const handleExtract = async () => {
    if (!text.trim()) {
      addToast("Please enter some expense text first.", "error");
      return;
    }
    setLoading(true);
    try {
      // Always try Gemini 3 first
      const result = await extractExpensesWithAI(text);
      
      setLoading(false);
      if (!result || result.length === 0) {
        addToast("No expenses detected. Try: 'spent ₹500 at Zomato'", "error");
      } else {
        setExtracted(result.map((r, i) => ({
          ...r,
          id: Date.now() + i,
          date: new Date().toISOString().split('T')[0],
        })));
        addToast(`✨ Gemini 3 extracted ${result.length} transaction(s)!`, "success");
      }
    } catch (err) {
      setLoading(false);
      console.warn("Gemini Error, falling back to rule engine:", err);
      // Fallback to rule-based
      const fallback = parseExpensesFromText(text);
      if (fallback.length > 0) {
        setExtracted(fallback.map((r, i) => ({ 
          ...r, 
          id: Date.now() + i, 
          date: new Date().toISOString().split('T')[0],
          confidence: 'low',
          note: 'Rule-based fallback'
        })));
        addToast(`Used rule-based fallback: ${fallback.length} found`, "info");
      } else {
        addToast("Could not extract any expenses.", "error");
      }
    }
  };

  const handleConfirm = () => {
    if (extracted.length === 0) return;
    onAddTransactions(extracted);
    setExtracted([]);
    setText('');
    addToast(`${extracted.length} transaction(s) saved!`, "success");
  };

  const handleEdit = (i, field, val) => {
    setExtracted(prev => prev.map((t, idx) =>
      idx === i ? { ...t, [field]: field === 'amount' ? parseFloat(val) || 0 : val } : t
    ));
  };

  const handleRemove = (i) => setExtracted(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="page-body">
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        AI Expense <span className="hero-gradient-text">Extractor</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Type or speak naturally — Gemini 3 will parse and categorize expenses instantly.
      </p>

      {/* Input Area */}
      <div className="ai-input-container">
        <AIPoweredBadge />

        {/* Live transcript preview */}
        {(isRecording || isProcessing || transcriptPreview) && (
          <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {isRecording && (
              <div className="voice-wave"><span/><span/><span/><span/><span/></div>
            )}
            {isProcessing ? (
              <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--accent-blue)' }} /> AI correcting speech…</>
            ) : isRecording ? "Listening…" : (
              <><span>📝</span> Captured: "{transcriptPreview}"</>
            )}
          </div>
        )}

        <div className="ai-input-row">
          <textarea
            id="ai-text-input"
            className="form-textarea"
            placeholder='Try: "spent 450 at Zomato and 1200 on Netflix, also paid 500 for fuel"'
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button
            className={`mic-btn ${isRecording ? 'recording' : 'idle'}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop recording" : "Voice input"}
            id="mic-btn"
          >
            {isRecording ? (
              <div className="voice-wave"><span/><span/><span/><span/><span/></div>
            ) : isProcessing ? (
              <span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--accent-blue)' }} />
            ) : "🎤"}
          </button>
        </div>

        <div className="ai-action-row">
          <LoadingBtn id="extract-btn" loading={loading} onClick={handleExtract} className="btn-primary">
            {loading ? "Gemini 3 analyzing…" : "✨ Extract Expenses"}
          </LoadingBtn>
          <button className="btn btn-ghost" onClick={() => { setText(''); setExtracted([]); }}>Clear</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Examples:</span>
          {EXAMPLES.slice(0, 3).map((ex, i) => (
            <button key={i} className="ai-example-chip" onClick={() => setText(ex)}>
              {ex.substring(0, 28)}…
            </button>
          ))}
        </div>
      </div>

      {/* Extracted Results */}
      {extracted.length > 0 && (
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Extracted by Gemini 3 AI</div>
              <div className="section-subtitle">Review and confirm before saving</div>
            </div>
            <button className="btn btn-green" onClick={handleConfirm} id="confirm-save-btn">
              ✅ Save All ({extracted.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {extracted.map((t, i) => (
              <div key={t.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 140px' }}>
                    <div className="form-label">Amount (₹)</div>
                    <input className="form-input" type="number" value={t.amount}
                      onChange={e => handleEdit(i, 'amount', e.target.value)} min={0} />
                  </div>
                  <div style={{ flex: '0 0 180px' }}>
                    <div className="form-label">Merchant</div>
                    <input className="form-input" type="text" value={t.merchant}
                      onChange={e => handleEdit(i, 'merchant', e.target.value)} />
                  </div>
                  <div style={{ flex: '0 0 160px' }}>
                    <div className="form-label">Category</div>
                    <select className="form-select" value={t.category}
                      onChange={e => handleEdit(i, 'category', e.target.value)}>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '0 0 150px' }}>
                    <div className="form-label">Date</div>
                    <input className="form-input" type="date" value={t.date}
                      onChange={e => handleEdit(i, 'date', e.target.value)} />
                  </div>
                  <div style={{ flex: '0 0 130px' }}>
                    <div className="form-label">Type</div>
                    <select className="form-select" value={t.type}
                      onChange={e => handleEdit(i, 'type', e.target.value)}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 2, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <CategoryBadge category={t.category} />
                      {t.confidence && (
                        <span className={`confidence-chip conf-${t.confidence}`}>{t.confidence}</span>
                      )}
                      {t.note && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{t.note}</span>
                      )}
                    </div>
                    <button className="btn btn-danger btn-icon" onClick={() => handleRemove(i)} title="Remove">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-green" onClick={handleConfirm} id="confirm-save-btn-2">✅ Save All</button>
            <button className="btn btn-ghost" onClick={() => setExtracted([])}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ marginTop: 28, background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.15)' }}>
        <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--accent-purple)', fontSize: 14 }}>
          🤖 Gemini 3 AI Input Tips
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 8 }}>
          {[
            ["Natural language", '"Spent 450 at Zomato for lunch"'],
            ["Multiple at once", '"Netflix 500, Uber 180, groceries 2000"'],
            ["Voice input", "Click 🎤, speak, AI corrects errors"],
            ["Number words", '"two fifty" → ₹250, "five k" → ₹5000'],
            ["Any currency prefix", "₹, Rs, INR — all handled"],
            ["AI inference", '"Grab dinner" → Food category'],
          ].map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent-purple)', marginTop: 1 }}>→</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
