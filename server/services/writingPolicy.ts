import { UserProfile, WritingTaskConfig, EnglishLevel } from '../../src/types/learning.js';

export function getWritingTaskConfig(
  profile: UserProfile,
  sessionDuration: 10 | 20 | 30,
  purpose: 'micro-practice' | 'independent-writing' | 'diagnostic' | 'synthesis',
  remainingMinutes?: number
): WritingTaskConfig {
  const level = profile.current_level;
  
  // Base configuration based on CEFR level
  const baseTargets: Record<EnglishLevel, { minSentences: number; maxSentences: number; minWords?: number; maxWords?: number; complexity: WritingTaskConfig['complexity'] }> = {
    'A1': { minSentences: 1, maxSentences: 2, complexity: 'basic' },
    'A2': { minSentences: 3, maxSentences: 5, complexity: 'developing' },
    'B1': { minSentences: 5, maxSentences: 8, complexity: 'developing' },
    'B2': { minSentences: 6, maxSentences: 10, minWords: 80, maxWords: 120, complexity: 'independent' },
    'C1': { minSentences: 8, maxSentences: 15, minWords: 120, maxWords: 200, complexity: 'advanced' },
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
    minSentences = Math.max(1, Math.round(minSentences * 0.5));
    maxSentences = Math.max(2, Math.round(maxSentences * 0.5));
    if (minWords) minWords = Math.round(minWords * 0.5);
    if (maxWords) maxWords = Math.round(maxWords * 0.5);
    estimatedMinutes = 3;
  } else if (purpose === 'diagnostic') {
    taskType = (level === 'B2' || level === 'C1') ? 'email' : 'paragraph';
    estimatedMinutes = 7;
  } else if (purpose === 'synthesis') {
    taskType = (level === 'B2' || level === 'C1') ? 'argument' : 'paragraph';
    estimatedMinutes = 10;
  }

  // Adjust for 10-minute quick sessions
  if (sessionDuration === 10 && purpose !== 'micro-practice') {
    minSentences = Math.max(2, Math.round(minSentences * 0.7));
    maxSentences = Math.max(4, Math.round(maxSentences * 0.7));
    if (minWords) minWords = Math.round(minWords * 0.7);
    if (maxWords) maxWords = Math.round(maxWords * 0.7);
    estimatedMinutes = Math.max(3, Math.round(estimatedMinutes * 0.7));
  }

  // Respect remaining time if provided
  if (remainingMinutes !== undefined && remainingMinutes < estimatedMinutes) {
    estimatedMinutes = Math.max(2, remainingMinutes);
    // Scale down length if time is very tight
    if (estimatedMinutes < 5) {
      minSentences = Math.max(1, Math.round(minSentences * 0.6));
      maxSentences = Math.max(2, Math.round(maxSentences * 0.6));
      if (minWords) minWords = Math.round(minWords * 0.6);
      if (maxWords) maxWords = Math.round(maxWords * 0.6);
    }
  }

  return {
    min_words: minWords,
    max_words: maxWords,
    min_sentences: minSentences,
    max_sentences: maxSentences,
    task_type: taskType,
    complexity: target.complexity,
    estimated_minutes: estimatedMinutes
  };
}
