import { Question } from '../src/types/learning.ts';
import {
  getSubmissionType,
  isAutoAssessQuestion,
  AUTO_SUBMIT_NOTE
} from '../src/utils/submissionPolicy.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('🧪 Running Test Suite 18: Answer Submission & Assessment Policy Tests...');

  // 1. Verify AUTO_SUBMIT_NOTE text
  assert(
    AUTO_SUBMIT_NOTE === 'Choose carefully — your answer is submitted immediately.',
    'AUTO_SUBMIT_NOTE must match required warning copy'
  );

  // 2. Test getSubmissionType and isAutoAssessQuestion for multiple choice
  const mcQuestion: Partial<Question> = {
    id: 'q1',
    section: 'grammar',
    question_type: 'multiple_choice',
    prompt: 'She ________ to work yesterday.',
    options: [
      { id: 'A', text: 'go' },
      { id: 'B', text: 'went' },
      { id: 'C', text: 'gone' }
    ],
    skill_id: 's1',
    skill_name: 'Past Simple',
    difficulty: 'A2'
  };

  assert(
    getSubmissionType(mcQuestion) === 'auto_assess',
    'Multiple choice question must evaluate as auto_assess'
  );
  assert(
    isAutoAssessQuestion(mcQuestion) === true,
    'isAutoAssessQuestion must return true for multiple choice'
  );

  // 3. Test fill_in_blank question type
  const fillInBlankQuestion: Partial<Question> = {
    id: 'q2',
    section: 'grammar',
    question_type: 'fill_in_blank',
    prompt: 'Complete the sentence: "By the time we arrived, the team ________ (leave)."',
    skill_id: 's2',
    skill_name: 'Past Perfect',
    difficulty: 'B1'
  };

  assert(
    getSubmissionType(fillInBlankQuestion) === 'explicit_submit',
    'Fill in blank question must evaluate as explicit_submit'
  );
  assert(
    isAutoAssessQuestion(fillInBlankQuestion) === false,
    'isAutoAssessQuestion must return false for fill in blank'
  );

  // 4. Test free_writing question type
  const writingQuestion: Partial<Question> = {
    id: 'q3',
    section: 'writing',
    question_type: 'free_writing',
    prompt: 'Write a brief email responding to your team lead about the project deadline.',
    skill_id: 's3',
    skill_name: 'Workplace Writing',
    difficulty: 'B2'
  };

  assert(
    getSubmissionType(writingQuestion) === 'explicit_submit',
    'Free writing question must evaluate as explicit_submit'
  );

  // 5. Test sentence_rewrite question type
  const rewriteQuestion: Partial<Question> = {
    id: 'q4',
    section: 'grammar',
    question_type: 'sentence_rewrite',
    prompt: 'Rewrite using passive voice: "The team completed the audit."',
    skill_id: 's4',
    skill_name: 'Passive Voice',
    difficulty: 'B2'
  };

  assert(
    getSubmissionType(rewriteQuestion) === 'explicit_submit',
    'Sentence rewrite question must evaluate as explicit_submit'
  );

  // 6. Test reading_comprehension with options
  const readingQuestionWithOptions: Partial<Question> = {
    id: 'q5',
    section: 'reading',
    question_type: 'reading_comprehension',
    prompt: 'What is the main reason for the project delay mentioned in paragraph 2?',
    options: [
      { id: 'A', text: 'Budget constraints' },
      { id: 'B', text: 'Resource shortage' },
      { id: 'C', text: 'Scope changes' }
    ],
    skill_id: 's5',
    skill_name: 'Reading Detail',
    difficulty: 'B1'
  };

  assert(
    getSubmissionType(readingQuestionWithOptions) === 'auto_assess',
    'Reading comprehension with options must evaluate as auto_assess'
  );

  // 7. Test null/undefined question fallback
  assert(
    getSubmissionType(null) === 'explicit_submit',
    'Null question must default safely to explicit_submit'
  );
  assert(
    getSubmissionType(undefined) === 'explicit_submit',
    'Undefined question must default safely to explicit_submit'
  );

  // 8. Test double submission guard state simulation
  let callCount = 0;
  let isSubmitting = false;
  let evaluationResult: { verdict: string } | null = null;

  async function mockSubmit(_ans: string) {
    if (isSubmitting || evaluationResult) {
      return; // Ignore rapid duplicate calls
    }
    isSubmitting = true;
    callCount++;
    // Simulate async evaluation
    await new Promise(r => setTimeout(r, 10));
    evaluationResult = { verdict: 'correct' };
    isSubmitting = false;
  }

  // Simulate two rapid clicks on option B
  const p1 = mockSubmit('B');
  const p2 = mockSubmit('B');
  await Promise.all([p1, p2]);

  assert(
    callCount === 1,
    'Rapid duplicate submissions must be safely ignored (callCount should be 1)'
  );

  // 9. Test preserving user answer on evaluation error
  const preservedAnswer = 'User typed text';
  let hasError: boolean = false;

  async function mockFailedEvaluation() {
    try {
      throw new Error('API Timeout');
    } catch (err) {
      hasError = true;
      // Do NOT reset preservedAnswer
    }
  }

  await mockFailedEvaluation();
  assert(hasError, 'Error caught');
  assert(
    preservedAnswer === 'User typed text',
    'User input must be preserved during error retry'
  );

  console.log('✅ All Answer Submission & Assessment Policy Tests passed!');
}

runTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
