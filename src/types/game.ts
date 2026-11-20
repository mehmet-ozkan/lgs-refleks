export type CategoryId =
  | 'mixed'
  | 'multiples'
  | 'powers'
  | 'squares-roots'
  | 'traps'
  | 'weak-spots';

export type ConcreteCategoryId =
  | 'multiples'
  | 'powers'
  | 'squares-roots'
  | 'traps';

export type GameMode = 'sprint' | 'practice';

export type AnswerStyle = 'hybrid' | 'choice' | 'input';

export type InputKind = 'choice' | 'number' | 'radical';

export type Difficulty = 'warmup' | 'standard' | 'master';

export type SprintDuration = 30 | 60 | 90;

export interface MathPrompt {
  label: string;
  parts: MathPart[];
}

export type MathPart =
  | { type: 'text'; value: string }
  | { type: 'power'; base: string; exp: string; highlightExp?: boolean }
  | { type: 'sqrt'; value: string; highlightInside?: boolean }
  | { type: 'radical'; coeff: string; radicand: string }
  | { type: 'blank'; text?: string }
  | { type: 'highlight'; value: string };

export interface QuestionOption {
  id: string;
  label: string;
  parts?: MathPart[];
}

export interface Question {
  key: string;
  category: ConcreteCategoryId;
  prompt: MathPrompt;
  hybridKind: InputKind;
  supportsInput: boolean;
  correctAnswer: string;
  radicalAnswer?: [number, number];
  displayAnswer: string;
  tip: string;
  options: QuestionOption[];
  isRetry?: boolean;
}

export interface CategoryMeta {
  id: CategoryId;
  title: string;
  shortTitle: string;
  description: string;
  examples: string[];
  accent: string;
  accentSoft: string;
  accentBorder: string;
  badgeBg: string;
}

export interface WeakSpot {
  key: string;
  category: ConcreteCategoryId;
  label: string;
  answer: string;
  tip: string;
  missCount: number;
  /** Consecutive correct answers in weak-spot drill; reaches 2 -> mastered & removed */
  masteryStreak: number;
  lastMissedAt: number;
  /** Snapshot of the full question so we can replay it directly in Weak Spots mode */
  questionSnapshot?: Question;
}

export interface CategoryProgress {
  solved: number;
  correct: number;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  secondsPracticed: number;
  questionsSolved: number;
  correctCount: number;
}

export interface StoredStats {
  /** Keyed by `${category}_${duration}` (and legacy `category` for 60s) */
  sprintRecords: Record<string, number>;
  daily: DailyProgress;
  /** Map of YYYY-MM-DD -> seconds practiced for the 7-day weekly calendar */
  dailyHistory: Record<string, number>;
  categoryStats: Record<ConcreteCategoryId, CategoryProgress>;
  streakDays: number;
  lastActiveDate: string | null;
  totalSolved: number;
  totalCorrect: number;
  weakSpots: Record<string, WeakSpot>;
  soundEnabled: boolean;
  answerStyle: AnswerStyle;
  autoSubmit: boolean;
  difficulty: Difficulty;
  sprintDuration: SprintDuration;
  theme: 'light' | 'dark';
  dismissedTip: boolean;
}

export interface SessionMistake {
  question: Question;
  userAnswer: string;
}

export interface SessionResult {
  category: CategoryId;
  mode: GameMode;
  answerStyle: AnswerStyle;
  difficulty: Difficulty;
  sprintDuration: SprintDuration;
  score: number;
  correctCount: number;
  wrongCount: number;
  maxStreak: number;
  durationSeconds: number;
  isNewRecord: boolean;
  previousRecord: number;
  mistakes: SessionMistake[];
  retriedMastered: number;
  /** Category breakdown for updating per-category mastery bars */
  categoryBreakdown: Record<ConcreteCategoryId, CategoryProgress>;
  /** Keys of weak spots answered right/wrong in this session */
  weakSpotHits: string[];
  weakSpotMisses: string[];
  clearedWeakSpots: number;
}
