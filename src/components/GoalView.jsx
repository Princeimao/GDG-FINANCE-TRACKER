import { useState } from 'react';
import { checkGoalProgress } from '../geminiService';

function GoalRing({ pct }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const color = pct > 100 ? '#00d68f' : pct > 60 ? '#3b82f6' : pct > 30 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
      <circle
        cx="90" cy="90" r={r} fill="none"
        stroke={color} strokeWidth="14"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="90" y="90"
        dominantBaseline="middle" textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: '90px 90px' }}
      >
        <tspan
          x="90" dy="-8"
          style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, fill: color }}
        >
          {Math.round(Math.min(pct, 100))}%
        </tspan>
        <tspan x="90" dy="22" style={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter,sans-serif' }}>
          progress
        </tspan>
      </text>
    </svg>
  );
}

export function GoalView({ transactions, addToast }) {
  const [goalAmount, setGoalAmount] = useState('');
  const [goalName, setGoalName]     = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentSavings = Math.max(0, totalIncome - totalExpense);

  const PRESET_GOALS = [
    { name: "Emergency Fund (3 months)", amount: 150000 },
    { name: "New Phone", amount: 80000 },
    { name: "Vacation", amount: 50000 },
    { name: "Laptop", amount: 120000 },
    { name: "Bike Down Payment", amount: 30000 },
  ];

  const handleAnalyze = async () => {
    const amt = parseFloat(goalAmount);
    if (!amt || amt <= 0) {
      addToast("Please enter a valid goal amount.", "error");
      return;
    }

    setLoading(true);
    try {
      // Always use Gemini 3
      const res = await checkGoalProgress(transactions, amt, goalName || "My Goal");
      setResult(res);
      addToast("Gemini 3 analysis complete!", "success");
    } catch (err) {
      addToast(`Goal analysis error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const statusClass = result?.status?.replace(' ', '-') === 'on-track' ? 'goal-on-track'
    : result?.status === 'behind' ? 'goal-behind'
    : 'goal-at-risk';

  const statusEmoji = { 'on track': '✅', behind: '⚠️', 'at risk': '🚨' };

  return (
    <div className="page-body">
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        Savings <span className="hero-gradient-text">Goal Tracker</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Set a savings goal and let Gemini 3 AI tell you if you're on track — with specific advice to get there.
      </p>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Goal Input */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>🎯 Set Your Goal</div>

          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input
              id="goal-name-input"
              className="form-input"
              placeholder="e.g., Vacation, Emergency Fund…"
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Amount (₹)</label>
            <input
              id="goal-amount-input"
              className="form-input"
              type="number"
              placeholder="e.g., 50000"
              value={goalAmount}
              onChange={e => setGoalAmount(e.target.value)}
              min={0}
            />
          </div>

          {/* Presets */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Quick Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_GOALS.map((g, i) => (
                <button
                  key={i}
                  className="ai-example-chip"
                  onClick={() => { setGoalName(g.name); setGoalAmount(g.amount.toString()); }}
                >
                  {g.name.split('(')[0].trim()} · ₹{(g.amount/1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={loading || !goalAmount}
            style={{ width: '100%' }}
            id="analyze-goal-btn"
          >
            {loading ? <><span className="spinner" /> Analyzing with AI…</> : "🔍 Analyze with Gemini 3"}
          </button>

          {/* Current savings summary */}
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Current savings</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>₹{currentSavings.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Progress Ring */}
        {result ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <GoalRing pct={result.progress_percentage} />
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, marginTop: 8 }}>
              {goalName || "My Goal"}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
              ₹{(result.current_savings || 0).toLocaleString('en-IN')} of ₹{(result.goal_amount || 0).toLocaleString('en-IN')}
            </div>
            <span className={`goal-status-badge ${statusClass}`}>
              {statusEmoji[result.status]} {result.status?.toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 15 }}>Set a goal to see progress</div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Key Metrics */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-card-header"><span className="stat-card-label">Daily Budget</span><div className="stat-icon blue">📅</div></div>
              <div className="stat-value">₹{(result.daily_budget || 0).toLocaleString('en-IN')}</div>
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Recommended max/day</div>
            </div>
            <div className="stat-card green">
              <div className="stat-card-header"><span className="stat-card-label">Monthly Target</span><div className="stat-icon green">🎯</div></div>
              <div className="stat-value">₹{(result.monthly_target_savings || 0).toLocaleString('en-IN')}</div>
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Save this per month</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-card-header"><span className="stat-card-label">Time to Goal</span><div className="stat-icon orange">⏱️</div></div>
              <div className="stat-value">{result.time_to_goal_months || '?'} mo</div>
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>At current rate</div>
            </div>
          </div>

          {/* AI Advice */}
          <div className="card" style={{ background: 'linear-gradient(135deg,rgba(0,214,143,0.06),rgba(6,182,212,0.04))', borderColor: 'rgba(0,214,143,0.15)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-green)', marginBottom: 8 }}>
              🤖 Gemini 3 Strategy
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.advice}</p>
          </div>

          {/* Cut Suggestions */}
          {result.cut_suggestions?.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>✂️ Where to Cut Spending</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.cut_suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.category}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Current ₹{s.current?.toLocaleString('en-IN')} → Suggested ₹{s.suggested?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>
                      Save ₹{s.saves?.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
