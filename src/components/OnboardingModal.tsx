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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#161A17]/70 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-3xl w-full p-4 sm:p-6 md:p-8 shadow-2xl text-[#2D312E] dark:text-[#F4F2EC] flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
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
            profile={profile}
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
