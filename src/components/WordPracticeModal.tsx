import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Compass,
  FileText,
  Info
} from 'lucide-react';
import {
  WordPracticeData,
  VocabularyItem,
  WordFamilyExercise,
  WordFormMastery,
  WordFamilyMember
} from '../types/learning.ts';
import { getWordPractice, localStore } from '../services/api.ts';
import { CambridgeDictionarySearch } from './CambridgeDictionarySearch.tsx';
import { playCorrectMeowChime, playMeowSound } from '../services/catSoundService.ts';
import { catCustomizationStore } from '../services/catCustomizationStore.ts';

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
  const [savedItem, setSavedItem] = useState<VocabularyItem | null>(null);

  // Micro-exam exercises state
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [exerciseStates, setExerciseStates] = useState<Record<number, ExerciseSubmissionState>>({});
  const [showHint, setShowHint] = useState<boolean>(false);

  // Sync activeWord if prop changes
  useEffect(() => {
    setActiveWord(word);
  }, [word]);

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
      setSavedItem(null);

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
          setSavedItem(existing);
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
      setSavedItem(itemToSave);
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

  const handleSelectOption = (optId: string) => {
    if (currentSubmission.isSubmitted) return;
    setExerciseStates(prev => ({
      ...prev,
      [activeExerciseIndex]: {
        selectedOptionId: optId,
        isSubmitted: false,
        isCorrect: false
      }
    }));
  };

  const handleSubmitExercise = async () => {
    if (!currentSubmission.selectedOptionId || !currentExercise || !data || currentSubmission.isSubmitted) return;

    const isCorrect = currentSubmission.selectedOptionId.toUpperCase() === currentExercise.expected_answer_id.toUpperCase();

    // Mark current exercise as submitted
    setExerciseStates(prev => ({
      ...prev,
      [activeExerciseIndex]: {
        selectedOptionId: currentSubmission.selectedOptionId,
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
      setSavedItem(formResult.item);

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
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-end animate-fadeIn"
    >
      <div className="w-full max-w-3xl min-h-screen bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between text-slate-100">
        {/* Top Sticky Header with Return Button & Cambridge Search */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-3.5 md:p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                title="Return to your previous screen"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>Return</span>
              </button>

              {currentQuestionIndex && totalQuestions ? (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Exam Question <strong>{currentQuestionIndex}</strong> of {totalQuestions}
                </span>
              ) : (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Cambridge Dictionary · Word Family Discovery & Mastery
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/60"
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
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-medium">
                Analyzing word family morphology for "<strong>{activeWord}</strong>"...
              </p>
            </div>
          ) : error || !data ? (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-3xl p-6 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Could Not Load Practice</h3>
              <p className="text-xs text-rose-200">{error || 'Unable to connect to dictionary service.'}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Return to Exam
              </button>
            </div>
          ) : (
            <>
              {/* 1. Main Word Profile Card */}
              <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        {data.word}
                      </h2>
                      <button
                        onClick={() => playSpeech(data.cleaned_word || data.word)}
                        className="p-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition"
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-indigo-300 mt-1 font-mono">
                      <span>{data.ipa}</span>
                      <span>·</span>
                      <span className="italic capitalize text-slate-300">{data.part_of_speech}</span>
                    </div>
                  </div>

                  {/* Bookmark / Save to Memory Button */}
                  <button
                    onClick={handleToggleSaveMemory}
                    className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                      isSavedToMemory
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSavedToMemory ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                        <span>Saved to Review Memory</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        <span>Save to Review Memory</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Meanings */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-sm md:text-base font-semibold text-white leading-relaxed">
                    {data.meaning_vi}
                  </div>
                  {data.meaning_en && (
                    <p className="text-xs text-slate-400 italic">
                      "{data.meaning_en}"
                    </p>
                  )}
                </div>

                {/* Where encountered in the exam */}
                {data.context_in_exam && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                      Encountered Context:
                    </span>
                    <p className="italic text-slate-200 leading-relaxed font-normal">
                      "{data.context_in_exam}"
                    </p>
                  </div>
                )}
              </div>

              {/* 2. WORD FAMILY DISCOVERY TABLE */}
              {data.word_family && data.word_family.members && data.word_family.members.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                          <span>Word Family Discovery</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            Root: {data.word_family.family_root || data.cleaned_word}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Explore derivational forms, suffix patterns, and natural sentences
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {data.word_family.members.length} forms identified
                    </span>
                  </div>

                  {/* Compact Word Family Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                          <th className="pb-2.5 font-semibold">Form & Pronunciation</th>
                          <th className="pb-2.5 font-semibold">Part of Speech</th>
                          <th className="pb-2.5 font-semibold hidden md:table-cell">Pattern / Suffix</th>
                          <th className="pb-2.5 font-semibold">Meaning & Context</th>
                          <th className="pb-2.5 font-semibold text-right">Form Mastery</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.word_family.members.map((member, idx) => {
                          const isHead = member.is_headword || member.form.toLowerCase() === data.cleaned_word.toLowerCase();
                          return (
                            <tr
                              key={idx}
                              className={`group hover:bg-slate-800/40 transition ${
                                isHead ? 'bg-indigo-950/20' : ''
                              }`}
                            >
                              <td className="py-3 pr-3">
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => playSpeech(member.form)}
                                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                    title={`Listen to ${member.form}`}
                                  >
                                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveWord(member.form)}
                                    className="font-bold text-white hover:text-indigo-300 transition text-left cursor-pointer underline decoration-dotted decoration-slate-600 hover:decoration-indigo-400"
                                    title="Look up this specific form in Cambridge dictionary"
                                  >
                                    {member.form}
                                  </button>
                                  {isHead && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                                      Searched
                                    </span>
                                  )}
                                </div>
                                {member.ipa && (
                                  <span className="text-[10px] font-mono text-slate-400 block pl-6">
                                    {member.ipa}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 pr-3">
                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                  member.part_of_speech.includes('verb')
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : member.part_of_speech.includes('noun')
                                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                    : member.part_of_speech.includes('adj')
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {member.part_of_speech.replace('_', ' ')}
                                </span>
                              </td>

                              <td className="py-3 pr-3 hidden md:table-cell text-slate-400 font-mono text-[11px]">
                                {member.suffix_or_pattern || '—'}
                              </td>

                              <td className="py-3 pr-3">
                                <p className="text-slate-200 font-medium">{member.meaning_vi}</p>
                                {member.example_sentence && (
                                  <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
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
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-start space-x-2">
                      <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong className="text-slate-300">Morphology Note: </strong>
                        {data.word_family.missing_forms_note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. REDESIGNED MICRO-EXAM: WORD FORM SELECTION & GRAMMATICAL MASTERY */}
              {currentExercise && (
                <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
                  {/* Micro-Exam Header & Exercise Stepper */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-2">
                          <span>Micro-Exam: {formatExerciseTypeLabel(currentExercise.exercise_type)}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                            Testing Form: {currentExercise.target_part_of_speech}
                          </span>
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Select the grammatically correct word form for this context
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Exercise Stepper if multiple exercises available */}
                      {currentExercises.length > 1 && (
                        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                          {currentExercises.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setActiveExerciseIndex(i);
                                setShowHint(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                activeExerciseIndex === i
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Ex {i + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {currentExercise.hint && (
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {showHint && currentExercise.hint && (
                    <div className="bg-sky-950/30 border border-sky-800/40 p-3 rounded-xl text-xs text-sky-200 animate-fadeIn">
                      💡 {currentExercise.hint}
                    </div>
                  )}

                  {/* Transformation source / Error sentence if applicable */}
                  {currentExercise.transformation_source_sentence && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        Original Sentence to Transform:
                      </span>
                      <p className="italic font-medium text-slate-200">
                        "{currentExercise.transformation_source_sentence}"
                      </p>
                      {currentExercise.transformation_prompt && (
                        <span className="text-[11px] text-indigo-300 font-semibold block pt-1">
                          → {currentExercise.transformation_prompt}
                        </span>
                      )}
                    </div>
                  )}

                  {currentExercise.error_sentence && (
                    <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-3.5 text-xs text-rose-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                        Sentence with Grammatical Error:
                      </span>
                      <p className="font-mono text-slate-200">
                        "{currentExercise.error_sentence}"
                      </p>
                    </div>
                  )}

                  {/* Question Prompt */}
                  <p className="text-sm md:text-base font-semibold text-white leading-relaxed whitespace-pre-line">
                    {currentExercise.prompt}
                  </p>

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
                        'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white';
                      if (currentSubmission.isSubmitted) {
                        if (isExpected) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500';
                        } else if (isWrongChoice) {
                          btnStyle = 'bg-rose-950/60 border-rose-500 text-white ring-1 ring-rose-500';
                        } else {
                          btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-950 border-indigo-500 text-white ring-2 ring-indigo-500';
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={currentSubmission.isSubmitted}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between ${btnStyle} ${
                            currentSubmission.isSubmitted ? 'cursor-default' : 'cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {opt.id}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs md:text-sm font-medium">{opt.text}</span>
                              {opt.part_of_speech && (
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-700">
                                  {opt.part_of_speech}
                                </span>
                              )}
                            </div>
                          </div>

                          {isExpected && (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                              ✓ Correct Form
                            </span>
                          )}
                          {isWrongChoice && (
                            <span className="text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                              ✗ Your Choice
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submission Button */}
                  {!currentSubmission.isSubmitted ? (
                    <div className="flex justify-end pt-1">
                      <button
                        disabled={!currentSubmission.selectedOptionId}
                        onClick={handleSubmitExercise}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-md flex items-center space-x-1.5"
                      >
                        <span>Submit Answer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Detailed Post-Submission Feedback */
                    <div className={`p-4 md:p-5 rounded-2xl border space-y-3 animate-fadeIn ${
                      currentSubmission.isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                    }`}>
                      {/* Verdict Header */}
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center space-x-2">
                          {currentSubmission.isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-300">
                                Excellent! Correct form: <strong>{currentExercise.expected_answer_text}</strong> ({currentExercise.target_part_of_speech})
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-400" />
                              <span className="text-rose-300">
                                Incorrect form. Expected: <strong>{currentExercise.expected_answer_text}</strong> ({currentExercise.target_part_of_speech})
                              </span>
                            </>
                          )}
                        </div>

                        {/* Individual Word Form Mastery Status Callout */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-400">Tested form status:</span>
                          {getFormMasteryBadge(currentExercise.target_form)}
                        </div>
                      </div>

                      {/* Decisive Grammatical Clue Box */}
                      {currentExercise.grammatical_clue && (
                        <div className="bg-slate-900/90 border border-indigo-500/30 p-3 rounded-xl text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                            💡 Decisive Grammatical Clue:
                          </span>
                          <p className="text-slate-200 leading-relaxed font-medium">
                            {currentExercise.grammatical_clue}
                          </p>
                        </div>
                      )}

                      {/* Full Completed Natural Sentence */}
                      {currentExercise.full_correct_sentence && (
                        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Natural Completed Sentence:
                          </span>
                          <p className="italic text-white font-medium">
                            "{currentExercise.full_correct_sentence}"
                          </p>
                        </div>
                      )}

                      {/* Vietnamese Explanation */}
                      {currentExercise.vietnamese_explanation && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {currentExercise.vietnamese_explanation}
                        </p>
                      )}

                      {/* Option-by-Option Distractor Breakdown */}
                      {currentExercise.distractor_explanations && Object.keys(currentExercise.distractor_explanations).length > 0 && (
                        <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Form-by-Form Syntactic Analysis:
                          </span>
                          {Object.entries(currentExercise.distractor_explanations).map(([optKey, explanationText]) => (
                            <div key={optKey} className="text-[11px] text-slate-300 flex items-start space-x-2">
                              <span className="font-bold text-indigo-400 shrink-0">Option {optKey}:</span>
                              <span>{explanationText}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Learning Progress Notice */}
                      <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800">
                        <span>
                          Word forms are tracked independently. A single correct answer does not mark the entire family as mastered.
                        </span>
                        {activeExerciseIndex < currentExercises.length - 1 && (
                          <button
                            onClick={() => {
                              setActiveExerciseIndex(prev => prev + 1);
                              setShowHint(false);
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center space-x-1"
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
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Natural Collocation:
                    </span>
                    <strong className="text-white block font-mono text-xs">
                      {data.collocation_pattern}
                    </strong>
                  </div>
                )}

                {data.pronunciation_tip && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                      Pronunciation Tip:
                    </span>
                    <p className="text-slate-300 text-xs">{data.pronunciation_tip}</p>
                  </div>
                )}
              </div>

              {/* 5. Workplace & Real-world Usage Examples */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Practical Application Examples
                </span>

                {data.example_workplace && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {examMajor || 'Professional'}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-200 italic font-medium leading-relaxed pl-1">
                      "{data.example_workplace}"
                    </p>
                  </div>
                )}

                {data.example_general && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Everyday Context:
                    </span>
                    <p className="text-xs text-slate-300 italic pl-1 leading-relaxed">
                      "{data.example_general}"
                    </p>
                  </div>
                )}

                {/* Similar Word Contrast */}
                {data.similar_word_comparison && (
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] block">
                        Nuance Contrast: {data.word} vs. {data.similar_word_comparison.word}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveWord(data.similar_word_comparison!.word)}
                        className="text-[10px] font-semibold text-amber-300 hover:text-white underline decoration-amber-400/60 transition"
                      >
                        Look up "{data.similar_word_comparison.word}" →
                      </button>
                    </div>
                    <p className="text-slate-300">{data.similar_word_comparison.difference}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Persistent Action Bar */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {isSavedToMemory ? (
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Word family saved in your spaced repetition deck</span>
              </span>
            ) : (
              <span>Your exam state is safely preserved.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSaveMemory}
              disabled={!data || isLoading}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                isSavedToMemory
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isSavedToMemory ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save to Memory</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5"
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
