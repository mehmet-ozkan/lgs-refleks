import React, { useState } from 'react';
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
  SlidersHorizontal,
  ChevronDown,
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
  multiples: <Layers size={18} strokeWidth={2.2} />,
  powers: <Zap size={18} strokeWidth={2.2} />,
  'squares-roots': <Radical size={18} strokeWidth={2.2} />,
  traps: <ShieldAlert size={18} strokeWidth={2.2} />,
};

const MOBILE_SUBTITLES: Record<ConcreteCategoryId, string> = {
  multiples: '12 · 15 · 16 · 18 · 24 · 36',
  powers: '2ⁿ · 3ⁿ · 5ⁿ çift yönlü',
  'squares-roots': '11–25 kare · √72 = 6√2',
  traps: '51 · 57 · 87 · 91',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  warmup: 'Isınma',
  standard: 'LGS',
  master: 'Usta',
};

const STYLE_LABELS: Record<AnswerStyle, string> = {
  hybrid: 'Hibrit',
  choice: '4 Şıklı',
  input: 'Yazmalı',
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
  onStartGame,
  onOpenReference,
  onDismissWeakSpot,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (dailyPct / 100) * circumference;

  const modeSummary =
    selectedMode === 'sprint' ? `${stats.sprintDuration}sn Sprint` : 'Serbest Pratik';

  return (
    <div className="page-shell fade-in">
      {/* Compact Brand Header */}
      <header className="top-bar">
        <div className="brand">
          <div className="brand-logo">
            <Zap size={19} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="brand-title">LGS Refleks</h1>
            <p className="brand-sub">Günde 10 dk matematik hızı</p>
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
            {stats.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="icon-btn"
            onClick={onToggleSound}
            aria-label={stats.soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
            title={stats.soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
          >
            {stats.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      {/* 1. Compact Daily Goal + 7-Day Mini Calendar */}
      <section className="daily-card">
        <div className="daily-header-row">
          <div className="daily-left">
            <div className="ring-wrap" aria-label={`Günlük hedef %${dailyPct}`}>
              <svg width="46" height="46" viewBox="0 0 46 46">
                <circle
                  className="ring-track"
                  cx="23"
                  cy="23"
                  r={radius}
                  strokeWidth="4.5"
                  fill="none"
                />
                <circle
                  className={`ring-fill ${dailyReached ? 'ring-fill--done' : ''}`}
                  cx="23"
                  cy="23"
                  r={radius}
                  strokeWidth="4.5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 23 23)"
                />
              </svg>
              <span className="ring-text">%{dailyPct}</span>
            </div>

            <div className="daily-info">
              <span className="daily-label">
                {dailyReached ? (
                  <>
                    <CheckCircle2 size={15} className="text-emerald" />
                    10 dk hedefi tamam!
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
                {todayAcc !== null && <> · %{todayAcc}</>}
              </span>
            </div>
          </div>

          <div className="streak-pill" title="Günlük seri">
            <Flame size={14} />
            <span>{stats.streakDays} gün</span>
          </div>
        </div>

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
                  {day.goalReached && <Check size={10} strokeWidth={3} />}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. PRIME ABOVE-THE-FOLD HERO: Instant Sprint Launch */}
      <section className="hero-section">
        <button className="hero-card" onClick={() => onStartGame('mixed')}>
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-left">
            <div className="hero-top-row">
              <div className="hero-badge">
                <Shuffle size={12} />
                <span>Günlük Karışık</span>
              </div>
              <div className="record-pill record-pill--hero">
                <Trophy size={13} />
                <span>
                  Rekor <strong>{mixedRecord}</strong>
                </span>
              </div>
            </div>

            <h2 className="hero-title">{mixedMeta.title}</h2>
            <p className="hero-desc">{mixedMeta.description}</p>

            <div className="chip-row hero-chips-desktop">
              {mixedMeta.examples.map((ex) => (
                <span key={ex} className="hero-chip">
                  {ex}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <span className="hero-cta">
              <Zap size={16} />
              <span>
                {selectedMode === 'sprint'
                  ? `${stats.sprintDuration}sn Sprint Başlat`
                  : 'Pratiğe Başla'}
              </span>
              <ArrowRight size={16} />
            </span>
          </div>
        </button>
      </section>

      {/* 3. Sleek 1-Line Collapsible Settings Summary Bar */}
      <section className="config-accordion">
        <button
          type="button"
          className={`config-summary-bar ${settingsOpen ? 'config-summary-bar--open' : ''}`}
          onClick={() => setSettingsOpen((o) => !o)}
          aria-expanded={settingsOpen}
        >
          <div className="config-summary-left">
            <SlidersHorizontal size={14} className="config-icon" />
            <div className="config-tags">
              <span className="config-tag config-tag--primary">{modeSummary}</span>
              <span className="config-tag">{DIFFICULTY_LABELS[stats.difficulty]}</span>
              <span className="config-tag">{STYLE_LABELS[stats.answerStyle]}</span>
              {stats.answerStyle !== 'choice' && stats.autoSubmit && (
                <span className="config-tag config-tag--accent">Oto Onay</span>
              )}
            </div>
          </div>
          <span className="config-chevron">
            <span className="config-edit-label">Ayarlar</span>
            <ChevronDown
              size={16}
              className={settingsOpen ? 'chevron-rot' : ''}
            />
          </span>
        </button>

        {settingsOpen && (
          <div className="config-drawer pop-in">
            <div className="config-group">
              <span className="config-group-label">Mod & Süre</span>
              <div className="config-group-controls">
                <div className="segmented" role="group" aria-label="Oyun modu">
                  <button
                    className={`seg-btn ${selectedMode === 'sprint' ? 'seg-btn--active' : ''}`}
                    onClick={() => onSelectMode('sprint')}
                  >
                    <Zap size={13} />
                    <span>Sprint</span>
                  </button>
                  <button
                    className={`seg-btn ${selectedMode === 'practice' ? 'seg-btn--active' : ''}`}
                    onClick={() => onSelectMode('practice')}
                  >
                    <InfinityIcon size={13} />
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
              </div>
            </div>

            <div className="config-group">
              <span className="config-group-label">Zorluk</span>
              <div className="segmented segmented--full" role="group" aria-label="Zorluk seviyesi">
                {(['warmup', 'standard', 'master'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    className={`seg-btn ${stats.difficulty === d ? 'seg-btn--active' : ''}`}
                    onClick={() => onSelectDifficulty(d)}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-group">
              <span className="config-group-label">Cevaplama</span>
              <div className="config-group-controls">
                <div className="segmented segmented--full" role="group" aria-label="Cevaplama tarzı">
                  <button
                    className={`seg-btn ${stats.answerStyle === 'hybrid' ? 'seg-btn--active' : ''}`}
                    onClick={() => onSelectAnswerStyle('hybrid')}
                  >
                    <Sparkles size={13} />
                    <span>Hibrit</span>
                  </button>
                  <button
                    className={`seg-btn ${stats.answerStyle === 'choice' ? 'seg-btn--active' : ''}`}
                    onClick={() => onSelectAnswerStyle('choice')}
                  >
                    <Grid2x2 size={13} />
                    <span>4 Şıklı</span>
                  </button>
                  <button
                    className={`seg-btn ${stats.answerStyle === 'input' ? 'seg-btn--active' : ''}`}
                    onClick={() => onSelectAnswerStyle('input')}
                  >
                    <Keyboard size={13} />
                    <span>Yazmalı</span>
                  </button>
                </div>

                {stats.answerStyle !== 'choice' && (
                  <button
                    className={`toggle-pill ${stats.autoSubmit ? 'toggle-pill--on' : ''}`}
                    onClick={onToggleAutoSubmit}
                  >
                    <Gauge size={14} />
                    <span>Oto Onay: {stats.autoSubmit ? 'Açık' : 'Kapalı'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. 2x2 Core Category Grid (Compact & Scannable on Mobile!) */}
      <section className="cat-section">
        <div className="cat-grid">
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
                    <Trophy size={11} />
                    <span>{record}</span>
                  </div>
                </div>

                <h3 className="cat-title">{meta.title}</h3>
                <p className="cat-desc cat-desc--desktop">{meta.description}</p>
                <p className="cat-mobile-sub">{MOBILE_SUBTITLES[id]}</p>

                {acc !== null && (
                  <div className="cat-mastery">
                    <div className="cat-mastery-row">
                      <span>%{acc}</span>
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

                <div className="cat-footer cat-footer--desktop">
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
        </div>
      </section>

      {/* 5. Weak Spots + Playable Drill CTA */}
      {visibleWeakSpots.length > 0 && (
        <section className="weak-section">
          <div className="section-head">
            <div>
              <h3>Sık Takıldığın Sayılar ({allWeakSpots.length})</h3>
              <span className="section-sub">
                Üst üste 2 kez doğru bildiğin sayı otomatik temizlenir
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
