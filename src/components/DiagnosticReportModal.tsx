import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  Brain,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  X
} from 'lucide-react';
import { DiagnosticReport, SectionType } from '../types/learning.ts';

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
  const [showEvidence, setShowEvidence] = useState<boolean>(false);

  const getConfidenceBadge = (confidence: 'low' | 'moderate' | 'high') => {
    switch (confidence) {
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">High Confidence</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Moderate Confidence</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Preliminary</span>;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Diagnostic Assessment Report</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {report.mode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated across {report.totalQuestionsAnswered} adaptive items • {new Date(report.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Global CEFR Baseline Banner */}
        <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Calibrated CEFR Proficiency Range
            </span>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <h3 className="text-3xl font-black text-white">{report.overallCEFR}</h3>
              {getConfidenceBadge(report.overallConfidence)}
            </div>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed pt-1">
              {report.overallSummary}
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center shrink-0 w-44">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Weighted Performance</span>
            <strong className="text-3xl font-black text-emerald-400">
              {typeof report.overallScorePercentage === 'number' ? report.overallScorePercentage : Math.round(report.accuracyRate * 100)}%
            </strong>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              4 areas • 25% weight each
            </span>
            {report.targetDurationMinutes && (
              <span className="block text-[10px] text-indigo-300 mt-1">
                ⏱ {report.targetDurationMinutes}-minute standard
              </span>
            )}
          </div>
        </div>

        {/* Section Scoring Cards if available */}
        {report.sectionScores && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-white">Grammar</span>
                <span className="text-[10px] font-mono text-indigo-300">25% wt</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">{report.sectionScores.grammar.percentage}%</div>
              <div className="text-[10px] text-slate-400">CEFR: <strong className="text-white">{report.sectionScores.grammar.cefr}</strong></div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-white">Vocabulary</span>
                <span className="text-[10px] font-mono text-indigo-300">25% wt</span>
              </div>
              <div className="text-xl font-bold text-sky-400">{report.sectionScores.vocabulary.percentage}%</div>
              <div className="text-[10px] text-slate-400">CEFR: <strong className="text-white">{report.sectionScores.vocabulary.cefr}</strong></div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-white">Reading</span>
                <span className="text-[10px] font-mono text-indigo-300">25% wt</span>
              </div>
              <div className="text-xl font-bold text-amber-400">{report.sectionScores.reading.percentage}%</div>
              <div className="text-[10px] text-slate-400">CEFR: <strong className="text-white">{report.sectionScores.reading.cefr}</strong></div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-white">Writing</span>
                <span className="text-[10px] font-mono text-indigo-300">25% wt</span>
              </div>
              <div className="text-xl font-bold text-purple-400">{report.sectionScores.writing.percentage}%</div>
              <div className="text-[10px] text-slate-400">CEFR: <strong className="text-white">{report.sectionScores.writing.cefr}</strong></div>
            </div>
          </div>
        )}

        {/* Skill-by-Skill Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
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
                      ? 'bg-slate-900/50 border-slate-800/80 opacity-75'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{getSkillTitle(key)}</span>
                      {isNotAssessed ? (
                        <span className="text-[10px] text-slate-500 italic">Optional / Later</span>
                      ) : (
                        getConfidenceBadge(est.confidence)
                      )}
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <span className={`text-base font-bold ${isNotAssessed ? 'text-slate-400 text-xs' : 'text-indigo-300'}`}>
                        {est.cefrRange}
                      </span>
                      {!isNotAssessed && (
                        <span className="text-[11px] text-slate-400">
                          ({est.correctCount}/{est.evidenceCount} correct)
                        </span>
                      )}
                    </div>

                    {isNotAssessed ? (
                      <p className="text-[11px] text-slate-500 mt-2 italic">
                        Not evaluated in text assessment. Speaking and listening proficiency require dedicated audio exercises.
                      </p>
                    ) : (
                      est.demonstratedStrengths.length > 0 && (
                        <div className="mt-2 text-[11px] text-emerald-300 flex items-center space-x-1">
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
            <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmed Strengths</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-200">
                {report.demonstratedStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.priorityWeaknesses.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Priority Growth Areas</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-200">
                {report.priorityWeaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Ready to inspect your evidence-based personalized study plan?
          </p>

          <button
            onClick={onProceedToPlan}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            <span>Review & Approve Study Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
