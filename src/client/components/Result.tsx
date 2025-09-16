import React from 'react';
import { GameAnswer, WordMatchDaily } from '../../shared/types/api';
import { navigateTo } from '@devvit/web/client';
import { StreakBadge } from './StreakBadge';

type ResultProps = {
  score: number;
  timeMs: number;
  perfect: boolean;
  newStreak: number;
  maxStreak: number;
  answers?: GameAnswer[];
  puzzle?: WordMatchDaily;
  hangmanWord?: string;
  hangmanSuccess?: boolean;
  shareText: string;
  onPlayAgain: () => void;
};

export const Result: React.FC<ResultProps> = ({
  score,
  timeMs,
  perfect,
  newStreak,
  maxStreak,
  answers,
  puzzle,
  hangmanWord,
  hangmanSuccess,
  shareText,
  onPlayAgain
}) => {
  const copyShareText = () => {
    navigator.clipboard.writeText(shareText);
    alert('Results copied to clipboard!');
  };

  const timeSeconds = Math.round(timeMs / 1000);
  
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Results</h2>
        <StreakBadge streak={newStreak} maxStreak={maxStreak} />
      </div>
      
      <div className="flex justify-between items-center mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600">{score}</div>
          <div className="text-sm text-gray-500">Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{timeSeconds}s</div>
          <div className="text-sm text-gray-500">Time</div>
        </div>
        
        {perfect && (
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">⭐</div>
            <div className="text-sm text-gray-500">Perfect</div>
          </div>
        )}
      </div>
      
      {/* Emoji Grid - Show different results based on game type */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">Your results:</div>
        {hangmanWord ? (
          <div className="text-center">
            <div className="text-xl font-bold mb-2">
              {hangmanSuccess ? '🎉 You guessed the word!' : '😔 Better luck next time!'}
            </div>
            <div className="text-2xl font-bold mb-4">{hangmanWord}</div>
          </div>
        ) : answers ? (
          <div className="flex justify-center text-2xl tracking-wider">
            {answers.map((answer, index) => (
              <span key={index}>{answer.correct ? '🟩' : '🟥'}</span>
            ))}
          </div>
        ) : null}
      </div>
      
      {/* Share button */}
      <button
        onClick={copyShareText}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium mb-4"
      >
        Share Results
      </button>
      
      {/* Play again button */}
      <button
        onClick={onPlayAgain}
        className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 rounded-lg font-medium mb-4"
      >
        Play Again
      </button>
      
      {/* Discuss button */}
      <button
        onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
        className="w-full text-center text-gray-500 hover:text-gray-700"
      >
        Discuss today's variants
      </button>
      
      {/* Explanations - Only show for word matching game */}
      {puzzle && answers && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Explanations</h3>
          <div className="space-y-4">
            {puzzle.items.map((item, index) => {
              const answer = answers[index];
              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg ${answer?.correct ? 'bg-green-50' : 'bg-red-50'}`}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{item.prompt_en}</div>
                    <div className={answer?.correct ? 'text-green-600' : 'text-red-600'}>
                      {answer?.correct ? 'Correct' : 'Wrong'}
                    </div>
                  </div>
                  <div className="mt-2 text-gray-700">
                    <span className="font-medium">Answer: </span>
                    {item.choices.find(c => c.key === item.answerKey)?.label}
                  </div>
                  {item.note && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Note: </span>
                      {item.note}
                    </div>
                  )}
                  {item.variants && item.variants.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Variants: </span>
                      {item.variants.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
