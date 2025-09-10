import { useState, useEffect } from 'react';
import { showToast } from '@devvit/web/client';
import { 
  WordMatchDaily, 
  UserState, 
  GameAnswer,
  InitResponse,
  GetPuzzleResponse,
  SubmitResultResponse,
  UserResult
} from '../shared/types/api';
import { Home } from './components/Home';
import { Game } from './components/Game';
import { Result } from './components/Result';
import { LanguagePicker } from './components/LanguagePicker';

type GameScreen = 'home' | 'game' | 'result';

export const App = () => {
  // Game state
  const [screen, setScreen] = useState<GameScreen>('home');
  const [username, setUsername] = useState<string>('anonymous');
  const [userState, setUserState] = useState<UserState>({ streak: 0, maxStreak: 0 });
  const [puzzle, setPuzzle] = useState<WordMatchDaily | null>(null);
  const [language, setLanguage] = useState<string>('de');
  const [loading, setLoading] = useState<boolean>(true);
  const [gameAnswers, setGameAnswers] = useState<GameAnswer[]>([]);
  const [gameResults, setGameResults] = useState<{
    score: number;
    timeMs: number;
    perfect: boolean;
    newStreak: number;
    maxStreak: number;
    shareText: string;
  } | null>(null);

  // Initialize the app
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/init');
        if (!response.ok) throw new Error('Failed to initialize app');
        
        const data: InitResponse = await response.json();
        setUsername(data.username);
        setUserState(data.userState);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Failed to initialize app. Please try again.');
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Load today's puzzle
  const loadTodaysPuzzle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/puzzle/today`);
      if (!response.ok) throw new Error('Failed to load puzzle');
      
      const data: GetPuzzleResponse = await response.json();
      setPuzzle(data.puzzle);
      setLoading(false);
      setScreen('game');
    } catch (error) {
      console.error('Error loading puzzle:', error);
      showToast('Failed to load puzzle. Please try again.');
      setLoading(false);
    }
  };
  
  // Load Reddit-based puzzle
  const loadRedditPuzzle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/puzzle/reddit`);
      if (!response.ok) throw new Error('Failed to load Reddit puzzle');
      
      const data: GetPuzzleResponse = await response.json();
      setPuzzle(data.puzzle);
      setLoading(false);
      setScreen('game');
    } catch (error) {
      console.error('Error loading Reddit puzzle:', error);
      showToast('Failed to load Reddit puzzle. Please try again.');
      setLoading(false);
    }
  };

  // Load practice puzzle (previous day)
  const loadPracticePuzzle = async () => {
    try {
      setLoading(true);
      // For practice, we'll use yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      const response = await fetch(`/api/puzzle/${yesterdayStr}:${language}`);
      if (!response.ok) throw new Error('Failed to load practice puzzle');
      
      const data: GetPuzzleResponse = await response.json();
      setPuzzle(data.puzzle);
      setLoading(false);
      setScreen('game');
    } catch (error) {
      console.error('Error loading practice puzzle:', error);
      showToast('Failed to load practice puzzle. Please try again.');
      setLoading(false);
    }
  };

  // Handle game completion
  const handleGameComplete = async (answers: GameAnswer[]) => {
    try {
      setLoading(true);
      setGameAnswers(answers);
      
      const result: UserResult = {
        userId: username,
        seed: puzzle?.id || '',
        score: 0, // Will be calculated on server
        timeMs: 0, // Will be calculated on server
        answers: answers
      };
      
      const response = await fetch('/api/submit-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      });
      
      if (!response.ok) throw new Error('Failed to submit results');
      
      const data: SubmitResultResponse = await response.json();
      setGameResults({
        score: data.score,
        timeMs: data.timeMs,
        perfect: data.perfect,
        newStreak: data.newStreak,
        maxStreak: data.maxStreak,
        shareText: data.shareText
      });
      
      // Update local user state
      setUserState(prev => ({
        ...prev,
        streak: data.newStreak,
        maxStreak: data.maxStreak
      }));
      
      setLoading(false);
      setScreen('result');
    } catch (error) {
      console.error('Error submitting results:', error);
      showToast('Failed to submit results. Please try again.');
      setLoading(false);
    }
  };

  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <img src="/assets/loading.gif" alt="Loading" className="w-16 h-16" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex relative flex-col justify-start items-center min-h-screen p-4 bg-gray-50">
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-orange-600">Deutsch Matching</h1>
        {screen !== 'home' && (
          <button 
            onClick={() => setScreen('home')}
            className="text-gray-500 hover:text-gray-700"
          >
            Back to Home
          </button>
        )}
        {screen === 'home' && (
          <LanguagePicker 
            currentLanguage={language} 
            onLanguageChange={handleLanguageChange} 
          />
        )}
      </header>
      
      {/* Main content */}
      <main className="w-full max-w-md flex-grow">
        {screen === 'home' && (
          <Home 
            username={username}
            userState={userState}
            onPlayDaily={loadTodaysPuzzle}
            onPlayPractice={loadPracticePuzzle}
            onPlayReddit={loadRedditPuzzle}
          />
        )}
        
        {screen === 'game' && puzzle && (
          <Game 
            puzzle={puzzle}
            onComplete={handleGameComplete}
          />
        )}
        
        {screen === 'result' && puzzle && gameResults && (
          <Result 
            score={gameResults.score}
            timeMs={gameResults.timeMs}
            perfect={gameResults.perfect}
            newStreak={gameResults.newStreak}
            maxStreak={gameResults.maxStreak}
            answers={gameAnswers}
            puzzle={puzzle}
            shareText={gameResults.shareText}
            onPlayAgain={() => setScreen('home')}
          />
        )}
      </main>
      
      {/* Footer */}
      <footer className="w-full max-w-md py-4 mt-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Deutsch Matching Game
      </footer>
    </div>
  );
};
