import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Repeat2,
  Delete,
  CornerDownLeft,
  Check,
  X as XIcon,
  Flag,
  Pause,
  Play,
  Home,
  Gauge,
} from 'lucide-react';
import {
  AnswerStyle,
  CategoryId,
  CategoryProgress,
  ConcreteCategoryId,
  Difficulty,
  GameMode,
  Question,
  SessionMistake,
  SessionResult,
  SprintDuration,
  WeakSpot,
} from '../types/game';
import { CATEGORIES } from '../engine/categories';
import { generateQuestion, resolveInputKind } from '../engine/questions';
import {
  enqueueMistake,
  pullDueMistake,
  QueuedMistake,
} from '../engine/mistakeLoop';
import {
  playCorrectSound,
  playRecordSound,
  playTickSound,
  playWrongSound,
} from '../utils/sound';
import { hapticCorrect, hapticRecord, hapticWrong } from '../utils/haptics';
import { MathDisplay } from './MathDisplay';

interface PlayViewProps {
  category: CategoryId;
  mode: GameMode;
  answerStyle: AnswerStyle;
  autoSubmit: boolean;
  difficulty: Difficulty;
  sprintDuration: SprintDuration;
  previousRecord: number;
  soundEnabled: boolean;
  weakSpotPool: WeakSpot[];
  onToggleAutoSubmit: () => void;
  onFinish: (result: SessionResult) => void;
  onExit: () => void;
}

type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'correct'; streak: number; selectedId: string }
  | {
      kind: 'wrong';
      userAnswer: string;
      correctDisplay: string;
      tip: string;
    };

function getComboLabel(streak: number): string {
  if (streak >= 15) return 'LGS Makinesi!';
  if (streak >= 10) return 'Durdurulamaz!';
  if (streak >= 5) return 'Süper Seri!';
  if (streak >= 3) return 'Harika!';
  return 'Doğru';
}

export const PlayView: React.FC<PlayViewProps> = ({
  category,
  mode,
  answerStyle,
  autoSubmit,
  difficulty,
  sprintDuration,
  previousRecord,
  soundEnabled,
  weakSpotPool,
  onToggleAutoSubmit,
  onFinish,
  onExit,
}) => {
  const totalSprintMs = sprintDuration * 1000;

  const [countdown, setCountdown] = useState<number>(mode === 'sprint' ? 3 : 0);
  const [paused, setPaused] = useState(false);

  const [localWeakPool, setLocalWeakPool] = useState<WeakSpot[]>(weakSpotPool);
  const weakStreaksRef = useRef<Record<string, number>>(
    Object.fromEntries(weakSpotPool.map((w) => [w.key, w.masteryStreak ?? 0]))
  );
  const weakHitsRef = useRef<string[]>([]);
  const weakMissesRef = useRef<string[]>([]);
  const clearedWeakCountRef = useRef<number>(0);

  const [question, setQuestion] = useState<Question>(() =>
    generateQuestion(category, answerStyle, [], difficulty, weakSpotPool)
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [retriedMastered, setRetriedMastered] = useState(0);
  const [mistakeQueue, setMistakeQueue] = useState<QueuedMistake[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'idle' });
  const [justBeatRecord, setJustBeatRecord] = useState(false);

  // Numeric & Radical inputs
  const [numInput, setNumInput] = useState('');
  const [radA, setRadA] = useState('');
  const [radB, setRadB] = useState('');
  const [radFocus, setRadFocus] = useState<'a' | 'b'>('a');

  // 60fps smooth sprint timer (ms) + practice elapsed seconds
  const [timeLeftMs, setTimeLeftMs] = useState(totalSprintMs);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const lastTickSecondRef = useRef<number>(sprintDuration);

  const recentKeysRef = useRef<string[]>([question.key]);
  const mistakesLogRef = useRef<SessionMistake[]>([]);
  const breakdownRef = useRef<Record<ConcreteCategoryId, CategoryProgress>>({
    multiples: { solved: 0, correct: 0 },
    powers: { solved: 0, correct: 0 },
    'squares-roots': { solved: 0, correct: 0 },
    traps: { solved: 0, correct: 0 },
  });
  const advanceTimerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const statsRef = useRef({
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    maxStreak: 0,
    retriedMastered: 0,
    elapsedSeconds: 0,
    timeLeftMs: totalSprintMs,
  });

  statsRef.current = {
    score,
    correctCount,
    wrongCount,
    maxStreak,
    retriedMastered,
    elapsedSeconds,
    timeLeftMs,
  };

  const inputKind = resolveInputKind(question, answerStyle);
  const catMeta = CATEGORIES[question.category];
  const isActive = countdown === 0 && !paused;

  const finishSession = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    const s = statsRef.current;
    const elapsedSprintSec = Math.max(
      1,
      Math.round((totalSprintMs - Math.max(0, s.timeLeftMs)) / 1000)
    );
    const duration =
      mode === 'sprint' ? elapsedSprintSec : Math.max(1, s.elapsedSeconds);
    const isNewRecord =
      mode === 'sprint' && s.score > 0 && s.score > previousRecord;

    if (isNewRecord) {
      playRecordSound(soundEnabled);
      hapticRecord();
    }

    onFinish({
      category,
      mode,
      answerStyle,
      difficulty,
      sprintDuration,
      score: s.score,
      correctCount: s.correctCount,
      wrongCount: s.wrongCount,
      maxStreak: s.maxStreak,
      durationSeconds: mode === 'sprint' ? sprintDuration : duration,
      isNewRecord,
      previousRecord,
      mistakes: mistakesLogRef.current,
      retriedMastered: s.retriedMastered,
      categoryBreakdown: breakdownRef.current,
      weakSpotHits: weakHitsRef.current,
      weakSpotMisses: weakMissesRef.current,
      clearedWeakSpots: clearedWeakCountRef.current,
    });
  }, [
    answerStyle,
    category,
    difficulty,
    mode,
    onFinish,
    previousRecord,
    soundEnabled,
    sprintDuration,
    totalSprintMs,
  ]);

  useEffect(() => {
    if (countdown <= 0) return;
    playTickSound(soundEnabled);
    const t = window.setTimeout(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 650);
    return () => window.clearTimeout(t);
  }, [countdown, soundEnabled]);

  useEffect(() => {
    if (mode !== 'sprint' || !isActive || finishedRef.current) return;

    let lastFrame = performance.now();
    let rafId = 0;

    const loop = (now: number) => {
      if (finishedRef.current) return;
      const dt = Math.min(now - lastFrame, 120);
      lastFrame = now;

      setTimeLeftMs((prev) => {
        const next = Math.max(0, prev - dt);
        const secCeil = Math.ceil(next / 1000);
        if (
          secCeil < lastTickSecondRef.current &&
          secCeil <= 5 &&
          secCeil > 0
        ) {
          playTickSound(soundEnabled);
        }
        lastTickSecondRef.current = secCeil;

        if (next <= 0) {
          setTimeout(() => finishSession(), 0);
          return 0;
        }
        return next;
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [mode, isActive, soundEnabled, finishSession]);

  useEffect(() => {
    if (mode !== 'practice' || !isActive || finishedRef.current) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, isActive]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const loadNextQuestion = useCallback(
    (nextQueue: QueuedMistake[], nextWeakPool: WeakSpot[] = localWeakPool) => {
      if (category === 'weak-spots' && nextWeakPool.length === 0) {
        finishSession();
        return;
      }

      const { dueQuestion, nextQueue: afterPull } = pullDueMistake(nextQueue);
      setMistakeQueue(afterPull);

      let nextQ: Question;
      if (dueQuestion) {
        nextQ = dueQuestion;
      } else {
        nextQ = generateQuestion(
          category,
          answerStyle,
          recentKeysRef.current,
          difficulty,
          nextWeakPool
        );
      }

      recentKeysRef.current = [...recentKeysRef.current.slice(-6), nextQ.key];
      setQuestion(nextQ);
      setQuestionIndex((i) => i + 1);
      setFeedback({ kind: 'idle' });
      setNumInput('');
      setRadA('');
      setRadB('');
      setRadFocus('a');
    },
    [answerStyle, category, difficulty, finishSession, localWeakPool]
  );

  const submitAnswer = useCallback(
    (rawAnswer: string) => {
      if (feedback.kind !== 'idle' || finishedRef.current || !isActive) return;
      const trimmed = rawAnswer.trim();
      if (!trimmed) return;

      const isCorrect = trimmed === question.correctAnswer;

      const b = breakdownRef.current[question.category];
      b.solved += 1;
      if (isCorrect) b.correct += 1;

      if (isCorrect) {
        const nextScore = score + 1;
        const nextStreak = streak + 1;
        setScore(nextScore);
        setCorrectCount((c) => c + 1);
        setStreak(nextStreak);
        setMaxStreak((m) => Math.max(m, nextStreak));
        if (question.isRetry) {
          setRetriedMastered((r) => r + 1);
        }
        if (
          mode === 'sprint' &&
          previousRecord > 0 &&
          nextScore === previousRecord + 1
        ) {
          setJustBeatRecord(true);
        }

        let updatedWeakPool = localWeakPool;
        if (question.key in weakStreaksRef.current) {
          weakHitsRef.current.push(question.key);
          const nextWStreak = (weakStreaksRef.current[question.key] ?? 0) + 1;
          weakStreaksRef.current[question.key] = nextWStreak;
          if (nextWStreak >= 2) {
            clearedWeakCountRef.current += 1;
            updatedWeakPool = localWeakPool.filter(
              (w) => w.key !== question.key
            );
            setLocalWeakPool(updatedWeakPool);
          }
        }

        setFeedback({
          kind: 'correct',
          streak: nextStreak,
          selectedId: trimmed,
        });
        playCorrectSound(soundEnabled, nextStreak);
        hapticCorrect();

        const qSnapshot = mistakeQueue;
        advanceTimerRef.current = window.setTimeout(() => {
          loadNextQuestion(qSnapshot, updatedWeakPool);
        }, 250);
      } else {
        setWrongCount((w) => w + 1);
        setStreak(0);
        mistakesLogRef.current.push({ question, userAnswer: trimmed });

        if (question.key in weakStreaksRef.current) {
          weakMissesRef.current.push(question.key);
          weakStreaksRef.current[question.key] = 0;
        }

        const updatedQueue = enqueueMistake(mistakeQueue, question);
        setMistakeQueue(updatedQueue);

        setFeedback({
          kind: 'wrong',
          userAnswer: trimmed,
          correctDisplay: question.displayAnswer,
          tip: question.tip,
        });
        playWrongSound(soundEnabled);
        hapticWrong();

        advanceTimerRef.current = window.setTimeout(() => {
          loadNextQuestion(updatedQueue, localWeakPool);
        }, 1500);
      }
    },
    [
      feedback.kind,
      isActive,
      question,
      score,
      streak,
      mode,
      previousRecord,
      localWeakPool,
      soundEnabled,
      mistakeQueue,
      loadNextQuestion,
    ]
  );

  const skipWrongFeedback = useCallback(() => {
    if (feedback.kind !== 'wrong') return;
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    loadNextQuestion(mistakeQueue, localWeakPool);
  }, [feedback.kind, loadNextQuestion, mistakeQueue, localWeakPool]);

  const handleNumpadDigit = useCallback(
    (digit: string) => {
      if (!isActive) return;
      if (feedback.kind === 'wrong') {
        skipWrongFeedback();
        return;
      }
      if (feedback.kind !== 'idle') return;

      if (inputKind === 'number') {
        if (numInput.length >= 5) return;
        const nextVal = numInput + digit;
        setNumInput(nextVal);
        if (autoSubmit && nextVal === question.correctAnswer) {
          submitAnswer(nextVal);
        }
      } else if (inputKind === 'radical') {
        if (radFocus === 'a') {
          if (radA.length >= 2) return;
          const nextA = radA + digit;
          setRadA(nextA);
          if (
            autoSubmit &&
            question.radicalAnswer &&
            nextA === String(question.radicalAnswer[0])
          ) {
            if (radB === String(question.radicalAnswer[1])) {
              submitAnswer(`${nextA}√${radB}`);
            } else {
              setRadFocus('b');
            }
          }
        } else {
          if (radB.length >= 2) return;
          const nextB = radB + digit;
          setRadB(nextB);
          if (
            autoSubmit &&
            radA.length > 0 &&
            `${radA}√${nextB}` === question.correctAnswer
          ) {
            submitAnswer(`${radA}√${nextB}`);
          }
        }
      }
    },
    [
      isActive,
      feedback.kind,
      inputKind,
      numInput,
      radFocus,
      radA,
      radB,
      autoSubmit,
      question.correctAnswer,
      question.radicalAnswer,
      skipWrongFeedback,
      submitAnswer,
    ]
  );

  const handleNumpadBackspace = useCallback(() => {
    if (feedback.kind !== 'idle' || !isActive) return;
    if (inputKind === 'number') {
      setNumInput((prev) => prev.slice(0, -1));
    } else if (inputKind === 'radical') {
      if (radFocus === 'b') {
        if (radB.length > 0) {
          setRadB((prev) => prev.slice(0, -1));
        } else {
          setRadFocus('a');
        }
      } else {
        setRadA((prev) => prev.slice(0, -1));
      }
    }
  }, [feedback.kind, isActive, inputKind, radFocus, radB.length]);

  const handleInputSubmit = useCallback(() => {
    if (!isActive) return;
    if (feedback.kind === 'wrong') {
      skipWrongFeedback();
      return;
    }
    if (feedback.kind !== 'idle') return;

    if (inputKind === 'number') {
      if (numInput.length > 0) submitAnswer(numInput);
    } else if (inputKind === 'radical') {
      if (radA.length > 0 && radB.length > 0) {
        submitAnswer(`${radA}√${radB}`);
      } else if (radA.length > 0 && radFocus === 'a') {
        setRadFocus('b');
      }
    }
  }, [
    isActive,
    feedback.kind,
    inputKind,
    numInput,
    radA,
    radB,
    radFocus,
    skipWrongFeedback,
    submitAnswer,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (countdown > 0) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setCountdown(0);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }

      if (paused) return;

      if (feedback.kind === 'wrong') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skipWrongFeedback();
        }
        return;
      }

      if (feedback.kind !== 'idle') return;

      if (inputKind === 'choice') {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < question.options.length) {
          e.preventDefault();
          submitAnswer(question.options[idx].id);
        }
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleNumpadDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumpadBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInputSubmit();
      } else if (
        inputKind === 'radical' &&
        (e.key === 'Tab' ||
          e.key === ' ' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowLeft')
      ) {
        e.preventDefault();
        setRadFocus((prev) => (prev === 'a' ? 'b' : 'a'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    countdown,
    paused,
    feedback.kind,
    inputKind,
    question.options,
    handleNumpadDigit,
    handleNumpadBackspace,
    handleInputSubmit,
    skipWrongFeedback,
    submitAnswer,
  ]);

  const timeLeftSec = Math.ceil(timeLeftMs / 1000);
  const timerPct = mode === 'sprint' ? (timeLeftMs / totalSprintMs) * 100 : 100;
  const timerState =
    mode === 'sprint'
      ? timerPct < 20
        ? 'danger'
        : timerPct < 35
        ? 'warn'
        : 'normal'
      : 'normal';

  const finalTenGlow = mode === 'sprint' && isActive && timeLeftMs <= 10000;
  const comboTier = streak >= 10 ? 'mega' : streak >= 5 ? 'hot' : 'warm';
  const toRecord =
    mode === 'sprint' && previousRecord > 0 ? previousRecord - score + 1 : null;

  // Dynamic Streak-Reactive Ambient Halo (0-4: calm ocean blue, 5-9: ice cyan, 10+: vivid emerald)
  const haloClass =
    feedback.kind === 'correct'
      ? 'play-halo--correct'
      : feedback.kind === 'wrong'
      ? 'play-halo--wrong'
      : streak >= 10
      ? 'play-halo--emerald'
      : streak >= 5
      ? 'play-halo--cyan'
      : 'play-halo--calm';

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`play-shell ${finalTenGlow ? 'play-shell--urgent' : ''}`}>
      {/* Dynamic Streak-Reactive Soft Radial Halo */}
      <div className={`play-halo ${haloClass}`} aria-hidden="true" />

      {/* 3-2-1 Countdown Overlay */}
      {countdown > 0 && (
        <div
          className="overlay-backdrop"
          onClick={() => setCountdown(0)}
          role="button"
          tabIndex={0}
        >
          <div className="countdown-box">
            <span className="countdown-label">
              {CATEGORIES[category].title} · {sprintDuration}sn
            </span>
            <span key={countdown} className="countdown-num pop-in">
              {countdown}
            </span>
            <span className="countdown-hint">Hemen başlamak için dokun</span>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {paused && (
        <div className="overlay-backdrop">
          <div className="pause-card pop-in">
            <h2>Duraklatıldı</h2>
            <p>Süre durduruldu. Hazır olduğunda devam edebilirsin.</p>
            <div className="pause-actions">
              <button
                className="btn-primary"
                onClick={() => setPaused(false)}
              >
                <Play size={17} />
                <span>Devam Et</span>
              </button>
              <button className="btn-secondary" onClick={onExit}>
                <Home size={17} />
                <span>Ana Menü</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Glowing 60fps Progress Bar (Mockup Style) */}
      <div className="play-top-chrome">
        {mode === 'sprint' && (
          <div className="sprint-bar-track">
            <div
              className={`sprint-bar-fill sprint-bar-fill--${timerState}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        )}

        {/* Whisper-Quiet Minimal HUD */}
        <header className="play-hud">
          <div className="hud-left-btns">
            <button className="glass-icon-btn" onClick={onExit} aria-label="Çık">
              <ArrowLeft size={17} />
            </button>
            <button
              className="glass-icon-btn"
              onClick={() => setPaused(true)}
              aria-label="Duraklat"
              title="Duraklat (Esc)"
            >
              <Pause size={15} />
            </button>
          </div>

          <div className="hud-center">
            <div className={`timer-badge timer-badge--${timerState}`}>
              {mode === 'sprint' ? `${timeLeftSec}s` : formatClock(elapsedSeconds)}
            </div>

            <div className="hud-score">
              <span className="hud-score-num">{score}</span>
              {mode === 'sprint' && previousRecord > 0 && (
                <span
                  className={`hud-record ${
                    score > previousRecord ? 'hud-record--beaten' : ''
                  }`}
                >
                  <Trophy size={11} />
                  {Math.max(previousRecord, score)}
                </span>
              )}
            </div>

            {streak >= 2 && (
              <div className={`combo-pill combo-pill--${comboTier}`}>
                <Flame size={12} />
                <span>{streak}x</span>
              </div>
            )}

            {mistakeQueue.length > 0 && (
              <div
                className="retry-queue-pill"
                title={`${mistakeQueue.length} yanlış soru birkaç soru sonra tekrar gelecek`}
              >
                <Repeat2 size={12} />
                <span>{mistakeQueue.length}</span>
              </div>
            )}
          </div>

          {mode === 'practice' ? (
            <button className="finish-btn" onClick={finishSession}>
              <Flag size={13} />
              <span>Bitir</span>
            </button>
          ) : (
            <div className="hud-spacer">
              {justBeatRecord ? (
                <span className="live-record-badge">🏆 REKOR</span>
              ) : toRecord !== null && toRecord > 0 && toRecord <= 3 ? (
                <span className="live-chase-badge">-{toRecord}</span>
              ) : null}
            </div>
          )}
        </header>
      </div>

      {/* Center Frameless Floating Math Stage */}
      <main className="play-stage">
        <div
          key={questionIndex}
          className={`floating-stage q-enter ${
            feedback.kind === 'wrong' ? 'floating-stage--shake' : ''
          }`}
          onClick={feedback.kind === 'wrong' ? skipWrongFeedback : undefined}
        >
          <div className="floating-meta">
            <span className="floating-cat-label">
              {catMeta.shortTitle} · {question.prompt.label}
            </span>
            {category === 'weak-spots' ? (
              <span className="retry-badge">Kalan: {localWeakPool.length}</span>
            ) : question.isRetry ? (
              <span className="retry-badge">
                <Repeat2 size={11} />
                Tekrar
              </span>
            ) : null}
          </div>

          <div className="floating-math-wrap">
            <MathDisplay parts={question.prompt.parts} size="lg" />
          </div>

          {/* Subtle Floating Feedback Slot */}
          <div className="feedback-slot">
            {feedback.kind === 'correct' && (
              <div className="feedback-pill--correct pop-in">
                <Check size={14} strokeWidth={3} />
                <span>{getComboLabel(feedback.streak)} +1</span>
              </div>
            )}

            {feedback.kind === 'wrong' && (
              <div className="feedback-wrong-box pop-in">
                <div className="feedback-wrong-head">
                  <XIcon size={14} strokeWidth={3} />
                  <span>
                    Doğrusu: <strong>{feedback.correctDisplay}</strong>
                  </span>
                  <span className="feedback-tap-hint">dokun →</span>
                </div>
                <p className="feedback-tip">{feedback.tip}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Thumb-Zone: Frosted Glass Choice Grid or Numpad */}
        <div className="answer-area">
          {inputKind === 'choice' && (
            <div
              className={`choice-grid ${
                question.options.length === 2 ? 'choice-grid--two' : ''
              }`}
            >
              {question.options.map((opt, idx) => {
                const isSelectedCorrect =
                  feedback.kind === 'correct' && feedback.selectedId === opt.id;
                const isSelectedWrong =
                  feedback.kind === 'wrong' && feedback.userAnswer === opt.id;
                const isRevealedCorrect =
                  feedback.kind === 'wrong' && opt.id === question.correctAnswer;

                return (
                  <button
                    key={opt.id}
                    className={`choice-btn ${
                      isSelectedCorrect || isRevealedCorrect
                        ? 'choice-btn--correct'
                        : ''
                    } ${isSelectedWrong ? 'choice-btn--wrong' : ''}`}
                    onClick={() => submitAnswer(opt.id)}
                    disabled={feedback.kind !== 'idle' || !isActive}
                  >
                    <span className="choice-key">{idx + 1}</span>
                    <span className="choice-label">
                      {opt.parts ? (
                        <MathDisplay parts={opt.parts} size="md" />
                      ) : (
                        opt.label
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {inputKind === 'number' && (
            <div className="input-panel">
              <div className="input-display-row">
                <div
                  className={`input-display ${
                    feedback.kind === 'correct'
                      ? 'input-display--correct'
                      : feedback.kind === 'wrong'
                      ? 'input-display--wrong'
                      : numInput
                      ? 'input-display--filled'
                      : ''
                  }`}
                >
                  {numInput || (
                    <span className="input-placeholder">Cevabı yaz...</span>
                  )}
                  <button
                    type="button"
                    className={`auto-chip ${autoSubmit ? 'auto-chip--on' : ''}`}
                    onClick={onToggleAutoSubmit}
                    title="Doğru rakamlar yazılınca otomatik onaylar"
                  >
                    <Gauge size={12} />
                    <span>Oto</span>
                  </button>
                </div>
              </div>

              <div className="numpad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    className="num-key"
                    onClick={() => handleNumpadDigit(d)}
                  >
                    {d}
                  </button>
                ))}
                <button
                  className="num-key num-key--util"
                  onClick={handleNumpadBackspace}
                  aria-label="Sil"
                >
                  <Delete size={20} />
                </button>
                <button
                  className="num-key"
                  onClick={() => handleNumpadDigit('0')}
                >
                  0
                </button>
                <button
                  className="num-key num-key--submit"
                  onClick={handleInputSubmit}
                  disabled={!numInput && feedback.kind === 'idle'}
                  aria-label="Gönder"
                >
                  <CornerDownLeft size={20} />
                </button>
              </div>
            </div>
          )}

          {inputKind === 'radical' && (
            <div className="input-panel">
              <div className="radical-input-row">
                <button
                  type="button"
                  className={`rad-slot ${
                    radFocus === 'a' ? 'rad-slot--active' : ''
                  }`}
                  onClick={() => setRadFocus('a')}
                >
                  {radA || <span className="input-placeholder">a</span>}
                </button>
                <span className="rad-symbol">√</span>
                <button
                  type="button"
                  className={`rad-slot ${
                    radFocus === 'b' ? 'rad-slot--active' : ''
                  }`}
                  onClick={() => setRadFocus('b')}
                >
                  {radB || <span className="input-placeholder">b</span>}
                </button>
              </div>

              <div className="numpad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    className="num-key"
                    onClick={() => handleNumpadDigit(d)}
                  >
                    {d}
                  </button>
                ))}
                <button
                  className="num-key num-key--util"
                  onClick={handleNumpadBackspace}
                  aria-label="Sil"
                >
                  <Delete size={20} />
                </button>
                <button
                  className="num-key"
                  onClick={() => handleNumpadDigit('0')}
                >
                  0
                </button>
                <button
                  className="num-key num-key--submit"
                  onClick={handleInputSubmit}
                  aria-label="Gönder"
                >
                  <CornerDownLeft size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
