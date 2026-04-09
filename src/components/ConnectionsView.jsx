import React, { useState } from 'react';
import { loginWithGoogle, fetchReceipts } from '../GmailService';
import { LoadingBtn } from './UI';

export function ConnectionsView({ onAddTransactions, addToast }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [connected, setConnected] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const token = await loginWithGoogle();
            setConnected(true);
            addToast("Connected to Gmail! Fetching receipts...", "info");
            
            const transactions = await fetchReceipts(token);
            if (transactions.length > 0) {
                onAddTransactions(transactions);
                addToast(`Successfully synced ${transactions.length} receipts from Amazon/Swiggy!`, "success");
            } else {
                addToast("No new receipts found.", "info");
            }
        } catch (err) {
            console.error(err);
            addToast("Sync failed: " + err.message, "error");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="page-body">
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
                Automated <span className="hero-gradient-text">Connections</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Connect your accounts to automatically scrape receipts and record expenses without lifting a finger.
            </p>

            <div className="grid-2">
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(234, 67, 53, 0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: 24 }}>📧</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>Gmail Receipt Sync</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amazon, Swiggy, Zomato, Uber</div>
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                        Automatically scan your inbox for order confirmations. We use AI to extract the merchant, items, and amount.
                    </p>
                    <LoadingBtn 
                        loading={isSyncing} 
                        onClick={handleSync} 
                        className={connected ? "btn-green" : "btn-primary"}
                        style={{ width: '100%' }}
                    >
                        {connected ? "✅ Connected & Synced" : "🔗 Connect Gmail"}
                    </LoadingBtn>
                </div>

                <div className="card" style={{ opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(56, 116, 255, 0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: 24 }}>💸</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>Bank API (Plaid)</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Coming soon</div>
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                        Live transaction sync with over 10,000+ banks worldwide. Securely track every swipe.
                    </p>
                    <button className="btn btn-ghost" disabled style={{ width: '100%' }}>🚧 Locked</button>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24, borderColor: 'var(--accent-purple)' }}>
                <div className="section-title">Security & Privacy</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>🔒 OAuth 2.0</div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>We never see your password. Google handles the login.</p>
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>🛡️ Read-Only</div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>We only read snippets of emails that look like receipts.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
