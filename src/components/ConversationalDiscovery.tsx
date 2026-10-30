import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Send,
  ArrowRight,
  Brain,
  SkipForward,
  Pencil
} from 'lucide-react';
import {
  UserProfile,
  DiscoveryState
} from '../types/learning.ts';
import {
  getDiscoveryState,
  sendDiscoveryMessage,
  confirmDiscovery
} from '../services/api.ts';
import { AIErrorAlert } from './AIErrorAlert.tsx';
import { AppButton } from './ui/AppButton.tsx';

interface ConversationalDiscoveryProps {
  currentProfile: UserProfile;
  onConfirmed: (profile: UserProfile) => void;
  onSkipToDiagnostic?: () => void;
}

export const ConversationalDiscovery: React.FC<ConversationalDiscoveryProps> = ({
  onConfirmed,
  onSkipToDiagnostic
}) => {
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [aiError, setAiError] = useState<any>(null);
  const [failedText, setFailedText] = useState<string>('');
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDiscovery();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discoveryState?.messages, isSending]);

  useEffect(() => {
    if (discoveryState?.summary) {
      setEditedSummary(discoveryState.summary);
    }
  }, [discoveryState?.summary]);

  const loadDiscovery = async () => {
    setIsLoading(true);
    try {
      const state = await getDiscoveryState();
      setDiscoveryState(state);
      if (state?.summary) {
        setEditedSummary(state.summary);
      }
    } catch (err) {
      console.error('Failed to load discovery state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    setAiError(null);
    setFailedText('');
    setInputText('');
    setIsSending(true);

    try {
      const updated = await sendDiscoveryMessage(text.trim());
      setDiscoveryState(updated);
      if (updated?.summary) {
        setEditedSummary(updated.summary);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setAiError(err);
      setFailedText(text);
      setInputText(text); // Preserve user's input so they can easily retry
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmPlan = async () => {
    try {
      const summaryToUse = editedSummary.trim() || discoveryState?.summary || '';
      const result = await confirmDiscovery(summaryToUse);
      onConfirmed(result.profile);
    } catch (err) {
      console.error('Failed to confirm discovery:', err);
    }
  };

  const handleSkipQuestion = () => {
    handleSendMessage('Skip question');
  };

  const latestMessage = discoveryState?.messages[discoveryState.messages.length - 1];
  const isLatestFromTutor = latestMessage?.sender === 'tutor';

  return (
    <div className="flex flex-col h-full max-h-[85vh] text-[#2D312E] dark:text-[#F4F2EC]">
      {/* Header bar */}
      <div className="pb-4 mb-3 border-b border-[#EBE4D7] dark:border-[#2C332E] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-2">
              <span>Conversational Goal Discovery</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/25 text-[#2D6A4F] dark:text-[#74A892] border border-[#2D6A4F]/20 font-sans font-semibold">
                1-on-1 Interview
              </span>
            </h3>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
              Tell your tutor about your real-world goals, challenges, and preferences
            </p>
          </div>
        </div>

        {onSkipToDiagnostic && (
          <AppButton
            onClick={onSkipToDiagnostic}
            size="sm"
            variant="ghost"
            rightIcon={<ArrowRight />}
          >
            Skip to Assessment
          </AppButton>
        )}
      </div>

      {/* Discovered tags indicator */}
      {discoveryState?.profileDraft && (
        <div className="flex flex-wrap items-center gap-1.5 py-2 px-1 text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mb-2 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <span className="font-semibold text-[#8C938D]">Learner Profile:</span>
          {discoveryState.profileDraft.primary_goal && (
            <span className="px-2 py-0.5 rounded-md bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 border border-[#2D6A4F]/30 text-[#2D6A4F] dark:text-[#74A892]">
              🎯 {discoveryState.profileDraft.primary_goal.replace('_', ' ')}
            </span>
          )}
          {discoveryState.profileDraft.current_level && (
            <span className="px-2 py-0.5 rounded-md bg-[#52796F]/10 dark:bg-[#52796F]/20 border border-[#52796F]/30 text-[#52796F] dark:text-[#84A98C]">
              📊 Level: {discoveryState.profileDraft.current_level}
            </span>
          )}
          {discoveryState.profileDraft.daily_minutes && (
            <span className="px-2 py-0.5 rounded-md bg-[#E07A5F]/10 dark:bg-[#E07A5F]/20 border border-[#E07A5F]/30 text-[#E07A5F]">
              ⏱ {discoveryState.profileDraft.daily_minutes} mins/day
            </span>
          )}
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">Connecting to tutor...</p>
          </div>
        ) : (
          discoveryState?.messages.map((msg, index) => {
            const isTutor = msg.sender === 'tutor';
            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-start space-x-2.5 max-w-[85%]">
                  {isTutor && (
                    <div className="w-7 h-7 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-serif font-bold">
                      T
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isTutor
                        ? 'bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[#2D312E] dark:text-[#F4F2EC] rounded-tl-sm shadow-xs'
                        : 'bg-[#2D6A4F] text-white rounded-tr-sm shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>

                <span className="text-[10px] text-[#8C938D] mt-1 px-9 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-serif font-bold animate-pulse">
              T
            </div>
            <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-3 text-xs text-[#5C645E] dark:text-[#A7ABA4] flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-ping" />
              <span>Tutor is thinking...</span>
            </div>
          </div>
        )}

        {/* Confirmation Summary Card */}
        {discoveryState?.isConfirmed && (
          <div className="bg-white dark:bg-[#262F28] border border-[#2D6A4F]/40 rounded-2xl p-5 shadow-sm space-y-4 my-2">
            <div className="flex items-center justify-between text-[#2D6A4F] dark:text-[#74A892]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-sm font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                  Discovery Complete • Learner Goal Summary
                </h4>
              </div>
              <button
                onClick={() => setIsEditingSummary(!isEditingSummary)}
                className="text-xs font-semibold text-[#2D6A4F] dark:text-[#74A892] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isEditingSummary ? 'Done Editing' : 'Edit Goal Summary'}</span>
              </button>
            </div>

            {isEditingSummary ? (
              <div className="space-y-2">
                <label className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] font-medium">
                  Refine or edit your goal summary below. This will be stored for your account and used to generate your diagnostic exam:
                </label>
                <textarea
                  rows={3}
                  value={editedSummary}
                  onChange={e => setEditedSummary(e.target.value)}
                  placeholder="E.g., Prepare for technical interviews, practice daily standups, learn business negotiation terms..."
                  className="w-full bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#D8CFBF] dark:border-[#3C443E] rounded-xl p-3 text-xs text-[#2D312E] dark:text-[#F4F2EC] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] leading-relaxed"
                />
              </div>
            ) : (
              <p className="text-xs text-[#2D312E] dark:text-[#E0DDD5] whitespace-pre-line leading-relaxed bg-[#FAF7F2] dark:bg-[#1E231F] p-4 rounded-xl border border-[#EBE4D7] dark:border-[#2C332E]">
                {editedSummary || discoveryState.summary || 'Master English for professional and daily communication'}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <AppButton
                onClick={() => handleSendMessage('Tôi muốn điều chỉnh lại một số điểm')}
                size="sm"
                variant="secondary"
              >
                Adjust via Tutor Chat
              </AppButton>

              <AppButton
                onClick={handleConfirmPlan}
                size="md"
                variant="primary"
                rightIcon={<ArrowRight />}
              >
                Confirm & Proceed to Adaptive Diagnostic
              </AppButton>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Replies */}
      {isLatestFromTutor && latestMessage?.quickReplies && latestMessage.quickReplies.length > 0 && !discoveryState?.isConfirmed && (
        <div className="flex flex-wrap gap-2 mb-3">
          {latestMessage.quickReplies.map((reply, idx) => (
            <button
              key={idx}
              disabled={isSending}
              onClick={() => handleSendMessage(reply)}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] hover:border-[#2D6A4F] text-[#2D312E] dark:text-[#F4F2EC] hover:text-[#2D6A4F] transition cursor-pointer shadow-2xs"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* AI Quota / Service Error Alert */}
      {aiError && (
        <AIErrorAlert
          error={aiError}
          onRetry={failedText ? () => handleSendMessage(failedText) : undefined}
          onDismiss={() => {
            setAiError(null);
            setFailedText('');
          }}
          compact
          className="mb-2"
        />
      )}

      {/* Input box */}
      {!discoveryState?.isConfirmed && (
        <div className="pt-2 border-t border-[#EBE4D7] dark:border-[#2C332E] flex items-center space-x-2">
          <input
            type="text"
            disabled={isSending}
            placeholder="Type your response in Vietnamese or English..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-white dark:bg-[#262F28] border border-[#D8CFBF] dark:border-[#3C443E] rounded-xl px-4 py-2.5 text-sm text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8C938D] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />

          <AppButton
            variant="icon"
            onClick={handleSkipQuestion}
            title="Skip this question"
            disabled={isSending}
            size="md"
          >
            <SkipForward className="w-4 h-4" />
          </AppButton>

          <AppButton
            disabled={!inputText.trim() || isSending}
            onClick={() => handleSendMessage()}
            variant="primary"
            size="md"
            className="!p-2.5 aspect-square min-w-0"
          >
            <Send className="w-4 h-4" />
          </AppButton>
        </div>
      )}
    </div>
  );
};
