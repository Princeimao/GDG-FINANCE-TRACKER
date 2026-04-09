import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import { CATEGORY_COLORS } from '../financeEngine';

// ---- Custom Tooltip ----
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a2235',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      {label && <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 12 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff', fontWeight: 600 }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Spending Area Chart (trend over time)
// ============================================================
export function SpendingAreaChart({ transactions }) {
  // Group by date
  const grouped = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const key = t.date || 'Unknown';
    grouped[key] = (grouped[key] || 0) + t.amount;
  }
  const data = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, amount]) => ({ date: date.slice(5), amount }));

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
        Add transactions with dates to see the trend
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={v => `₹${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          name="Spent"
          stroke="#3b82f6"
          strokeWidth={2.5}
          fill="url(#spendGrad)"
          dot={{ fill: '#3b82f6', r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Category Bar Chart
// ============================================================
export function CategoryBarChart({ transactions }) {
  const byCat = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  }
  const data = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({ cat, amount, fill: CATEGORY_COLORS[cat] || '#64748b' }));

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
        No expense data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="cat" stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={v => `₹${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" name="Spent" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Donut / Pie Chart
// ============================================================
const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function CategoryDonut({ transactions }) {
  const byCat = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  }
  const data = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={CustomLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
