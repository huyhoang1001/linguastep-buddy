import React, { useState } from 'react';
import { UserProfile, DiagnosticReport, PersonalizedStudyPlan } from '../types/learning.ts';
import { ConversationalDiscovery } from './ConversationalDiscovery.tsx';
import { AdaptiveDiagnosticView } from './AdaptiveDiagnosticView.tsx';
import { DiagnosticReportModal } from './DiagnosticReportModal.tsx';
import { StudyPlanModal } from './StudyPlanModal.tsx';

interface OnboardingModalProps {
  currentProfile: UserProfile;
  onComplete: () => void;
  initialPhase?: 'discovery' | 'diagnostic' | 'report' | 'plan';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  currentProfile,
  onComplete,
  initialPhase = 'discovery'
}) => {
  const [phase, setPhase] = useState<'discovery' | 'diagnostic' | 'report' | 'plan'>(initialPhase);
  const [profile, setProfile] = useState<UserProfile>(currentProfile);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [studyPlan, setStudyPlan] = useState<PersonalizedStudyPlan | null>(null);

  const handleDiscoveryConfirmed = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setPhase('diagnostic');
  };

  const handleAssessmentCompleted = (completedReport: DiagnosticReport, generatedPlan: PersonalizedStudyPlan) => {
    setReport(completedReport);
    setStudyPlan(generatedPlan);
    setPhase('report');
  };

  const handleProceedToPlan = () => {
    setPhase('plan');
  };

  const handlePlanApproved = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Stage 1: Conversational Goal Discovery */}
        {phase === 'discovery' && (
          <ConversationalDiscovery
            currentProfile={profile}
            onConfirmed={handleDiscoveryConfirmed}
            onSkipToDiagnostic={() => setPhase('diagnostic')}
          />
        )}

        {/* Stage 2: Adaptive Diagnostic Assessment */}
        {phase === 'diagnostic' && (
          <AdaptiveDiagnosticView
            onAssessmentCompleted={handleAssessmentCompleted}
            onPaused={() => onComplete()}
          />
        )}

        {/* Stage 3: Diagnostic Report */}
        {phase === 'report' && report && (
          <DiagnosticReportModal
            report={report}
            onProceedToPlan={handleProceedToPlan}
          />
        )}

        {/* Stage 4: Personalized Study Plan */}
        {phase === 'plan' && studyPlan && (
          <StudyPlanModal
            plan={studyPlan}
            profile={profile}
            onPlanApproved={handlePlanApproved}
          />
        )}
      </div>
    </div>
  );
};
