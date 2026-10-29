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

    // Initialize Google Identity Services if client ID is configured
    if (googleClientIdConfigured && googleClientId) {
      let cancelled = false;
      let attempts = 0;

      const initGsi = () => {
        if (cancelled) return;
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              auto_select: false,
              cancel_on_tap_outside: true,
              callback: async (response: any) => {
                if (response?.credential) {
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
                } else if (response?.error) {
                  setError(`Google sign-in error: ${response.error}`);
                }
              }
            });

            if (googleBtnContainerRef.current) {
              googleBtnContainerRef.current.innerHTML = '';
              window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
                theme: 'outline',
                size: 'large',
                shape: 'rectangular',
                text: 'signin_with',
                width: 280
              });
            }
          } catch (err: any) {
            console.warn('Google Identity initialization error:', err);
            setError('Could not initialize Google Sign-In widget. Please try guest mode.');
          }
        } else if (attempts < 15) {
          attempts++;
          setTimeout(initGsi, 250);
        }
      };

      initGsi();
      return () => {
        cancelled = true;
      };
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
    <div className="fixed inset-0 z-50 bg-[#161A17]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-md w-full p-7 shadow-2xl relative text-[#2D312E] dark:text-[#F4F2EC] animate-in fade-in zoom-in-95 duration-150">
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-white dark:hover:bg-[#262F28] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
            {currentUser ? 'Your MeoMeo Account' : 'Welcome to MeoMeo'}
          </h2>
          <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1">
            Your cozy study companion for adult English learners. No personal API key required.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#E07A5F]/15 border border-[#E07A5F]/30 text-[#E07A5F] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#E07A5F]" />
            <span>{error}</span>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E]">
              <div className="flex items-center gap-3">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full border border-[#2D6A4F]/40"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#2D6A4F]/20 border border-[#2D6A4F]/30 flex items-center justify-center text-[#2D6A4F] dark:text-[#74A892] font-serif font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1B4332] dark:text-[#F4F2EC] truncate">{currentUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#74A892] border border-[#2D6A4F]/20 font-mono">
                      {currentUser.authProvider}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] truncate font-mono">{currentUser.email}</p>
                </div>
              </div>

              {limits && (
                <div className="mt-4 pt-3 border-t border-[#EBE4D7] dark:border-[#3C443E] space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-[#FAF7F2] dark:bg-[#1E231F] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#2C332E]">
                      <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4] block">Your Daily Quota</span>
                      <span className="font-bold text-[#2D6A4F] dark:text-[#74A892] font-mono">{limits.userRemaining} of {limits.userDailyLimit}</span>
                    </div>
                    <div className="bg-[#FAF7F2] dark:bg-[#1E231F] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#2C332E]">
                      <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4] block">Community Budget</span>
                      <span className="font-bold text-[#52796F] dark:text-[#84A98C] font-mono">{limits.globalRemaining} of {limits.globalDailyLimit}</span>
                    </div>
                  </div>
                  {typeof limits.estimatedTokensUsedToday === 'number' && (
                    <div className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] text-center flex items-center justify-center gap-1.5 bg-[#FAF7F2] dark:bg-[#1E231F] py-1.5 px-3 rounded-xl border border-[#EBE4D7] dark:border-[#2C332E]">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                      <span>Tokens consumed today: <strong className="text-[#2D312E] dark:text-[#F4F2EC] font-mono">~{limits.estimatedTokensUsedToday.toLocaleString()}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm transition cursor-pointer shadow-sm"
            >
              Continue Learning
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Sign-in Section */}
            {googleClientIdConfigured ? (
              <div className="flex flex-col items-center gap-2.5">
                <div ref={googleBtnContainerRef} className="flex justify-center" />
                <span className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">Sign in with your Google account</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                <div className="flex items-center gap-2 font-medium text-[#D4A373] mb-1">
                  <Shield className="w-4 h-4 text-[#D4A373]" />
                  <span className="font-semibold text-[#1B4332] dark:text-[#F4F2EC]">Google Client ID not configured</span>
                </div>
                <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
                  To enable 1-click Google Sign-In, add <code className="text-[#2D6A4F] dark:text-[#74A892] font-mono">GOOGLE_CLIENT_ID</code> in your server environment. You can start immediately below as a Guest learner!
                </p>
              </div>
            )}

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EBE4D7] dark:border-[#2C332E]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FAF7F2] dark:bg-[#1E231F] px-2 text-[#8C938D] text-[10px] font-bold font-mono">Or</span>
              </div>
            </div>

            {/* Guest / Demo Option */}
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#262F28] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] border border-[#D8CFBF] dark:border-[#3C443E] text-[#2D312E] dark:text-[#F4F2EC] font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <User className="w-4 h-4 text-[#52796F]" />
              <span>Continue as Guest Learner</span>
            </button>

            {/* Privacy & Safe Usage Badges */}
            <div className="pt-3 border-t border-[#EBE4D7] dark:border-[#2C332E] text-[11px] text-[#5C645E] dark:text-[#A7ABA4] space-y-1.5">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#74A892] shrink-0" />
                <span>Zero personal API keys required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#74A892] shrink-0" />
                <span>Isolated progress and private learning memory</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#74A892] shrink-0" />
                <span>Protected daily token allowance (30 AI queries/day)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
