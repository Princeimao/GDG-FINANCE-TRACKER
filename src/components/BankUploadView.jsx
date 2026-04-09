import { useState, useRef } from 'react';
import { parseBankData, CATEGORIES, CATEGORY_ICONS } from '../financeEngine';
import { extractFromImage } from '../geminiService';
import { LoadingBtn, CategoryBadge } from './UI';

export function BankUploadView({ onAddTransactions, addToast }) {
  const [tab, setTab]         = useState('text');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed]   = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageBase64, setImageBase64]   = useState('');
  const [imageMime, setImageMime]       = useState('');
  const [ocrWarning, setOcrWarning]     = useState('');
  const fileInputRef = useRef(null);

  const SAMPLE_DATA = `Date        Description                    Amount
01-04-2024  Zomato Order                   -450.00
01-04-2024  Salary Credit NEFT             50000.00
02-04-2024  Amazon Purchase IMPS           -2300.00
03-04-2024  Uber Cab Booking               -280.00
04-04-2024  Netflix Subscription           -499.00
05-04-2024  Pharmacy Apollo                -850.00
06-04-2024  Petrol Fill                    -1200.00
07-04-2024  Swiggy Food Delivery           -340.00
08-04-2024  Electricity Bill               -2100.00
09-04-2024  Dominos Pizza                  -560.00`;

  const handleTextParse = () => {
    if (!rawText.trim()) { addToast("Paste some bank statement text first.", "error"); return; }
    setLoading(true);
    setTimeout(() => {
      const result = parseBankData(rawText);
      setLoading(false);
      if (result.length === 0) {
        addToast("No transactions found. Check format.", "error");
      } else {
        setParsed(result.map((r, i) => ({ ...r, id: Date.now() + i })));
        addToast(`Parsed ${result.length} transactions!`, "success");
      }
    }, 600);
  };

  const handleImageSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      addToast("Please upload a valid image file.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast("Image too large (max 10MB).", "error");
      return;
    }
    setImageFile(file);
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      const b64 = dataUrl.split(',')[1];
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
    addToast("Image loaded! Click 'Extract with Gemini 3' to process.", "info");
  };

  const handleOCRExtract = async () => {
    if (!imageBase64) { addToast("Upload an image first.", "error"); return; }
    setLoading(true);
    setOcrWarning('');
    try {
      const result = await extractFromImage(imageBase64, imageMime);
      setLoading(false);
      if (result.warning) setOcrWarning(result.warning);
      const txns = result.transactions || [];
      if (txns.length === 0) {
        addToast("No transactions extracted from image. Try a clearer photo.", "error");
      } else {
        setParsed(txns.map((r, i) => ({ ...r, id: Date.now() + i })));
        addToast(`🖼️ Gemini 3 Vision extracted ${txns.length} transactions!`, "success");
      }
    } catch (err) {
      setLoading(false);
      addToast(`Vision OCR error: ${err.message}`, "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleImageSelect(e.dataTransfer.files[0]);
  };

  const handleConfirm = () => {
    onAddTransactions(parsed);
    setParsed([]);
    setRawText('');
    setImageFile(null); setImagePreview(''); setImageBase64('');
    addToast(`${parsed.length} transactions saved!`, "success");
  };

  const handleEdit = (i, field, val) => {
    setParsed(prev => prev.map((t, idx) =>
      idx === i ? { ...t, [field]: field === 'amount' ? parseFloat(val) || 0 : val } : t
    ));
  };

  const handleRemove = (i) => setParsed(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="page-body">
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        Bank Statement <span className="hero-gradient-text">Upload</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Paste text or upload a bank statement image — Gemini 3 Vision will extract all transactions automatically.
      </p>

      {/* Tabs */}
      <div className="tab-nav" style={{ maxWidth: 420, marginBottom: 24 }}>
        <button className={`tab-btn${tab === 'text' ? ' active' : ''}`} onClick={() => setTab('text')}>
          📄 Paste Text
        </button>
        <button className={`tab-btn${tab === 'image' ? ' active' : ''}`} onClick={() => setTab('image')}>
          🖼️ Gemini Vision OCR
        </button>
      </div>

      {/* Text Tab */}
      {tab === 'text' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>Paste Bank Statement Data</div>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setRawText(SAMPLE_DATA)}>
              Load Sample
            </button>
          </div>
          <textarea
            id="bank-text-input"
            className="form-textarea"
            style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 13 }}
            placeholder={"Date        Description           Amount\n01-04-2024  Zomato               -450.00\n01-04-2024  Salary Credit        50000.00"}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <LoadingBtn loading={loading} onClick={handleTextParse} className="btn-primary" id="bank-parse-btn">
              {loading ? "Parsing…" : "🔍 Parse Transactions"}
            </LoadingBtn>
            <button className="btn btn-ghost" onClick={() => { setRawText(''); setParsed([]); }}>Clear</button>
          </div>
        </div>
      )}

      {/* Image Tab */}
      {tab === 'image' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef} type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleImageSelect(e.target.files[0])}
              id="bank-image-input"
            />
            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="Bank statement" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: 12 }} />
                <div style={{ fontSize: 12, color: 'var(--accent-blue)' }}>Click to change image</div>
              </div>
            ) : (
              <>
                <div className="upload-icon">🏦</div>
                <div className="upload-title">Record Bank Transaction with Vision</div>
                <div className="upload-subtitle">Gemini 3 will read and extract all transactions — PNG, JPG</div>
              </>
            )}
          </div>

          {ocrWarning && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
              <strong style={{ color: '#f59e0b', fontSize: 13 }}>⚠️ OCR Warning: </strong>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ocrWarning}</span>
            </div>
          )}

          {imageFile && (
            <div style={{ marginTop: 14 }}>
              <LoadingBtn loading={loading} onClick={handleOCRExtract} className="btn-primary" id="ocr-extract-btn">
                {loading ? "Gemini Vision reading…" : "🤖 Extract with Gemini 3 Vision"}
              </LoadingBtn>
            </div>
          )}
        </div>
      )}

      {/* Parsed Results */}
      {parsed.length > 0 && (
        <>
          <div className="section-header">
            <div>
              <div className="section-title">Parsed Transactions</div>
              <div className="section-subtitle">Review and edit, then save</div>
            </div>
            <button className="btn btn-green" onClick={handleConfirm} id="bank-save-btn">
              ✅ Save All ({parsed.length})
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Merchant</th><th>Category</th>
                  <th>Amount</th><th>Type</th><th></th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((t, i) => (
                  <tr key={t.id}>
                    <td><input className="form-input" type="date" value={t.date}
                      onChange={e => handleEdit(i, 'date', e.target.value)}
                      style={{ padding: '6px 8px', fontSize: 12, width: 140 }} /></td>
                    <td><input className="form-input" type="text" value={t.merchant}
                      onChange={e => handleEdit(i, 'merchant', e.target.value)}
                      style={{ padding: '6px 8px', fontSize: 12, width: 160 }} /></td>
                    <td>
                      <select className="form-select" value={t.category}
                        onChange={e => handleEdit(i, 'category', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: 12, width: 130 }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                      </select>
                    </td>
                    <td><input className="form-input" type="number" value={t.amount}
                      onChange={e => handleEdit(i, 'amount', e.target.value)}
                      style={{ padding: '6px 8px', fontSize: 12, width: 100 }} /></td>
                    <td>
                      <select className="form-select" value={t.type}
                        onChange={e => handleEdit(i, 'type', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: 12, width: 110 }}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </td>
                    <td><button className="btn btn-danger btn-icon" onClick={() => handleRemove(i)} style={{ fontSize: 13 }}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-green" onClick={handleConfirm} id="bank-save-btn-2">✅ Save All</button>
            <button className="btn btn-ghost" onClick={() => setParsed([])}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
