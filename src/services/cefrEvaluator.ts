import {
  EnglishLevel,
  SectionType,
  Question,
  Verdict
} from '../types/learning.ts';

export interface AssessmentAttempt {
  question: {
    section?: SectionType | string;
    difficulty?: EnglishLevel | string;
    skill_name?: string;
  };
  verdict: Verdict;
}

export interface CEFRPlacementResult {
  placedLevel: EnglishLevel;
  confidence: 'provisional' | 'moderate' | 'high';
  compositeScore: number; // 0 - 100 difficulty-weighted proficiency score
  difficultyBreakdown: Record<EnglishLevel, { attempted: number; correct: number; accuracy: number }>;
  categoryCoverage: string[];
  rationale: string;
}

const LEVEL_WEIGHTS: Record<EnglishLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5
};

const ALL_LEVELS: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

/**
 * Evidence-Based Provisional CEFR Evaluator
 * 
 * Replaces naive accuracy mapping (e.g. 85% = C1) with difficulty-weighted,
 * coverage-aware proficiency estimation.
 */
export class CEFREvaluator {
  public static evaluateAttempts(attempts: AssessmentAttempt[]): CEFRPlacementResult {
    const breakdown: Record<EnglishLevel, { attempted: number; correct: number; accuracy: number }> = {
      A1: { attempted: 0, correct: 0, accuracy: 0 },
      A2: { attempted: 0, correct: 0, accuracy: 0 },
      B1: { attempted: 0, correct: 0, accuracy: 0 },
      B2: { attempted: 0, correct: 0, accuracy: 0 },
      C1: { attempted: 0, correct: 0, accuracy: 0 }
    };

    const categoriesFound = new Set<string>();

    let totalWeightedPointsEarned = 0;
    let totalMaxPossibleWeightedPoints = 0;

    for (const att of attempts) {
      const rawDiff = (att.question.difficulty || 'B1').toUpperCase() as EnglishLevel;
      const level: EnglishLevel = ALL_LEVELS.includes(rawDiff) ? rawDiff : 'B1';
      const isCorrect = att.verdict === 'correct';

      breakdown[level].attempted += 1;
      if (isCorrect) breakdown[level].correct += 1;

      if (att.question.section) {
        categoriesFound.add(att.question.section);
      }

      const weight = LEVEL_WEIGHTS[level];
      totalMaxPossibleWeightedPoints += weight * 100;
      totalWeightedPointsEarned += isCorrect ? weight * 100 : att.verdict === 'partially_correct' ? weight * 50 : 0;
    }

    // Compute accuracy per level
    for (const lvl of ALL_LEVELS) {
      const stats = breakdown[lvl];
      stats.accuracy = stats.attempted > 0 ? Number((stats.correct / stats.attempted).toFixed(2)) : 0;
    }

    const totalQuestions = attempts.length;
    const categoryCoverage = Array.from(categoriesFound);

    // Confidence calculation
    let confidence: 'provisional' | 'moderate' | 'high' = 'provisional';
    if (totalQuestions >= 12 && categoryCoverage.length >= 3) {
      confidence = 'high';
    } else if (totalQuestions >= 6 && categoryCoverage.length >= 2) {
      confidence = 'moderate';
    } else {
      confidence = 'provisional';
    }

    // Determine highest defensible CEFR level based on evidence
    // To achieve level L:
    // 1. Must have attempted items at or above level L
    // 2. Must achieve >= 60% accuracy at level L
    // 3. Must not have critical failures (< 50%) on prerequisites below level L
    let placedLevel: EnglishLevel = 'A1';

    for (const lvl of ALL_LEVELS) {
      const currentStats = breakdown[lvl];
      if (currentStats.attempted === 0) {
        // No evidence for this level; cannot place higher than last confirmed level
        break;
      }

      // Check prerequisite foundation: all levels below lvl must have >= 50% accuracy
      const lvlIndex = ALL_LEVELS.indexOf(lvl);
      const prerequisitesIntact = ALL_LEVELS.slice(0, lvlIndex).every(p => {
        const pStats = breakdown[p];
        return pStats.attempted === 0 || pStats.accuracy >= 0.5;
      });

      if (currentStats.accuracy >= 0.6 && prerequisitesIntact) {
        placedLevel = lvl;
      } else {
        // Failed threshold at this level; stop ascending
        break;
      }
    }

    const compositeScore = totalMaxPossibleWeightedPoints > 0
      ? Math.round((totalWeightedPointsEarned / totalMaxPossibleWeightedPoints) * 100)
      : 50;

    let rationale = `Placed at ${placedLevel} (${confidence} confidence). `;
    if (placedLevel === 'A1' && breakdown.A1.accuracy >= 0.8 && breakdown.A2.attempted === 0) {
      rationale += `Demonstrated strong A1 mastery (${Math.round(breakdown.A1.accuracy * 100)}%). Ready for A2 diagnostic progression.`;
    } else {
      rationale += `Demonstrated proficiency across tested difficulty bands: ${ALL_LEVELS.filter(l => breakdown[l].attempted > 0).map(l => `${l}: ${Math.round(breakdown[l].accuracy * 100)}% (${breakdown[l].correct}/${breakdown[l].attempted})`).join(', ')}.`;
    }

    return {
      placedLevel,
      confidence,
      compositeScore,
      difficultyBreakdown: breakdown,
      categoryCoverage,
      rationale
    };
  }
}
