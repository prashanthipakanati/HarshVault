import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import {
  LayoutDashboard,
  Hash,
  GitCompare,
  ShieldCheck,
  History,
  Bot,
  FileSpreadsheet,
  Settings,
  Shield,
  X,
  HardDrive,
  Lock
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { currentView, setCurrentView, records } = useApp();

  const navItems: Array<{ id: AppView; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hash', label: 'Hash Workspace', icon: Hash },
    { id: 'compare', label: 'Compare Hashes', icon: GitCompare },
    { id: 'verify', label: 'Verify Integrity', icon: ShieldCheck },
    { id: 'history', label: 'Saved Records', icon: History, badge: records.length },
    { id: 'ai-assistant', label: 'AI Cryptography Tutor', icon: Bot },
    { id: 'reports', label: 'Export & Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings & Vault', icon: Settings },
  ];

  const handleNavClick = (viewId: AppView) => {
    setCurrentView(viewId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-[#0c101a] transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-0 md:translate-x-0 max-md:-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Hash Explorer
                <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400 border border-violet-500/30">
                  VAULT
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 tracking-wider">
                CRYPTOGRAPHIC SUITE
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : Boolean(item.badge)) && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-medium ${
                      isActive
                        ? 'bg-violet-500/30 text-violet-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Local Storage Privacy Card */}
        <div className="border-t border-slate-800/80 p-3 bg-[#0a0e17]/80">
          <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5" />
                Local Browser Vault
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="text-xs text-slate-300 font-mono">
              {records.length} records in local storage
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Lock className="h-3 w-3 text-slate-500" /> Private & Device-Only
              </span>
              <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
