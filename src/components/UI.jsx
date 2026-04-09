import { CATEGORY_ICONS } from '../financeEngine';

// ============================================================
// Sidebar Navigation
// ============================================================
export function Sidebar({ activeView, setActiveView, transactions }) {
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "add",       icon: "✨", label: "AI Extractor" },
    { id: "upload",    icon: "📁", label: "Bank Upload" },
    { id: "history",   icon: "📜", label: "Transactions" },
    { id: "insights",  icon: "💡", label: "Insights" },
    { id: "tax",       icon: "🧾", label: "Tax Estimator" },
    { id: "budget",    icon: "🎯", label: "Budget" },
  ];

  const aiNavItems = [
    { id: "chat",        icon: "💬", label: "AI Chat" },
    { id: "predict",     icon: "🔮", label: "Predictions" },
    { id: "goals",       icon: "🏆", label: "Goal Tracker" },
    { id: "connections", icon: "🔗", label: "Connections" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">💸</div>
        <span className="logo-text">FinanceAI</span>
      </div>

      <div className="nav-section-label">Main Menu</div>
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item${activeView === item.id ? ' active' : ''}`}
          onClick={() => setActiveView(item.id)}
          id={`nav-${item.id}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
          {item.id === "history" && transactions.length > 0 && (
            <span className="count-pill" style={{ marginLeft: 'auto' }}>{transactions.length}</span>
          )}
        </button>
      ))}

      <div className="nav-section-label" style={{ marginTop: 12 }}>🤖 AI Powered</div>
      {aiNavItems.map(item => (
        <button
          key={item.id}
          className={`nav-item${activeView === item.id ? ' active' : ''}`}
          onClick={() => setActiveView(item.id)}
          id={`nav-${item.id}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
          <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)', flexShrink: 0 }} />
        </button>
      ))}

      <div className="sidebar-footer">
        {/* Spend Summary */}
        <div style={{ padding: '12px', background: 'rgba(59,130,246,0.08)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.15)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>TOTAL SPENT</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--accent-red)' }}>
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{transactions.length} transactions</div>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// Topbar
// ============================================================
export function Topbar({ title, subtitle, children }) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div className="topbar-actions">{children}</div>
    </header>
  );
}

// ============================================================
// Toast Notifications
// ============================================================
export function ToastContainer({ toasts }) {
  const ICONS = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{ICONS[t.type] || "ℹ️"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Category Badge
// ============================================================
export function CategoryBadge({ category }) {
  const icon = CATEGORY_ICONS[category] || "📦";
  return (
    <span className={`category-badge cat-${category}`}>
      {icon} {category}
    </span>
  );
}

// ============================================================
// Stat Card
// ============================================================
export function StatCard({ label, value, icon, color, change, changeDir }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-icon ${color}`}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeDir}`}>{change}</div>
      )}
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
export function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// ============================================================
// Loading Button
// ============================================================
export function LoadingBtn({ loading, onClick, className, children, id }) {
  return (
    <button
      id={id}
      className={`btn ${className}`}
      onClick={onClick}
      disabled={loading}
      style={{ opacity: loading ? 0.85 : 1 }}
    >
      {loading ? <span className="spinner" /> : null}
      {children}
    </button>
  );
}

// ============================================================
// Transaction Row
// ============================================================
export function TransactionRow({ t, onDelete }) {
  return (
    <tr>
      <td>{t.date ? (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t.date}</span>
      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}</td>
      <td>
        <div style={{ fontWeight: 500 }}>{t.merchant}</div>
      </td>
      <td><CategoryBadge category={t.category} /></td>
      <td>
        <span className={`amount-${t.type}`}>
          {t.type === "expense" ? "-" : "+"}₹{t.amount.toLocaleString('en-IN')}
        </span>
      </td>
      <td>
        <span className={`type-badge type-${t.type}`}>
          {t.type === "expense" ? "↑ Expense" : "↓ Income"}
        </span>
      </td>
      <td>
        <button
          className="btn btn-danger btn-icon"
          onClick={() => onDelete(t.id)}
          title="Delete"
          style={{ fontSize: 14 }}
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}

// ============================================================
// Insight Card
// ============================================================
export function InsightCard({ insight }) {
  return (
    <div className="insight-item">
      <div className={`insight-icon ${insight.type}`}>
        <span style={{ fontSize: 18 }}>{insight.icon}</span>
      </div>
      <div>
        <div className="insight-title">{insight.title}</div>
        <div className="insight-desc">{insight.desc}</div>
      </div>
    </div>
  );
}

// ============================================================
// Mic Button
// ============================================================
export function MicButton({ isRecording, onStart, onStop }) {
  return (
    <button
      className={`mic-btn ${isRecording ? 'recording' : 'idle'}`}
      onClick={isRecording ? onStop : onStart}
      title={isRecording ? "Stop recording" : "Start voice input"}
      id="mic-btn"
    >
      {isRecording ? "⏹️" : "🎤"}
    </button>
  );
}

// ============================================================
// Progress Bar
// ============================================================
export function ProgressBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  let barColor = color;
  if (!barColor) {
    barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#00d68f';
  }
  return (
    <div className="progress-bar-outer">
      <div
        className="progress-bar-inner"
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  );
}

// ============================================================
// Card
// ============================================================
export function Card({ children, className = "", style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}
