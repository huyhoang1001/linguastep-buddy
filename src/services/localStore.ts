import {
  UserProfile,
  LearnerSkillState,
  VocabularyItem,
  Attempt,
  LessonPlan,
  DailySummary,
  DiscoveryState,
  DiagnosticSession,
  DiagnosticReport,
  PersonalizedStudyPlan,
  LearningDataExport,
  ActiveLessonState,
  VocabExerciseType,
  VocabMasteryStage,
  WordFormMastery,
  WordFormMasteryStatus,
  WordFamilyData,
  EnglishLevel,
  CompanionChatMessage
} from '../types/learning.ts';
import {
  DEFAULT_PROFILE,
  INITIAL_SKILLS,
  INITIAL_VOCABULARY
} from './localSeed.ts';
import { MasteryEngine } from './masteryEngine.ts';

const DB_NAME = 'linguastep_local_v1';
const DB_VERSION = 1;

export interface StorageStatus {
  initialized: boolean;
  type: 'indexeddb' | 'memory';
  lastSavedAt: string;
  error?: string | null;
}

/**
 * Local-First Durable Storage Layer
 * Uses IndexedDB in the browser, with an in-memory fallback for test runners/SSR.
 */
class LocalLearningStore {
  private db: IDBDatabase | null = null;
  private isIndexedDBAvailable: boolean;
  private memoryStore: Map<string, any> = new Map();
  private lastSavedAt: string = new Date().toISOString();
  private lastError: string | null = null;
  private activeAccountId: string = 'learner-primary';

  constructor() {
    this.isIndexedDBAvailable =
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined';
  }

  public setActiveAccount(accountId: string | null | undefined): void {
    if (accountId && accountId.trim()) {
      this.activeAccountId = accountId.trim();
    } else {
      this.activeAccountId = 'learner-primary';
    }
  }

  public getActiveAccount(): string {
    return this.activeAccountId;
  }

  private getScopedId(id: string): string {
    if (!this.activeAccountId) return id;
    if (id.startsWith(`${this.activeAccountId}::`)) return id;
    return `${this.activeAccountId}::${id}`;
  }

  private async openDB(): Promise<IDBDatabase | null> {
    if (!this.isIndexedDBAvailable) return null;
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const stores = [
          'profile',
          'skills',
          'vocabulary',
          'attempts',
          'lessons',
          'active_lesson',
          'summaries',
          'discovery',
          'diagnostic_session',
          'diagnostic_reports',
          'study_plan',
          'companion_chat',
          'metadata'
        ];

        for (const storeName of stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('[LocalStore] IndexedDB open error, falling back to in-memory:', (event.target as IDBOpenDBRequest).error);
        this.isIndexedDBAvailable = false;
        resolve(null);
      };
    });
  }

  private async getStoreData<T>(storeName: string, id: string): Promise<T | null> {
    const scopedId = this.getScopedId(id);
    try {
      const db = await this.openDB();
      if (!db) {
        const val = this.memoryStore.get(`${storeName}:${scopedId}`);
        if (val !== undefined) return val;
        // Backward-compatible fallback for un-scoped primary guest data
        if (this.activeAccountId === 'learner-primary') {
          return this.memoryStore.get(`${storeName}:${id}`) || null;
        }
        return null;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(scopedId);

        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result.data);
          } else if (this.activeAccountId === 'learner-primary' && scopedId !== id) {
            // Check legacy un-scoped id
            const fallbackReq = store.get(id);
            fallbackReq.onsuccess = () => resolve(fallbackReq.result ? fallbackReq.result.data : null);
            fallbackReq.onerror = () => reject(fallbackReq.error);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err: any) {
      this.lastError = err?.message || 'Read error';
      return this.memoryStore.get(`${storeName}:${scopedId}`) || null;
    }
  }

  private async getAllStoreData<T>(storeName: string): Promise<T[]> {
    const prefix = `${this.activeAccountId}::`;
    try {
      const db = await this.openDB();
      if (!db) {
        const itemMap = new Map<string, T>();
        // Process un-scoped first if learner-primary, so scoped can overwrite
        if (this.activeAccountId === 'learner-primary') {
          for (const [k, v] of this.memoryStore.entries()) {
            if (k.startsWith(`${storeName}:`) && !k.slice(storeName.length + 1).includes('::')) {
              const baseId = k.slice(storeName.length + 1);
              itemMap.set(baseId, v);
            }
          }
        }
        for (const [k, v] of this.memoryStore.entries()) {
          if (k.startsWith(`${storeName}:${prefix}`)) {
            const baseId = k.slice(`${storeName}:${prefix}`.length);
            itemMap.set(baseId, v);
          }
        }
        return Array.from(itemMap.values());
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => {
          const itemMap = new Map<string, T>();
          // First pass: legacy un-scoped items if learner-primary
          if (this.activeAccountId === 'learner-primary') {
            for (const item of (req.result || [])) {
              if (item && typeof item.id === 'string' && !item.id.includes('::')) {
                itemMap.set(item.id, item.data);
              }
            }
          }
          // Second pass: scoped items (these overwrite any legacy items with same baseId)
          for (const item of (req.result || [])) {
            if (item && typeof item.id === 'string' && item.id.startsWith(prefix)) {
              const baseId = item.id.slice(prefix.length);
              itemMap.set(baseId, item.data);
            }
          }
          resolve(Array.from(itemMap.values()));
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err: any) {
      this.lastError = err?.message || 'Read all error';
      return [];
    }
  }

  private async setStoreData<T>(storeName: string, id: string, data: T): Promise<void> {
    const scopedId = this.getScopedId(id);
    this.lastSavedAt = new Date().toISOString();
    this.memoryStore.set(`${storeName}:${scopedId}`, data);

    try {
      const db = await this.openDB();
      if (!db) return;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put({ id: scopedId, data, updatedAt: this.lastSavedAt });

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err: any) {
      this.lastError = err?.message || 'Write error';
    }
  }

  private async deleteStoreData(storeName: string, id: string): Promise<void> {
    const scopedId = this.getScopedId(id);
    this.memoryStore.delete(`${storeName}:${scopedId}`);
    try {
      const db = await this.openDB();
      if (!db) return;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(scopedId);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err: any) {
      this.lastError = err?.message || 'Delete error';
    }
  }

  private async clearStore(storeName: string): Promise<void> {
    const prefix = `${this.activeAccountId}::`;
    for (const k of Array.from(this.memoryStore.keys())) {
      if (k.startsWith(`${storeName}:${prefix}`)) {
        this.memoryStore.delete(k);
      } else if (this.activeAccountId === 'learner-primary' && k.startsWith(`${storeName}:`) && !k.slice(storeName.length + 1).includes('::')) {
        this.memoryStore.delete(k);
      }
    }

    try {
      const db = await this.openDB();
      if (!db) return;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.getAllKeys();

        req.onsuccess = () => {
          const keys = req.result || [];
          for (const key of keys) {
            if (typeof key === 'string') {
              if (key.startsWith(prefix) || (this.activeAccountId === 'learner-primary' && !key.includes('::'))) {
                store.delete(key);
              }
            }
          }
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err: any) {
      this.lastError = err?.message || 'Clear store error';
    }
  }

  /**
   * Safely migrates learning progress from guest/primary account to a new Google account
   */
  public async migrateGuestDataToAccount(targetAccountId: string): Promise<boolean> {
    if (!targetAccountId || targetAccountId === 'learner-primary') return false;
    const currentActive = this.activeAccountId;
    try {
      this.activeAccountId = 'learner-primary';
      const guestProfile = await this.getStoreData<UserProfile>('profile', 'current');
      const guestSkills = await this.getAllStoreData<LearnerSkillState>('skills');
      const guestVocab = await this.getAllStoreData<VocabularyItem>('vocabulary');
      const guestAttempts = await this.getAllStoreData<Attempt>('attempts');
      const guestLessons = await this.getAllStoreData<LessonPlan>('lessons');
      const guestSummaries = await this.getAllStoreData<DailySummary>('summaries');
      const guestStudyPlan = await this.getStudyPlan();

      this.activeAccountId = targetAccountId;
      const existingTargetProfile = await this.getStoreData<UserProfile>('profile', 'current');

      if (!existingTargetProfile && guestProfile) {
        await this.setStoreData('profile', 'current', { ...guestProfile, id: targetAccountId });
        for (const s of guestSkills) {
          await this.setStoreData('skills', s.skill_id, s);
        }
        for (const v of guestVocab) {
          await this.setStoreData('vocabulary', v.id, v);
        }
        for (const a of guestAttempts) {
          await this.setStoreData('attempts', a.id, a);
        }
        for (const l of guestLessons) {
          await this.setStoreData('lessons', l.lesson_id, l);
        }
        for (const sm of guestSummaries) {
          await this.setStoreData('summaries', sm.lesson_id, sm);
        }
        if (guestStudyPlan) {
          await this.saveStudyPlan(guestStudyPlan);
        }
      }
      return true;
    } catch (err) {
      console.warn('[LocalStore] Migration error:', err);
      return false;
    } finally {
      this.activeAccountId = targetAccountId;
    }
  }

  // =========================================================================
  // 1. PROFILE
  // =========================================================================

  public async getProfile(): Promise<UserProfile> {
    let p = await this.getStoreData<UserProfile>('profile', 'current');
    if (!p) {
      p = { ...DEFAULT_PROFILE, id: this.activeAccountId };
      await this.setStoreData('profile', 'current', p);
    }
    return p;
  }

  public async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated: UserProfile = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };
    await this.setStoreData('profile', 'current', updated);
    return updated;
  }

  // =========================================================================
  // 2. STUDY PLAN
  // =========================================================================

  public async getStudyPlan(): Promise<PersonalizedStudyPlan | null> {
    return this.getStoreData<PersonalizedStudyPlan>('study_plan', 'current');
  }

  public async saveStudyPlan(plan: PersonalizedStudyPlan): Promise<PersonalizedStudyPlan> {
    await this.setStoreData('study_plan', 'current', plan);
    return plan;
  }

  // =========================================================================
  // 3. IN-PROGRESS ACTIVE LESSON RESUMPTION
  // =========================================================================

  public async getActiveLesson(): Promise<ActiveLessonState | null> {
    return this.getStoreData<ActiveLessonState>('active_lesson', 'current');
  }

  public async saveActiveLesson(state: ActiveLessonState): Promise<ActiveLessonState> {
    const updated = { ...state, updatedAt: new Date().toISOString() };
    await this.setStoreData('active_lesson', 'current', updated);
    return updated;
  }

  public async clearActiveLesson(): Promise<void> {
    await this.deleteStoreData('active_lesson', 'current');
  }

  // =========================================================================
  // 4. LESSON PLANS HISTORY
  // =========================================================================

  public async getLessons(): Promise<LessonPlan[]> {
    return this.getAllStoreData<LessonPlan>('lessons');
  }

  public async saveLesson(lesson: LessonPlan): Promise<LessonPlan> {
    await this.setStoreData('lessons', lesson.lesson_id, lesson);
    return lesson;
  }

  // =========================================================================
  // 5. ATTEMPTS & LOCAL MASTERY UPDATES
  // =========================================================================

  public async getAttempts(): Promise<Attempt[]> {
    return this.getAllStoreData<Attempt>('attempts');
  }

  public async recordAttempt(attempt: Attempt): Promise<Attempt> {
    await this.setStoreData('attempts', attempt.id, attempt);

    // Update skill mastery locally with multi-stage cognitive progression
    const isCorrect = attempt.verdict === 'correct';
    const profile = await this.getProfile();
    const isVi = profile.explanation_language === 'vi';
    let errorTag = (attempt.evaluation.error_tags && attempt.evaluation.error_tags[0]) || attempt.evaluation.decisive_clue;
    if (!isCorrect && (!errorTag || errorTag === attempt.skill_name || errorTag.length < 3)) {
      errorTag = attempt.user_answer
        ? (isVi ? `Đã chọn/nhập "${attempt.user_answer}" thay vì đáp án đúng` : `Selected/wrote "${attempt.user_answer}" instead of expected answer`)
        : (attempt.evaluation.explanation || 'Incorrect response');
    }

    await this.updateSkillMastery(
      attempt.question_id,
      attempt.skill_name,
      attempt.section,
      isCorrect,
      errorTag,
      undefined,
      undefined,
      attempt.created_at
    );

    return attempt;
  }

  public async getSkills(): Promise<LearnerSkillState[]> {
    return this.getAllStoreData<LearnerSkillState>('skills');
  }

  public async updateSkillMastery(
    skillId: string,
    skillName: string,
    category: string,
    isCorrect: boolean,
    errorTag?: string,
    questionType?: string,
    questionDifficulty?: EnglishLevel,
    attemptTimestamp?: string,
    isProgressCheck?: boolean
  ): Promise<LearnerSkillState> {
    const skills = await this.getSkills();
    let currentSkill = skills.find(s => s.skill_id === skillId || s.skill_name.toLowerCase() === skillName.toLowerCase());

    const result = MasteryEngine.recordSkillEvidence(currentSkill, {
      skillId,
      skillName,
      category,
      isCorrect,
      errorTag,
      questionType,
      questionDifficulty,
      attemptTimestamp,
      isProgressCheck
    });

    const updated = result.updatedSkill;
    await this.setStoreData('skills', updated.skill_id, updated);
    return updated;
  }

  // =========================================================================
  // 6. VOCABULARY & SPACED REVIEW
  // =========================================================================

  public async getVocabulary(): Promise<VocabularyItem[]> {
    const raw = await this.getAllStoreData<VocabularyItem>('vocabulary');
    const seenIds = new Set<string>();
    const seenWords = new Set<string>();
    const unique: VocabularyItem[] = [];

    for (const item of raw) {
      if (!item) continue;
      const idKey = item.id ? String(item.id).trim() : '';
      const wordKey = item.word ? String(item.word).trim().toLowerCase() : '';

      if (!idKey && !wordKey) continue;
      if ((idKey && seenIds.has(idKey)) || (wordKey && seenWords.has(wordKey))) {
        continue;
      }
      if (idKey) seenIds.add(idKey);
      if (wordKey) seenWords.add(wordKey);
      unique.push(item);
    }
    return unique;
  }

  public async saveVocabularyItem(item: Partial<VocabularyItem> & { word: string }): Promise<VocabularyItem> {
    const list = await this.getVocabulary();
    const existing = list.find(v => v.word.toLowerCase() === item.word.toLowerCase());

    if (existing) {
      const updated: VocabularyItem = {
        ...existing,
        ...item,
        last_reviewed_at: new Date().toISOString()
      };
      await this.setStoreData('vocabulary', updated.id, updated);
      return updated;
    } else {
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const newItem: VocabularyItem = {
        id: item.id || `vocab-${Date.now()}-${randomSuffix}`,
        word: item.word,
        part_of_speech: item.part_of_speech || 'noun',
        ipa: item.ipa || '',
        pronunciation_tip: item.pronunciation_tip || '',
        meaning: item.meaning || '',
        collocation_pattern: item.collocation_pattern || '',
        example_general: item.example_general || '',
        example_workplace: item.example_workplace || '',
        similar_word_comparison: item.similar_word_comparison,
        review_stage: 1,
        mastery_stage: item.mastery_stage || 'encountered',
        mastery_score: item.mastery_score ?? 25,
        contexts_encountered: item.contexts_encountered || [],
        exercise_types_passed: item.exercise_types_passed || [],
        common_confusions: item.common_confusions || [],
        next_review_at: new Date(Date.now() + 86400000).toISOString(),
        first_seen_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString(),
        times_correct: item.times_correct ?? 1,
        times_incorrect: item.times_incorrect ?? 0
      };
      await this.setStoreData('vocabulary', newItem.id, newItem);
      return newItem;
    }
  }

  /**
   * Evidence-based vocabulary mastery calculation.
   * A word is NEVER marked as mastered based on a single immediate recognition.
   * Progress requires:
   * - Multiple distinct contextual sentences
   * - Success across varied exercise types (meaning_from_context, contextual_cloze, usage_discrimination, collocations, etc.)
   * - Spaced repetition and high retrieval accuracy over time
   */
  public async recordVocabularyEvidence(params: {
    word: string;
    cardData?: Partial<VocabularyItem>;
    isCorrect: boolean;
    contextSentence?: string;
    exerciseType?: VocabExerciseType;
    confusedWith?: string;
  }): Promise<{
    item: VocabularyItem;
    update: {
      word: string;
      previous_stage: VocabMasteryStage;
      new_stage: VocabMasteryStage;
      score: number;
      explanation: string;
    };
  }> {
    const list = await this.getVocabulary();
    let existing = list.find(v => v.word.toLowerCase() === params.word.toLowerCase());

    if (!existing) {
      existing = await this.saveVocabularyItem({
        word: params.word,
        ...(params.cardData || {}),
        times_correct: 0,
        times_incorrect: 0,
        mastery_stage: 'encountered',
        mastery_score: 15,
        contexts_encountered: params.contextSentence ? [params.contextSentence] : [],
        exercise_types_passed: [],
        common_confusions: []
      });
    }

    const previousStage = existing.mastery_stage || 'encountered';
    const timesCorrect = existing.times_correct + (params.isCorrect ? 1 : 0);
    const timesIncorrect = existing.times_incorrect + (params.isCorrect ? 0 : 1);

    // Merge contexts encountered (deduplicate)
    const contexts = Array.from(new Set([
      ...(existing.contexts_encountered || []),
      ...(params.contextSentence ? [params.contextSentence] : [])
    ]));

    // Merge exercise types passed
    const exerciseTypes = Array.from(new Set([
      ...(existing.exercise_types_passed || []),
      ...(params.isCorrect && params.exerciseType ? [params.exerciseType] : [])
    ]));

    // Merge common confusions
    const confusions = Array.from(new Set([
      ...(existing.common_confusions || []),
      ...(!params.isCorrect && params.confusedWith ? [params.confusedWith] : [])
    ]));

    const totalAttempts = timesCorrect + timesIncorrect;
    const accuracy = totalAttempts > 0 ? timesCorrect / totalAttempts : 0;
    const uniqueContexts = contexts.length;
    const uniqueTypes = exerciseTypes.length;

    let newStage: VocabMasteryStage = 'encountered';
    let newScore = 20;
    let newReviewStage: 1 | 3 | 7 | 14 | 30 = 1;
    let explanation = '';

    if (!params.isCorrect) {
      // Slip / Error: reset review interval for tomorrow, reduce score
      newReviewStage = 1;
      if (previousStage === 'mastered') {
        newStage = 'applied';
        newScore = 75;
        explanation = `Mistake recorded. Demoted from Mastered to Applied for review tomorrow.`;
      } else if (previousStage === 'applied') {
        newStage = 'retrieved';
        newScore = 60;
        explanation = `Needs reinforcement in this context. Review scheduled for tomorrow.`;
      } else {
        newStage = previousStage;
        newScore = Math.max(10, (existing.mastery_score || 25) - 15);
        explanation = `Contextual slip recorded with distractor "${params.confusedWith || 'alternative'}". Reviewing tomorrow.`;
      }
    } else {
      // Correct performance: rigorous multi-evidence progression
      if (timesCorrect >= 5 && uniqueContexts >= 3 && uniqueTypes >= 3 && accuracy >= 0.85) {
        newStage = 'mastered';
        newScore = 100;
        newReviewStage = 30;
        explanation = `Full mastery verified: successfully retrieved and applied across ${uniqueContexts} distinct contexts and ${uniqueTypes} exercise formats (${Math.round(accuracy * 100)}% accuracy).`;
      } else if (timesCorrect >= 4 && uniqueContexts >= 3 && uniqueTypes >= 2 && accuracy >= 0.8) {
        newStage = 'applied';
        newScore = 90;
        newReviewStage = 14;
        explanation = `Applied stage reached: strong active usage across ${uniqueContexts} contexts and ${uniqueTypes} exercise types.`;
      } else if (timesCorrect >= 3 && uniqueContexts >= 2 && uniqueTypes >= 2 && accuracy >= 0.7) {
        newStage = 'retrieved';
        newScore = 75;
        newReviewStage = 7;
        explanation = `Retrieved stage reached: demonstrated contextual understanding without immediate answer revelation.`;
      } else if (timesCorrect >= 2 && (uniqueContexts >= 2 || uniqueTypes >= 2)) {
        newStage = 'practicing';
        newScore = 50;
        newReviewStage = 3;
        explanation = `Practicing stage reached: recognized and interpreted in ${uniqueContexts} different contexts.`;
      } else {
        newStage = 'encountered';
        newScore = 25;
        newReviewStage = 1;
        explanation = `First successful demonstration in context. Continued practice across different sentence structures is required to build true mastery.`;
      }
    }

    const updated: VocabularyItem = {
      ...existing,
      ...(params.cardData || {}),
      times_correct: timesCorrect,
      times_incorrect: timesIncorrect,
      contexts_encountered: contexts,
      exercise_types_passed: exerciseTypes,
      common_confusions: confusions,
      mastery_stage: newStage,
      mastery_score: newScore,
      review_stage: newReviewStage,
      next_review_at: new Date(Date.now() + newReviewStage * 86400000).toISOString(),
      last_reviewed_at: new Date().toISOString()
    };

    await this.setStoreData('vocabulary', updated.id, updated);

    return {
      item: updated,
      update: {
        word: params.word,
        previous_stage: previousStage,
        new_stage: newStage,
        score: newScore,
        explanation
      }
    };
  }

  /**
   * Tracks performance separately for each individual word form in a word family.
   * For example:
   * collaborate (verb) — needs practice
   * collaboration (noun) — understood
   * collaborative (adj) — understood
   * collaboratively (adv) — needs practice
   *
   * A single correct answer NEVER marks the entire family as mastered.
   */
  public async recordWordFormEvidence(params: {
    rootWord: string;
    form: string;
    partOfSpeech: string;
    isCorrect: boolean;
    familyData?: WordFamilyData;
  }): Promise<{
    item: VocabularyItem;
    formMastery: WordFormMastery;
    allFormMasteries: Record<string, WordFormMastery>;
  }> {
    const list = await this.getVocabulary();
    const normalizedRoot = params.rootWord.toLowerCase().trim();
    const normalizedForm = params.form.toLowerCase().trim();

    let existing = list.find(v => v.word.toLowerCase() === normalizedRoot);
    if (!existing) {
      existing = await this.saveVocabularyItem({
        word: params.rootWord,
        part_of_speech: params.partOfSpeech,
        meaning: `Word family for ${params.rootWord}`,
        word_family: params.familyData
      });
    }

    const currentMasteryMap: Record<string, WordFormMastery> = existing.word_form_mastery || {};
    const existingFormMastery = currentMasteryMap[normalizedForm] || {
      form: params.form,
      part_of_speech: params.partOfSpeech,
      status: 'needs_practice',
      times_correct: 0,
      times_incorrect: 0,
      last_practiced_at: new Date().toISOString()
    };

    const timesCorrect = existingFormMastery.times_correct + (params.isCorrect ? 1 : 0);
    const timesIncorrect = existingFormMastery.times_incorrect + (params.isCorrect ? 0 : 1);
    const totalAttempts = timesCorrect + timesIncorrect;
    const accuracy = totalAttempts > 0 ? timesCorrect / totalAttempts : 0;

    let status: WordFormMasteryStatus = 'needs_practice';
    if (!params.isCorrect) {
      status = 'needs_practice';
    } else if (timesCorrect >= 2 && accuracy >= 0.75) {
      status = 'mastered';
    } else {
      status = 'understood';
    }

    const updatedFormMastery: WordFormMastery = {
      form: params.form,
      part_of_speech: params.partOfSpeech,
      status,
      times_correct: timesCorrect,
      times_incorrect: timesIncorrect,
      last_practiced_at: new Date().toISOString()
    };

    const updatedMap: Record<string, WordFormMastery> = {
      ...currentMasteryMap,
      [normalizedForm]: updatedFormMastery
    };

    const updatedItem: VocabularyItem = {
      ...existing,
      word_family: params.familyData || existing.word_family,
      word_form_mastery: updatedMap,
      last_reviewed_at: new Date().toISOString()
    };

    await this.setStoreData('vocabulary', updatedItem.id, updatedItem);

    return {
      item: updatedItem,
      formMastery: updatedFormMastery,
      allFormMasteries: updatedMap
    };
  }

  public async getWordFamilyMastery(rootWord: string): Promise<Record<string, WordFormMastery>> {
    const list = await this.getVocabulary();
    const existing = list.find(v => v.word.toLowerCase() === rootWord.toLowerCase().trim());
    return existing?.word_form_mastery || {};
  }

  // =========================================================================
  // 7. SUMMARIES
  // =========================================================================

  public async getSummaries(): Promise<DailySummary[]> {
    return this.getAllStoreData<DailySummary>('summaries');
  }

  public async saveSummary(summary: DailySummary): Promise<DailySummary> {
    await this.setStoreData('summaries', summary.lesson_id, summary);
    return summary;
  }

  // =========================================================================
  // 8. DISCOVERY STATE
  // =========================================================================

  public async getDiscoveryState(): Promise<DiscoveryState | null> {
    return this.getStoreData<DiscoveryState>('discovery', 'current');
  }

  public async saveDiscoveryState(state: DiscoveryState): Promise<DiscoveryState> {
    await this.setStoreData('discovery', 'current', state);
    return state;
  }

  // =========================================================================
  // 9. DIAGNOSTIC PROGRESS & REPORTS
  // =========================================================================

  public async getDiagnosticSession(): Promise<DiagnosticSession | null> {
    return this.getStoreData<DiagnosticSession>('diagnostic_session', 'current');
  }

  public async saveDiagnosticSession(session: DiagnosticSession): Promise<DiagnosticSession> {
    await this.setStoreData('diagnostic_session', 'current', session);
    return session;
  }

  public async clearDiagnosticSession(): Promise<void> {
    await this.deleteStoreData('diagnostic_session', 'current');
  }

  public async getDiagnosticReports(): Promise<DiagnosticReport[]> {
    return this.getAllStoreData<DiagnosticReport>('diagnostic_reports');
  }

  public async saveDiagnosticReport(report: DiagnosticReport): Promise<DiagnosticReport> {
    await this.setStoreData('diagnostic_reports', report.id, report);
    return report;
  }

  // =========================================================================
  // 9b. COMPANION CHAT HISTORY
  // =========================================================================

  public async getCompanionChatHistory(userId?: string): Promise<CompanionChatMessage[]> {
    const id = userId || this.activeAccountId || 'learner-primary';
    const messages = await this.getStoreData<CompanionChatMessage[]>('companion_chat', id);
    return Array.isArray(messages) ? messages : [];
  }

  public async saveCompanionChatHistory(userId: string | undefined, history: CompanionChatMessage[]): Promise<void> {
    const id = userId || this.activeAccountId || 'learner-primary';
    const maxMsgs = 30; // 30-message FIFO cap
    const trimmed = history.slice(-maxMsgs);
    await this.setStoreData('companion_chat', id, trimmed);
  }

  public async clearCompanionChatHistory(userId?: string): Promise<void> {
    const id = userId || this.activeAccountId || 'learner-primary';
    await this.deleteStoreData('companion_chat', id);
  }

  // =========================================================================
  // 10. EXPORT / IMPORT / RESET
  // =========================================================================

  public async exportAll(): Promise<LearningDataExport> {
    const profile = await this.getProfile();
    const skills = await this.getSkills();
    const vocabulary = await this.getVocabulary();
    const attempts = await this.getAttempts();
    const lessons = await this.getLessons();
    const activeLesson = await this.getActiveLesson();
    const summaries = await this.getSummaries();
    const discoveryState = (await this.getDiscoveryState()) || undefined;
    const diagnosticSession = (await this.getDiagnosticSession()) || undefined;
    const diagnosticReports = await this.getDiagnosticReports();
    const studyPlan = (await this.getStudyPlan()) || undefined;

    return {
      version: 1,
      profile,
      skills,
      vocabulary,
      attempts,
      lessons,
      activeLesson,
      summaries,
      discoveryState,
      diagnosticSession,
      diagnosticReports,
      studyPlan,
      exported_at: new Date().toISOString()
    };
  }

  public validateImport(data: any): {
    valid: boolean;
    errors: string[];
    summary: {
      profileName?: string;
      level?: string;
      skillsCount: number;
      vocabCount: number;
      attemptsCount: number;
      lessonsCount: number;
      reportsCount: number;
    };
  } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('File does not contain valid JSON learning data.');
      return {
        valid: false,
        errors,
        summary: { skillsCount: 0, vocabCount: 0, attemptsCount: 0, lessonsCount: 0, reportsCount: 0 }
      };
    }

    if (!data.profile || typeof data.profile !== 'object') {
      errors.push('Missing or invalid profile object.');
    } else {
      if (!data.profile.current_level) errors.push('Profile is missing current_level.');
      if (!data.profile.primary_goal) errors.push('Profile is missing primary_goal.');
    }

    if (data.skills && !Array.isArray(data.skills)) {
      errors.push('Skills must be an array.');
    }
    if (data.vocabulary && !Array.isArray(data.vocabulary)) {
      errors.push('Vocabulary must be an array.');
    }
    if (data.attempts && !Array.isArray(data.attempts)) {
      errors.push('Attempts must be an array.');
    }
    if (data.lessons && !Array.isArray(data.lessons)) {
      errors.push('Lessons must be an array.');
    }

    const summary = {
      profileName: data.profile?.name || 'Learner',
      level: data.profile?.current_level,
      goal: data.profile?.primary_goal,
      skillsCount: Array.isArray(data.skills) ? data.skills.length : 0,
      vocabCount: Array.isArray(data.vocabulary) ? data.vocabulary.length : 0,
      attemptsCount: Array.isArray(data.attempts) ? data.attempts.length : 0,
      lessonsCount: Array.isArray(data.lessons) ? data.lessons.length : 0,
      summariesCount: Array.isArray(data.summaries) ? data.summaries.length : 0,
      reportsCount: Array.isArray(data.diagnosticReports) ? data.diagnosticReports.length : 0,
      hasActiveLesson: Boolean(data.activeLesson),
      hasStudyPlan: Boolean(data.studyPlan)
    };

    return {
      valid: errors.length === 0,
      errors,
      summary
    };
  }

  public async importAll(data: LearningDataExport): Promise<void> {
    const validation = this.validateImport(data);
    if (!validation.valid) {
      throw new Error(`Import validation failed: ${validation.errors.join('; ')}`);
    }

    // Save profile
    await this.setStoreData('profile', 'current', data.profile);

    // Save skills
    await this.clearStore('skills');
    if (Array.isArray(data.skills)) {
      for (const s of data.skills) {
        await this.setStoreData('skills', s.skill_id, s);
      }
    }

    // Save vocabulary
    await this.clearStore('vocabulary');
    if (Array.isArray(data.vocabulary)) {
      const seenIds = new Set<string>();
      const seenWords = new Set<string>();
      for (const v of data.vocabulary) {
        if (!v || !v.word) continue;
        const normWord = v.word.trim().toLowerCase();
        if (seenWords.has(normWord)) continue;
        seenWords.add(normWord);

        const validId = v.id && !seenIds.has(v.id)
          ? v.id
          : `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        seenIds.add(validId);
        await this.setStoreData('vocabulary', validId, { ...v, id: validId });
      }
    }

    // Save attempts
    await this.clearStore('attempts');
    if (Array.isArray(data.attempts)) {
      for (const a of data.attempts) {
        await this.setStoreData('attempts', a.id, a);
      }
    }

    // Save lessons
    await this.clearStore('lessons');
    if (Array.isArray(data.lessons)) {
      for (const l of data.lessons) {
        await this.setStoreData('lessons', l.lesson_id, l);
      }
    }

    // Save active lesson
    if (data.activeLesson) {
      await this.saveActiveLesson(data.activeLesson);
    } else {
      await this.clearActiveLesson();
    }

    // Save summaries
    await this.clearStore('summaries');
    if (Array.isArray(data.summaries)) {
      for (const s of data.summaries) {
        await this.setStoreData('summaries', s.lesson_id, s);
      }
    }

    // Save discovery
    if (data.discoveryState) {
      await this.setStoreData('discovery', 'current', data.discoveryState);
    }

    // Save diagnostic session
    if (data.diagnosticSession) {
      await this.setStoreData('diagnostic_session', 'current', data.diagnosticSession);
    } else {
      await this.clearDiagnosticSession();
    }

    // Save diagnostic reports
    await this.clearStore('diagnostic_reports');
    if (Array.isArray(data.diagnosticReports)) {
      for (const r of data.diagnosticReports) {
        await this.setStoreData('diagnostic_reports', r.id, r);
      }
    }

    // Save study plan
    if (data.studyPlan) {
      await this.setStoreData('study_plan', 'current', data.studyPlan);
    }
  }

  public async resetAll(): Promise<void> {
    this.memoryStore.clear();
    const stores = [
      'profile',
      'skills',
      'vocabulary',
      'attempts',
      'lessons',
      'active_lesson',
      'summaries',
      'discovery',
      'diagnostic_session',
      'diagnostic_reports',
      'study_plan'
    ];

    for (const s of stores) {
      try {
        await this.clearStore(s);
      } catch (err) {
        console.warn(`[LocalStore] Failed to clear store '${s}':`, err);
      }
    }

    // Set pristine default profile with onboarding_completed: false (leaving vocab and skills empty)
    await this.setStoreData('profile', 'current', { ...DEFAULT_PROFILE, onboarding_completed: false });
    this.lastSavedAt = new Date().toISOString();
  }

  public getStorageStatus(): StorageStatus {
    return {
      initialized: true,
      type: this.isIndexedDBAvailable ? 'indexeddb' : 'memory',
      lastSavedAt: this.lastSavedAt,
      error: this.lastError
    };
  }
}

export const localStore = new LocalLearningStore();
export { LocalLearningStore };
