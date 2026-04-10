import { useState, useEffect } from 'react';
import './index.css';

import { Sidebar, Topbar, ToastContainer } from './components/UI';
import { DashboardView }   from './components/DashboardView';
import { AIExtractorView } from './components/AIExtractorView';
import { BankUploadView }  from './components/BankUploadView';
import { HistoryView }     from './components/HistoryView';
import { InsightsView }    from './components/InsightsView';
import { BudgetView }      from './components/BudgetView';
import { AIChatView }      from './components/AIChatView';
import { PredictionView }  from './components/PredictionView';
import { GoalView }        from './components/GoalView';
import { TaxGeneratorView } from './components/TaxGeneratorView';
import { ConnectionsView } from './components/ConnectionsView';
import { SetupWizard }    from './components/SetupWizard';
import { useToast, useLocalStorage } from './hooks';
import { checkBudgetsAndNotify } from './EmailService';

const PAGE_META = {
  dashboard:   { title: "Dashboard",          subtitle: "Your financial overview at a glance" },
  add:         { title: "AI Extractor",       subtitle: "Extract expenses from text or voice · Gemini 3 Flash" },
  upload:      { title: "Bank Upload",        subtitle: "Parse statements · Gemini Vision OCR" },
  history:     { title: "Transactions",       subtitle: "Full history of recorded transactions" },
  insights:    { title: "Insights",           subtitle: "AI analysis & financial health" },
  budget:      { title: "Budget Tracker",     subtitle: "Set limits and track category spending" },
  chat:        { title: "AI Chat",            subtitle: "Conversational finance assistant · Gemini 3 Flash" },
  predict:     { title: "Predictions",        subtitle: "AI spending forecast & risk analysis" },
  goals:       { title: "Goal Tracker",       subtitle: "Savings goal progress · AI advice" },
  tax:         { title: "Tax Estimator",      subtitle: "Estimate your annual income tax liability" },
  connections: { title: "Connections",       subtitle: "Automate expense recording with Gmail sync" },
};

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [transactions, setTransactions] = useLocalStorage('financeai_txns', []);
  const [budgets] = useLocalStorage('financeai_budgets', { Food: 5000, Shopping: 3000, Transport: 2000, Bills: 10000 });
  const [userEmail] = useLocalStorage('financeai_email', 'user@example.com');
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage('financeai_setup_complete', false);
  const { toasts, addToast } = useToast();

  const meta = PAGE_META[activeView] || PAGE_META.dashboard;

  useEffect(() => {
    if (isSetupComplete) {
      checkBudgetsAndNotify(transactions, budgets, userEmail, addToast);
    }
  }, [transactions, isSetupComplete]);

  const handleAddTransactions = (newTxns) => {
    const withIds = newTxns.map((t, i) => ({
      ...t,
      id: Date.now() + i,
      date: t.date || new Date().toISOString().split('T')[0],
      type: t.type || 'expense'
    }));
    setTransactions(prev => [...withIds, ...prev]);
  };

  const handleSetupComplete = (initialTransactions) => {
    handleAddTransactions(initialTransactions);
    setIsSetupComplete(true);
    addToast("Welcome! Your financial profile is set up.", "success");
  };

  const handleDelete = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    addToast("Transaction deleted.", "info");
  };

  const handleClearAll = () => {
    if (window.confirm("Clear ALL transactions? This cannot be undone.")) {
      setTransactions([]);
      addToast("All transactions cleared.", "info");
    }
  };

  const sharedProps = { addToast };

  if (!isSetupComplete) {
    return (
      <>
        <SetupWizard onComplete={handleSetupComplete} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        transactions={transactions}
      />

      <div className="main-content">
        <Topbar title={meta.title} subtitle={meta.subtitle}>
          <button className="btn btn-primary" onClick={() => setActiveView('add')} id="add-expense-btn">
            ➕ Add Expense
          </button>
        </Topbar>

        {activeView === 'dashboard' && <DashboardView transactions={transactions} />}
        {activeView === 'add'       && <AIExtractorView onAddTransactions={handleAddTransactions} {...sharedProps} />}
        {activeView === 'upload'    && <BankUploadView  onAddTransactions={handleAddTransactions} {...sharedProps} />}
        {activeView === 'history'   && <HistoryView transactions={transactions} onDelete={handleDelete} onClear={handleClearAll} />}
        {activeView === 'insights'  && <InsightsView transactions={transactions} {...sharedProps} />}
        {activeView === 'budget'    && <BudgetView transactions={transactions} />}
        {activeView === 'chat'      && <AIChatView transactions={transactions} {...sharedProps} />}
        {activeView === 'predict'   && <PredictionView transactions={transactions} {...sharedProps} />}
        {activeView === 'goals'     && <GoalView transactions={transactions} {...sharedProps} />}
        {activeView === 'tax'       && <TaxGeneratorView transactions={transactions} />}
        {activeView === 'connections' && <ConnectionsView onAddTransactions={handleAddTransactions} {...sharedProps} />}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

