import { Question } from '../types/game';

export interface QueuedMistake {
  question: Question;
  /** Number of new questions to serve before this mistake reappears */
  remainingGap: number;
}

/**
 * Adds a missed question to the spaced-repetition loop so it reappears
 * 2 to 4 questions later (never immediately back-to-back).
 */
export function enqueueMistake(
  queue: QueuedMistake[],
  question: Question
): QueuedMistake[] {
  const gap = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 questions later
  const filtered = queue.filter((item) => item.question.key !== question.key);
  return [
    ...filtered,
    {
      question: { ...question, isRetry: true },
      remainingGap: gap,
    },
  ];
}

/**
 * Advances all queued mistakes by 1 step and returns a ready retry question
 * if any item has reached remainingGap <= 0.
 */
export function pullDueMistake(queue: QueuedMistake[]): {
  dueQuestion: Question | null;
  nextQueue: QueuedMistake[];
} {
  if (queue.length === 0) {
    return { dueQuestion: null, nextQueue: queue };
  }

  const decremented = queue.map((item) => ({
    ...item,
    remainingGap: item.remainingGap - 1,
  }));

  const readyIndex = decremented.findIndex((item) => item.remainingGap <= 0);
  if (readyIndex === -1) {
    return { dueQuestion: null, nextQueue: decremented };
  }

  const dueQuestion = decremented[readyIndex].question;
  const nextQueue = decremented.filter((_, idx) => idx !== readyIndex);
  return { dueQuestion, nextQueue };
}
