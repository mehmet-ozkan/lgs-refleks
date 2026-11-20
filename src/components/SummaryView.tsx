import React, { useEffect } from 'react';
import {
  Trophy,
  RotateCcw,
  Home,
  Flame,
  Zap,
  Repeat2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { SessionResult, StoredStats } from '../types/game';
import { CATEGORIES } from '../engine/categories';
import { DAILY_GOAL_SECONDS } from '../utils/storage';
import { MathDisplay } from './MathDisplay';
import { ConfettiBurst } from './ConfettiBurst';

interface SummaryViewProps {
  result: SessionResult;
  stats: StoredStats;
  onReplay: () => void;
  onHome: () => void;
}

function getHeadline(
  result: SessionResult,
  accuracy: number
): { title: string; subtitle: string; tone: 'gold' | 'emerald' | 'cyan' | 'amber' } {
  if (result.isNewRecord) {
    return {
      title: 'Yeni Rekor Kırıldı!',
      subtitle:
        result.previousRecord > 0
          ? `Önceki ${result.previousRecord} rekorunu geride bıraktın.`
          : 'İlk rekorunu harika bir başlangıçla koydun.',
      tone: 'gold',
    };
  }
  if (result.wrongCount === 0 && result.correctCount >= 5) {
    return {
      title: 'Kusursuz Refleks!',
      subtitle: 'Tek bir hata bile yapmadan seriyi tamamladın.',
      tone: 'emerald',
    };
  }
  if (accuracy >= 85 && result.correctCount >= 5) {
    return {
      title: 'Harika Tempo!',
      subtitle: 'Hız ve isabet dengesi tam LGS seviyesinde.',
      tone: 'cyan',
    };
  }
  if (accuracy >= 65) {
    return {
      title: 'Güçlü Antrenman',
      subtitle: 'Takıldığın sayılar tekrar döngüsüne eklendi.',
      tone: 'cyan',
    };
  }
  return {
    title: 'İyi Isınma',
    subtitle: 'Aşağıdaki ipuçlarına göz atıp bir tur daha dene.',
    tone: 'amber',
  };
}

function formatMinutes(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins === 0) return `${rem} sn`;
  if (rem === 0) return `${mins} dk`;
  return `${mins} dk ${rem} sn`;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  result,
  stats,
  onReplay,
  onHome,
}) => {
  const total = result.correctCount + result.wrongCount;
  const accuracy = total > 0 ? Math.round((result.correctCount / total) * 100) : 0;
  const avgSec =
    total > 0 ? (result.durationSeconds / total).toFixed(1) : '0.0';
  const catMeta = CATEGORIES[result.category];
  const dailyPct = Math.min(
    100,
    Math.round((stats.daily.secondsPracticed / DAILY_GOAL_SECONDS) * 100)
  );
  const celebrate =
    result.isNewRecord ||
    result.clearedWeakSpots > 0 ||
    (result.wrongCount === 0 && result.correctCount >= 5);

  const headline = getHeadline(result, accuracy);

  const uniqueMistakes = Array.from(
    new Map(result.mistakes.map((m) => [m.question.key, m])).values()
  );

  // Keyboard Enter/Space to replay quickly on desktop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onReplay();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onHome();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onReplay, onHome]);

  // Glowing accuracy ring geometry
  const ringRadius = 74;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (accuracy / 100) * ringCircumference;

  const recordGap =
    result.mode === 'sprint' &&
    !result.isNewRecord &&
    result.previousRecord > 0
      ? result.previousRecord - result.score + 1
      : null;

  return (
    <div className="sum-shell fade-in">
      {celebrate && <ConfettiBurst />}

      {/* Ambient Soft-Glow Halo Behind Hero Score */}
      <div
        className={`sum-halo sum-halo--${headline.tone}`}
        aria-hidden="true"
      />

      <div className="sum-content">
        {/* Category & Mode Eyebrow */}
        <div className="sum-eyebrow">
          <span className="sum-cat-tag">
            {catMeta.title} ·{' '}
            {result.mode === 'sprint'
              ? `${result.sprintDuration}sn Sprint`
              : 'Serbest Pratik'}
          </span>
          {result.isNewRecord && (
            <span className="sum-record-chip pop-in">
              <Trophy size={12} />
              YENİ REKOR
            </span>
          )}
        </div>

        {/* Dynamic Headline */}
        <div className="sum-title-block">
          <h1 className="sum-title">{headline.title}</h1>
          <p className="sum-subtitle">{headline.subtitle}</p>
        </div>

        {/* Centerpiece: Luminous Accuracy Ring + Giant Score */}
        <div className="sum-ring-stage">
          <svg
            className="sum-ring-svg"
            width="184"
            height="184"
            viewBox="0 0 184 184"
          >
            <defs>
              <linearGradient
                id="sumRingGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={
                    headline.tone === 'gold'
                      ? '#fbbf24'
                      : headline.tone === 'amber'
                      ? '#f59e0b'
                      : '#22d3ee'
                  }
                />
                <stop
                  offset="100%"
                  stopColor={
                    headline.tone === 'gold'
                      ? '#f97316'
                      : headline.tone === 'amber'
                      ? '#fb7185'
                      : '#34d399'
                  }
                />
              </linearGradient>
            </defs>
            <circle
              className="sum-ring-track"
              cx="92"
              cy="92"
              r={ringRadius}
              strokeWidth="7"
              fill="none"
            />
            <circle
              className="sum-ring-fill"
              cx="92"
              cy="92"
              r={ringRadius}
              stroke="url(#sumRingGrad)"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 92 92)"
            />
          </svg>

          <div className="sum-ring-center">
            <span className="sum-score-num">{result.score}</span>
            <span className="sum-score-label">DOĞRU</span>
          </div>

          <span className="sum-acc-pill">%{accuracy} isabet</span>
        </div>

        {/* Record Chase / Weak Spot Cleared Banner */}
        {result.clearedWeakSpots > 0 && (
          <div className="cleared-banner pop-in">
            <Sparkles size={15} />
            <span>
              {result.clearedWeakSpots} zayıf nokta kalıcı olarak temizlendi!
            </span>
          </div>
        )}

        {recordGap !== null && recordGap > 0 && recordGap <= 5 && (
          <div className="sum-chase-note">
            <Trophy size={14} />
            <span>
              Rekorunu kırmaya sadece <strong>{recordGap} doğru</strong> kaldı!
            </span>
          </div>
        )}

        {/* Unified Editorial Glass Metrics Ribbon */}
        <div className="sum-ribbon">
          <div className="sum-metric">
            <div className="sum-metric-val">
              <Flame size={15} className="stat-icon--amber" />
              <span>{result.maxStreak}x</span>
            </div>
            <span className="sum-metric-lbl">En Uzun Seri</span>
          </div>

          <div className="sum-divider" aria-hidden="true" />

          <div className="sum-metric">
            <div className="sum-metric-val">
              <Zap size={15} className="stat-icon--sky" />
              <span>{avgSec}sn</span>
            </div>
            <span className="sum-metric-lbl">Soru Başına</span>
          </div>

          <div className="sum-divider" aria-hidden="true" />

          <div className="sum-metric">
            <div className="sum-metric-val">
              {result.wrongCount === 0 && total > 0 ? (
                <>
                  <CheckCircle2 size={15} className="stat-icon--emerald" />
                  <span>0 Hata</span>
                </>
              ) : (
                <>
                  <Repeat2 size={15} className="stat-icon--teal" />
                  <span>{result.retriedMastered}</span>
                </>
              )}
            </div>
            <span className="sum-metric-lbl">
              {result.wrongCount === 0 && total > 0
                ? 'Tertemiz'
                : 'Tekrarda Bildi'}
            </span>
          </div>
        </div>

        {/* Compact Daily 10-Min Goal Strip */}
        <div className="sum-daily-strip">
          <div className="sum-daily-row">
            <span>Günlük 10 dk Hedefi</span>
            <strong>
              {formatMinutes(stats.daily.secondsPracticed)} · %{dailyPct}
            </strong>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${dailyPct >= 100 ? 'progress-fill--done' : ''}`}
              style={{ width: `${dailyPct}%` }}
            />
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="sum-actions">
          <button className="btn-primary sum-btn-replay" onClick={onReplay}>
            <RotateCcw size={17} />
            <span>
              {result.mode === 'sprint' ? 'Tekrar Sprint At' : 'Yeni Pratik'}
            </span>
            <ArrowRight size={16} />
          </button>
          <button className="btn-secondary sum-btn-home" onClick={onHome}>
            <Home size={17} />
            <span>Ana Menü</span>
          </button>
        </div>

        {/* Sleek Mistake Flashcards (Only if mistakes occurred) */}
        {uniqueMistakes.length > 0 && (
          <section className="sum-mistakes">
            <div className="sum-mistakes-head">
              <h3>Gözden Geçir</h3>
              <span>{uniqueMistakes.length} soru</span>
            </div>

            <div className="sum-mistake-list">
              {uniqueMistakes.map((m) => (
                <div key={m.question.key} className="sum-mistake-card">
                  <div className="sum-mistake-top">
                    <div className="sum-mistake-expr">
                      <MathDisplay parts={m.question.prompt.parts} size="sm" />
                    </div>
                    <div className="sum-mistake-badges">
                      <span className="sum-badge-wrong">{m.userAnswer}</span>
                      <span className="sum-badge-arrow">→</span>
                      <span className="sum-badge-right">
                        {m.question.displayAnswer}
                      </span>
                    </div>
                  </div>
                  <p className="sum-mistake-tip">{m.question.tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
