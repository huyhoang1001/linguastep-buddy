import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, RotateCcw, X, ShieldAlert, Sparkles } from 'lucide-react';
import { AIClientError } from '../services/api.ts';

interface AIErrorAlertProps {
  error: AIClientError | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

export const AIErrorAlert: React.FC<AIErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  compact = false,
  className = ''
}) => {
  if (!error) return null;

  const code = (error as any)?.code || 'GENERAL_ERROR';
  const retryable = (error as any)?.retryable ?? (code === 'RATE_LIMITED' || code === 'SERVICE_UNAVAILABLE' || code === 'TIMEOUT');
  const initialCooldown = (error as any)?.retryAfterSeconds || (code === 'RATE_LIMITED' ? 5 : 0);

  const [cooldown, setCooldown] = useState<number>(initialCooldown);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    setCooldown(initialCooldown);
  }, [initialCooldown, error]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleRetryClick = async () => {
    if (cooldown > 0 || isRetrying || !onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const isQuota = code === 'QUOTA_EXHAUSTED';
  const isRateLimit = code === 'RATE_LIMITED';
  const isAuth = code === 'AUTH_FAILED';

  // Primary user-facing headline
  const headline = isQuota
    ? "AI daily quota reached. We're unable to process your request right now. Please try again later."
    : isRateLimit
    ? 'AI service is temporarily busy. Please wait a moment before trying again.'
    : isAuth
    ? 'AI service configuration issue. Unable to verify credentials.'
    : typeof error === 'string'
    ? error
    : (error as any)?.userMessage || error.message || 'An unexpected AI service notice occurred.';

  // Explanatory guidance
  const guidance = isQuota
    ? 'The AI daily allowance for this session has been reached. No automated response was substituted so you can retry when allowance is restored. Your current inputs and progress have been preserved.'
    : isRateLimit
    ? `Please wait ${cooldown > 0 ? `${cooldown} seconds` : 'a moment'} for the rate-limit cooldown before submitting your request again.`
    : isAuth
    ? 'The service credentials need to be restored before AI features can work again.'
    : 'A transient service disruption occurred. Your work is preserved so you can retry without losing your input.';

  if (compact) {
    return (
      <div
        className={`rounded-2xl border p-3 text-xs flex items-start justify-between space-x-3 transition-all ${
          isQuota
            ? 'bg-[#E07A5F]/10 border-[#E07A5F]/30 text-[#2D312E] dark:text-[#F4F2EC]'
            : isRateLimit
            ? 'bg-[#D4A373]/15 border-[#D4A373]/35 text-[#2D312E] dark:text-[#F4F2EC]'
            : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] text-[#2D312E] dark:text-[#F4F2EC]'
        } ${className}`}
        role="alert"
      >
        <div className="flex items-start space-x-2.5">
          {isQuota ? (
            <ShieldAlert className="w-4 h-4 text-[#E07A5F] shrink-0 mt-0.5" />
          ) : isRateLimit ? (
            <Clock className="w-4 h-4 text-[#D4A373] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#E07A5F] shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold text-[#1B4332] dark:text-[#F4F2EC]">{headline}</div>
            <div className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">{guidance}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onRetry && (
            <button
              onClick={handleRetryClick}
              disabled={cooldown > 0 || isRetrying}
              className={`px-2.5 py-1 rounded-xl font-medium text-[11px] flex items-center space-x-1 transition shadow-2xs cursor-pointer ${
                cooldown > 0
                  ? 'bg-white/40 dark:bg-[#1E231F] text-[#8C938D] cursor-not-allowed border border-[#D8CFBF] dark:border-[#3C443E]'
                  : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
              }`}
            >
              <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{cooldown > 0 ? `Wait (${cooldown}s)` : 'Retry'}</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white transition cursor-pointer"
              title="Dismiss warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border p-4 md:p-5 shadow-xs transition-all ${
        isQuota
          ? 'bg-[#FAF7F2] dark:bg-[#1E231F] border-[#E07A5F]/40 text-[#2D312E] dark:text-[#F4F2EC]'
          : isRateLimit
          ? 'bg-[#FAF7F2] dark:bg-[#1E231F] border-[#D4A373]/40 text-[#2D312E] dark:text-[#F4F2EC]'
          : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] text-[#2D312E] dark:text-[#F4F2EC]'
      } ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
              isQuota
                ? 'bg-[#E07A5F]/15 border-[#E07A5F]/30 text-[#E07A5F]'
                : isRateLimit
                ? 'bg-[#D4A373]/15 border-[#D4A373]/35 text-[#D4A373]'
                : 'bg-[#E07A5F]/15 border-[#E07A5F]/30 text-[#E07A5F]'
            }`}
          >
            {isQuota ? (
              <ShieldAlert className="w-5 h-5" />
            ) : isRateLimit ? (
              <Clock className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4]">
                {isQuota ? 'AI Quota Limit' : isRateLimit ? 'Rate Limited' : 'AI Service Notice'}
              </span>
              {cooldown > 0 && (
                <span className="text-xs text-[#D4A373] font-mono">
                  (Cooldown: {cooldown}s)
                </span>
              )}
            </div>
            <h4 className="text-sm md:text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] pt-1">
              {headline}
            </h4>
            <p className="text-xs leading-relaxed text-[#5C645E] dark:text-[#A7ABA4] max-w-xl">
              {guidance}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-white dark:hover:bg-[#262F28] transition cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-4 pt-3 border-t border-[#EBE4D7] dark:border-[#2C332E] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-[#8C938D]">
            {isQuota
              ? 'Progress and typed input remain intact. You can retry whenever capacity resets.'
              : 'Pacing requests gently prevents repeated server rate-limit errors.'}
          </span>

          <button
            onClick={handleRetryClick}
            disabled={cooldown > 0 || isRetrying}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-xs cursor-pointer ${
              cooldown > 0
                ? 'bg-white/40 dark:bg-[#1E231F] text-[#8C938D] cursor-not-allowed border border-[#D8CFBF] dark:border-[#3C443E]'
                : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>
              {isRetrying
                ? 'Retrying...'
                : cooldown > 0
                ? `Retry available in ${cooldown}s`
                : 'Retry Request'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
