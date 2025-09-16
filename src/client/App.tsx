import { useState, useEffect } from 'react';
import { showToast } from '@devvit/web/client';
import { 
  WordMatchDaily, 
  UserState, 
  GameAnswer,
  InitResponse,
  GetHangmanGameResponse,
  SubmitHangmanResultResponse,
  HangmanGame,
  HangmanGuess
} from '../shared/types/api';
import { Home } from './components/Home';
import { Hangman } from './components/Hangman';
import { Result } from './components/Result';
import { LanguagePicker } from './components/LanguagePicker';

type GameScreen = 'home' | 'hangman' | 'result';

export const App = () => {
  // Game state
  const [screen, setScreen] = useState<GameScreen>('home');
  const [username, setUsername] = useState<string>('anonymous');
  const [userState, setUserState] = useState<UserState>({ streak: 0, maxStreak: 0 });
  const [hangmanGame, setHangmanGame] = useState<HangmanGame | null>(null);
  const [language, setLanguage] = useState<string>('de');
  const [loading, setLoading] = useState<boolean>(true);
  const [gameResults, setGameResults] = useState<{
    score: number;
    timeMs: number;
    perfect: boolean;
    newStreak: number;
    maxStreak: number;
    shareText: string;
    word?: string;
    success?: boolean;
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

  // Load today's hangman game
  const loadTodaysHangman = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hangman/today`);
      if (!response.ok) throw new Error('Failed to load hangman game');
      
      const data: GetHangmanGameResponse = await response.json();
      setHangmanGame(data.game);
      setLoading(false);
      setScreen('hangman');
    } catch (error) {
      console.error('Error loading hangman game:', error);
      showToast('Failed to load hangman game. Please try again.');
      setLoading(false);
    }
  };
  
  // Load practice hangman game
  const loadPracticeHangman = async (difficulty: string = 'medium') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hangman/practice/${difficulty}`);
      if (!response.ok) throw new Error('Failed to load practice hangman game');
      
      const data: GetHangmanGameResponse = await response.json();
      setHangmanGame(data.game);
      setLoading(false);
      setScreen('hangman');
    } catch (error) {
      console.error('Error loading practice hangman game:', error);
      showToast('Failed to load practice hangman game. Please try again.');
      setLoading(false);
    }
  };

  // Load easy practice hangman game
  const loadEasyHangman = async () => {
    await loadPracticeHangman('easy');
  };
  
  // Load hard practice hangman game
  const loadHardHangman = async () => {
    await loadPracticeHangman('hard');
  };

  // Handle hangman game completion
  const handleHangmanComplete = async (result: {
    word: string;
    guesses: HangmanGuess[];
    success: boolean;
    timeMs: number;
  }) => {
    try {
      setLoading(true);
      
      const hangmanResult = {
        userId: username,
        seed: hangmanGame?.id || '',
        score: 0, // Will be calculated on server
        timeMs: result.timeMs,
        word: result.word,
        guesses: result.guesses,
        success: result.success
      };
      
      const response = await fetch('/api/hangman/submit-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hangmanResult)
      });
      
      if (!response.ok) throw new Error('Failed to submit hangman results');
      
      const data: SubmitHangmanResultResponse = await response.json();
      setGameResults({
        score: data.score,
        timeMs: data.timeMs,
        perfect: data.perfect,
        newStreak: data.newStreak,
        maxStreak: data.maxStreak,
        shareText: data.shareText,
        word: data.word,
        success: data.success
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
      console.error('Error submitting hangman results:', error);
      showToast('Failed to submit hangman results. Please try again.');
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
        <h1 className="text-xl font-bold text-orange-600">Deutsch Hangman</h1>
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
            onPlayDaily={loadTodaysHangman}
            onPlayPractice={loadEasyHangman}
            onPlayReddit={loadHardHangman}
          />
        )}
        
        {screen === 'hangman' && hangmanGame && (
          <Hangman 
            game={hangmanGame}
            onComplete={handleHangmanComplete}
          />
        )}
        
        {screen === 'result' && gameResults && (
          <Result 
            score={gameResults.score}
            timeMs={gameResults.timeMs}
            perfect={gameResults.perfect}
            newStreak={gameResults.newStreak}
            maxStreak={gameResults.maxStreak}
            hangmanWord={gameResults.word || ''}
            hangmanSuccess={gameResults.success || false}
            shareText={gameResults.shareText}
            onPlayAgain={() => setScreen('home')}
          />
        )}
      </main>
      
      {/* Footer */}
      <footer className="w-full max-w-md py-4 mt-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Deutsch Hangman Game
      </footer>
    </div>
  );
};
