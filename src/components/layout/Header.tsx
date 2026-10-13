import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { Menu, Shield, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const VIEW_TITLES: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Mission Control',
    subtitle: 'Cryptographic hash workspace statistics and active operations',
  },
  hash: {
    title: 'Hash Generator',
    subtitle: 'Generate deterministic SHA-256/384/512, SHA-1 & MD5 digests client-side',
  },
  compare: {
    title: 'Hash Comparison',
    subtitle: 'Side-by-side hexadecimal digest equality and differential verification',
  },
  verify: {
    title: 'Data Integrity Verification',
    subtitle: 'Verify downloaded files and text against expected vendor checksums',
  },
  history: {
    title: 'Hash Registry & History',
    subtitle: 'Search, filter, label, export, and inspect persisted cryptographic records',
  },
  'ai-assistant': {
    title: 'AI Cryptography Tutor',
    subtitle: 'Google Gemini 3.8-powered educational assistant & algorithm consultant',
  },
  reports: {
    title: 'Export & Audit Reports',
    subtitle: 'Download CSV, JSON, checksum manifests, and printable audit sheets',
  },
  settings: {
    title: 'Settings & Storage Vault',
    subtitle: 'Preferences, local storage quotas, JSON backups, and vector self-tests',
  },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentView, setCurrentView, stats } = useApp();
  const currentInfo = VIEW_TITLES[currentView] || { title: 'Workspace', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#080b11]/90 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Open navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            {currentInfo.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 truncate max-w-md">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick status pill */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-[#0f1422] px-3 py-1 text-xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Total Records:</span>
          <span className="font-mono font-semibold text-slate-200">{stats.totalGenerated}</span>
        </div>

        {/* Quick Hash Button */}
        {currentView !== 'hash' && (
          <button
            onClick={() => setCurrentView('hash')}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Hash</span>
          </button>
        )}

        {/* AI Tutor shortcut */}
        {currentView !== 'ai-assistant' && (
          <button
            onClick={() => setCurrentView('ai-assistant')}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-950/40 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-900/50 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>
        )}
      </div>
    </header>
  );
};
