import { useState } from 'react';
import { BUDGET_LIMITS, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../financeEngine';
import { ProgressBar, EmptyState } from './UI';

export function BudgetView({ transactions }) {
  const [budgets, setBudgets] = useState({ ...BUDGET_LIMITS });
  const [editing, setEditing] = useState(null);

  // Actual spent per category
  const spent = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    spent[t.category] = (spent[t.category] || 0) + t.amount;
  }

  const handleBudgetChange = (cat, val) => {
    setBudgets(prev => ({ ...prev, [cat]: parseFloat(val) || 0 }));
  };

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent  = Object.values(spent).reduce((s, v) => s + v, 0);
  const overBudget  = CATEGORIES.filter(c => (spent[c] || 0) > budgets[c]);

  return (
    <div className="page-body">
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        Budget <span className="hero-gradient-text">Tracker</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Set monthly budgets per category and track how well you're staying on target.
      </p>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Budget</span>
            <div className="stat-icon blue">🎯</div>
          </div>
          <div className="stat-value">₹{totalBudget.toLocaleString('en-IN')}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Monthly limit</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Spent</span>
            <div className="stat-icon purple">💳</div>
          </div>
          <div className="stat-value">₹{totalSpent.toLocaleString('en-IN')}</div>
          <div className={`stat-change ${totalSpent > totalBudget ? 'down' : 'up'}`}>
            {totalSpent > totalBudget ? '⚠️ Over budget' : `₹${(totalBudget - totalSpent).toLocaleString('en-IN')} remaining`}
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-header">
            <span className="stat-card-label">Over Budget</span>
            <div className="stat-icon orange">🚨</div>
          </div>
          <div className="stat-value">{overBudget.length}</div>
          <div className="stat-change down">
            {overBudget.length > 0 ? overBudget.join(', ') : 'All within limits ✅'}
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-header">
            <span className="stat-card-label">Budget Used</span>
            <div className="stat-icon green">📊</div>
          </div>
          <div className="stat-value">
            {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : '—'}
          </div>
          <div className={`stat-change ${(totalSpent / totalBudget) > 0.9 ? 'down' : 'up'}`}>
            {totalBudget > 0 && (totalSpent / totalBudget) > 0.9 ? 'Critical' : 'On track'}
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div className="section-title">Category Budgets</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click a limit to edit</div>
        </div>

        {CATEGORIES.map(cat => {
          const limit = budgets[cat];
          const actual = spent[cat] || 0;
          const pct = limit > 0 ? Math.min((actual / limit) * 100, 100) : 0;
          const over = actual > limit;

          return (
            <div key={cat} className="budget-item" style={{ marginBottom: 20 }}>
              <div style={{ width: 140, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat]}</span>
                <span className="budget-label" style={{ width: 'auto', fontSize: 13 }}>{cat}</span>
              </div>
              <div className="budget-bar-wrap">
                <div className="budget-values">
                  <span style={{ color: over ? 'var(--accent-red)' : 'var(--text-secondary)', fontWeight: over ? 700 : 400 }}>
                    ₹{actual.toLocaleString('en-IN')} spent
                    {over && <span style={{ marginLeft: 6, fontSize: 11 }}>⚠️ OVER</span>}
                  </span>
                  <span
                    style={{ cursor: 'pointer', color: 'var(--text-muted)', textDecoration: 'underline dotted' }}
                    onClick={() => setEditing(editing === cat ? null : cat)}
                    title="Click to edit budget"
                  >
                    {editing === cat ? (
                      <input
                        className="form-input"
                        type="number"
                        value={limit}
                        onChange={e => handleBudgetChange(cat, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: 100, padding: '3px 8px', fontSize: 12, display: 'inline-block' }}
                      />
                    ) : (
                      `₹${limit.toLocaleString('en-IN')} limit`
                    )}
                  </span>
                </div>
                <div className="progress-bar-outer">
                  <div
                    className="progress-bar-inner"
                    style={{
                      width: `${pct}%`,
                      background: over
                        ? 'var(--accent-red)'
                        : pct > 80
                        ? '#f59e0b'
                        : CATEGORY_COLORS[cat] || '#00d68f'
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {pct.toFixed(0)}% used · ₹{Math.max(0, limit - actual).toLocaleString('en-IN')} remaining
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="card" style={{ marginTop: 20, background: 'rgba(0,214,143,0.04)', borderColor: 'rgba(0,214,143,0.15)' }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8, fontSize: 14 }}>
          💡 Budget Tip
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Follow the <strong>50/30/20 rule</strong>: 50% needs (Bills, Transport), 30% wants (Food, Entertainment, Shopping), and 20% savings.
          Click any limit value to edit your monthly budget for that category.
        </div>
      </div>
    </div>
  );
}
