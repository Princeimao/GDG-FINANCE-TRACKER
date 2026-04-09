import { StatCard, InsightCard, EmptyState } from './UI';
import { SpendingAreaChart, CategoryBarChart, CategoryDonut } from './Charts';
import { generateInsights, CATEGORY_COLORS, CATEGORY_ICONS, BUDGET_LIMITS } from '../financeEngine';

export function DashboardView({ transactions }) {
  const expenses = transactions.filter(t => t.type === "expense");
  const incomes  = transactions.filter(t => t.type === "income");

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome  = incomes.reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;
  const insights     = generateInsights(transactions);

  // Category breakdown
  const byCat = {};
  for (const t of expenses) {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  }
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  // Recent 5
  const recent = [...transactions].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);

  return (
    <div className="page-body">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Financial Overview <span className="hero-gradient-text">✨</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Track, analyze, and optimize your spending with AI-powered insights.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Expenses" value={`₹${totalExpense.toLocaleString('en-IN')}`}
          icon="📉" color="purple"
          change={expenses.length > 0 ? `${expenses.length} transactions` : "No data yet"}
          changeDir="down"
        />
        <StatCard label="Total Income" value={`₹${totalIncome.toLocaleString('en-IN')}`}
          icon="📈" color="green"
          change={incomes.length > 0 ? `${incomes.length} credits` : "No income logged"}
          changeDir="up"
        />
        <StatCard label="Net Balance" value={`₹${Math.abs(balance).toLocaleString('en-IN')}`}
          icon={balance >= 0 ? "💰" : "⚠️"} color={balance >= 0 ? "blue" : "orange"}
          change={balance >= 0 ? "Surplus" : "Deficit"}
          changeDir={balance >= 0 ? "up" : "down"}
        />
        <StatCard label="Top Category"
          value={topCat ? topCat[0] : "—"}
          icon={topCat ? CATEGORY_ICONS[topCat[0]] : "📦"} color="orange"
          change={topCat ? `₹${topCat[1].toLocaleString('en-IN')}` : "Add transactions"}
          changeDir="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-2 chart-section">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Spending Trend</div>
              <div className="section-subtitle">Daily expense breakdown</div>
            </div>
          </div>
          <SpendingAreaChart transactions={transactions} />
        </div>
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Category Split</div>
              <div className="section-subtitle">Where your money goes</div>
            </div>
          </div>
          <CategoryDonut transactions={transactions} />
        </div>
      </div>

      {/* Bar + Insights */}
      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">By Category</div>
              <div className="section-subtitle">Expense comparison</div>
            </div>
          </div>
          <CategoryBarChart transactions={transactions} />
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">AI Insights</div>
              <div className="section-subtitle">Personalized recommendations</div>
            </div>
          </div>
          {insights.length > 0 ? (
            <div className="insight-list scrollable" style={{ maxHeight: 320 }}>
              {insights.slice(0, 4).map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </div>
          ) : (
            <EmptyState icon="💡" title="No insights yet" description="Add transactions to unlock AI insights" />
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      {recent.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="section-header">
            <div className="section-title">Recent Transactions</div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t.date || "—"}</td>
                    <td style={{ fontWeight: 500 }}>{t.merchant}</td>
                    <td>
                      <span className={`category-badge cat-${t.category}`}>
                        {CATEGORY_ICONS[t.category]} {t.category}
                      </span>
                    </td>
                    <td><span className={`amount-${t.type}`}>
                      {t.type === "expense" ? "-" : "+"}₹{t.amount.toLocaleString('en-IN')}
                    </span></td>
                    <td><span className={`type-badge type-${t.type}`}>
                      {t.type === "expense" ? "↑ Exp" : "↓ Inc"}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <EmptyState
            icon="🤖"
            title="No transactions yet!"
            description='Use "AI Extractor" to add expenses by typing or speaking naturally.'
          />
        </div>
      )}
    </div>
  );
}
