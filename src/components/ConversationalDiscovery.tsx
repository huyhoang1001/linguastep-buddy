import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  RotateCcw,
  SkipForward,
  MessageSquare
} from 'lucide-react';
import {
  UserProfile,
  DiscoveryState,
  DiscoveryMessage
} from '../types/learning.ts';
import {
  getDiscoveryState,
  sendDiscoveryMessage,
  confirmDiscovery
} from '../services/api.ts';
import { AIErrorAlert } from './AIErrorAlert.tsx';

interface ConversationalDiscoveryProps {
  currentProfile: UserProfile;
  onConfirmed: (profile: UserProfile) => void;
  onSkipToDiagnostic?: () => void;
}

export const ConversationalDiscovery: React.FC<ConversationalDiscoveryProps> = ({
  currentProfile,
  onConfirmed,
  onSkipToDiagnostic
}) => {
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [aiError, setAiError] = useState<any>(null);
  const [failedText, setFailedText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDiscovery();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discoveryState?.messages, isSending]);

  const loadDiscovery = async () => {
    setIsLoading(true);
    try {
      const state = await getDiscoveryState();
      setDiscoveryState(state);
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
      const result = await confirmDiscovery();
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
    <div className="flex flex-col h-full max-h-[85vh] text-slate-100">
      {/* Header bar */}
      <div className="pb-4 mb-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Conversational Goal Discovery</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                1-on-1 Interview
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Tell your tutor about your real-world goals, challenges, and preferences
            </p>
          </div>
        </div>

        {onSkipToDiagnostic && (
          <button
            onClick={onSkipToDiagnostic}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            Skip to Assessment →
          </button>
        )}
      </div>

      {/* Discovered tags indicator */}
      {discoveryState?.profileDraft && (
        <div className="flex flex-wrap items-center gap-1.5 py-2 px-1 text-[11px] text-slate-400 mb-2 border-b border-slate-800/60">
          <span className="font-semibold text-slate-500">Learner Profile:</span>
          {discoveryState.profileDraft.primary_goal && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
              🎯 {discoveryState.profileDraft.primary_goal.replace('_', ' ')}
            </span>
          )}
          {discoveryState.profileDraft.current_level && (
            <span className="px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-800/40 text-sky-300">
              📊 Level: {discoveryState.profileDraft.current_level}
            </span>
          )}
          {discoveryState.profileDraft.daily_minutes && (
            <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/40 text-amber-300">
              ⏱ {discoveryState.profileDraft.daily_minutes} mins/day
            </span>
          )}
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Connecting to tutor...</p>
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
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold">
                      T
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isTutor
                        ? 'bg-slate-800/80 border border-slate-700/80 text-slate-100 rounded-tl-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-9">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold animate-pulse">
              T
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-xs text-slate-400 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Tutor is thinking...</span>
            </div>
          </div>
        )}

        {/* Confirmation Summary Card */}
        {discoveryState?.isConfirmed && discoveryState?.summary && (
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/50 rounded-2xl p-5 shadow-xl space-y-4 my-2">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Discovery Complete • Summary
              </h4>
            </div>

            <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {discoveryState.summary}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => handleSendMessage('Tôi muốn điều chỉnh lại một số điểm')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Adjust My Answers
              </button>

              <button
                onClick={handleConfirmPlan}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
              >
                <span>Confirm & Proceed to Adaptive Diagnostic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
              className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/70 text-slate-200 hover:text-white transition"
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
        <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            disabled={isSending}
            placeholder="Type your response in Vietnamese or English..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleSkipQuestion}
            title="Skip this question"
            disabled={isSending}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            disabled={!inputText.trim() || isSending}
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
