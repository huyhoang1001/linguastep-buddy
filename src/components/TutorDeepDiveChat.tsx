import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Columns,
  Quote
} from 'lucide-react';
import {
  Question,
  AnswerEvaluation,
  DeepDiveChatMessage
} from '../types/learning.ts';
import { tutorDeepDive } from '../services/api.ts';
import { AIErrorAlert } from './AIErrorAlert.tsx';
import { AppButton } from './ui/AppButton.tsx';

interface TutorDeepDiveChatProps {
  question: Question;
  userAnswer: string;
  evaluation?: AnswerEvaluation;
}

export const TutorDeepDiveChat: React.FC<TutorDeepDiveChatProps> = ({
  question,
  userAnswer,
  evaluation
}) => {
  const [messages, setMessages] = useState<DeepDiveChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [chatError, setChatError] = useState<any>(null);
  const [failedPrompt, setFailedPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset or clear chat when question changes
  useEffect(() => {
    setMessages([]);
    setInputMessage('');
    setIsExpanded(true);
    setChatError(null);
    setFailedPrompt('');
  }, [question.id]);

  useEffect(() => {
    if (messages.length > 0 || chatError) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, chatError]);

  // Contextual quick prompt suggestions
  const getQuickPrompts = (): string[] => {
    if (question.section === 'vocabulary') {
      return [
        'Similar words: when & why should I use each?',
        'Give me 3 realistic workplace examples',
        'Common mistakes & wrong collocations to avoid'
      ];
    }
    if (question.section === 'grammar') {
      return [
        'Why this structure instead of alternatives?',
        'Give me a simple memory trick for this rule',
        'Show 2 contrasting example sentences'
      ];
    }
    if (question.section === 'writing') {
      return [
        'How can I make my writing sound more natural?',
        'Show a formal vs casual variation of this',
        'What transitional phrases would improve flow?'
      ];
    }
    return [
      'Can you explain the subtle nuance in this question?',
      'Give me another real-life example'
    ];
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setChatError(null);
    setFailedPrompt('');

    const userMsg: DeepDiveChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await tutorDeepDive(question, userAnswer, evaluation, text, history);

      const tutorMsg: DeepDiveChatMessage = {
        id: `tutor-${Date.now()}`,
        role: 'tutor',
        content: response.reply,
        created_at: new Date().toISOString(),
        examples: response.examples,
        similar_words_comparison: response.similar_words_comparison,
        suggestedFollowUps: response.suggestedFollowUps
      };

      setMessages([...newMessages, tutorMsg]);
    } catch (err: any) {
      // Preserve input for retry and surface error alert
      setChatError(err);
      setFailedPrompt(text);
      setInputMessage(text);
      // Remove the orphaned user message so the thread remains coherent
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-3xl p-5 md:p-6 shadow-xs space-y-4 transition-all">
      {/* Header with toggle collapse */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D7] dark:border-[#3C443E]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-2">
              <span>Dig Deeper with Your AI Tutor</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#74A892] border border-[#2D6A4F]/25 font-mono font-semibold uppercase tracking-wider">
                Interactive
              </span>
            </h4>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
              Ask about nuanced word differences, alternative phrasing, or extra real-life examples.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] transition cursor-pointer"
          title={isExpanded ? 'Collapse tutor chat' : 'Expand tutor chat'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Quick Suggestions (if no messages yet or as prompt ideas) */}
          {messages.length === 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] block">
                Suggested Questions to Dig Into:
              </span>
              <div className="flex flex-wrap gap-2">
                {getQuickPrompts().map((prompt, idx) => (
                  <AppButton
                    key={idx}
                    disabled={isLoading}
                    onClick={() => handleSend(prompt)}
                    size="sm"
                    variant="secondary"
                    leftIcon={<Lightbulb className="text-[#D4A373]" />}
                    className="text-left font-normal"
                  >
                    {prompt}
                  </AppButton>
                ))}
              </div>
            </div>
          )}

          {/* Messages Thread */}
          {messages.length > 0 && (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed space-y-3 ${
                      msg.role === 'user'
                        ? 'bg-[#2D6A4F] text-white rounded-tr-sm shadow-xs'
                        : 'bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] text-[#2D312E] dark:text-[#F4F2EC] rounded-tl-sm shadow-xs'
                    }`}
                  >
                    {/* Role header for tutor */}
                    {msg.role === 'tutor' && (
                      <div className="flex items-center space-x-1.5 pb-1.5 border-b border-[#EBE4D7] dark:border-[#2C332E] text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#74A892]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Tutor Insight</span>
                      </div>
                    )}

                    {/* Content text */}
                    <div className="whitespace-pre-line leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Similar Words Comparison (if present) */}
                    {msg.similar_words_comparison && msg.similar_words_comparison.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#EBE4D7] dark:border-[#2C332E] space-y-2">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-[#52796F] dark:text-[#74A892] flex items-center space-x-1">
                          <Columns className="w-3 h-3" />
                          <span>Nuance & Context Comparison:</span>
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.similar_words_comparison.map((comp, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] space-y-1">
                              <div className="flex items-center justify-between">
                                <strong className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                                  {comp.word}
                                </strong>
                                <span className="text-[10px] text-[#D4A373] font-medium">
                                  {comp.when_to_use}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
                                <span className="font-semibold text-[#2D312E] dark:text-[#E0DDD5]">Nuance: </span>{comp.nuance}
                              </p>
                              {comp.example && (
                                <p className="text-[11px] text-[#2D6A4F] dark:text-[#74A892] italic pt-0.5">
                                  "{comp.example}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Highlighted Examples (if present) */}
                    {msg.examples && msg.examples.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-[#EBE4D7] dark:border-[#2C332E] space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#74A892] flex items-center space-x-1">
                          <Quote className="w-3 h-3" />
                          <span>Key Example Sentences:</span>
                        </span>
                        {msg.examples.map((ex, i) => (
                          <div key={i} className="p-2 rounded-lg bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[11px] text-[#2D312E] dark:text-[#E0DDD5] italic">
                            "{ex}"
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Clickable Follow-up Suggestions */}
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#EBE4D7] dark:border-[#2C332E] space-y-1.5">
                        <span className="text-[10px] font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider block">
                          Suggested Next Questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((fu, i) => (
                            <button
                              key={i}
                              disabled={isLoading}
                              onClick={() => handleSend(fu)}
                              className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#1E231F] hover:bg-white dark:hover:bg-[#2C332E] border border-[#EBE4D7] dark:border-[#2C332E] text-[#2D6A4F] dark:text-[#74A892] transition flex items-center space-x-1 cursor-pointer"
                            >
                              <span>{fu}</span>
                              <ArrowRight className="w-3 h-3 text-[#2D6A4F]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading spinner state */}
              {isLoading && (
                <div className="flex items-center space-x-2 text-xs text-[#2D6A4F] dark:text-[#74A892] bg-[#FAF7F2] dark:bg-[#1E231F] p-3 rounded-2xl w-fit border border-[#EBE4D7] dark:border-[#2C332E]">
                  <div className="w-3.5 h-3.5 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
                  <span>Tutor is formulating a detailed explanation...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* AI Quota & Service Error Alert */}
          {chatError && (
            <AIErrorAlert
              error={chatError}
              onRetry={failedPrompt ? () => handleSend(failedPrompt) : undefined}
              onDismiss={() => {
                setChatError(null);
                setFailedPrompt('');
              }}
              compact
            />
          )}

          {/* Input Box */}
          <div className="flex items-center space-x-2 pt-2 border-t border-[#EBE4D7] dark:border-[#3C443E]">
            <input
              type="text"
              disabled={isLoading}
              placeholder="Ask anything about this word, rule, or sentence nuance..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isLoading && inputMessage.trim()) {
                  handleSend();
                }
              }}
              className="flex-1 bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#D8CFBF] dark:border-[#3C443E] rounded-xl px-4 py-2.5 text-xs md:text-sm text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8C938D] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] transition"
            />
            <AppButton
              disabled={!inputMessage.trim() || isLoading}
              onClick={() => handleSend()}
              size="md"
              variant="primary"
              rightIcon={<Send />}
            >
              Ask
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
};
