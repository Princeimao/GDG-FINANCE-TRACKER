import React, { useState, useMemo } from 'react';
import { Card, StatCard } from './UI';
import { useLocalStorage } from '../hooks';

export function TaxGeneratorView({ transactions }) {
    const [regime, setRegime] = useState('new'); // 'old' | 'new'
    const [lastPaidDate, setLastPaidDate] = useLocalStorage('tax_last_paid', '2024-03-31');
    const [showSlabs, setShowSlabs] = useState(false);

    // Calculate annual income from transactions
    const annualIncome = useMemo(() => {
        return transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0) * (12 / 1); // Mocking it as monthly average for demo
    }, [transactions]);

    const calculateTax = (income, reg) => {
        let tax = 0;
        if (reg === 'new') {
            // FY 2024-25 New Regime Slabs
            if (income <= 300000) tax = 0;
            else if (income <= 600000) tax = (income - 300000) * 0.05;
            else if (income <= 900000) tax = 15000 + (income - 600000) * 0.10;
            else if (income <= 1200000) tax = 45000 + (income - 900000) * 0.15;
            else if (income <= 1500000) tax = 90000 + (income - 1200000) * 0.20;
            else tax = 150000 + (income - 1500000) * 0.30;
        } else {
            // Old Regime Slabs (Simplified)
            if (income <= 250000) tax = 0;
            else if (income <= 500000) tax = (income - 250000) * 0.05;
            else if (income <= 1000000) tax = 12500 + (income - 500000) * 0.20;
            else tax = 112500 + (income - 1000000) * 0.30;
        }
        return Math.max(0, tax);
    };

    const estimatedTax = calculateTax(annualIncome, regime);
    const cess = estimatedTax * 0.04;
    const totalTax = estimatedTax + cess;

    const daysSinceLastPayment = Math.floor((new Date() - new Date(lastPaidDate)) / (1000 * 60 * 60 * 24));

    return (
        <div className="page-body">
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
                Income <span className="hero-gradient-text">Tax Estimator</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Estimate your tax liability based on your recorded income transactions.
            </p>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                <Card>
                    <div className="section-title">Regime Selection</div>
                    <div className="tab-nav" style={{ marginTop: 16 }}>
                        <button className={`tab-btn ${regime === 'new' ? 'active' : ''}`} onClick={() => setRegime('new')}>New Regime (FY 24-25)</button>
                        <button className={`tab-btn ${regime === 'old' ? 'active' : ''}`} onClick={() => setRegime('old')}>Old Regime</button>
                    </div>
                    
                    <div style={{ marginTop: 20 }}>
                        <div className="form-label">Annual Income (Computed)</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-green)' }}>
                            ₹{annualIncome.toLocaleString('en-IN')}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            *Computed by summing all recorded 'Income' transactions.
                        </p>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <div className="form-label">Last Tax Payment Date</div>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={lastPaidDate} 
                            onChange={(e) => setLastPaidDate(e.target.value)}
                        />
                    </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent)' }}>
                    <div className="section-title">Tax Summary</div>
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Estimated Tax</span>
                            <span style={{ fontWeight: 600 }}>₹{estimatedTax.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Health & Education Cess (4%)</span>
                            <span style={{ fontWeight: 600 }}>₹{cess.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ margin: '16px 0', height: 1, background: 'var(--border)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: 18 }}>Total Payable</span>
                            <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent-red)' }}>₹{totalTax.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: 20 }} onClick={() => setShowSlabs(!showSlabs)}>
                        {showSlabs ? 'Hide Slabs' : 'Show Tax Slabs'}
                    </button>
                </Card>
            </div>

            <div className="stats-grid">
                <StatCard 
                    label="Last Paid" 
                    value={`${daysSinceLastPayment} Days`} 
                    icon="🗓️" 
                    color="purple" 
                    change="Since last payment" 
                    changeDir="" 
                />
                <StatCard 
                    label="Deadline" 
                    value="31 July" 
                    icon="🔔" 
                    color="orange" 
                    change="ITR Filing Due Date" 
                    changeDir="" 
                />
            </div>

            {showSlabs && (
                <Card style={{ marginTop: 24, animation: 'fadeIn 0.3s ease' }}>
                    <div className="section-title">New Regime Slabs (FY 2024-25)</div>
                    <div className="table-container" style={{ marginTop: 16 }}>
                        <table>
                            <thead>
                                <tr><th>Income Slab</th><th>Tax Rate</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>Up to ₹3,00,000</td><td>0%</td></tr>
                                <tr><td>₹3,00,001 - ₹6,00,000</td><td>5%</td></tr>
                                <tr><td>₹6,00,001 - ₹9,00,000</td><td>10%</td></tr>
                                <tr><td>₹9,00,001 - ₹12,00,000</td><td>15%</td></tr>
                                <tr><td>₹12,00,001 - ₹15,00,000</td><td>20%</td></tr>
                                <tr><td>Above ₹15,00,000</td><td>30%</td></tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
