import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Plus,
  Briefcase,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Sliders,
  ArrowRight
} from 'lucide-react';
import {
  UserProfile,
  LearnerSkillState,
  VocabularyItem,
  DailySummary,
  NextSessionCustomContext
} from '../types/learning.ts';
import { localStore } from '../services/api.ts';
import { CURATED_MAJORS } from './AdaptiveDiagnosticView.tsx';

// CEFR-calibrated grammar curriculum catalog
interface GrammarCatalogItem {
  id: string;
  name: string;
  level: string;
  category: 'Grammar' | 'Style & Tone' | 'Collocations' | 'Discourse';
  description: string;
  example: string;
}

const GRAMMAR_CATALOG: GrammarCatalogItem[] = [
  // B1 Concepts
  {
    id: 'b1_present_perf_vs_past',
    name: 'Present Perfect vs Past Simple in Status Updates',
    level: 'B1',
    category: 'Grammar',
    description: 'Distinguish completed past events with specific time stamps from ongoing accomplishments.',
    example: '"We completed the audit yesterday" vs "We have already achieved the target."'
  },
  {
    id: 'b1_conditionals_1_2',
    name: 'First & Second Conditionals (Real vs Hypothetical Plans)',
    level: 'B1',
    category: 'Grammar',
    description: 'Discuss realistic project outcomes (If we finish...) and hypothetical choices (If we had more time...).',
    example: '"If the client approves the proposal, we will commence deployment next week."'
  },
  {
    id: 'b1_modals_obligation',
    name: 'Modal Verbs of Obligation & Discretion (Must, Should, May)',
    level: 'B1',
    category: 'Grammar',
    description: 'Express business requirements, professional advice, and discretionary permissions.',
    example: '"All team members must sign off, while contractors should be notified."'
  },
  {
    id: 'b1_passive_reports',
    name: 'Passive Voice in Objective Reports',
    level: 'B1',
    category: 'Grammar',
    description: 'Maintain objective, neutral tone in workplace findings and bug summaries.',
    example: '"The issue was identified during automated regression testing."'
  },
  {
    id: 'b1_prepositional_collocations',
    name: 'Prepositions after Professional Verbs (comply with, depend on)',
    level: 'B1',
    category: 'Collocations',
    description: 'Avoid mother-tongue interference with verb-preposition pairings.',
    example: '"The team must adhere to security standards and collaborate with stakeholders."'
  },

  // B2 Concepts
  {
    id: 'b2_negative_inversion',
    name: 'Negative & Restrictive Inversion (Seldom, Rarely, Not only)',
    level: 'B2',
    category: 'Grammar',
    description: 'Elevate formal register and dramatic emphasis in executive summaries and presentations.',
    example: '"Seldom have we witnessed such significant quarter-over-quarter efficiency gains."'
  },
  {
    id: 'b2_cleft_sentences',
    name: 'Cleft Sentences for Emphasis & Clarification (What we need is...)',
    level: 'B2',
    category: 'Discourse',
    description: 'Highlight core priorities and resolve cross-functional alignment ambiguities.',
    example: '"What the stakeholder is genuinely requesting is faster turnaround on pull requests."'
  },
  {
    id: 'b2_third_mixed_conditionals',
    name: 'Third & Mixed Conditionals in Project Retrospectives',
    level: 'B2',
    category: 'Grammar',
    description: 'Analyze post-mortem root causes and counterfactual scenarios.',
    example: '"If we had caught the regression earlier, the production deployment would not be delayed today."'
  },
  {
    id: 'b2_participle_clauses',
    name: 'Participle Clauses for Concise Reporting (Having reviewed...)',
    level: 'B2',
    category: 'Style & Tone',
    description: 'Condense background context and chronological actions into fluid sentences.',
    example: '"Having completed the compliance audit, the engineering lead submitted the final RFC."'
  },
  {
    id: 'b2_subjunctive_mood',
    name: 'Subjunctive Mood in Formal Recommendations (recommend that he be...)',
    level: 'B2',
    category: 'Grammar',
    description: 'Express formal mandates, advisory motions, and policy recommendations.',
    example: '"The board recommended that the release date be postponed until load tests pass."'
  },
  {
    id: 'b2_passive_causative',
    name: 'Passive Causative Structures (Have/Get something done)',
    level: 'B2',
    category: 'Grammar',
    description: 'Describe delegating tasks, commissioning audits, and vendor management.',
    example: '"We had the codebase reviewed by an external cybersecurity consultancy."'
  },
  {
    id: 'b2_discourse_signposting',
    name: 'Signposting & Transition Markers in Cross-Functional Meetings',
    level: 'B2',
    category: 'Discourse',
    description: 'Guide listeners smoothly through complex agendas, pivots, and conclusions.',
    example: '"Turning now to operational bottlenecks, let us evaluate the latency metrics."'
  },

  // C1/C2 Concepts
  {
    id: 'c1_hedging_diplomatic',
    name: 'Hedging & Diplomatic Nuance in Executive Disagreements',
    level: 'C1',
    category: 'Style & Tone',
    description: 'Soften criticism and propose alternative solutions respectfully without losing clarity.',
    example: '"It would appear that the proposed timeline may prove slightly ambitious under current constraints."'
  },
  {
    id: 'c1_inverted_conditionals',
    name: 'Inverted Conditionals in Formal Correspondence (Should you require...)',
    level: 'C1',
    category: 'Grammar',
    description: 'Formulate high-level commercial agreements and enterprise client correspondence.',
    example: '"Should any discrepancies arise during reconciliation, please notify our team immediately."'
  },
  {
    id: 'c1_advanced_nominalization',
    name: 'Advanced Nominalization in Technical & Policy Documentation',
    level: 'C1',
    category: 'Style & Tone',
    description: 'Pack information densely and authoritatively in specifications and research papers.',
    example: '"The implementation of robust encryption protocols facilitated regulatory compliance."'
  },
  {
    id: 'c1_concession_patterns',
    name: 'Concession & Counter-Argument Patterns (Notwithstanding, Granted...)',
    level: 'C1',
    category: 'Discourse',
    description: 'Build persuasive arguments by acknowledging valid opposing perspectives before pivoting.',
    example: '"Notwithstanding initial performance overhead, the long-term reliability justifies the architecture."'
  }
];

interface SessionContextCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  isBuilding: boolean;
  onConfirmBuild: (context: NextSessionCustomContext) => void;
}

export const SessionContextCatalogModal: React.FC<SessionContextCatalogModalProps> = ({
  isOpen,
  onClose,
  profile,
  isBuilding,
  onConfirmBuild
}) => {
  // Navigation tabs within catalog
  const [activeTab, setActiveTab] = useState<'overview' | 'mistakes' | 'vocabulary' | 'skills' | 'notes'>('overview');

  // Loaded user memory assets
  const [skills, setSkills] = useState<LearnerSkillState[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

  const [isLoadingMemory, setIsLoadingMemory] = useState<boolean>(true);

  // 1. Session Duration & Pace
  const [dailyMinutes, setDailyMinutes] = useState<number>(profile.daily_minutes || 20);

  // 2. Discipline & Topic Context
  const initialMajor = profile.major_or_subject || 'Software Engineering & IT';
  const matchingCurated = CURATED_MAJORS.find(m => m.name.toLowerCase() === initialMajor.toLowerCase());
  const [selectedMajorId, setSelectedMajorId] = useState<string>(matchingCurated ? matchingCurated.id : 'other_custom');
  const [customMajorText, setCustomMajorText] = useState<string>(matchingCurated ? '' : initialMajor);
  const [customScenarioText, setCustomScenarioText] = useState<string>(profile.major_focus_details || '');
  const [generalRatio, setGeneralRatio] = useState<number>(profile.general_vs_work_ratio || 35);

  // 3. Selected Mistakes to Clinic
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);
  const [customMistakeInput, setCustomMistakeInput] = useState<string>('');

  // 4. Selected Vocabulary to Review
  const [selectedVocabWords, setSelectedVocabWords] = useState<string[]>([]);
  const [customVocabInput, setCustomVocabInput] = useState<string>('');

  // 5. Selected Grammar & Skills to Learn
  const [selectedNewSkills, setSelectedNewSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [skillFilterLevel, setSkillFilterLevel] = useState<string>('all');

  // 6. Freeform Custom Instructions for AI
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load memory and initialize sensible recommendations
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchMemoryData = async () => {
      setIsLoadingMemory(true);
      try {
        const [loadedSkills, loadedVocab, loadedSummaries] = await Promise.all([
          localStore.getSkills(),
          localStore.getVocabulary(),
          localStore.getSummaries()
        ]);

        if (!isMounted) return;

        setSkills(loadedSkills);
        setVocabulary(loadedVocab);
        setSummaries(loadedSummaries);

        // Pre-select top recurring mistakes (up to 3)
        const errorList: string[] = [];
        loadedSkills.forEach(s => {
          if (s.recurring_errors && s.recurring_errors.length > 0) {
            s.recurring_errors.forEach(e => {
              if (!errorList.includes(e)) errorList.push(e);
            });
          }
        });
        loadedSummaries.forEach(sum => {
          if (sum.recurring_mistakes_flagged) {
            sum.recurring_mistakes_flagged.forEach(e => {
              if (!errorList.includes(e)) errorList.push(e);
            });
          }
        });
        setSelectedMistakes(errorList.slice(0, 3));

        // Pre-select due vocabulary items (up to 4)
        const dueWords = loadedVocab
          .filter(v => v.times_incorrect > 0 || v.mastery_stage === 'practicing' || v.mastery_stage === 'encountered')
          .slice(0, 4)
          .map(v => v.word);
        setSelectedVocabWords(dueWords.length > 0 ? dueWords : loadedVocab.slice(0, 3).map(v => v.word));

        // Pre-select recommended skills matching learner level or diagnostic plan
        const userLevel = profile.current_level || 'B2';
        const levelSkills = GRAMMAR_CATALOG.filter(c => c.level === userLevel);
        const initialSkills = levelSkills.slice(0, 2).map(s => s.name);
        setSelectedNewSkills(initialSkills);

      } catch (err) {
        console.error('Failed to load memory for catalog:', err);
      } finally {
        if (isMounted) setIsLoadingMemory(false);
      }
    };

    fetchMemoryData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const getEffectiveMajorName = (): string => {
    if (selectedMajorId === 'other_custom') {
      return customMajorText.trim() || 'General Professional English';
    }
    const found = CURATED_MAJORS.find(m => m.id === selectedMajorId);
    return found ? found.name : 'Software Engineering & IT';
  };

  // Build the complete context payload and trigger generation
  const handleConfirm = () => {
    const finalContext: NextSessionCustomContext = {
      dailyMinutes,
      paceMode: dailyMinutes === 10 ? 'quick_10' : dailyMinutes === 30 ? 'deep_30' : 'standard_20',
      topicCategory: getEffectiveMajorName(),
      topicCustomScenario: customScenarioText.trim() || undefined,
      generalVsWorkRatio: generalRatio,
      selectedMistakes: selectedMistakes.filter(Boolean),
      selectedVocabWords: selectedVocabWords.filter(Boolean),
      selectedNewSkills: selectedNewSkills.filter(Boolean),
      customInstructions: customInstructions.trim() || undefined
    };

    onConfirmBuild(finalContext);
  };

  // Toggle helpers
  const toggleMistake = (item: string) => {
    setSelectedMistakes(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomMistake = () => {
    const trimmed = customMistakeInput.trim();
    if (trimmed && !selectedMistakes.includes(trimmed)) {
      setSelectedMistakes(prev => [...prev, trimmed]);
      setCustomMistakeInput('');
    }
  };

  const toggleVocab = (word: string) => {
    setSelectedVocabWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const handleAddCustomVocab = () => {
    const trimmed = customVocabInput.trim();
    if (trimmed && !selectedVocabWords.includes(trimmed)) {
      setSelectedVocabWords(prev => [...prev, trimmed]);
      setCustomVocabInput('');
    }
  };

  const toggleSkill = (skillName: string) => {
    setSelectedNewSkills(prev =>
      prev.includes(skillName) ? prev.filter(s => s !== skillName) : [...prev, skillName]
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedNewSkills.includes(trimmed)) {
      setSelectedNewSkills(prev => [...prev, trimmed]);
      setCustomSkillInput('');
    }
  };

  // Extract all known mistakes from history
  const allKnownMistakes: string[] = [];
  skills.forEach(s => {
    s.recurring_errors?.forEach(e => {
      if (!allKnownMistakes.includes(e)) allKnownMistakes.push(e);
    });
  });
  summaries.forEach(sum => {
    sum.recurring_mistakes_flagged?.forEach(e => {
      if (!allKnownMistakes.includes(e)) allKnownMistakes.push(e);
    });
  });
  // Also include any user-selected mistakes not already in allKnownMistakes
  selectedMistakes.forEach(m => {
    if (!allKnownMistakes.includes(m)) allKnownMistakes.push(m);
  });

  // Filter grammar catalog items
  const filteredGrammar = GRAMMAR_CATALOG.filter(item => {
    if (skillFilterLevel === 'all') return true;
    return item.level.toLowerCase() === skillFilterLevel.toLowerCase();
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#161A17]/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#2D312E] dark:text-[#F4F2EC]">
        
        {/* Header with Title and Tab Navigation */}
        <div className="p-5 md:p-6 border-b border-[#EBE4D7] dark:border-[#2C332E] bg-[#FAF7F2]/90 dark:bg-[#1E231F]/90 shrink-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
                  <Sliders className="w-4 h-4" />
                </span>
                <h2 id="catalog-modal-title" className="text-lg md:text-xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight">
                  Next Session Context Catalog & Reviewer
                </h2>
              </div>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1 leading-relaxed">
                Review and customize the exact topics, past mistakes, vocabulary, and grammar rules the AI will synthesize into your next session.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-white dark:hover:bg-[#262F28] transition cursor-pointer"
              title="Close catalog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>1. Topic & Duration</span>
            </button>

            <button
              onClick={() => setActiveTab('mistakes')}
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === 'mistakes'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>2. Mistakes Clinic</span>
              {selectedMistakes.length > 0 && (
                <span className="font-mono text-[10px] bg-[#FAF7F2] dark:bg-[#1E231F] px-1.5 py-0.2 rounded-md text-[#E07A5F] font-bold">
                  {selectedMistakes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === 'vocabulary'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#52796F]" />
              <span>3. Vocab to Review</span>
              {selectedVocabWords.length > 0 && (
                <span className="font-mono text-[10px] bg-[#FAF7F2] dark:bg-[#1E231F] px-1.5 py-0.2 rounded-md text-[#52796F] dark:text-[#74A892] font-bold">
                  {selectedVocabWords.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>4. New Grammar & Skills</span>
              {selectedNewSkills.length > 0 && (
                <span className="font-mono text-[10px] bg-[#FAF7F2] dark:bg-[#1E231F] px-1.5 py-0.2 rounded-md text-[#2D6A4F] dark:text-[#74A892] font-bold">
                  {selectedNewSkills.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>5. Tutor Notes</span>
              {customInstructions.trim() && (
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {isLoadingMemory ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading your learning memory and mistake patterns...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & TOPIC FOCUS */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Session Duration Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                      Session Pace & Duration (Thời lượng buổi học)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setDailyMinutes(10)}
                        className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                          dailyMinutes === 10
                            ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/80 shadow-lg shadow-indigo-950/60'
                            : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300">Quick Practice</span>
                          <span className="font-mono text-xs font-bold text-white">10 mins</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                          3 activities · 6 focused questions · Fast review + 1 new concept
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDailyMinutes(20)}
                        className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                          dailyMinutes === 20
                            ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/80 shadow-lg shadow-indigo-950/60'
                            : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300">Standard Balance</span>
                          <span className="font-mono text-xs font-bold text-white">20 mins</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                          4 activities · 10 questions · Complete warm-up, grammar, vocab & production
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDailyMinutes(30)}
                        className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                          dailyMinutes === 30
                            ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/80 shadow-lg shadow-indigo-950/60'
                            : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300">Deep Immersion</span>
                          <span className="font-mono text-xs font-bold text-white">30 mins</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                          5 activities · 15 questions · Mistake clinic, multiple grammar rules & writing
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Discipline / Major Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                      Target Discipline or Industry Focus (Chuyên ngành & Lĩnh vực)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {CURATED_MAJORS.map(major => {
                        const isSelected = selectedMajorId === major.id;
                        return (
                          <button
                            key={major.id}
                            type="button"
                            onClick={() => setSelectedMajorId(major.id)}
                            className={`p-3 rounded-2xl border text-left transition flex items-start space-x-3 ${
                              isSelected
                                ? 'bg-indigo-950 border-indigo-500 ring-1 ring-indigo-500 text-white'
                                : 'bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{major.icon}</span>
                            <div className="min-w-0">
                              <strong className="text-xs font-bold block text-white truncate">{major.name}</strong>
                              <span className="text-[10px] text-slate-400 block truncate">{major.nameVi}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedMajorId === 'other_custom' && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={customMajorText}
                          onChange={e => setCustomMajorText(e.target.value)}
                          placeholder="Type your custom discipline or major..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Specific Workplace Scenario */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                      Specific Scenario or Project Context (Optional)
                    </label>
                    <input
                      type="text"
                      value={customScenarioText}
                      onChange={e => setCustomScenarioText(e.target.value)}
                      placeholder="E.g., Pull request code reviews, incident post-mortems, client QBR slides, salary negotiation..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      The AI will ground reading passages, cloze sentences, and writing prompts directly into this context.
                    </p>
                  </div>

                  {/* General vs Workplace Balance Slider */}
                  <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Context Balance</span>
                      <span className="font-mono text-indigo-300 font-bold">
                        {100 - generalRatio}% Workplace / Tech · {generalRatio}% General
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={generalRatio}
                      onChange={e => setGeneralRatio(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>100% Workplace Tech</span>
                      <span>50/50 Balanced</span>
                      <span>100% General Daily</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MISTAKES FROM BEFORE (CLINIC) */}
              {activeTab === 'mistakes' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Mistakes Clinic (Luyện tập khắc phục lỗi cũ)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Select recurring error patterns detected from previous quizzes to target with warm-up review exercises.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMistakes([])}
                      className="text-xs text-slate-400 hover:text-slate-200 transition"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Custom Mistake Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMistakeInput}
                      onChange={e => setCustomMistakeInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomMistake();
                        }
                      }}
                      placeholder="Type a custom mistake you want to fix (e.g., 'Preposition with depend on', 'Past perfect timeline')..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMistake}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Known Mistake Items */}
                  {allKnownMistakes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {allKnownMistakes.map((mistake, idx) => {
                        const isSelected = selectedMistakes.includes(mistake);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleMistake(mistake)}
                            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between space-x-3 ${
                              isSelected
                                ? 'bg-amber-950/40 border-amber-500/70 ring-1 ring-amber-500/50 text-white'
                                : 'bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <span className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-800'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </span>
                              <span className="text-xs font-medium truncate">{mistake}</span>
                            </div>
                            <span className="text-[10px] text-amber-400 font-mono shrink-0">
                              Clinic Focus
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        No recurring mistake patterns have been flagged yet. You can type any specific grammar rule or phrasing weakness you want to address in the input above.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VOCABULARY TO REVIEW */}
              {activeTab === 'vocabulary' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Vocabulary Review Deck (Từ vựng cần ôn luyện)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Choose words saved in your review memory to weave into tomorrow's exercises and reading texts.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedVocabWords([])}
                      className="text-xs text-slate-400 hover:text-slate-200 transition"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Custom Word Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customVocabInput}
                      onChange={e => setCustomVocabInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomVocab();
                        }
                      }}
                      placeholder="Add any specific word to practice in this session (e.g. 'reconcile', 'discrepancy', 'mitigate')..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomVocab}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Word</span>
                    </button>
                  </div>

                  {/* Vocabulary List */}
                  {vocabulary.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {vocabulary.map((item, index) => {
                        const isSelected = selectedVocabWords.includes(item.word);
                        return (
                          <div
                            key={item.id ? `${item.id}-${index}` : `${item.word}-${index}`}
                            onClick={() => toggleVocab(item.word)}
                            className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                              isSelected
                                ? 'bg-sky-950/40 border-sky-500/70 ring-1 ring-sky-500/50 text-white'
                                : 'bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2.5">
                                <span className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-sky-500 border-sky-500 text-slate-950' : 'border-slate-700 bg-slate-800'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </span>
                                <div>
                                  <strong className="text-xs font-bold text-white block">{item.word}</strong>
                                  {item.ipa && <span className="text-[10px] text-slate-400 font-mono">{item.ipa}</span>}
                                </div>
                              </div>

                              <span className="text-[10px] text-sky-400 capitalize font-medium">
                                {item.mastery_stage}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                              {item.meaning}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        No vocabulary words currently in your review memory. As you click unfamiliar words during exams or lessons, they will appear here automatically. You can also type words above.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: NEW GRAMMAR & SKILLS TO LEARN */}
              {activeTab === 'skills' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">Grammar & Skill Catalog (Kiến thức ngữ pháp mới)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Select new concepts calibrated for your level to introduce in the core grammar section.
                      </p>
                    </div>

                    {/* Level Filter Tabs */}
                    <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl text-[11px]">
                      {['all', 'B1', 'B2', 'C1'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSkillFilterLevel(lvl)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                            skillFilterLevel === lvl
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lvl.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Skill Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={e => setCustomSkillInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      placeholder="Add a custom grammar rule or skill target (e.g. 'Hedging in customer complaint emails')..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Target</span>
                    </button>
                  </div>

                  {/* Grammar Catalog Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {filteredGrammar.map(item => {
                      const isSelected = selectedNewSkills.includes(item.name);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSkill(item.name)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/70 ring-1 ring-emerald-500/50 text-white shadow-md shadow-emerald-950/50'
                              : 'bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-2.5">
                              <span className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700 bg-slate-800'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </span>
                              <div>
                                <strong className="text-xs font-bold text-white block leading-snug">
                                  {item.name}
                                </strong>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {item.level} · {item.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-emerald-300/90 italic font-mono truncate">
                            {item.example}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: TUTOR NOTES & SPECIAL INSTRUCTIONS */}
              {activeTab === 'notes' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="text-sm font-bold text-white">Tutor Guidance & Freeform Notes</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Type any specific requests or instructions for your AI language coach to honor during this session.
                    </p>
                  </div>

                  <textarea
                    rows={6}
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    placeholder="E.g.,&#10;• Focus on formal tone when disagreeing with senior stakeholders in meeting minutes.&#10;• Include technical terminology for cloud migrations and Docker containerization.&#10;• Emphasize phrasal verbs commonly used in agile ceremonies..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />

                  {/* Quick suggestion chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold block">Quick Prompt Suggestions:</span>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {[
                        'Diplomatic disagreement phrasing in meetings',
                        'Clear and concise bug report writing',
                        'Polite follow-up email when receiving no reply',
                        'Presenting quarterly metrics with signposting'
                      ].map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCustomInstructions(prev => prev ? `${prev}\n• ${sug}` : `• ${sug}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Selection Summary and Confirmation Actions */}
        <div className="p-4 md:p-5 border-t border-[#EBE4D7] dark:border-[#2C332E] bg-[#FAF7F2]/95 dark:bg-[#1E231F]/95 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Summary counters with zero-pill discipline */}
          <div className="text-xs text-[#5C645E] dark:text-[#A7ABA4] flex flex-wrap items-center gap-1.5 font-mono">
            <span className="text-[#1B4332] dark:text-[#F4F2EC] font-semibold">{getEffectiveMajorName()}</span>
            <span aria-hidden="true">·</span>
            <span>{dailyMinutes} mins</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#E07A5F] font-medium">{selectedMistakes.length} mistakes to clinic</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#52796F] dark:text-[#74A892] font-medium">{selectedVocabWords.length} vocab</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#2D6A4F] dark:text-[#74A892] font-medium">{selectedNewSkills.length} new grammar</span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isBuilding}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#262F28] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] border border-[#D8CFBF] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBuilding}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs shadow-sm transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isBuilding ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Tailored Session...</span>
                </>
              ) : (
                <>
                  <span>Generate & Start Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
