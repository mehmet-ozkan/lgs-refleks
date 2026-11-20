import React from 'react';
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  Flame,
  Target,
  Clock,
  Repeat2,
  Sparkles,
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

  const uniqueMistakes = Array.from(
    new Map(result.mistakes.map((m) => [m.question.key, m])).values()
  );

  return (
    <div className="page-shell summary-shell fade-in">
      {celebrate && <ConfettiBurst />}

      <div className="summary-card">
        {result.isNewRecord && (
          <div className="record-banner pop-in">
            <Trophy size={18} />
            <span>
              YENİ {result.sprintDuration}sn REKORU!{' '}
              {result.previousRecord > 0
                ? `(Önceki: ${result.previousRecord})`
                : ''}
            </span>
          </div>
        )}

        {result.clearedWeakSpots > 0 && (
          <div className="cleared-banner pop-in">
            <Sparkles size={17} />
            <span>
              {result.clearedWeakSpots} zayıf nokta kalıcı olarak temizlendi!
            </span>
          </div>
        )}

        <div className="summary-head">
          <span
            className="cat-pill"
            style={{
              backgroundColor: catMeta.accentSoft,
              color: catMeta.accent,
            }}
          >
            {catMeta.title} ·{' '}
            {result.mode === 'sprint'
              ? `${result.sprintDuration}sn Sprint`
              : 'Serbest Pratik'}
          </span>

          <div className="summary-score-block">
            <span className="summary-score-num">{result.score}</span>
            <span className="summary-score-label">Doğru Cevap</span>
          </div>
        </div>

        <div className="summary-stats-grid">
          <div className="stat-box">
            <Target size={18} className="stat-icon stat-icon--emerald" />
            <strong>%{accuracy}</strong>
            <span>Doğruluk</span>
          </div>
          <div className="stat-box">
            <Flame size={18} className="stat-icon stat-icon--amber" />
            <strong>{result.maxStreak}</strong>
            <span>En Uzun Seri</span>
          </div>
          <div className="stat-box">
            <Clock size={18} className="stat-icon stat-icon--sky" />
            <strong>{avgSec} sn</strong>
            <span>Soru Başına</span>
          </div>
          <div className="stat-box">
            <Repeat2 size={18} className="stat-icon stat-icon--teal" />
            <strong>{result.retriedMastered}</strong>
            <span>Tekrarda Bildi</span>
          </div>
        </div>

        {/* Daily 10-min Goal Mini Bar */}
        <div className="summary-daily">
          <div className="summary-daily-row">
            <span>Günlük 10 dk Hedefi</span>
            <strong>%{dailyPct}</strong>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${dailyPct >= 100 ? 'progress-fill--done' : ''}`}
              style={{ width: `${dailyPct}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="summary-actions">
          <button className="btn-primary" onClick={onReplay}>
            <RotateCcw size={17} />
            <span>
              {result.mode === 'sprint' ? 'Tekrar Sprint At' : 'Yeni Pratik'}
            </span>
          </button>
          <button className="btn-secondary" onClick={onHome}>
            <Home size={17} />
            <span>Ana Menü</span>
          </button>
        </div>

        {/* Mistake Review */}
        {uniqueMistakes.length > 0 ? (
          <div className="summary-mistakes">
            <h3>Gözden Geçir ({uniqueMistakes.length})</h3>
            <div className="mistake-list">
              {uniqueMistakes.map((m) => (
                <div key={m.question.key} className="mistake-item">
                  <div className="mistake-q">
                    <MathDisplay parts={m.question.prompt.parts} size="sm" />
                  </div>
                  <div className="mistake-ans-row">
                    <span className="mistake-wrong">Senin: {m.userAnswer}</span>
                    <span className="mistake-right">
                      Doğru: {m.question.displayAnswer}
                    </span>
                  </div>
                  <p className="mistake-tip">{m.question.tip}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          total > 0 && (
            <div className="perfect-banner">
              <CheckCircle2 size={18} />
              <span>Hatasız seri! Harika refleks.</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
