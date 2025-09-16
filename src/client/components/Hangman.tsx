import React, { useState, useEffect } from 'react';
import { HangmanGame, HangmanGuess } from '../../shared/types/api';
import { Timer } from './Timer';

type HangmanProps = {
  game: HangmanGame;
  onComplete: (result: {
    word: string;
    guesses: HangmanGuess[];
    success: boolean;
    timeMs: number;
  }) => void;
};

export const Hangman: React.FC<HangmanProps> = ({ game, onComplete }) => {
  const [guesses, setGuesses] = useState<HangmanGuess[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  // German alphabet (excluding special characters for simplicity)
  const alphabet = 'abcdefghijklmnopqrstuvwxyzäöüß'.split('');
  
  // Start timer when component mounts
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  // Get unique letters in the word
  const uniqueLetters = Array.from(new Set(game.word.toLowerCase().split('')));
  
  // Calculate remaining attempts
  const incorrectGuesses = guesses.filter(g => !g.correct).length;
  const remainingAttempts = game.maxAttempts - incorrectGuesses;
  
  // Calculate revealed letters
  const revealedLetters = game.word.toLowerCase().split('').map(letter => {
    return guesses.some(g => g.letter === letter) ? letter : null;
  });
  
  // Check if all letters are guessed
  const allLettersGuessed = uniqueLetters.every(letter => 
    guesses.some(g => g.letter === letter)
  );

  // Handle letter selection
  const handleLetterSelect = (letter: string) => {
    if (gameOver) return;
    
    const lowerLetter = letter.toLowerCase();
    
    // Check if letter was already guessed
    if (guesses.some(g => g.letter === lowerLetter)) return;
    
    const isCorrect = game.word.toLowerCase().includes(lowerLetter);
    const newGuess: HangmanGuess = {
      letter: lowerLetter,
      correct: isCorrect,
      timestamp: Date.now()
    };
    
    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);
    
    // Check game end conditions
    const newIncorrectGuesses = updatedGuesses.filter(g => !g.correct).length;
    
    // Check if word is guessed
    const wordGuessed = uniqueLetters.every(letter => 
      updatedGuesses.some(g => g.letter === letter)
    );
    
    if (wordGuessed || newIncorrectGuesses >= game.maxAttempts) {
      endGame(wordGuessed, updatedGuesses);
    }
  };
  
  // End the game
  const endGame = (isSuccess: boolean, finalGuesses: HangmanGuess[]) => {
    setGameOver(true);
    setSuccess(isSuccess);
    setIsTimerRunning(false);
    
    const endTime = Date.now();
    const timeSpent = endTime - startTime;
    
    onComplete({
      word: game.word,
      guesses: finalGuesses,
      success: isSuccess,
      timeMs: timeSpent
    });
  };
  
  // Handle timer completion (auto-end game)
  const handleTimerComplete = () => {
    if (!gameOver) {
      endGame(false, guesses);
    }
  };
  
  // Render hangman figure based on incorrect guesses
  const renderHangman = () => {
    const hangmanStates = [
      // 0 incorrect guesses - just the gallows
      (
        <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
          <line x1="40" y1="230" x2="160" y2="230" stroke="black" strokeWidth="4" />
          <line x1="60" y1="230" x2="60" y2="50" stroke="black" strokeWidth="4" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="black" strokeWidth="4" />
          <line x1="120" y1="50" x2="120" y2="70" stroke="black" strokeWidth="4" />
        </svg>
      ),
      // 1 incorrect guess - head
      (
        <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
          <line x1="40" y1="230" x2="160" y2="230" stroke="black" strokeWidth="4" />
          <line x1="60" y1="230" x2="60" y2="50" stroke="black" strokeWidth="4" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="black" strokeWidth="4" />
          <line x1="120" y1="50" x2="120" y2="70" stroke="black" strokeWidth="4" />
          <circle cx="120" cy="90" r="20" stroke="black" strokeWidth="4" fill="none" />
        </svg>
      ),
      // 2 incorrect guesses - body
      (
        <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
          <line x1="40" y1="230" x2="160" y2="230" stroke="black" strokeWidth="4" />
          <line x1="60" y1="230" x2="60" y2="50" stroke="black" strokeWidth="4" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="black" strokeWidth="4" />
          <line x1="120" y1="50" x2="120" y2="70" stroke="black" strokeWidth="4" />
          <circle cx="120" cy="90" r="20" stroke="black" strokeWidth="4" fill="none" />
          <line x1="120" y1="110" x2="120" y2="170" stroke="black" strokeWidth="4" />
        </svg>
      ),
      // 3 incorrect guesses - left arm
      (
        <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
          <line x1="40" y1="230" x2="160" y2="230" stroke="black" strokeWidth="4" />
          <line x1="60" y1="230" x2="60" y2="50" stroke="black" strokeWidth="4" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="black" strokeWidth="4" />
          <line x1="120" y1="50" x2="120" y2="70" stroke="black" strokeWidth="4" />
          <circle cx="120" cy="90" r="20" stroke="black" strokeWidth="4" fill="none" />
          <line x1="120" y1="110" x2="120" y2="170" stroke="black" strokeWidth="4" />
          <line x1="120" y1="130" x2="90" y2="150" stroke="black" strokeWidth="4" />
        </svg>
      ),
      // 4 incorrect guesses - right arm
      (
        <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
          <line x1="40" y1="230" x2="160" y2="230" stroke="black" strokeWidth="4" />
          <line x1="60" y1="230" x2="60" y2="50" stroke="black" strokeWidth="4" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="black" strokeWidth="4" />
          <line x1="120" y1="50" x2="120" y2="70" stroke="black" strokeWidth="4" />
          <circle cx="120" cy="90" r="20" stroke="black" strokeWidth="4" fill="none" />
          <line x1="120" y1="110" x2="120" y2="170" stroke="black" strokeWidth="4" />
          <line x1="120" y1="130" x2="90" y2="150" stroke="black" strokeWidth="4" />
          <line x1="120" y1="130" x2="150" y2="150" stroke="black" strokeWidth="4" />
        </svg>
      ),
      // 5 incorrect guesses - left leg
      (
        <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
          <line x1="40" y1="230" x2="160" y2="230" stroke="black" strokeWidth="4" />
          <line x1="60" y1="230" x2="60" y2="50" stroke="black" strokeWidth="4" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="black" strokeWidth="4" />
          <line x1="120" y1="50" x2="120" y2="70" stroke="black" strokeWidth="4" />
          <circle cx="120" cy="90" r="20" stroke="black" strokeWidth="4" fill="none" />
          <line x1="120" y1="110" x2="120" y2="170" stroke="black" strokeWidth="4" />
          <line x1="120" y1="130" x2="90" y2="150" stroke="black" strokeWidth="4" />
          <line x1="120" y1="130" x2="150" y2="150" stroke="black" strokeWidth="4" />
          <line x1="120" y1="170" x2="90" y2="210" stroke="black" strokeWidth="4" />
        </svg>
      ),
      // 6 incorrect guesses - right leg (game over)
      (
        <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
          <line x1="40" y1="230" x2="160" y2="230" stroke="black" strokeWidth="4" />
          <line x1="60" y1="230" x2="60" y2="50" stroke="black" strokeWidth="4" />
          <line x1="60" y1="50" x2="120" y2="50" stroke="black" strokeWidth="4" />
          <line x1="120" y1="50" x2="120" y2="70" stroke="black" strokeWidth="4" />
          <circle cx="120" cy="90" r="20" stroke="black" strokeWidth="4" fill="none" />
          <line x1="120" y1="110" x2="120" y2="170" stroke="black" strokeWidth="4" />
          <line x1="120" y1="130" x2="90" y2="150" stroke="black" strokeWidth="4" />
          <line x1="120" y1="130" x2="150" y2="150" stroke="black" strokeWidth="4" />
          <line x1="120" y1="170" x2="90" y2="210" stroke="black" strokeWidth="4" />
          <line x1="120" y1="170" x2="150" y2="210" stroke="black" strokeWidth="4" />
          {/* X eyes for game over */}
          {gameOver && !success && (
            <>
              <line x1="110" y1="85" x2="120" y2="95" stroke="black" strokeWidth="2" />
              <line x1="120" y1="85" x2="110" y2="95" stroke="black" strokeWidth="2" />
              <line x1="120" y1="85" x2="130" y2="95" stroke="black" strokeWidth="2" />
              <line x1="130" y1="85" x2="120" y2="95" stroke="black" strokeWidth="2" />
            </>
          )}
          {/* Smile for win */}
          {gameOver && success && (
            <path d="M110,95 Q120,105 130,95" stroke="black" strokeWidth="2" fill="none" />
          )}
        </svg>
      )
    ];

    return hangmanStates[Math.min(incorrectGuesses, hangmanStates.length - 1)];
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Attempts left: {remainingAttempts} / {game.maxAttempts}
        </div>
        <Timer 
          duration={60} 
          onComplete={handleTimerComplete} 
          isRunning={isTimerRunning} 
        />
      </div>
      
      {/* Hangman figure */}
      <div className="w-full bg-white rounded-xl shadow-md p-6 mb-6">
        {renderHangman()}
        
        {/* Word display */}
        <div className="flex justify-center gap-2 my-6">
          {revealedLetters.map((letter, index) => (
            <div 
              key={index} 
              className="w-8 h-10 border-b-2 border-gray-800 flex items-center justify-center text-xl font-bold"
            >
              {letter || (gameOver && !success ? game.word[index] : '')}
            </div>
          ))}
        </div>
        
        {/* Hint */}
        <div className="text-center mb-4">
          <p className="text-gray-600">Hint: {game.hint}</p>
        </div>
        
        {/* Game status message */}
        {gameOver && (
          <div className={`text-center mb-4 font-bold ${success ? 'text-green-600' : 'text-red-600'}`}>
            {success ? 'You won!' : `Game over! The word was: ${game.word}`}
          </div>
        )}
      </div>
      
      {/* Keyboard */}
      <div className="w-full bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {alphabet.map(letter => {
            const isGuessed = guesses.some(g => g.letter === letter);
            const isCorrect = guesses.some(g => g.letter === letter && g.correct);
            
            let buttonClass = "w-8 h-10 rounded-md flex items-center justify-center font-medium";
            
            if (!isGuessed) {
              buttonClass += " bg-gray-200 hover:bg-gray-300 text-gray-800";
            } else if (isCorrect) {
              buttonClass += " bg-green-200 text-green-800";
            } else {
              buttonClass += " bg-red-200 text-red-800";
            }
            
            if (gameOver) {
              buttonClass += " opacity-50 cursor-not-allowed";
            }
            
            return (
              <button
                key={letter}
                onClick={() => handleLetterSelect(letter)}
                disabled={isGuessed || gameOver}
                className={buttonClass}
                aria-label={`Letter ${letter}`}
              >
                {letter.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
