// ================================================================
// GMAIL SYNC SERVICE
// Fetches receipts (Amazon, Swiggy) and parses them with Gemini
// ================================================================

import { extractExpensesWithAI } from './geminiService';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES    = "https://www.googleapis.com/auth/gmail.readonly";

export async function loginWithGoogle() {
    return new Promise((resolve, reject) => {
        if (!CLIENT_ID) {
            reject(new Error("VITE_GOOGLE_CLIENT_ID missing in .env"));
            return;
        }

        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
                if (response.error !== undefined) {
                    reject(response);
                }
                resolve(response.access_token);
            },
        });
        tokenClient.requestAccessToken();
    });
}

export async function fetchReceipts(accessToken) {
    // Search queries for common receipts
    const queries = ['from:amazon "order confirmation"', 'from:swiggy "order confirmation"'];
    const transactions = [];

    for (const q of queries) {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=5`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        
        if (data.messages) {
            for (const msg of data.messages) {
                const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const detail = await detailRes.json();
                
                // Get snippet or parts
                const text = detail.snippet + " " + (detail.payload.body?.data ? atob(detail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')) : "");
                
                // Use Gemini to extract from the messy email text
                const extracted = await extractExpensesWithAI(`Gmail Content: ${text}`, null); // uses ENV key
                if (extracted && extracted.length > 0) {
                    transactions.push(...extracted);
                }
            }
        }
    }
    return transactions;
}
