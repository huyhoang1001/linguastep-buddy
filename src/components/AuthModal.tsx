import React, { useEffect, useRef, useState } from 'react';
import { LogIn, User, Sparkles, Shield, AlertCircle, X, Check } from 'lucide-react';
import { UserAccount, BudgetLimits } from '../types/auth.ts';
import { loginWithGoogle, loginAsGuest } from '../services/api.ts';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  googleClientIdConfigured: boolean;
  googleClientId?: string;
  limits?: BudgetLimits | null;
  onAuthSuccess: (user: UserAccount, limits: BudgetLimits) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  googleClientIdConfigured,
  googleClientId,
  limits,
  onAuthSuccess
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    // Initialize Google Identity Services if client ID is configured and script is loaded
    if (googleClientIdConfigured && googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true);
              setError(null);
              try {
                const result = await loginWithGoogle(response.credential);
                onAuthSuccess(result.user, result.limits);
                onClose();
              } catch (err: any) {
                setError(err.message || 'Google authentication failed');
              } finally {
                setLoading(false);
              }
            }
          }
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'rectangular',
            text: 'signin_with',
            width: 280
          });
        }
      } catch (err) {
        console.warn('Google Identity initialization error:', err);
      }
    }
  }, [isOpen, googleClientIdConfigured, googleClientId]);

  if (!isOpen) return null;

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginAsGuest();
      onAuthSuccess(result.user, result.limits);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest session creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {currentUser ? 'Your LinguaStep Account' : 'Sign in to LinguaStep'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Learn with your adaptive English tutor. No personal API key required.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-3">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full border border-indigo-400/50"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white truncate">{currentUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentUser.authProvider}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              {limits && (
                <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Daily AI Quota</span>
                    <span className="font-bold text-indigo-400">{limits.userRemaining} / {limits.userDailyLimit} left</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Community Budget</span>
                    <span className="font-bold text-sky-400">{limits.globalRemaining} / {limits.globalDailyLimit} left</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              Continue Learning
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Sign-in Section */}
            {googleClientIdConfigured ? (
              <div className="flex flex-col items-center gap-2">
                <div ref={googleBtnContainerRef} className="flex justify-center" />
                <span className="text-[11px] text-slate-400">Sign in with your Google account</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-medium text-amber-300 mb-1">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Google Client ID not configured</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To enable 1-click Google Sign-In, add <code className="text-slate-200">GOOGLE_CLIENT_ID</code> in your server environment. You can start immediately below as a Guest learner!
                </p>
              </div>
            )}

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 text-[10px] font-bold">Or</span>
              </div>
            </div>

            {/* Guest / Demo Option */}
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Continue as Guest Learner</span>
            </button>

            {/* Privacy & Safe Usage Badges */}
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero personal API keys required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Isolated progress and private learning memory</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Protected server-side usage limits (30 AI queries/day)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
