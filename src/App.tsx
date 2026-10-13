import React, { useState } from 'react';
import { AppProvider, useApp, AppView } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { DashboardView } from './components/dashboard/DashboardView';
import { HashWorkspaceView } from './components/hash/HashWorkspaceView';
import { CompareView } from './components/compare/CompareView';
import { VerifyView } from './components/verify/VerifyView';
import { HistoryView } from './components/history/HistoryView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

function AppContent() {
  const { currentView } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'hash':
        return <HashWorkspaceView />;
      case 'compare':
        return <CompareView />;
      case 'verify':
        return <VerifyView />;
      case 'history':
        return <HistoryView />;
      case 'ai-assistant':
        return <AIAssistantView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080b11] text-slate-100 font-sans">
      {/* Collapsible / Mobile Responsive Sidebar */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Notification Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
