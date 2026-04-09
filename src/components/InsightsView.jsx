import { useState, useEffect } from 'react';
import { generateAIInsights } from '../geminiService';
import { generateInsights as ruleInsights } from '../financeEngine';
import { InsightCard, EmptyState } from './UI';
import { CategoryDonut, CategoryBarChart } from './Charts';

function ThinkingBar() {
  return (
    <div className="thinking-bar">
      <div className="thinking-dots"><span /><span /><span /></div>
      Gemini 3 is analyzing your spending patterns…
    </div>
  );
}

function ScoreMeter({ score }) {
  const color = score >= 70 ? '#00d68f' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Average' : 'Needs Work';
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color, lineHeight: 1 }}>
        {score}
      </div>
      <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Financial Score</div>
      <div className="progress-bar-outer" style={{ marginTop: 8 }}>
        <div className="progress-bar-inner" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export function InsightsView({ transactions, addToast }) {
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState('rule'); // 'rule' | 'ai'

  const expenses     = transactions.filter(t => t.type === 'expense');
  const income       = transactions.filter(t => t.type === 'income');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome  = income.reduce((s, t) => s + t.amount, 0);
  const savingsRate  = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : null;

  // Category breakdown
  const byCat = {};
  for (const t of expenses) byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const ruleInsightList = ruleInsights(transactions);

  const handleAIInsights = async () => {
    if (transactions.length === 0) { addToast("Add transactions first!", "error"); return; }
    setLoading(true);
    try {
      const result = await generateAIInsights(transactions);
      setAiResult(result);
      setMode('ai');
      addToast("Gemini 3 insights generated!", "success");
    } catch (err) {
      addToast(`AI insights error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate AI insights if they don't exist
  useEffect(() => {
    if (transactions.length > 0 && !aiResult && !loading) {
      handleAIInsights();
    }
  }, []);

  return (
    <div className="page-body">
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        AI Financial <span className="hero-gradient-text">Insights</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Deep spending analysis with actionable recommendations powered by Gemini 3.
      </p>

      {transactions.length === 0 ? (
        <div className="card"><EmptyState icon="🤖" title="No data to analyze" description="Add transactions first." /></div>
      ) : (
        <>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={`btn ${mode === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode('ai')}
              disabled={loading}
            >
              {loading && <span className="spinner" style={{ marginRight: 8 }} />}
              🤖 Gemini 3 AI
            </button>
            <button
              className={`btn ${mode === 'rule' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setMode('rule')}
            >
              📐 Classic Stats
            </button>
            {mode === 'ai' && aiResult && (
              <button className="btn btn-ghost" onClick={handleAIInsights} disabled={loading} style={{ marginLeft: 'auto' }}>
                🔄 Regenerate
              </button>
            )}
          </div>

          {loading && <ThinkingBar />}

          {/* Savings Banner */}
          {savingsRate !== null && !loading && (
            <div style={{
              padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: 24,
              background: parseFloat(savingsRate) >= 20
                ? 'linear-gradient(135deg,rgba(0,214,143,0.1),rgba(6,182,212,0.08))'
                : 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(245,158,11,0.08))',
              border: `1px solid ${parseFloat(savingsRate) >= 20 ? 'rgba(0,214,143,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {parseFloat(savingsRate) >= 20 ? '✅ Great Savings Rate!' : '⚠️ Savings Need Attention'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Saving <strong style={{ color: parseFloat(savingsRate) >= 20 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {savingsRate}%
                    </strong> of income · ₹{Math.max(0, totalIncome - totalExpense).toLocaleString('en-IN')} saved
                  </div>
                </div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 800, color: parseFloat(savingsRate) >= 20 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {savingsRate}%
                </div>
              </div>
            </div>
          )}

          {/* AI Insights Mode */}
          {mode === 'ai' && aiResult && !loading && (
            <>
              {/* Summary + Score */}
              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: 'var(--accent-purple)' }}>
                    🤖 Gemini 3 Analysis
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{aiResult.summary}</p>
                  {aiResult.monthly_forecast && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--accent-blue)' }}>
                      📅 Forecast: {aiResult.monthly_forecast}
                    </div>
                  )}
                  {aiResult.unusual_patterns?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>UNUSUAL PATTERNS</div>
                      {aiResult.unusual_patterns.map((p, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--accent-orange)', marginBottom: 4 }}>⚠️ {p}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card">
                  {aiResult.spending_score && <ScoreMeter score={aiResult.spending_score} />}
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Top spending: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{aiResult.top_spending_category}</span></div>
                    {aiResult.savings_rate !== undefined && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        AI-calculated savings rate: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{aiResult.savings_rate?.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {aiResult.warnings?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="section-title" style={{ marginBottom: 12 }}>⚠️ Risk Warnings</div>
                  <div className="insight-list">
                    {aiResult.warnings.map((w, i) => (
                      <InsightCard key={i} insight={{ type: 'warning', icon: w.icon, title: w.title, desc: w.description }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {aiResult.suggestions?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="section-title" style={{ marginBottom: 12 }}>💡 AI Recommendations</div>
                  <div className="insight-list">
                    {aiResult.suggestions.map((s, i) => (
                      <InsightCard key={i} insight={{ type: 'success', icon: s.icon, title: s.title, desc: s.action }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Overspending */}
              {aiResult.overspending_categories?.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="section-title" style={{ marginBottom: 14 }}>🔴 Overspending Analysis</div>
                  {aiResult.overspending_categories.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < aiResult.overspending_categories.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.category}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{c.reason}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>₹{(c.amount || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.percentage_of_total?.toFixed(1)}% of total</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Rule-based mode */}
          {mode === 'rule' && (
            <div className="grid-2" style={{ marginBottom: 24 }}>
              <div>
                <div className="section-header"><div className="section-title">💡 Quick Insights</div></div>
                <div className="insight-list">
                  {ruleInsightList.map((ins, i) => <InsightCard key={i} insight={ins} />)}
                </div>
              </div>
              <div>
                <div className="section-header"><div className="section-title">📊 Category Split</div></div>
                <div className="card"><CategoryDonut transactions={transactions} /></div>
              </div>
            </div>
          )}

          {/* Charts always visible */}
          <div className="grid-2">
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>Category Bar Chart</div>
              <CategoryBarChart transactions={transactions} />
            </div>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>Spending Breakdown</div>
              {sorted.length > 0 && sorted.map(([cat, amt]) => {
                const pct = (amt / totalExpense) * 100;
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{cat}</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>₹{amt.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="progress-bar-outer">
                      <div className="progress-bar-inner" style={{ width: `${pct}%`, background: pct > 40 ? '#ef4444' : pct > 25 ? '#f59e0b' : '#00d68f' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
