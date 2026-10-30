import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Layers,
  HelpCircle,
  AlertTriangle,
  Check,
  Info
} from 'lucide-react';
import {
  WordPracticeData,
  VocabularyItem,
  WordFamilyExercise,
  WordFormMastery
} from '../types/learning.ts';
import { getWordPractice, localStore } from '../services/api.ts';
import { CambridgeDictionarySearch } from './CambridgeDictionarySearch.tsx';
import { playCorrectMeowChime, playMeowSound } from '../services/catSoundService.ts';
import { catCustomizationStore } from '../services/catCustomizationStore.ts';
import { AUTO_SUBMIT_NOTE } from '../utils/submissionPolicy.ts';

interface WordPracticeModalProps {
  word: string;
  contextSentence?: string;
  examMajor?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  onClose: () => void;
  onSavedToMemory?: (item: VocabularyItem) => void;
}

interface ExerciseSubmissionState {
  selectedOptionId: string | null;
  isSubmitted: boolean;
  isCorrect: boolean;
}

export const WordPracticeModal: React.FC<WordPracticeModalProps> = ({
  word,
  contextSentence = '',
  examMajor = 'General Professional English',
  currentQuestionIndex,
  totalQuestions,
  onClose,
  onSavedToMemory
}) => {
  const [activeWord, setActiveWord] = useState<string>(word);
  const [data, setData] = useState<WordPracticeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Word family form mastery tracking
  const [formMasteries, setFormMasteries] = useState<Record<string, WordFormMastery>>({});
  const [isSavedToMemory, setIsSavedToMemory] = useState<boolean>(false);


  // Micro-exam exercises state
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [exerciseStates, setExerciseStates] = useState<Record<number, ExerciseSubmissionState>>({});
  const [showHint, setShowHint] = useState<boolean>(false);

  // Sync activeWord if prop changes
  useEffect(() => {
    setActiveWord(word);
  }, [word]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load word details, word family discovery, and exercises
  useEffect(() => {
    let isMounted = true;
    const fetchWordData = async () => {
      setIsLoading(true);
      setError(null);
      setActiveExerciseIndex(0);
      setExerciseStates({});
      setShowHint(false);
      setIsSavedToMemory(false);

      try {
        const practiceData = await getWordPractice(activeWord, contextSentence, examMajor);
        if (!isMounted) return;
        setData(practiceData);

        // Check if word is already saved in memory and load existing form masteries
        const vocabList = await localStore.getVocabulary();
        const existing = vocabList.find(
          v => v.word.toLowerCase() === practiceData.cleaned_word.toLowerCase()
        );
        if (existing) {
          setIsSavedToMemory(true);
          if (existing.word_form_mastery) {
            setFormMasteries(existing.word_form_mastery);
          } else {
            setFormMasteries({});
          }
        } else {
          setFormMasteries({});
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load word practice:', err);
        setError(err?.message || 'Could not load practice for this word.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchWordData();
    return () => {
      isMounted = false;
    };
  }, [activeWord, contextSentence, examMajor]);

  const playSpeech = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const handleToggleSaveMemory = async () => {
    if (!data) return;

    if (isSavedToMemory) {
      setIsSavedToMemory(false);
      return;
    }

    try {
      const itemToSave = await localStore.saveVocabularyItem({
        word: data.cleaned_word || data.word,
        part_of_speech: data.part_of_speech || 'noun',
        ipa: data.ipa || '',
        meaning: data.meaning_vi || data.meaning_en,
        collocation_pattern: data.collocation_pattern || '',
        example_general: data.example_general || '',
        example_workplace: data.example_workplace || '',
        similar_word_comparison: data.similar_word_comparison,
        word_family: data.word_family,
        word_form_mastery: formMasteries
      });

      setIsSavedToMemory(true);
      if (onSavedToMemory) onSavedToMemory(itemToSave);
    } catch (err) {
      console.error('Failed to save vocabulary item:', err);
    }
  };

  const currentExercises: WordFamilyExercise[] = data?.exercises && data.exercises.length > 0
    ? data.exercises
    : data?.practice_question
      ? [
          {
            id: 'legacy-1',
            exercise_type: 'word_form_selection',
            prompt: data.practice_question.prompt,
            target_form: data.cleaned_word,
            target_part_of_speech: data.part_of_speech,
            options: data.practice_question.options.map(o => ({ id: o.id, text: o.text })),
            expected_answer_id: data.practice_question.expected_answer_id,
            expected_answer_text: data.practice_question.expected_answer_text,
            full_correct_sentence: data.practice_question.prompt.replace('________', data.practice_question.expected_answer_text),
            grammatical_clue: 'Context-specific grammatical structure requires this canonical form.',
            vietnamese_explanation: data.practice_question.explanation,
            hint: data.practice_question.hint
          }
        ]
      : [];

  const currentExercise = currentExercises[activeExerciseIndex] || currentExercises[0];
  const currentSubmission = exerciseStates[activeExerciseIndex] || {
    selectedOptionId: null,
    isSubmitted: false,
    isCorrect: false
  };

  const handleSelectOption = async (optId: string) => {
    if (currentSubmission.isSubmitted) return;
    await handleSubmitExercise(optId);
  };

  const handleSubmitExercise = async (overrideOptionId?: string) => {
    const selectedOptId = overrideOptionId || currentSubmission.selectedOptionId;
    if (!selectedOptId || !currentExercise || !data || currentSubmission.isSubmitted) return;

    const isCorrect = selectedOptId.toUpperCase() === currentExercise.expected_answer_id.toUpperCase();

    // Mark current exercise as submitted
    setExerciseStates(prev => ({
      ...prev,
      [activeExerciseIndex]: {
        selectedOptionId: selectedOptId,
        isSubmitted: true,
        isCorrect
      }
    }));

    // Cute Cat Chibi sound feedback
    try {
      const catConfig = catCustomizationStore.getConfig();
      if (catConfig.soundEnabled) {
        if (isCorrect && catConfig.meowOnCorrect) {
          playCorrectMeowChime();
        } else if (!isCorrect) {
          playMeowSound(0.85);
        }
      }
    } catch (e) {}

    // Record separate performance evidence for this specific tested word form
    try {
      const formResult = await localStore.recordWordFormEvidence({
        rootWord: data.cleaned_word || data.word,
        form: currentExercise.target_form,
        partOfSpeech: currentExercise.target_part_of_speech,
        isCorrect,
        familyData: data.word_family
      });

      setFormMasteries(formResult.allFormMasteries);
      setIsSavedToMemory(true);

      // Record general vocabulary evidence
      await localStore.recordVocabularyEvidence({
        word: data.cleaned_word || data.word,
        cardData: {
          word: data.cleaned_word || data.word,
          part_of_speech: data.part_of_speech,
          ipa: data.ipa,
          meaning: data.meaning_vi || data.meaning_en,
          collocation_pattern: data.collocation_pattern,
          example_workplace: data.example_workplace,
          word_family: data.word_family
        },
        isCorrect,
        contextSentence: currentExercise.full_correct_sentence || currentExercise.prompt,
        exerciseType: 'contextual_cloze'
      });

      if (onSavedToMemory) onSavedToMemory(formResult.item);
    } catch (e) {
      console.warn('Failed to record word form evidence:', e);
    }
  };

  const getFormMasteryBadge = (formText: string) => {
    const key = formText.toLowerCase().trim();
    const mastery = formMasteries[key];
    if (!mastery) {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E231F] text-[#5C645E] dark:text-[#A7ABA4] border border-[#EBE4D7] dark:border-[#2C332E]">
          Not Tested
        </span>
      );
    }

    if (mastery.status === 'mastered') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Mastered</span>
        </span>
      );
    }

    if (mastery.status === 'understood') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
          Understood
        </span>
      );
    }

    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
        Needs Practice
      </span>
    );
  };

  const formatExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'word_form_selection':
        return 'Word Form Selection';
      case 'error_correction':
        return 'Error Correction';
      case 'sentence_transformation':
        return 'Sentence Transformation';
      case 'family_completion':
        return 'Family Completion';
      default:
        return 'Grammatical Practice';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#161A17]/70 backdrop-blur-sm flex justify-end animate-fadeIn"
    >
      <div className="w-full max-w-3xl min-h-screen bg-[#FAF7F2] dark:bg-[#1A1F1B] border-l border-[#EBE4D7] dark:border-[#2C332E] shadow-2xl flex flex-col justify-between text-[#2D312E] dark:text-[#F4F2EC] font-sans">
        {/* Top Sticky Header with Return Button & Cambridge Search */}
        <div className="sticky top-0 z-10 bg-[#FAF7F2]/95 dark:bg-[#1A1F1B]/95 backdrop-blur border-b border-[#EBE4D7] dark:border-[#2C332E] p-3.5 md:p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#272E29] hover:bg-[#EFF6F1] dark:hover:bg-[#323D34] text-[#2D312E] dark:text-[#F4F2EC] border border-[#EBE4D7] dark:border-[#38423A] text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="Return to your previous screen"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                <span>Return</span>
              </button>

              {currentQuestionIndex && totalQuestions ? (
                <span className="text-xs text-[#5C645E] dark:text-[#A7ABA4] hidden sm:inline">
                  Exam Question <strong>{currentQuestionIndex}</strong> of {totalQuestions}
                </span>
              ) : (
                <span className="text-xs text-[#5C645E] dark:text-[#A7ABA4] hidden sm:inline">
                  Cambridge Dictionary · Word Family Discovery &amp; Mastery
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white dark:bg-[#272E29] hover:bg-[#EFF6F1] dark:hover:bg-[#323D34] text-[#8A938C] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] flex items-center justify-center transition border border-[#EBE4D7] dark:border-[#38423A] cursor-pointer"
              title="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Quick Cambridge Word Search Bar inside modal */}
          <div className="pt-0.5">
            <CambridgeDictionarySearch
              onSelectWord={(newWord) => setActiveWord(newWord)}
              placeholder="Look up another word in Cambridge dictionary..."
              compact={true}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#5C645E] dark:text-[#A7ABA4] font-medium">
                Analyzing word family morphology for &ldquo;<strong>{activeWord}</strong>&rdquo;...
              </p>
            </div>
          ) : error || !data ? (
            <div className="bg-[#FDF0ED] dark:bg-[#2D2320] border border-[#F5D5CC] dark:border-[#4B342E] rounded-3xl p-6 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-[#E07A5F] mx-auto" />
              <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">Could Not Load Practice</h3>
              <p className="text-xs text-[#E07A5F]">{error || 'Unable to connect to dictionary service.'}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#272E29] border border-[#EBE4D7] dark:border-[#38423A] text-[#2D312E] dark:text-[#F4F2EC] text-xs font-semibold cursor-pointer"
              >
                Return to Exam
              </button>
            </div>
          ) : (
            <>
              {/* 1. Main Word Profile Card */}
              <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight">
                        {data.word}
                      </h2>
                      <button
                        type="button"
                        onClick={() => playSpeech(data.cleaned_word || data.word)}
                        className="p-2 rounded-xl bg-[#EFF6F1] dark:bg-[#252F28] hover:bg-[#E2EFE6] text-[#2D6A4F] dark:text-[#84A98C] border border-[#CDE1D4] dark:border-[#334237] transition cursor-pointer"
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-[#52796F] dark:text-[#84A98C] mt-1 font-mono">
                      <span>{data.ipa}</span>
                      <span>&middot;</span>
                      <span className="italic capitalize text-[#5C645E] dark:text-[#A7ABA4]">{data.part_of_speech}</span>
                    </div>
                  </div>

                  {/* Bookmark / Save to Stash Button */}
                  <button
                    type="button"
                    onClick={handleToggleSaveMemory}
                    className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer ${
                      isSavedToMemory
                        ? 'bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237] text-[#2D6A4F] dark:text-[#52B788]'
                        : 'bg-white dark:bg-[#272E29] hover:bg-[#FAF7F2] border-[#EBE4D7] dark:border-[#38423A] text-[#5C645E] dark:text-[#A7ABA4]'
                    }`}
                  >
                    {isSavedToMemory ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-[#52B788]" />
                        <span>Saved to Word Stash</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-[#8A938C]" />
                        <span>Save to Word Stash</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Meanings */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-sm md:text-base font-semibold text-[#1B4332] dark:text-[#95D5B2] leading-relaxed">
                    {data.meaning_vi}
                  </div>
                  {data.meaning_en && (
                    <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic">
                      &ldquo;{data.meaning_en}&rdquo;
                    </p>
                  )}
                </div>

                {/* Where encountered in the exam */}
                {data.context_in_exam && (
                  <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-2xl p-3.5 text-xs text-[#5C645E] dark:text-[#A7ABA4] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#84A98C] block">
                      Encountered Context:
                    </span>
                    <p className="italic text-[#2D312E] dark:text-[#EAE6DF] leading-relaxed font-normal">
                      &ldquo;{data.context_in_exam}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* 2. WORD FAMILY DISCOVERY TABLE */}
              {data.word_family && data.word_family.members && data.word_family.members.length > 0 && (
                <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE4D7] dark:border-[#303B33] pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF6F1] dark:bg-[#28352C] flex items-center justify-center text-[#2D6A4F] dark:text-[#52B788]">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight flex items-center space-x-2">
                          <span>Word Family Discovery</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1A1F1B] text-[#5C645E] dark:text-[#A7ABA4] border border-[#EBE4D7] dark:border-[#303B33]">
                            Root: {data.word_family.family_root || data.cleaned_word}
                          </span>
                        </h3>
                        <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                          Explore derivational forms, suffix patterns, and natural sentences
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-[#8A938C]">
                      {data.word_family.members.length} forms identified
                    </span>
                  </div>

                  {/* Compact Word Family Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#EBE4D7] dark:border-[#303B33] text-[#8A938C] text-[11px] uppercase tracking-wider">
                          <th className="pb-2.5 font-semibold">Form &amp; Pronunciation</th>
                          <th className="pb-2.5 font-semibold">Part of Speech</th>
                          <th className="pb-2.5 font-semibold hidden md:table-cell">Pattern / Suffix</th>
                          <th className="pb-2.5 font-semibold">Meaning &amp; Context</th>
                          <th className="pb-2.5 font-semibold text-right">Form Mastery</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4EFEB] dark:divide-[#2B332D]">
                        {data.word_family.members.map((member, idx) => {
                          const isHead = member.is_headword || member.form.toLowerCase() === data.cleaned_word.toLowerCase();
                          return (
                            <tr
                              key={idx}
                              className={`group hover:bg-[#FAF7F2] dark:hover:bg-[#252C26] transition ${
                                isHead ? 'bg-[#EFF6F1] dark:bg-[#28352C]' : ''
                              }`}
                            >
                              <td className="py-3 pr-3">
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => playSpeech(member.form)}
                                    className="p-1 rounded-md text-[#8A938C] hover:text-[#1B4332] dark:hover:text-white transition"
                                    title={`Listen to ${member.form}`}
                                  >
                                    <Volume2 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveWord(member.form)}
                                    className="font-bold text-[#1B4332] dark:text-[#F4F2EC] hover:text-[#2D6A4F] dark:hover:text-[#52B788] transition text-left cursor-pointer underline decoration-dotted decoration-[#C5BFB3] hover:decoration-[#2D6A4F]"
                                    title="Look up this specific form in Cambridge dictionary"
                                  >
                                    {member.form}
                                  </button>
                                  {isHead && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2D6A4F]/10 dark:bg-[#52B788]/20 text-[#2D6A4F] dark:text-[#52B788] border border-[#2D6A4F]/20 font-semibold">
                                      Searched
                                    </span>
                                  )}
                                </div>
                                {member.ipa && (
                                  <span className="text-[10px] font-mono text-[#5C645E] dark:text-[#A7ABA4] block pl-6">
                                    {member.ipa}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 pr-3">
                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                  member.part_of_speech.includes('verb')
                                    ? 'bg-[#FDF0ED] dark:bg-[#2E2421] text-[#E07A5F] border border-[#F5D5CC] dark:border-[#4B342E]'
                                    : member.part_of_speech.includes('noun')
                                    ? 'bg-[#EFF6F1] dark:bg-[#252F28] text-[#2D6A4F] dark:text-[#84A98C] border border-[#CDE1D4] dark:border-[#334237]'
                                    : member.part_of_speech.includes('adj')
                                    ? 'bg-[#EFF6F1] dark:bg-[#252F28] text-[#2D6A4F] dark:text-[#84A98C] border border-[#CDE1D4] dark:border-[#334237]'
                                    : 'bg-[#FAF7F2] dark:bg-[#242A25] text-[#B25E00] dark:text-[#E9A825] border border-[#EBE4D7] dark:border-[#313B33]'
                                }`}>
                                  {member.part_of_speech.replace('_', ' ')}
                                </span>
                              </td>

                              <td className="py-3 pr-3 hidden md:table-cell text-[#5C645E] dark:text-[#A7ABA4] font-mono text-[11px]">
                                {member.suffix_or_pattern || '—'}
                              </td>

                              <td className="py-3 pr-3">
                                <p className="text-[#2D312E] dark:text-[#F4F2EC] font-medium">{member.meaning_vi}</p>
                                {member.example_sentence && (
                                  <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] italic mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                                    "{member.example_sentence}"
                                  </p>
                                )}
                              </td>

                              <td className="py-3 text-right">
                                {getFormMasteryBadge(member.form)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Missing forms note */}
                  {data.word_family.missing_forms_note && (
                    <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-2xl p-3 text-xs text-[#5C645E] dark:text-[#A7ABA4] flex items-start space-x-2">
                      <Info className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong className="text-[#1B4332] dark:text-[#F4F2EC]">Morphology Note: </strong>
                        {data.word_family.missing_forms_note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. REDESIGNED MICRO-EXAM: WORD FORM SELECTION & GRAMMATICAL MASTERY */}
              {currentExercise && (
                <div className="bg-white dark:bg-[#222924] border border-[#2D6A4F]/40 dark:border-[#52B788]/40 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                  {/* Micro-Exam Header & Exercise Stepper */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE4D7] dark:border-[#303B33] pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF6F1] dark:bg-[#28352C] flex items-center justify-center text-[#2D6A4F] dark:text-[#52B788]">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52B788] flex items-center space-x-2">
                          <span>Micro-Exam: {formatExerciseTypeLabel(currentExercise.exercise_type)}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EFF6F1] dark:bg-[#28352C] text-[#2D6A4F] dark:text-[#84A98C] border border-[#CDE1D4] dark:border-[#344439]">
                            Testing Form: {currentExercise.target_part_of_speech}
                          </span>
                        </h4>
                        <span className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
                          Select the grammatically correct word form for this context
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Exercise Stepper if multiple exercises available */}
                      {currentExercises.length > 1 && (
                        <div className="flex items-center space-x-1 bg-[#FAF7F2] dark:bg-[#1A1F1B] p-1 rounded-xl border border-[#EBE4D7] dark:border-[#303B33]">
                          {currentExercises.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setActiveExerciseIndex(i);
                                setShowHint(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                activeExerciseIndex === i
                                  ? 'bg-[#2D6A4F] text-white shadow-sm'
                                  : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
                              }`}
                            >
                              Ex {i + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {currentExercise.hint && (
                        <button
                          type="button"
                          onClick={() => setShowHint(!showHint)}
                          className="text-xs text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white flex items-center space-x-1 cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#E6A23C]" />
                          <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {showHint && currentExercise.hint && (
                    <div className="bg-[#EFF6F1] dark:bg-[#242E27] border border-[#CDE1D4] dark:border-[#334237] p-3 rounded-xl text-xs text-[#2D6A4F] dark:text-[#84A98C] animate-fadeIn">
                      💡 {currentExercise.hint}
                    </div>
                  )}

                  {/* Transformation source / Error sentence if applicable */}
                  {currentExercise.transformation_source_sentence && (
                    <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-2xl p-3.5 text-xs text-[#5C645E] dark:text-[#A7ABA4] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B25E00] dark:text-[#E9A825] block">
                        Original Sentence to Transform:
                      </span>
                      <p className="italic font-medium text-[#2D312E] dark:text-[#F4F2EC]">
                        "{currentExercise.transformation_source_sentence}"
                      </p>
                      {currentExercise.transformation_prompt && (
                        <span className="text-[11px] text-[#2D6A4F] dark:text-[#52B788] font-semibold block pt-1">
                          → {currentExercise.transformation_prompt}
                        </span>
                      )}
                    </div>
                  )}

                  {currentExercise.error_sentence && (
                    <div className="bg-[#FDF0ED] dark:bg-[#2D2320] border border-[#F5D5CC] dark:border-[#4B342E] rounded-2xl p-3.5 text-xs text-[#E07A5F] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#E07A5F] block">
                        Sentence with Grammatical Error:
                      </span>
                      <p className="font-mono text-[#2D312E] dark:text-[#F4F2EC]">
                        "{currentExercise.error_sentence}"
                      </p>
                    </div>
                  )}

                  {/* Question Prompt */}
                  <p className="text-sm md:text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] leading-relaxed whitespace-pre-line">
                    {currentExercise.prompt}
                  </p>

                  {/* Auto Submit Note */}
                  {!currentSubmission.isSubmitted && (
                    <div className="text-xs font-medium text-[#2D6A4F] dark:text-[#52B788] flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#334237]">
                      <span className="text-sm shrink-0">💡</span>
                      <span>{AUTO_SUBMIT_NOTE}</span>
                    </div>
                  )}

                  {/* Options with Part of Speech labels */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentExercise.options.map(opt => {
                      const isSelected = currentSubmission.selectedOptionId === opt.id;
                      const isExpected =
                        currentSubmission.isSubmitted &&
                        opt.id.toUpperCase() === currentExercise.expected_answer_id.toUpperCase();
                      const isWrongChoice =
                        currentSubmission.isSubmitted && isSelected && !isExpected;

                      let btnStyle =
                        'bg-[#FAF7F2] dark:bg-[#1E231F] border-[#EBE4D7] dark:border-[#333D35] text-[#2D312E] dark:text-[#F4F2EC] hover:border-[#74A892]';
                      if (currentSubmission.isSubmitted) {
                        if (isExpected) {
                          btnStyle = 'bg-[#EFF6F1] dark:bg-[#252F28] border-[#52B788] text-[#1B4332] dark:text-[#F4F2EC] ring-1 ring-[#52B788]';
                        } else if (isWrongChoice) {
                          btnStyle = 'bg-[#FDF0ED] dark:bg-[#2D2320] border-[#E07A5F] text-[#2D312E] dark:text-[#F4F2EC] ring-1 ring-[#E07A5F]';
                        } else {
                          btnStyle = 'bg-white/40 dark:bg-[#1A1F1B] border-[#EBE4D7] dark:border-[#2C332E] text-[#8A938C] opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-[#EFF6F1] dark:bg-[#252F28] border-[#2D6A4F] text-[#1B4332] dark:text-[#F4F2EC] ring-1 ring-[#2D6A4F]';
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={currentSubmission.isSubmitted}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between ${btnStyle} ${
                            currentSubmission.isSubmitted ? 'cursor-default' : 'cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 rounded-lg bg-white dark:bg-[#272E29] border border-[#EBE4D7] dark:border-[#38423A] flex items-center justify-center text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] shrink-0">
                              {opt.id}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs md:text-sm font-medium">{opt.text}</span>
                              {opt.part_of_speech && (
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#222924] text-[#5C645E] dark:text-[#A7ABA4] border border-[#EBE4D7] dark:border-[#303B33]">
                                  {opt.part_of_speech}
                                </span>
                              )}
                            </div>
                          </div>

                          {isExpected && (
                            <span className="text-[11px] font-bold text-[#2D6A4F] dark:text-[#52B788] bg-[#EFF6F1] dark:bg-[#252F28] px-2 py-0.5 rounded border border-[#CDE1D4] dark:border-[#344439]">
                              ✓ Correct Form
                            </span>
                          )}
                          {isWrongChoice && (
                            <span className="text-[11px] font-bold text-[#E07A5F] bg-[#FDF0ED] dark:bg-[#2D2320] px-2 py-0.5 rounded border border-[#F5D5CC] dark:border-[#4B342E]">
                              ✗ Your Choice
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {currentSubmission.isSubmitted && (
                    /* Detailed Post-Submission Feedback */
                    <div className={`p-4 md:p-5 rounded-2xl border space-y-3 animate-fadeIn ${
                      currentSubmission.isCorrect
                        ? 'bg-[#EFF6F1] dark:bg-[#202B24] border-[#CDE1D4] dark:border-[#334237] text-[#1B4332] dark:text-[#F4F2EC]'
                        : 'bg-[#FDF0ED] dark:bg-[#2D2320] border-[#F5D5CC] dark:border-[#4B342E] text-[#2D312E] dark:text-[#F4F2EC]'
                    }`}>
                      {/* Verdict Header */}
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center space-x-2">
                          {currentSubmission.isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
                              <span className="text-[#2D6A4F] dark:text-[#52B788]">
                                Excellent! Correct form: <strong>{currentExercise.expected_answer_text}</strong> ({currentExercise.target_part_of_speech})
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-[#E07A5F]" />
                              <span className="text-[#E07A5F]">
                                Incorrect form. Expected: <strong>{currentExercise.expected_answer_text}</strong> ({currentExercise.target_part_of_speech})
                              </span>
                            </>
                          )}
                        </div>

                        {/* Individual Word Form Mastery Status Callout */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">Tested form status:</span>
                          {getFormMasteryBadge(currentExercise.target_form)}
                        </div>
                      </div>

                      {/* Decisive Grammatical Clue Box */}
                      {currentExercise.grammatical_clue && (
                        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] p-3 rounded-xl text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52B788] block">
                            💡 Decisive Grammatical Clue:
                          </span>
                          <p className="text-[#2D312E] dark:text-[#F4F2EC] leading-relaxed font-medium">
                            {currentExercise.grammatical_clue}
                          </p>
                        </div>
                      )}

                      {/* Full Completed Natural Sentence */}
                      {currentExercise.full_correct_sentence && (
                        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] p-3 rounded-xl text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] block">
                            Natural Completed Sentence:
                          </span>
                          <p className="italic text-[#1B4332] dark:text-[#F4F2EC] font-medium">
                            "{currentExercise.full_correct_sentence}"
                          </p>
                        </div>
                      )}

                      {/* Vietnamese Explanation */}
                      {currentExercise.vietnamese_explanation && (
                        <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
                          {currentExercise.vietnamese_explanation}
                        </p>
                      )}

                      {/* Option-by-Option Distractor Breakdown */}
                      {currentExercise.distractor_explanations && Object.keys(currentExercise.distractor_explanations).length > 0 && (
                        <div className="pt-2 border-t border-[#EBE4D7] dark:border-[#2C332E] space-y-1.5 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] block">
                            Form-by-Form Syntactic Analysis:
                          </span>
                          {Object.entries(currentExercise.distractor_explanations).map(([optKey, explanationText]) => (
                            <div key={optKey} className="text-[11px] text-[#2D312E] dark:text-[#F4F2EC] flex items-start space-x-2">
                              <span className="font-bold text-[#2D6A4F] dark:text-[#52B788] shrink-0">Option {optKey}:</span>
                              <span>{explanationText}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Learning Progress Notice */}
                      <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5C645E] dark:text-[#A7ABA4] border-t border-[#EBE4D7] dark:border-[#2C332E]">
                        <span>
                          Word forms are tracked independently. A single correct answer does not mark the entire family as mastered.
                        </span>
                        {activeExerciseIndex < currentExercises.length - 1 && (
                          <button
                            onClick={() => {
                              setActiveExerciseIndex(prev => prev + 1);
                              setShowHint(false);
                            }}
                            className="px-3 py-1 rounded-lg bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Next Exercise ({activeExerciseIndex + 2}/{currentExercises.length})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Collocations & Nuances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {data.collocation_pattern && (
                  <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52B788] block">
                      Natural Collocation:
                    </span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC] block font-mono text-xs">
                      {data.collocation_pattern}
                    </strong>
                  </div>
                )}

                {data.pronunciation_tip && (
                  <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] block">
                      Pronunciation Tip:
                    </span>
                    <p className="text-[#5C645E] dark:text-[#A7ABA4] text-xs">{data.pronunciation_tip}</p>
                  </div>
                )}
              </div>

              {/* 5. Workplace & Real-world Usage Examples */}
              <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-3xl p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] block">
                  Practical Application Examples
                </span>

                {data.example_workplace && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-[10px] uppercase font-bold text-[#2D6A4F] dark:text-[#84A98C] bg-[#EFF6F1] dark:bg-[#28352C] px-2 py-0.5 rounded border border-[#CDE1D4] dark:border-[#344439]">
                        {examMajor || 'Professional'}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-[#2D312E] dark:text-[#F4F2EC] italic font-medium leading-relaxed pl-1">
                      "{data.example_workplace}"
                    </p>
                  </div>
                )}

                {data.example_general && (
                  <div className="space-y-1 pt-1 border-t border-[#F4EFEB] dark:border-[#2B332D]">
                    <span className="text-[10px] uppercase font-bold text-[#5C645E] dark:text-[#A7ABA4] block">
                      Everyday Context:
                    </span>
                    <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic pl-1 leading-relaxed">
                      "{data.example_general}"
                    </p>
                  </div>
                )}

                {/* Similar Word Contrast */}
                {data.similar_word_comparison && (
                  <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-2xl p-3.5 text-xs text-[#2D312E] dark:text-[#F4F2EC] space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B25E00] dark:text-[#E9A825] font-bold uppercase tracking-wider text-[10px] block">
                        Nuance Contrast: {data.word} vs. {data.similar_word_comparison.word}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveWord(data.similar_word_comparison!.word)}
                        className="text-[10px] font-semibold text-[#2D6A4F] dark:text-[#52B788] hover:underline transition cursor-pointer"
                      >
                        Look up "{data.similar_word_comparison.word}" →
                      </button>
                    </div>
                    <p className="text-[#5C645E] dark:text-[#A7ABA4]">{data.similar_word_comparison.difference}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Persistent Action Bar */}
        <div className="sticky bottom-0 bg-[#FAF7F2]/95 dark:bg-[#1A1F1B]/95 backdrop-blur border-t border-[#EBE4D7] dark:border-[#2C332E] p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
            {isSavedToMemory ? (
              <span className="text-[#2D6A4F] dark:text-[#52B788] font-semibold flex items-center space-x-1">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Word family saved in your spaced repetition deck</span>
              </span>
            ) : (
              <span>Your exam state is safely preserved.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleToggleSaveMemory}
              disabled={!data || isLoading}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                isSavedToMemory
                  ? 'bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237] text-[#2D6A4F] dark:text-[#52B788]'
                  : 'bg-white dark:bg-[#272E29] hover:bg-[#FAF7F2] dark:hover:bg-[#323D34] border-[#EBE4D7] dark:border-[#38423A] text-[#2D312E] dark:text-[#F4F2EC]'
              }`}
            >
              {isSavedToMemory ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#52B788]" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-[#8A938C]" />
                  <span>Save to Memory</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Current Exam</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
