import { useState, useEffect } from 'react';
import { predictSpending } from '../geminiService';
import { SpendingAreaChart } from './Charts';
import { EmptyState } from './UI';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../financeEngine';

function ThinkingBar({ msg }) {
  return (
    <div className="thinking-bar">
      <div className="thinking-dots"><span /><span /><span /></div>
      {msg}
    </div>
  );
}

export function PredictionView({ transactions, addToast }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(false);

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const handlePredict = async () => {
    if (transactions.length === 0) {
      addToast("Add transactions first!", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await predictSpending(transactions);
      setPrediction(result);
      addToast("AI prediction generated!", "success");
    } catch (err) {
      addToast(`Prediction error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run prediction once if transactions exist
  useEffect(() => {
    if (transactions.length > 5 && !prediction && !loading) {
       handlePredict();
    }
  }, []);

  return (
    <div className="page-body">
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        AI Spending <span className="hero-gradient-text">Predictions</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Gemini 3 analyzes your spending velocity and predicts end-of-month finances.
      </p>

      {/* Current Snapshot */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card purple">
          <div className="stat-card-header"><span className="stat-card-label">Current Spend</span><div className="stat-icon purple">💳</div></div>
          <div className="stat-value">₹{totalExpense.toLocaleString('en-IN')}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>This period</div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-header"><span className="stat-card-label">Current Income</span><div className="stat-icon green">📈</div></div>
          <div className="stat-value">₹{totalIncome.toLocaleString('en-IN')}</div>
          <div className="stat-change up">Logged income</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-header"><span className="stat-card-label">Overall Health</span><div className="stat-icon blue">📊</div></div>
          <div className="stat-value">{totalIncome > totalExpense ? 'Stable' : 'Risk'}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Based on data</div>
        </div>
      </div>

      {loading && <ThinkingBar msg="Gemini 3 is forecasting your spending…" />}

      {!prediction && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔮</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Predict Your Finances
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Gemini 3 will analyze your spending velocity and recurring expenses to forecast your month-end results.
          </div>
          <button className="btn btn-primary" onClick={handlePredict} disabled={transactions.length === 0} id="run-prediction-btn">
            {transactions.length === 0 ? "Add transactions first" : "🔮 Run AI Forecast"}
          </button>
        </div>
      )}

      {prediction && !loading && (
        <>
          {/* Main Prediction Cards */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card orange">
              <div className="stat-card-header"><span className="stat-card-label">Predicted Spending</span><div className="stat-icon orange">📉</div></div>
              <div className="stat-value" style={{ color: 'var(--accent-red)' }}>
                ₹{(prediction.predicted_spending || 0).toLocaleString('en-IN')}
              </div>
              <div className="stat-change down">End of month estimate</div>
            </div>
            <div className="stat-card green">
              <div className="stat-card-header"><span className="stat-card-label">Predicted Savings</span><div className="stat-icon green">💰</div></div>
              <div className="stat-value" style={{ color: prediction.predicted_savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                ₹{Math.abs(prediction.predicted_savings || 0).toLocaleString('en-IN')}
              </div>
              <div className={`stat-change ${prediction.predicted_savings >= 0 ? 'up' : 'down'}`}>
                {prediction.predicted_savings >= 0 ? 'Projected surplus' : 'Projected deficit'}
              </div>
            </div>
            <div className="stat-card blue">
              <div className="stat-card-header"><span className="stat-card-label">Daily Velocity</span><div className="stat-icon blue">⚡</div></div>
              <div className="stat-value" style={{ fontSize: 20 }}>{prediction.spending_velocity || '—'}</div>
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Avg daily spend</div>
            </div>
          </div>

          {/* Risk + Reason */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17 }}>AI Analysis</div>
                  <span className={`risk-badge risk-${prediction.risk_level}`}>
                    {prediction.risk_level === 'High' ? '🔴' : prediction.risk_level === 'Medium' ? '🟡' : '🟢'}
                    {prediction.risk_level} Risk
                  </span>
                  {prediction.confidence && (
                    <span className={`confidence-chip conf-${prediction.confidence?.toLowerCase()}`}>
                      {prediction.confidence} confidence
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{prediction.reason}</p>
                {prediction.biggest_risk_category && (
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 20, border: '1px solid rgba(239,68,68,0.15)', fontSize: 13 }}>
                    ⚠️ Top risk: <strong>{prediction.biggest_risk_category}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Actual Spending Trend</div>
            <SpendingAreaChart transactions={transactions} />
          </div>

          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={handlePredict}>
            🔄 Regenerate Prediction
          </button>
        </>
      )}
    </div>
  );
}
