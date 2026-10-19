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
    ? "AI usage limit reached. We're unable to process your request right now. Please try again later."
    : isRateLimit
    ? 'AI service is temporarily busy due to rate limits. Please wait a moment before trying again.'
    : isAuth
    ? 'AI service configuration issue. Unable to verify credentials.'
    : typeof error === 'string'
    ? error
    : (error as any)?.userMessage || error.message || 'An unexpected AI service error occurred.';

  // Explanatory guidance
  const guidance = isQuota
    ? 'The AI usage allowance for this service has been exhausted. No automated default response was substituted so you can retry when allowance is restored. Your current inputs and progress have been preserved.'
    : isRateLimit
    ? `Please wait ${cooldown > 0 ? `${cooldown} seconds` : 'a moment'} for the rate-limit cooldown before submitting your request again.`
    : isAuth
    ? 'The service credentials need to be restored before AI features can work again.'
    : 'A transient service disruption occurred. Your inputs and progress are preserved so you can retry without losing your work.';

  if (compact) {
    return (
      <div
        className={`rounded-xl border p-3 text-xs flex items-start justify-between space-x-3 transition-all ${
          isQuota
            ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            : isRateLimit
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
            : 'bg-red-950/80 border-red-500/40 text-red-200'
        } ${className}`}
        role="alert"
      >
        <div className="flex items-start space-x-2.5">
          {isQuota ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : isRateLimit ? (
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold text-white">{headline}</div>
            <div className="text-[11px] opacity-80 mt-0.5">{guidance}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onRetry && (
            <button
              onClick={handleRetryClick}
              disabled={cooldown > 0 || isRetrying}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] flex items-center space-x-1 transition shadow-sm ${
                cooldown > 0
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : isQuota
                  ? 'bg-rose-800 hover:bg-rose-700 text-white'
                  : 'bg-amber-800 hover:bg-amber-700 text-white'
              }`}
            >
              <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{cooldown > 0 ? `Wait (${cooldown}s)` : 'Retry'}</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded text-slate-400 hover:text-white transition"
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
      className={`rounded-2xl border p-4 md:p-5 shadow-xl transition-all ${
        isQuota
          ? 'bg-rose-950/85 border-rose-500/50 text-rose-100 shadow-rose-950/30'
          : isRateLimit
          ? 'bg-amber-950/85 border-amber-500/50 text-amber-100 shadow-amber-950/30'
          : 'bg-slate-900/95 border-red-500/40 text-slate-200'
      } ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isQuota
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : isRateLimit
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-red-500/20 border-red-500/40 text-red-300'
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
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/50 border border-current">
                {isQuota ? 'AI Quota Limit' : isRateLimit ? 'Rate Limited' : 'AI Service Notice'}
              </span>
              {cooldown > 0 && (
                <span className="text-xs text-amber-300 font-mono">
                  (Cooldown: {cooldown}s)
                </span>
              )}
            </div>
            <h4 className="text-sm md:text-base font-bold text-white pt-1">
              {headline}
            </h4>
            <p className="text-xs leading-relaxed opacity-90 max-w-xl">
              {guidance}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isQuota
              ? 'Progress and typed input remain intact. You can retry whenever capacity resets.'
              : 'Pacing requests gently prevents repeated server rate-limit errors.'}
          </span>

          <button
            onClick={handleRetryClick}
            disabled={cooldown > 0 || isRetrying}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-lg ${
              cooldown > 0
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : isQuota
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
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
