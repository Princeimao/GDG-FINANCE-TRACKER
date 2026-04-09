// ================================================================
// EMAIL NOTIFICATION SERVICE
// Uses EmailJS for client-side email delivery
// ================================================================

import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function sendOverspendAlert(userEmail, category, spent, budget) {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn("Email context missing. Set VITE_EMAILJS_* keys in .env");
        return;
    }

    const templateParams = {
        to_email: userEmail,
        message: `🚨 Overspend Alert: You have spent ₹${spent} in the ${category} category, which exceeds your budget of ₹${budget}!`,
        subject: `FinanceAI: Budget Warning for ${category}`
    };

    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('Email sent successfully!', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send email:', err);
        return false;
    }
}

export function checkBudgetsAndNotify(transactions, budgets, userEmail, addToast) {
    if (!userEmail) return;

    const expensesByCategory = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        }
    });

    Object.keys(budgets).forEach(cat => {
        const spent = expensesByCategory[cat] || 0;
        const limit = budgets[cat];

        if (spent > limit) {
            // Check if we already notified for this (local state/prev check logic)
            // For now, we just suggest the action
            addToast(`🚨 Budget exceeded in ${cat}! Sending email alert...`, "error");
            sendOverspendAlert(userEmail, cat, spent, limit);
        }
    });
}
