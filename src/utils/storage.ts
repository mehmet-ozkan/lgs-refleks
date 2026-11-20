import {
  AnswerStyle,
  CategoryId,
  ConcreteCategoryId,
  Difficulty,
  Question,
  SessionResult,
  SprintDuration,
  StoredStats,
  WeakSpot,
} from '../types/game';

const STORAGE_KEY = 'lgs-refleks-stats-v1';

export const DAILY_GOAL_SECONDS = 600; // 10 minutes

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateKey(d);
}

export function getRecordKey(
  category: CategoryId,
  duration: SprintDuration
): string {
  return duration === 60 ? category : `${category}_${duration}`;
}

export function getSprintRecord(
  stats: StoredStats,
  category: CategoryId,
  duration: SprintDuration
): number {
  const key = getRecordKey(category, duration);
  return stats.sprintRecords[key] ?? 0;
}

export interface WeekDayStatus {
  dateKey: string;
  label: string;
  seconds: number;
  isToday: boolean;
  isFuture: boolean;
  goalReached: boolean;
}

const WEEK_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function getCurrentWeekStatus(stats: StoredStats): WeekDayStatus[] {
  const now = new Date();
  const todayKey = formatDateKey(now);
  // Monday-based offset (Mon=0 .. Sun=6)
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);

  return WEEK_LABELS.map((label, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateKey = formatDateKey(d);
    const seconds =
      dateKey === todayKey
        ? Math.max(stats.daily.secondsPracticed, stats.dailyHistory[dateKey] ?? 0)
        : stats.dailyHistory[dateKey] ?? 0;

    return {
      dateKey,
      label,
      seconds,
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
      goalReached: seconds >= DAILY_GOAL_SECONDS,
    };
  });
}

function createDefaultStats(): StoredStats {
  return {
    sprintRecords: {
      mixed: 0,
      multiples: 0,
      powers: 0,
      'squares-roots': 0,
      traps: 0,
    },
    daily: {
      date: getTodayKey(),
      secondsPracticed: 0,
      questionsSolved: 0,
      correctCount: 0,
    },
    dailyHistory: {},
    categoryStats: {
      multiples: { solved: 0, correct: 0 },
      powers: { solved: 0, correct: 0 },
      'squares-roots': { solved: 0, correct: 0 },
      traps: { solved: 0, correct: 0 },
    },
    streakDays: 0,
    lastActiveDate: null,
    totalSolved: 0,
    totalCorrect: 0,
    weakSpots: {},
    soundEnabled: true,
    answerStyle: 'hybrid',
    autoSubmit: true,
    difficulty: 'standard',
    sprintDuration: 60,
    theme: 'dark',
    dismissedTip: false,
  };
}

export function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultStats();
    const parsed = JSON.parse(raw) as Partial<StoredStats>;
    const defaults = createDefaultStats();
    const today = getTodayKey();

    const daily =
      parsed.daily && parsed.daily.date === today
        ? parsed.daily
        : defaults.daily;

    let streakDays = parsed.streakDays ?? 0;
    if (
      parsed.lastActiveDate &&
      parsed.lastActiveDate !== today &&
      parsed.lastActiveDate !== getYesterdayKey()
    ) {
      streakDays = 0;
    }

    const categoryStats = {
      multiples: parsed.categoryStats?.multiples ?? { solved: 0, correct: 0 },
      powers: parsed.categoryStats?.powers ?? { solved: 0, correct: 0 },
      'squares-roots': parsed.categoryStats?.['squares-roots'] ?? {
        solved: 0,
        correct: 0,
      },
      traps: parsed.categoryStats?.traps ?? { solved: 0, correct: 0 },
    };

    const migratedKey = 'lgs-refleks-dark-v2';
    let theme = parsed.theme ?? 'dark';
    if (!localStorage.getItem(migratedKey)) {
      theme = 'dark';
      localStorage.setItem(migratedKey, '1');
    }

    return {
      ...defaults,
      ...parsed,
      theme,
      sprintRecords: {
        ...defaults.sprintRecords,
        ...(parsed.sprintRecords ?? {}),
      },
      daily,
      dailyHistory: parsed.dailyHistory ?? {},
      categoryStats,
      streakDays,
      weakSpots: parsed.weakSpots ?? {},
    };
  } catch {
    return createDefaultStats();
  }
}

export function saveStats(stats: StoredStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore quota errors
  }
}

function promptSummary(q: Question): string {
  return q.prompt.parts
    .map((p) => {
      switch (p.type) {
        case 'text':
        case 'highlight':
          return p.value;
        case 'power':
          return `${p.base}^${p.exp}`;
        case 'sqrt':
          return `√${p.value}`;
        case 'radical':
          return `${p.coeff}√${p.radicand}`;
        case 'blank':
          return p.text ?? '?';
      }
    })
    .join('');
}

export function recordSessionToStats(
  prev: StoredStats,
  result: SessionResult
): StoredStats {
  const today = getTodayKey();
  const isNewDay = prev.lastActiveDate !== today;

  let nextStreak = prev.streakDays;
  if (result.correctCount + result.wrongCount > 0) {
    if (isNewDay) {
      nextStreak =
        prev.lastActiveDate === getYesterdayKey() ? prev.streakDays + 1 : 1;
    }
  }

  const nextRecords: Record<string, number> = { ...prev.sprintRecords };
  if (result.mode === 'sprint') {
    const rKey = getRecordKey(result.category, result.sprintDuration);
    if (result.score > (nextRecords[rKey] ?? 0)) {
      nextRecords[rKey] = result.score;
    }
  }

  // Update per-category mastery stats
  const nextCategoryStats = { ...prev.categoryStats };
  (Object.keys(result.categoryBreakdown) as ConcreteCategoryId[]).forEach(
    (cat) => {
      const add = result.categoryBreakdown[cat];
      if (add && add.solved > 0) {
        nextCategoryStats[cat] = {
          solved: (nextCategoryStats[cat]?.solved ?? 0) + add.solved,
          correct: (nextCategoryStats[cat]?.correct ?? 0) + add.correct,
        };
      }
    }
  );

  // Update weak spots (add new mistakes, increment mastery streak on hits, remove at 2)
  const nextWeakSpots: Record<string, WeakSpot> = { ...prev.weakSpots };

  for (const m of result.mistakes) {
    const existing = nextWeakSpots[m.question.key];
    nextWeakSpots[m.question.key] = {
      key: m.question.key,
      category: m.question.category,
      label: promptSummary(m.question),
      answer: m.question.displayAnswer,
      tip: m.question.tip,
      missCount: (existing?.missCount ?? 0) + 1,
      masteryStreak: 0,
      lastMissedAt: Date.now(),
      questionSnapshot: { ...m.question, isRetry: false },
    };
  }

  for (const hitKey of result.weakSpotHits) {
    const ws = nextWeakSpots[hitKey];
    if (!ws) continue;
    const nextMastery = (ws.masteryStreak ?? 0) + 1;
    if (nextMastery >= 2) {
      delete nextWeakSpots[hitKey];
    } else {
      nextWeakSpots[hitKey] = { ...ws, masteryStreak: nextMastery };
    }
  }

  for (const missKey of result.weakSpotMisses) {
    const ws = nextWeakSpots[missKey];
    if (ws) {
      nextWeakSpots[missKey] = { ...ws, masteryStreak: 0 };
    }
  }

  const baseDaily =
    prev.daily.date === today
      ? prev.daily
      : { date: today, secondsPracticed: 0, questionsSolved: 0, correctCount: 0 };

  const newSecondsToday = baseDaily.secondsPracticed + result.durationSeconds;
  const nextHistory = {
    ...prev.dailyHistory,
    [today]: newSecondsToday,
  };

  const updated: StoredStats = {
    ...prev,
    sprintRecords: nextRecords,
    daily: {
      date: today,
      secondsPracticed: newSecondsToday,
      questionsSolved:
        baseDaily.questionsSolved + result.correctCount + result.wrongCount,
      correctCount: baseDaily.correctCount + result.correctCount,
    },
    dailyHistory: nextHistory,
    categoryStats: nextCategoryStats,
    streakDays: nextStreak,
    lastActiveDate:
      result.correctCount + result.wrongCount > 0 ? today : prev.lastActiveDate,
    totalSolved: prev.totalSolved + result.correctCount + result.wrongCount,
    totalCorrect: prev.totalCorrect + result.correctCount,
    weakSpots: nextWeakSpots,
  };

  saveStats(updated);
  return updated;
}

export function removeWeakSpot(prev: StoredStats, key: string): StoredStats {
  const nextWeakSpots = { ...prev.weakSpots };
  delete nextWeakSpots[key];
  const updated = { ...prev, weakSpots: nextWeakSpots };
  saveStats(updated);
  return updated;
}

export function updatePreferences(
  prev: StoredStats,
  patch: Partial<{
    soundEnabled: boolean;
    answerStyle: AnswerStyle;
    autoSubmit: boolean;
    difficulty: Difficulty;
    sprintDuration: SprintDuration;
    theme: 'light' | 'dark';
    dismissedTip: boolean;
  }>
): StoredStats {
  const updated = { ...prev, ...patch };
  saveStats(updated);
  return updated;
}
