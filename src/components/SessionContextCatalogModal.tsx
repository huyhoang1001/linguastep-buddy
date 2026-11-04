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
  ArrowRight,
  Clock,
  History,
  Languages,
  Layout
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
import { 
  AppButton, 
  IconButton, 
  InteractiveCard,
  StatusBadge 
} from './ui/index.ts';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[calc(100dvh-48px)] bg-surface border border-border-app rounded-[2rem] shadow-2xl flex flex-col overflow-hidden text-text-primary">
        
        {/* Header Section (Fixed) */}
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-border-app bg-surface shrink-0 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center text-brand-primary-fg shadow-md">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 id="catalog-modal-title" className="text-lg md:text-2xl font-serif font-bold tracking-tight text-text-primary leading-tight">
                  Next Session Catalog
                </h2>
                <p className="text-[10px] md:text-xs text-text-muted mt-0.5 leading-relaxed">
                  Tailor your learning objective, mistakes, and new skills.
                </p>
              </div>
            </div>

            <IconButton
              icon={<X />}
              ariaLabel="Close catalog"
              onClick={onClose}
              variant="ghost"
              className="mt-1 shrink-0"
            />
          </div>

          {/* Responsive Navigation Tabs (Horizontal Scrollable) */}
          <div className="flex items-center space-x-1 mt-6 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'overview', label: 'Topic', icon: Briefcase },
              { id: 'mistakes', label: 'Mistakes', icon: AlertTriangle, count: selectedMistakes.length },
              { id: 'vocabulary', label: 'Vocab', icon: BookOpen, count: selectedVocabWords.length },
              { id: 'skills', label: 'Skills', icon: GraduationCap, count: selectedNewSkills.length },
              { id: 'notes', label: 'Notes', icon: Sparkles, hasDot: !!customInstructions.trim() }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center space-x-2 shrink-0 cursor-pointer border-2 ${
                  activeTab === tab.id
                    ? 'bg-brand-primary border-brand-primary text-brand-primary-fg shadow-sm'
                    : 'bg-transparent border-transparent text-text-muted hover:text-text-secondary hover:bg-surface-subdued'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-lg text-[10px] font-mono leading-none ${
                    activeTab === tab.id ? 'bg-brand-primary-fg/20 text-brand-primary-fg' : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.hasDot && (
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    activeTab === tab.id ? 'bg-brand-primary-fg' : 'bg-brand-primary'
                  }`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area (Single Region) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 space-y-8 no-scrollbar bg-surface overscroll-contain">
          {isLoadingMemory ? (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-text-muted">Analyzing your learning memory...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & TOPIC FOCUS */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Duration Section */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                      <Clock className="w-4 h-4 opacity-50" />
                      <span>Duration & Pace</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { mins: 10, title: 'Quick Practice', icon: Layout, desc: '6 Qs · 10 min · Fast review' },
                        { mins: 20, title: 'Standard Balance', icon: History, desc: '10 Qs · 20 min · Core lessons' },
                        { mins: 30, title: 'Deep Immersion', icon: GraduationCap, desc: '15 Qs · 30 min · Deep analysis' }
                      ].map(opt => (
                        <InteractiveCard
                          key={opt.mins}
                          selected={dailyMinutes === opt.mins}
                          onClick={() => setDailyMinutes(opt.mins)}
                          className="flex flex-col justify-between min-h-[110px] h-full"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">{opt.title}</span>
                            <opt.icon className={`w-4 h-4 ${dailyMinutes === opt.mins ? 'text-brand-primary' : 'text-text-muted'}`} />
                          </div>
                          <div className="mt-4">
                            <div className="text-xl font-bold">{opt.mins} min</div>
                            <p className="text-[11px] text-text-muted leading-snug mt-1 font-medium">{opt.desc}</p>
                          </div>
                        </InteractiveCard>
                      ))}
                    </div>
                  </div>

                  {/* Industry Selection Grid */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                      <Briefcase className="w-4 h-4 opacity-50" />
                      <span>Industry & Discipline</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {CURATED_MAJORS.map(major => (
                        <InteractiveCard
                          key={major.id}
                          selected={selectedMajorId === major.id}
                          onClick={() => setSelectedMajorId(major.id)}
                          className="flex items-start space-x-3 p-4"
                        >
                          <span className="text-2xl mt-0.5 shrink-0">{major.icon}</span>
                          <div className="min-w-0">
                            <strong className="text-[13px] font-bold block truncate leading-tight">{major.name}</strong>
                            <span className="text-[10px] text-text-muted font-bold block truncate mt-0.5 opacity-60 uppercase">{major.nameVi}</span>
                          </div>
                        </InteractiveCard>
                      ))}
                    </div>

                    {selectedMajorId === 'other_custom' && (
                      <div className="animate-fadeIn pt-2">
                        <input
                          type="text"
                          value={customMajorText}
                          onChange={e => setCustomMajorText(e.target.value)}
                          placeholder="Type your custom discipline or major..."
                          className="w-full bg-surface-subdued border border-border-default rounded-2xl px-5 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Scenario Input */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                      <Languages className="w-4 h-4 opacity-50" />
                      <span>Project Context (Optional)</span>
                    </h3>
                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        value={customScenarioText}
                        onChange={e => setCustomScenarioText(e.target.value)}
                        placeholder="E.g., Client demo slides, code review comments, agile retrospectives..."
                        className="w-full bg-surface-subdued border border-border-default rounded-2xl p-5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm leading-relaxed"
                      />
                      <div className="flex items-start space-x-2 px-1">
                        <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-text-muted leading-normal font-medium italic">
                          The AI will synthesize all exercises directly into this scenario context.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Balance Slider */}
                  <div className="bg-surface-subdued border border-border-default rounded-3xl p-6 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-text-muted">Context Balance</span>
                      <div className="px-3 py-1 rounded-full bg-surface border border-border-app text-brand-primary font-mono font-bold text-[11px]">
                        {100 - generalRatio}% Tech · {generalRatio}% General
                      </div>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={generalRatio}
                        onChange={e => setGeneralRatio(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-app rounded-full appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-tighter opacity-50">
                      <span>100% Technical</span>
                      <span>50/50 Balanced</span>
                      <span>100% General</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MISTAKES CLINIC */}
              {activeTab === 'mistakes' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-end justify-between px-1">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight text-text-primary">Mistakes Clinic</h3>
                      <p className="text-sm text-text-muted font-medium">
                        Select past recurring errors to target in this session.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMistakes([])}
                      className="text-xs font-bold text-brand-primary hover:opacity-80 transition py-1"
                    >
                      Deselect All
                    </button>
                  </div>

                  <div className="flex gap-3">
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
                      placeholder="Add a custom mistake pattern to fix..."
                      className="flex-1 bg-surface-subdued border border-border-default rounded-2xl px-5 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                    />
                    <AppButton
                      onClick={handleAddCustomMistake}
                      variant="secondary"
                      size="md"
                      className="shrink-0 rounded-2xl font-bold"
                      leftIcon={<Plus />}
                    >
                      Add
                    </AppButton>
                  </div>

                  {allKnownMistakes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allKnownMistakes.map((mistake, idx) => {
                        const isSelected = selectedMistakes.includes(mistake);
                        return (
                          <InteractiveCard
                            key={idx}
                            selected={isSelected}
                            onClick={() => toggleMistake(mistake)}
                            className="flex items-center justify-between space-x-4 p-4 shadow-sm"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-brand-primary border-brand-primary text-brand-primary-fg shadow-sm' : 'border-border-default bg-surface opacity-50'
                              }`}>
                                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                              </div>
                              <span className="text-sm font-bold truncate leading-none">{mistake}</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-brand-primary/10 text-brand-primary' : 'bg-surface-subdued text-text-muted opacity-60'
                            }`}>
                              Clinic
                            </span>
                          </InteractiveCard>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-surface-subdued border border-dashed border-border-default rounded-[2rem] p-12 text-center shadow-sm">
                      <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-muted opacity-40">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-text-muted font-medium max-w-sm mx-auto">
                        No mistake patterns detected yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VOCABULARY REVIEW */}
              {activeTab === 'vocabulary' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-end justify-between px-1">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight text-text-primary">Vocab Catalog</h3>
                      <p className="text-sm text-text-muted font-medium">
                        Select words from your memory to reinforce.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVocabWords([])}
                      className="text-xs font-bold text-brand-primary hover:opacity-80 transition py-1"
                    >
                      Deselect All
                    </button>
                  </div>

                  <div className="flex gap-3">
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
                      placeholder="Type a word to practice (e.g. 'mitigate')..."
                      className="flex-1 bg-surface-subdued border border-border-default rounded-2xl px-5 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                    />
                    <AppButton
                      onClick={handleAddCustomVocab}
                      variant="secondary"
                      size="md"
                      className="shrink-0 rounded-2xl font-bold"
                      leftIcon={<Plus />}
                    >
                      Add Word
                    </AppButton>
                  </div>

                  {vocabulary.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vocabulary.map((item, index) => {
                        const isSelected = selectedVocabWords.includes(item.word);
                        return (
                          <InteractiveCard
                            key={item.id ? `${item.id}-${index}` : `${item.word}-${index}`}
                            selected={isSelected}
                            onClick={() => toggleVocab(item.word)}
                            className="p-4 flex flex-col space-y-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'bg-brand-primary border-brand-primary text-brand-primary-fg shadow-sm' : 'border-border-default bg-surface opacity-50'
                                }`}>
                                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                </div>
                                <div className="min-w-0">
                                  <strong className="text-sm font-black block truncate leading-none mb-1">{item.word}</strong>
                                  <span className="text-[10px] text-text-muted font-mono font-bold opacity-50">{item.ipa || item.part_of_speech}</span>
                                </div>
                              </div>
                              <StatusBadge
                                variant={item.mastery_stage === 'mastered' ? 'success' : item.mastery_stage === 'applied' ? 'info' : 'warning'}
                                className="!text-[9px] scale-90 origin-right font-black"
                              >
                                {item.mastery_stage || 'Encountered'}
                              </StatusBadge>
                            </div>
                            <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed font-bold opacity-80">
                              {item.meaning}
                            </p>
                          </InteractiveCard>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-surface-subdued border border-dashed border-border-default rounded-[2rem] p-12 text-center shadow-sm">
                      <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-muted opacity-40">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-text-muted font-medium max-w-sm mx-auto">
                        No vocabulary words in memory.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: NEW GRAMMAR & SKILLS */}
              {activeTab === 'skills' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-wrap items-end justify-between gap-4 px-1">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight text-text-primary">Grammar Catalog</h3>
                      <p className="text-sm text-text-muted font-medium">
                        Choose new skills calibrated for your level.
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 bg-surface-subdued p-1 rounded-2xl shadow-inner border border-border-default/50">
                      {['all', 'B1', 'B2', 'C1'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSkillFilterLevel(lvl)}
                          className={`px-3 py-1.5 rounded-xl font-black text-[10px] transition uppercase tracking-widest ${
                            skillFilterLevel === lvl
                              ? 'bg-brand-primary text-brand-primary-fg shadow-sm'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
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
                      placeholder="Add custom target (e.g. 'Inversion')..."
                      className="flex-1 bg-surface-subdued border border-border-default rounded-2xl px-5 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                    />
                    <AppButton
                      onClick={handleAddCustomSkill}
                      variant="secondary"
                      size="md"
                      className="shrink-0 rounded-2xl font-bold"
                      leftIcon={<Plus />}
                    >
                      Add Target
                    </AppButton>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredGrammar.map(item => {
                      const isSelected = selectedNewSkills.includes(item.name);
                      return (
                        <InteractiveCard
                          key={item.id}
                          selected={isSelected}
                          onClick={() => toggleSkill(item.name)}
                          className="p-5 flex flex-col space-y-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isSelected ? 'bg-brand-primary border-brand-primary text-brand-primary-fg shadow-sm' : 'border-border-default bg-surface opacity-50'
                              }`}>
                                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                              </div>
                              <div className="min-w-0">
                                <strong className="text-sm font-black block leading-snug">{item.name}</strong>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">{item.level}</span>
                                  <span className="text-[10px] font-black text-text-muted bg-surface-subdued px-2 py-0.5 rounded uppercase tracking-wider opacity-80">{item.category}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-text-muted leading-relaxed font-bold opacity-80">
                            {item.description}
                          </p>

                          <div className="bg-surface border border-border-default rounded-2xl p-4 shadow-inner">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted block mb-2 opacity-50">Usage Example</span>
                            <p className="text-[11px] font-mono italic leading-relaxed text-text-secondary font-medium">"{item.example}"</p>
                          </div>
                        </InteractiveCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: TUTOR NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-1 px-1">
                    <h3 className="text-xl font-bold tracking-tight text-text-primary">Tutor Notes</h3>
                    <p className="text-sm text-text-muted font-medium">
                      Provide direct instructions or specific focus areas.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <textarea
                      rows={8}
                      value={customInstructions}
                      onChange={e => setCustomInstructions(e.target.value)}
                      placeholder="• Use phrasal verbs for cloud deployments.&#10;• Focus on formal tone for executive reports..."
                      className="w-full bg-surface-subdued border border-border-default rounded-[2rem] p-6 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm leading-relaxed"
                    />

                    <div className="space-y-4 px-1">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60 block">Quick Suggestions:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Diplomatic disagreement phrasing',
                          'Clear bug report writing',
                          'Polite follow-up emails',
                          'Quarterly metrics signposting'
                        ].map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCustomInstructions(prev => prev ? `${prev}\n• ${sug}` : `• ${sug}`)}
                            className="px-4 py-2.5 rounded-2xl bg-surface border border-border-default text-[11px] font-bold text-text-secondary hover:border-brand-primary hover:text-brand-primary transition shadow-sm cursor-pointer"
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions (Fixed) */}
        <div className="px-6 py-5 md:px-8 md:py-6 border-t border-border-app bg-surface shrink-0 z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Session Summary - Zero-Pill Discipline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 opacity-50" />
                <span className="max-w-[120px] truncate">{getEffectiveMajorName()}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-border-default shrink-0" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-50" />
                <span>{dailyMinutes} min</span>
              </div>
              {(selectedMistakes.length > 0 || selectedVocabWords.length > 0 || selectedNewSkills.length > 0) && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border-default shrink-0" />
                  <div className="flex items-center gap-1.5 text-brand-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{selectedMistakes.length + selectedVocabWords.length + selectedNewSkills.length} Targets</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <AppButton
                onClick={onClose}
                variant="ghost"
                disabled={isBuilding}
                className="flex-1 sm:flex-none font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </AppButton>

              <AppButton
                onClick={handleConfirm}
                disabled={isBuilding}
                isLoading={isBuilding}
                variant="primary"
                className="flex-[2] sm:flex-none px-8 py-3 rounded-2xl shadow-lg shadow-brand-primary/20 font-black uppercase tracking-wider text-xs"
                rightIcon={<ArrowRight />}
              >
                Start Session
              </AppButton>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
