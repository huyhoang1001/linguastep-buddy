import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';

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
    <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border-b border-[#D4A373]/50 px-4 py-2.5 text-[#2D312E] dark:text-[#F4F2EC] text-xs shadow-xs sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-7 h-7 rounded-lg bg-[#D4A373]/20 border border-[#D4A373]/40 flex items-center justify-center text-[#D4A373] shrink-0 mx-auto sm:mx-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center justify-center sm:justify-start space-x-2">
              <span>Offline Continuity Mode Active</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#D4A373]/15 text-[#9C6D38] dark:text-[#E6B87E] border border-[#D4A373]/30">
                Local Mode
              </span>
            </div>
            <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
              {reason || 'AI daily allowance is temporarily depleted. The study desk is running in local continuity mode so your learning records and reviews continue smoothly.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs transition shadow-2xs flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Check Again</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white transition cursor-pointer"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
