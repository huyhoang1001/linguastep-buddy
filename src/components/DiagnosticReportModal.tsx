import React from 'react';
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { DiagnosticReport } from '../types/learning.ts';

interface DiagnosticReportModalProps {
  report: DiagnosticReport;
  onProceedToPlan: () => void;
  onClose?: () => void;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  report,
  onProceedToPlan,
  onClose
}) => {

  const getConfidenceBadge = (confidence?: 'low' | 'moderate' | 'high' | 'provisional') => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#74A892] border border-[#2D6A4F]/30">
            High Confidence
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#52796F]/15 text-[#52796F] dark:text-[#84A98C] border border-[#52796F]/30">
            Moderate Confidence
          </span>
        );
      case 'provisional':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E07A5F]/15 text-[#E07A5F] border border-[#E07A5F]/30">
            Provisional Estimate
          </span>
        );
    }
  };

  const getSkillTitle = (cat: string) => {
    switch (cat) {
      case 'grammar': return 'Grammar in Context';
      case 'vocabulary': return 'Vocabulary & Collocations';
      case 'reading': return 'Reading & Inference';
      case 'writing': return 'Written Expression';
      case 'speaking': return 'Speaking & Pronunciation';
      case 'listening': return 'Audio Listening';
      default: return cat;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161A17]/70 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl text-[#2D312E] dark:text-[#F4F2EC] max-h-[92vh] overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">Diagnostic Field Report</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 text-[#2D6A4F] dark:text-[#74A892] border border-[#2D6A4F]/25 uppercase font-mono">
                  {report.mode}
                </span>
              </div>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                Evaluated across {report.totalQuestionsAnswered} adaptive items • {new Date(report.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-white dark:hover:bg-[#262F28] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Global CEFR Baseline Banner */}
        <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] dark:text-[#74A892]">
              Calibrated CEFR Proficiency Range
            </span>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <h3 className="text-4xl font-serif font-black text-[#1B4332] dark:text-[#F4F2EC]">{report.overallCEFR}</h3>
              {getConfidenceBadge(report.overallConfidence)}
            </div>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] max-w-lg leading-relaxed pt-1">
              {report.overallSummary}
            </p>
          </div>

          <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-2xl p-4 text-center shrink-0 w-44">
            <span className="text-[10px] font-semibold uppercase text-[#5C645E] dark:text-[#A7ABA4] block mb-1">Weighted Performance</span>
            <strong className="text-3xl font-serif font-black text-[#2D6A4F] dark:text-[#74A892]">
              {typeof report.overallScorePercentage === 'number' ? report.overallScorePercentage : Math.round(report.accuracyRate * 100)}%
            </strong>
            <span className="block text-[10px] text-[#8C938D] mt-0.5 font-mono">
              4 areas • 25% weight each
            </span>
            {report.targetDurationMinutes && (
              <span className="block text-[10px] text-[#52796F] dark:text-[#84A98C] mt-1 font-medium">
                ⏱ {report.targetDurationMinutes}-minute standard
              </span>
            )}
          </div>
        </div>

        {/* Section Scoring Cards if available */}
        {report.sectionScores && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
                <span className="font-semibold text-[#1B4332] dark:text-[#F4F2EC]">Grammar</span>
                <span className="text-[10px] font-mono text-[#8C938D]">25% wt</span>
              </div>
              <div className="text-xl font-bold font-serif text-[#2D6A4F] dark:text-[#74A892]">{report.sectionScores.grammar.percentage}%</div>
              <div className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">CEFR: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{report.sectionScores.grammar.cefr}</strong></div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
                <span className="font-semibold text-[#1B4332] dark:text-[#F4F2EC]">Vocabulary</span>
                <span className="text-[10px] font-mono text-[#8C938D]">25% wt</span>
              </div>
              <div className="text-xl font-bold font-serif text-[#52796F] dark:text-[#84A98C]">{report.sectionScores.vocabulary.percentage}%</div>
              <div className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">CEFR: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{report.sectionScores.vocabulary.cefr}</strong></div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
                <span className="font-semibold text-[#1B4332] dark:text-[#F4F2EC]">Reading</span>
                <span className="text-[10px] font-mono text-[#8C938D]">25% wt</span>
              </div>
              <div className="text-xl font-bold font-serif text-[#D4A373]">{report.sectionScores.reading.percentage}%</div>
              <div className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">CEFR: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{report.sectionScores.reading.cefr}</strong></div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
                <span className="font-semibold text-[#1B4332] dark:text-[#F4F2EC]">Writing</span>
                <span className="text-[10px] font-mono text-[#8C938D]">25% wt</span>
              </div>
              <div className="text-xl font-bold font-serif text-[#E07A5F]">{report.sectionScores.writing.percentage}%</div>
              <div className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">CEFR: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{report.sectionScores.writing.cefr}</strong></div>
            </div>
          </div>
        )}

        {/* Skill-by-Skill Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-[#2D6A4F]" />
            <span>Multi-Skill Performance Matrix</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(report.skillEstimates).map(([key, est]) => {
              const isNotAssessed = est.cefrRange.includes('Not Assessed');

              return (
                <div
                  key={key}
                  className={`border rounded-2xl p-4 flex flex-col justify-between ${
                    isNotAssessed
                      ? 'bg-[#FAF7F2]/60 dark:bg-[#1E231F]/60 border-[#EBE4D7] dark:border-[#2C332E] opacity-75'
                      : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">{getSkillTitle(key)}</span>
                      {isNotAssessed ? (
                        <span className="text-[10px] text-[#8C938D] italic">Optional / Later</span>
                      ) : (
                        getConfidenceBadge(est.confidence)
                      )}
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <span className={`text-base font-serif font-bold ${isNotAssessed ? 'text-[#8C938D] text-xs' : 'text-[#2D6A4F] dark:text-[#74A892]'}`}>
                        {est.cefrRange}
                      </span>
                      {!isNotAssessed && (
                        <span className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] font-mono">
                          ({est.correctCount}/{est.evidenceCount} correct)
                        </span>
                      )}
                    </div>

                    {isNotAssessed ? (
                      <p className="text-[11px] text-[#8C938D] mt-2 italic">
                        Not evaluated in text assessment. Speaking and listening proficiency require dedicated audio exercises.
                      </p>
                    ) : (
                      est.demonstratedStrengths.length > 0 && (
                        <div className="mt-2 text-[11px] text-[#2D6A4F] dark:text-[#74A892] flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Strength: {est.demonstratedStrengths.join(', ')}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Priority Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.demonstratedStrengths.length > 0 && (
            <div className="bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 border border-[#2D6A4F]/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#74A892] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmed Strengths</span>
              </span>
              <ul className="space-y-1 text-xs text-[#2D312E] dark:text-[#E0DDD5]">
                {report.demonstratedStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-[#2D6A4F] dark:text-[#74A892]">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.priorityWeaknesses.length > 0 && (
            <div className="bg-[#E07A5F]/10 dark:bg-[#E07A5F]/20 border border-[#E07A5F]/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E07A5F] flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Priority Growth Areas</span>
              </span>
              <ul className="space-y-1 text-xs text-[#2D312E] dark:text-[#E0DDD5]">
                {report.priorityWeaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-[#E07A5F]">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EBE4D7] dark:border-[#2C332E]">
          <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] text-center sm:text-left">
            Ready to inspect your evidence-based personalized study plan?
          </p>

          <button
            onClick={onProceedToPlan}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Review & Approve Study Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
