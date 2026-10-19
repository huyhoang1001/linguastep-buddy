import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, X, RotateCcw } from 'lucide-react';

export const AIFallbackBanner: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleFallbackEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.active) {
        setIsActive(true);
        if (detail.reason) {
          setReason(detail.reason);
        }
      }
    };

    window.addEventListener('ai-fallback-active', handleFallbackEvent);
    return () => {
      window.removeEventListener('ai-fallback-active', handleFallbackEvent);
    };
  }, []);

  if (!isActive || dismissed) return null;

  return (
    <div className="bg-amber-950/95 border-b border-amber-500/40 px-4 py-3 text-amber-200 text-xs shadow-lg backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mx-auto sm:mx-0">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
              <span>AI Fallback Mode Active (Offline / Mock Mode)</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Quota / Token Limit
              </span>
            </div>
            <p className="text-[11px] text-amber-300/90 mt-0.5">
              {reason || 'AI token quota or credits are depleted (e.g. 402 Prepayment Required or Rate Limited). The app is currently running in offline fallback mode for testing and continuity.'} Please replenish your AI Studio credits or wait for quota reset for full AI intelligence.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Check Again / Retry</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-xl text-amber-400 hover:text-white hover:bg-amber-900/60 transition"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
