# STEERING.md — Project Knowledge & Architectural Guidelines

This document serves as the **steering blueprint and project memory** for **LinguaStep (Remix LinguaStep)**. When starting a new AI assistant session or extending the codebase, follow the rules, architecture, and design patterns outlined below.

---

## 1. Product Overview & Core Mission

**LinguaStep** is an adaptive, hyper-personalized English learning application powered by Gemini. It delivers daily 10-, 20-, or 30-minute structured learning sessions tailored to the learner's current CEFR level (A2, B1, B2, C1), goals (General or Workplace & Tech), and native explanation language (English or Vietnamese).

### Core Features
1. **Conversational Discovery & Onboarding**: Interactive onboarding determining the learner's targets, preferred daily duration, and explanation language.
2. **Adaptive Diagnostic Exam**: Multi-section placement assessment (Grammar, Reading, Writing, Vocabulary) with real-time level adjustment and comprehensive diagnostic reports.
3. **Full-Session Daily Lessons**: Structured multi-activity sessions (Warm-up, Core Concept, Workplace Writing, Free Practice) with pre-generated questions for seamless, zero-latency activity switching.
4. **AI Tutor Assistant & Deep Dive**: Context-aware hints, simplified explanations, additional examples, and interactive follow-up Q&A.
5. **Daily Summary & Tomorrow Preview**: Session takeaways, accuracy metrics, target time comparisons, and preview cards for tomorrow's upcoming focus.
6. **Curriculum Roadmap**: Multi-day skill trajectory visualizing mastered skills, items needing practice, and upcoming learning milestones.

---

## 2. Technical Stack & Directory Structure

- **Frontend**: React SPA + Vite + Tailwind CSS + Lucide Icons.
- **Backend**: Server-side Express proxy (`server.ts`) running Node with Gemini API Integration (`@google/genai`).
- **Persistence**: Dual local/session storage (`src/services/localStore.ts`) for learner profile, active lesson state, diagnostic history, and skill mastery levels.

```
/
├── server.ts                       # Express server entry point & API endpoints
├── server/
│   ├── aiService.ts                # Main AI Service provider (<500 lines modular class)
│   ├── questionUtils.ts            # Question sanitization & option reconciliation
│   ├── services/
│   │   └── diagnosticService.ts    # Adaptive diagnostic logic & report computation
│   ├── evaluators/
│   │   ├── diagnosticHelpers.ts    # Writing rubric & diagnostic fallback helpers
│   │   └── lessonHelpers.ts        # Option matching, evaluation & summary fallbacks
│   ├── prompts/                    # Categorized system prompt builders
│   │   ├── diagnosticPrompts.ts    # Diagnostic system prompts
│   │   ├── discoveryPrompts.ts     # Conversational discovery prompts
│   │   ├── evaluationPrompts.ts    # Answer evaluation & contrast prompts
│   │   ├── lessonPrompts.ts        # Daily lesson plan & question prompts
│   │   └── tutorPrompts.ts         # Tutor assist & deep dive prompts
│   ├── fallbacks/                  # Deterministic fallback generators
│   │   ├── diagnosticFallbacks.js
│   │   └── lessonFallbacks.js
│   ├── usageBudget.ts              # Per-user request budget & quota manager
│   ├── contentCache.ts             # In-memory plan & item caching
│   └── aiErrors.ts                 # Classification of API & rate limit errors
├── src/
│   ├── components/                 # React UI components
│   │   ├── LessonView.tsx          # Main daily session execution component
│   │   ├── Header.tsx              # Application header & navigation controls
│   │   ├── LessonSummaryModal.tsx  # Daily completion summary & tomorrow preview
│   │   ├── CurriculumRoadmapModal.tsx # Roadmap & skill trajectory modal
│   │   ├── DiagnosticExamView.tsx # Placement exam interface
│   │   ├── OnboardingModal.tsx     # Conversational onboarding flow
│   │   └── DeepDiveModal.tsx       # AI Tutor interactive explanation modal
│   ├── services/
│   │   ├── api.ts                  # Client API functions calling server endpoints
│   │   └── localStore.ts           # Browser localStorage state manager
│   └── types/
│       └── learning.ts             # Primary TypeScript interfaces and data models
```

---

## 3. Key Architectural Rules & Business Requirements

### A. Full-Session Batch Question Generation (Zero-Latency Rule)
- **Requirement**: Never render or generate questions one-by-one on demand during activity tab switching. Questions for **ALL sections** in a daily session must be generated upfront when creating or resuming the lesson plan (`populatePlanQuestions`).
- **Endpoint**: `/api/ai/batch-session-questions` accepts a `LessonPlan` and pre-populates all section question arrays concurrently via `Promise.all`.
- **UI Behavior**: `LessonView.tsx` stores questions in `questionsBySection`. Switching between activity tabs updates the section index and immediately displays the section's pre-loaded question without loading spinners or server delay.

### B. Modular Server Code Base (< 500-600 Line Rule)
- **Rule**: Keep `server/aiService.ts` clean, readable, and tightly scoped under **500–600 lines**.
- **Refactoring Convention**:
  - Place complex domain logic in sub-services under `server/services/` (e.g., `diagnosticService.ts`).
  - Place prompt templates under `server/prompts/`.
  - Place option-matching and evaluation helpers under `server/evaluators/`.
  - Place sanitization logic in `server/questionUtils.ts`.

### C. Question Sanitization & Reconciliation
- Before presenting any question to the user, pass it through `sanitizeAndReconcileQuestion(q)`:
  - Validates multiple-choice `expected_answer_ids` against option IDs (`A`, `B`, `C`, `D`).
  - Reconciles expected text mismatch with option text.
  - Ensures reading or fill-in-the-blank prompt formatting properly embeds context sentences.

### D. Adaptive CEFR Leveling
- CEFR Levels: `A2` → `B1` → `B2` → `C1`.
- Adjust difficulty dynamically during diagnostic exams and daily practice:
  - Accuracy ≥ 80% over 2+ consecutive attempts → step level up.
  - Accuracy < 40% over 2+ consecutive attempts → step level down.

### E. Dual-Language Explanation Rules
- Learner preference `explanation_language` (`'vi'` or `'en'`).
- Explanations, hints, contrast comparisons, and summary feedback must respect the preferred language.
- English target content (sentences, vocabulary, grammar rules) remains in authentic English regardless of explanation language.

### F. Index Clamping & Navigation Protection
- In `LessonView.tsx`, always clamp `currentSectionIndex` and question indices within valid bounds: `Math.max(0, Math.min(index, total - 1))`.
- Prevent out-of-bounds indexing when switching session modes (e.g., switching from 30-min deep session to 10-min quick session).

---

## 4. AI Prompting Guidelines & Output Schemas

1. **Strict JSON Output**: All Gemini calls must enforce `responseMimeType: 'application/json'` with explicit TypeScript schemas matching `src/types/learning.ts`.
2. **Deterministic Fallbacks**: Every AI endpoint must be wrapped in a fail-safe `try/catch`. In case of quota cooldown or API budget exhaustion, return high-quality fallback objects rather than breaking the application.
3. **Session Objectives**: System prompts for question generation accept `sessionObjective` to ensure every generated question connects directly to the overarching session goal.

---

## 5. Development & Testing Instructions

- **Run Type Check**: `npx tsc --noEmit`
- **Run Applet Build Verification**: Use `compile_applet` tool or `npm run build`
- **Run Lint Check**: `npm run lint`

When starting new chat sessions or making code changes, refer to this `STEERING.md` to ensure all architectural rules, pre-generation flows, and line-limit constraints are maintained!
