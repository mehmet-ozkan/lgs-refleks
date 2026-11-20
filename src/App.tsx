import { useEffect, useState } from 'react';
import {
  AnswerStyle,
  CategoryId,
  Difficulty,
  GameMode,
  SessionResult,
  SprintDuration,
  StoredStats,
} from './types/game';
import {
  getSprintRecord,
  loadStats,
  recordSessionToStats,
  removeWeakSpot,
  updatePreferences,
} from './utils/storage';
import { HomeView } from './components/HomeView';
import { PlayView } from './components/PlayView';
import { SummaryView } from './components/SummaryView';
import { ReferenceModal } from './components/ReferenceModal';

type Screen =
  | { name: 'home' }
  | { name: 'play'; category: CategoryId; mode: GameMode; runId: number }
  | { name: 'summary'; result: SessionResult };

export function App() {
  const [stats, setStats] = useState<StoredStats>(() => loadStats());
  const [mode, setMode] = useState<GameMode>('sprint');
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [showReference, setShowReference] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', stats.theme);
  }, [stats.theme]);

  const handleSelectAnswerStyle = (answerStyle: AnswerStyle) => {
    setStats((prev) => updatePreferences(prev, { answerStyle }));
  };

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    setStats((prev) => updatePreferences(prev, { difficulty }));
  };

  const handleSelectDuration = (sprintDuration: SprintDuration) => {
    setStats((prev) => updatePreferences(prev, { sprintDuration }));
  };

  const handleToggleAutoSubmit = () => {
    setStats((prev) =>
      updatePreferences(prev, { autoSubmit: !prev.autoSubmit })
    );
  };

  const handleToggleSound = () => {
    setStats((prev) =>
      updatePreferences(prev, { soundEnabled: !prev.soundEnabled })
    );
  };

  const handleToggleTheme = () => {
    setStats((prev) =>
      updatePreferences(prev, {
        theme: prev.theme === 'dark' ? 'light' : 'dark',
      })
    );
  };

  const handleDismissTip = () => {
    setStats((prev) => updatePreferences(prev, { dismissedTip: true }));
  };

  const handleStartGame = (category: CategoryId, overrideMode?: GameMode) => {
    const activeMode =
      overrideMode ?? (category === 'weak-spots' ? 'practice' : mode);
    setScreen({
      name: 'play',
      category,
      mode: activeMode,
      runId: Date.now(),
    });
  };

  const handleFinishGame = (result: SessionResult) => {
    setStats((prev) => recordSessionToStats(prev, result));
    setScreen({ name: 'summary', result });
  };

  const handleDismissWeakSpot = (key: string) => {
    setStats((prev) => removeWeakSpot(prev, key));
  };

  const weakSpotPool = Object.values(stats.weakSpots);

  return (
    <div className="app-root">
      {screen.name === 'home' && (
        <HomeView
          stats={stats}
          selectedMode={mode}
          onSelectMode={setMode}
          onSelectAnswerStyle={handleSelectAnswerStyle}
          onSelectDifficulty={handleSelectDifficulty}
          onSelectDuration={handleSelectDuration}
          onToggleAutoSubmit={handleToggleAutoSubmit}
          onToggleSound={handleToggleSound}
          onToggleTheme={handleToggleTheme}
          onDismissTip={handleDismissTip}
          onStartGame={handleStartGame}
          onOpenReference={() => setShowReference(true)}
          onDismissWeakSpot={handleDismissWeakSpot}
        />
      )}

      {screen.name === 'play' && (
        <PlayView
          key={screen.runId}
          category={screen.category}
          mode={screen.mode}
          answerStyle={stats.answerStyle}
          autoSubmit={stats.autoSubmit}
          difficulty={stats.difficulty}
          sprintDuration={stats.sprintDuration}
          previousRecord={getSprintRecord(
            stats,
            screen.category,
            stats.sprintDuration
          )}
          soundEnabled={stats.soundEnabled}
          weakSpotPool={weakSpotPool}
          onToggleAutoSubmit={handleToggleAutoSubmit}
          onFinish={handleFinishGame}
          onExit={() => setScreen({ name: 'home' })}
        />
      )}

      {screen.name === 'summary' && (
        <SummaryView
          result={screen.result}
          stats={stats}
          onReplay={() =>
            handleStartGame(screen.result.category, screen.result.mode)
          }
          onHome={() => setScreen({ name: 'home' })}
        />
      )}

      {showReference && (
        <ReferenceModal onClose={() => setShowReference(false)} />
      )}
    </div>
  );
}

export default App;
