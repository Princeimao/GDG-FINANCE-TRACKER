import { useState } from 'react';
import { TransactionRow, EmptyState } from './UI';
import { CATEGORIES, CATEGORY_ICONS } from '../financeEngine';

export function HistoryView({ transactions, onDelete, onClear }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');

  const filtered = transactions
    .filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.merchant.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      const matchCat = filterCat === 'All' || t.category === filterCat;
      const matchType = filterType === 'All' || t.type === filterType;
      return matchSearch && matchCat && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return (b.id || 0) - (a.id || 0);
      if (sortBy === 'date_asc')  return (a.id || 0) - (b.id || 0);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc')  return a.amount - b.amount;
      return 0;
    });

  const totalFiltered = filtered
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="page-body">
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        Transaction <span className="hero-gradient-text">History</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        View, search, filter, and manage all your transactions.
      </p>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            id="search-transactions"
            className="form-input"
            placeholder="🔍 Search merchant or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 220px' }}
          />
          <select
            className="form-select"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            style={{ flex: '0 0 160px' }}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ flex: '0 0 130px' }}
          >
            <option value="All">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <select
            className="form-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ flex: '0 0 160px' }}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
          {transactions.length > 0 && (
            <button className="btn btn-danger" onClick={onClear} id="clear-all-btn">
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      {filtered.length > 0 && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 16,
          background: 'var(--bg-card)', borderRadius: 12, padding: '12px 18px',
          border: '1px solid var(--border)', flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of {transactions.length} transactions
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Total Expense: <strong style={{ color: 'var(--accent-red)' }}>
              ₹{totalFiltered.toLocaleString('en-IN')}
            </strong>
          </span>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <TransactionRow key={t.id} t={t} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={transactions.length === 0 ? "📭" : "🔍"}
            title={transactions.length === 0 ? "No transactions yet" : "No results found"}
            description={transactions.length === 0
              ? "Add expenses using AI Extractor or Bank Upload"
              : "Try adjusting your search or filters"}
          />
        </div>
      )}
    </div>
  );
}
