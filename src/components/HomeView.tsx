import React from 'react';
import {
  Zap,
  Infinity as InfinityIcon,
  Trophy,
  Flame,
  BookOpen,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sparkles,
  Grid2x2,
  Keyboard,
  Shuffle,
  Trash2,
  Layers,
  Radical,
  ShieldAlert,
  ArrowRight,
  Moon,
  Sun,
  Check,
  Target,
  Lightbulb,
  X,
  Gauge,
} from 'lucide-react';
import {
  AnswerStyle,
  CategoryId,
  ConcreteCategoryId,
  Difficulty,
  GameMode,
  SprintDuration,
  StoredStats,
} from '../types/game';
import { CATEGORIES, CONCRETE_CATEGORIES } from '../engine/categories';
import {
  DAILY_GOAL_SECONDS,
  getCurrentWeekStatus,
  getSprintRecord,
} from '../utils/storage';

interface HomeViewProps {
  stats: StoredStats;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onSelectAnswerStyle: (style: AnswerStyle) => void;
  onSelectDifficulty: (diff: Difficulty) => void;
  onSelectDuration: (dur: SprintDuration) => void;
  onToggleAutoSubmit: () => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onDismissTip: () => void;
  onStartGame: (category: CategoryId, overrideMode?: GameMode) => void;
  onOpenReference: () => void;
  onDismissWeakSpot: (key: string) => void;
}

const CATEGORY_ICONS: Record<ConcreteCategoryId, React.ReactNode> = {
  multiples: <Layers size={18} strokeWidth={2.3} />,
  powers: <Zap size={18} strokeWidth={2.3} />,
  'squares-roots': <Radical size={18} strokeWidth={2.3} />,
  traps: <ShieldAlert size={18} strokeWidth={2.3} />,
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  warmup: 'Isınma',
  standard: 'LGS',
  master: 'Usta',
};

function formatMinutes(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins === 0) return `${rem} sn`;
  if (rem === 0) return `${mins} dk`;
  return `${mins} dk ${rem} sn`;
}

export const HomeView: React.FC<HomeViewProps> = ({
  stats,
  selectedMode,
  onSelectMode,
  onSelectAnswerStyle,
  onSelectDifficulty,
  onSelectDuration,
  onToggleAutoSubmit,
  onToggleSound,
  onToggleTheme,
  onDismissTip,
  onStartGame,
  onOpenReference,
  onDismissWeakSpot,
}) => {
  const dailyPct = Math.min(
    100,
    Math.round((stats.daily.secondsPracticed / DAILY_GOAL_SECONDS) * 100)
  );
  const dailyReached = stats.daily.secondsPracticed >= DAILY_GOAL_SECONDS;
  const todayAcc =
    stats.daily.questionsSolved > 0
      ? Math.round((stats.daily.correctCount / stats.daily.questionsSolved) * 100)
      : null;

  const weekDays = getCurrentWeekStatus(stats);

  const allWeakSpots = Object.values(stats.weakSpots).sort(
    (a, b) => b.missCount - a.missCount || b.lastMissedAt - a.lastMissedAt
  );
  const playableWeakCount = allWeakSpots.filter((w) => w.questionSnapshot).length;
  const visibleWeakSpots = allWeakSpots.slice(0, 6);

  const mixedMeta = CATEGORIES.mixed;
  const mixedRecord = getSprintRecord(stats, 'mixed', stats.sprintDuration);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (dailyPct / 100) * circumference;

  return (
    <div className="page-shell fade-in">
      <header className="top-bar">
        <div className="brand">
          <div className="brand-logo">
            <Zap size={20} strokeWidth={2.6} />
          </div>
          <div>
            <h1 className="brand-title">LGS Refleks</h1>
            <p className="brand-sub">Günde 10 dk matematik hız antrenmanı</p>
          </div>
        </div>

        <div className="top-actions">
          <button
            className="pill-btn"
            onClick={onOpenReference}
            title="Hızlı Refleks Kartı"
          >
            <BookOpen size={15} />
            <span className="pill-btn-text">Refleks Kartı</span>
          </button>
          <button
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={stats.theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
            title={stats.theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
          >
            {stats.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="icon-btn"
            onClick={onToggleSound}
            aria-label={stats.soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
            title={stats.soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
          >
            {stats.soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </header>

      {/* Daily 10-min Goal + 7-Day Mini Calendar */}
      <section className="daily-card">
        <div className="daily-header-row">
          <div className="daily-left">
            <div className="ring-wrap" aria-label={`Günlük hedef %${dailyPct}`}>
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle
                  className="ring-track"
                  cx="27"
                  cy="27"
                  r={radius}
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  className={`ring-fill ${dailyReached ? 'ring-fill--done' : ''}`}
                  cx="27"
                  cy="27"
                  r={radius}
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 27 27)"
                />
              </svg>
              <span className="ring-text">%{dailyPct}</span>
            </div>

            <div className="daily-info">
              <span className="daily-label">
                {dailyReached ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald" />
                    Günlük 10 dk hedefi tamam!
                  </>
                ) : (
                  <>Günlük 10 dk Hedefi</>
                )}
              </span>
              <span className="daily-progress-text">
                {formatMinutes(stats.daily.secondsPracticed)} / 10 dk
                {stats.daily.questionsSolved > 0 && (
                  <> · {stats.daily.questionsSolved} soru</>
                )}
                {todayAcc !== null && <> · %{todayAcc} isabet</>}
              </span>
            </div>
          </div>

          <div className="streak-pill" title="Günlük seri">
            <Flame size={15} />
            <span>{stats.streakDays} gün</span>
          </div>
        </div>

        {/* 7-Day Weekly Calendar Strip */}
        <div className="week-strip" aria-label="Haftalık çalışma takvimi">
          {weekDays.map((day) => {
            const hasActivity = day.seconds > 0 && !day.goalReached;
            return (
              <div
                key={day.dateKey}
                className={`week-day ${day.isToday ? 'week-day--today' : ''}`}
                title={`${day.label}: ${formatMinutes(day.seconds)}`}
              >
                <span className="week-day-label">{day.label}</span>
                <span
                  className={`week-dot ${
                    day.goalReached
                      ? 'week-dot--done'
                      : hasActivity
                      ? 'week-dot--partial'
                      : ''
                  }`}
                >
                  {day.goalReached && <Check size={11} strokeWidth={3} />}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* One-time Quick Tip */}
      {!stats.dismissedTip && (
        <div className="tip-banner">
          <Lightbulb size={16} className="tip-icon" />
          <p className="tip-text">
            <strong>Hız İpucu:</strong> <strong>Oto Onay</strong> açıkken doğru
            rakamları yazdığın anda soru otomatik geçer. Masaüstünde{' '}
            <code>1–4</code> ve <code>0–9</code> tuşlarıyla ışık hızında
            çözebilirsin.
          </p>
          <button
            className="tip-close"
            onClick={onDismissTip}
            aria-label="İpucunu kapat"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Controls: Mode, Duration, Difficulty, Answer Style & Auto-Submit */}
      <section className="controls-stack">
        <div className="controls-row">
          <div className="segmented" role="group" aria-label="Oyun modu">
            <button
              className={`seg-btn ${selectedMode === 'sprint' ? 'seg-btn--active' : ''}`}
              onClick={() => onSelectMode('sprint')}
            >
              <Zap size={14} />
              <span>Sprint</span>
            </button>
            <button
              className={`seg-btn ${selectedMode === 'practice' ? 'seg-btn--active' : ''}`}
              onClick={() => onSelectMode('practice')}
            >
              <InfinityIcon size={14} />
              <span>Pratik</span>
            </button>
          </div>

          {selectedMode === 'sprint' && (
            <div className="segmented" role="group" aria-label="Sprint süresi">
              {([30, 60, 90] as SprintDuration[]).map((dur) => (
                <button
                  key={dur}
                  className={`seg-btn seg-btn--compact ${
                    stats.sprintDuration === dur ? 'seg-btn--active' : ''
                  }`}
                  onClick={() => onSelectDuration(dur)}
                >
                  {dur}sn
                </button>
              ))}
            </div>
          )}

          <div className="segmented" role="group" aria-label="Zorluk seviyesi">
            {(['warmup', 'standard', 'master'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`seg-btn seg-btn--compact ${
                  stats.difficulty === d ? 'seg-btn--active' : ''
                }`}
                onClick={() => onSelectDifficulty(d)}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="controls-row">
          <div className="segmented" role="group" aria-label="Cevaplama tarzı">
            <button
              className={`seg-btn ${stats.answerStyle === 'hybrid' ? 'seg-btn--active' : ''}`}
              onClick={() => onSelectAnswerStyle('hybrid')}
              title="Kategoriye göre en hızlı yöntem (yazmalı + 4 şıklı)"
            >
              <Sparkles size={14} />
              <span>Hibrit</span>
            </button>
            <button
              className={`seg-btn ${stats.answerStyle === 'choice' ? 'seg-btn--active' : ''}`}
              onClick={() => onSelectAnswerStyle('choice')}
              title="Tüm sorular 4 şıklı"
            >
              <Grid2x2 size={14} />
              <span>4 Şıklı</span>
            </button>
            <button
              className={`seg-btn ${stats.answerStyle === 'input' ? 'seg-btn--active' : ''}`}
              onClick={() => onSelectAnswerStyle('input')}
              title="Klavye / tuş takımı ile direkt yazmalı"
            >
              <Keyboard size={14} />
              <span>Yazmalı</span>
            </button>
          </div>

          {stats.answerStyle !== 'choice' && (
            <button
              className={`toggle-pill ${stats.autoSubmit ? 'toggle-pill--on' : ''}`}
              onClick={onToggleAutoSubmit}
              title="Doğru cevap yazıldığı anda Enter'a basmadan otomatik onaylar"
            >
              <Gauge size={14} />
              <span>Oto Onay: {stats.autoSubmit ? 'Açık' : 'Kapalı'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Hero Mixed Sprint Card */}
      <section className="hero-section">
        <button className="hero-card" onClick={() => onStartGame('mixed')}>
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-left">
            <div className="hero-badge">
              <Shuffle size={13} />
              <span>
                Önerilen Günlük Egzersiz · {DIFFICULTY_LABELS[stats.difficulty]}
              </span>
            </div>
            <h2 className="hero-title">{mixedMeta.title}</h2>
            <p className="hero-desc">{mixedMeta.description}</p>
            <div className="chip-row">
              {mixedMeta.examples.map((ex) => (
                <span key={ex} className="hero-chip">
                  {ex}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <div className="record-pill record-pill--hero">
              <Trophy size={14} />
              <span>
                {stats.sprintDuration}sn Rekor: <strong>{mixedRecord}</strong>
              </span>
            </div>
            <span className="hero-cta">
              <span>
                {selectedMode === 'sprint'
                  ? `${stats.sprintDuration}sn Başlat`
                  : 'Pratiğe Başla'}
              </span>
              <ArrowRight size={16} />
            </span>
          </div>
        </button>
      </section>

      {/* 4 Core Category Cards with Mastery Bar */}
      <section className="cat-grid">
        {CONCRETE_CATEGORIES.map((id) => {
          const meta = CATEGORIES[id];
          const record = getSprintRecord(stats, id, stats.sprintDuration);
          const cStat = stats.categoryStats[id];
          const acc =
            cStat && cStat.solved > 0
              ? Math.round((cStat.correct / cStat.solved) * 100)
              : null;

          return (
            <button
              key={id}
              className="cat-card"
              style={
                {
                  '--cat-accent': meta.accent,
                  '--cat-soft': meta.accentSoft,
                  '--cat-border': meta.accentBorder,
                } as React.CSSProperties
              }
              onClick={() => onStartGame(id)}
            >
              <div className="cat-card-top">
                <span className="cat-icon-badge">{CATEGORY_ICONS[id]}</span>
                <div className="record-pill">
                  <Trophy size={12} />
                  <span>{record}</span>
                </div>
              </div>

              <h3 className="cat-title">{meta.title}</h3>
              <p className="cat-desc">{meta.description}</p>

              {/* Per-Category Mastery Indicator */}
              {acc !== null && (
                <div className="cat-mastery">
                  <div className="cat-mastery-row">
                    <span>İsabet %{acc}</span>
                    <span>{cStat.solved} soru</span>
                  </div>
                  <div className="cat-mastery-track">
                    <div
                      className="cat-mastery-fill"
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="cat-footer">
                <div className="chip-row">
                  {meta.examples.map((ex) => (
                    <span key={ex} className="cat-chip">
                      {ex}
                    </span>
                  ))}
                </div>
                <span className="cat-arrow" aria-hidden="true">
                  <ArrowRight size={15} />
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Weak Spots (Most Missed) + Playable Drill CTA */}
      {visibleWeakSpots.length > 0 && (
        <section className="weak-section">
          <div className="section-head">
            <div>
              <h3>Sık Takıldığın Sayılar ({allWeakSpots.length})</h3>
              <span className="section-sub">
                Üst üste 2 kez doğru bildiğin sayı listeden otomatik silinir
              </span>
            </div>
            {playableWeakCount > 0 && (
              <button
                className="weak-drill-btn"
                onClick={() => onStartGame('weak-spots', 'practice')}
              >
                <Target size={15} />
                <span>Zayıf Noktaları Çalış ({playableWeakCount})</span>
              </button>
            )}
          </div>

          <div className="weak-grid">
            {visibleWeakSpots.map((ws) => (
              <div key={ws.key} className="weak-card">
                <div className="weak-main">
                  <div className="weak-top">
                    <span
                      className="weak-cat"
                      style={{
                        color: CATEGORIES[ws.category].accent,
                        backgroundColor: CATEGORIES[ws.category].accentSoft,
                      }}
                    >
                      {CATEGORIES[ws.category].shortTitle}
                    </span>
                    <span className="weak-count">{ws.missCount}× hata</span>
                    {ws.masteryStreak > 0 && (
                      <span className="weak-mastery-tag">
                        {ws.masteryStreak}/2 ✓
                      </span>
                    )}
                  </div>
                  <div className="weak-expr">
                    <span>{ws.label}</span>
                    <strong>→ {ws.answer}</strong>
                  </div>
                  <p className="weak-tip">{ws.tip}</p>
                </div>
                <button
                  className="weak-dismiss"
                  onClick={() => onDismissWeakSpot(ws.key)}
                  title="Öğrendim, listeden kaldır"
                  aria-label="Listeden kaldır"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
