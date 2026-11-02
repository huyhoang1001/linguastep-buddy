import { UserProfile, WritingTaskConfig, EnglishLevel } from '../../src/types/learning.js';

export function getWritingTaskConfig(
  profile: UserProfile,
  sessionDuration: 10 | 20 | 30,
  purpose: 'micro-practice' | 'independent-writing' | 'diagnostic' | 'synthesis',
  remainingMinutes?: number
): WritingTaskConfig {
  const level = profile.current_level;
  
  // Base configuration based on CEFR level - strictly calibrated for authentic production
  const baseTargets: Record<EnglishLevel, { minSentences: number; maxSentences: number; minWords?: number; maxWords?: number; complexity: WritingTaskConfig['complexity'] }> = {
    'A1': { minSentences: 1, maxSentences: 3, complexity: 'basic' },
    'A2': { minSentences: 3, maxSentences: 6, complexity: 'developing' },
    'B1': { minSentences: 5, maxSentences: 10, minWords: 60, maxWords: 100, complexity: 'developing' },
    'B2': { minSentences: 8, maxSentences: 15, minWords: 120, maxWords: 180, complexity: 'independent' },
    'C1': { minSentences: 12, maxSentences: 25, minWords: 200, maxWords: 350, complexity: 'advanced' },
  };

  const target = baseTargets[level] || baseTargets['B1'];
  
  // Adjust based on purpose and session duration
  let minSentences = target.minSentences;
  let maxSentences = target.maxSentences;
  let minWords = target.minWords;
  let maxWords = target.maxWords;
  let taskType: WritingTaskConfig['task_type'] = 'paragraph';
  let estimatedMinutes = 5;

  if (purpose === 'micro-practice') {
    taskType = 'micro';
    minSentences = Math.max(1, Math.floor(minSentences * 0.4));
    maxSentences = Math.max(2, Math.floor(maxSentences * 0.4));
    if (minWords) minWords = Math.floor(minWords * 0.4);
    if (maxWords) maxWords = Math.floor(maxWords * 0.4);
    estimatedMinutes = 3;
  } else if (purpose === 'diagnostic') {
    taskType = (level === 'B2' || level === 'C1') ? 'email' : 'paragraph';
    estimatedMinutes = 8;
  } else if (purpose === 'synthesis') {
    // Synthesis should be a substantial workplace or academic task
    taskType = (level === 'B2' || level === 'C1') ? 'email' : 'paragraph';
    if (level === 'C1') taskType = 'report';
    estimatedMinutes = 12;
  }

  // Adjust for 10-minute quick sessions - significantly scale back
  if (sessionDuration === 10 && purpose !== 'micro-practice') {
    minSentences = Math.max(2, Math.round(minSentences * 0.5));
    maxSentences = Math.max(4, Math.round(maxSentences * 0.5));
    if (minWords) minWords = Math.round(minWords * 0.5);
    if (maxWords) maxWords = Math.round(maxWords * 0.5);
    estimatedMinutes = Math.max(3, Math.round(estimatedMinutes * 0.6));
  }

  // Respect remaining time if provided - last resort safety
  if (remainingMinutes !== undefined && remainingMinutes < estimatedMinutes) {
    estimatedMinutes = Math.max(2, remainingMinutes);
    const ratio = estimatedMinutes / 10; // assuming 10 is baseline
    minSentences = Math.max(1, Math.round(minSentences * ratio));
    maxSentences = Math.max(2, Math.round(maxSentences * ratio));
    if (minWords) minWords = Math.round(minWords * ratio);
    if (maxWords) maxWords = Math.round(maxWords * ratio);
  }

  return {
    min_words: minWords || undefined,
    max_words: maxWords || undefined,
    min_sentences: minSentences,
    max_sentences: maxSentences,
    task_type: taskType,
    complexity: target.complexity,
    estimated_minutes: estimatedMinutes
  };
}
