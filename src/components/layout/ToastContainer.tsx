import React from 'react';
import { useApp, ToastMessage } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast: ToastMessage) => {
        let borderColor = 'border-slate-800';
        let bgColor = 'bg-[#0f1422]';
        let Icon = Info;
        let iconColor = 'text-sky-400';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-500/40';
          bgColor = 'bg-[#0a1814]';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          borderColor = 'border-rose-500/40';
          bgColor = 'bg-[#1a0f14]';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-500/40';
          bgColor = 'bg-[#1a160f]';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between rounded-xl border ${borderColor} ${bgColor} p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
          >
            <div className="flex items-start space-x-3">
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div>
                <div className="text-xs font-semibold text-slate-100">{toast.title}</div>
                {toast.message && (
                  <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 shrink-0 rounded p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
