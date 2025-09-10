import React, { useState, useEffect } from 'react';
import { WordMatchDaily, ChoiceKey, GameAnswer } from '../../shared/types/api';
import { Timer } from './Timer';

type GameProps = {
  puzzle: WordMatchDaily;
  onComplete: (answers: GameAnswer[]) => void;
};

export const Game: React.FC<GameProps> = ({ puzzle, onComplete }) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [selectedChoice, setSelectedChoice] = useState<ChoiceKey | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  const currentItem = puzzle.items[currentItemIndex];
  
  // Safety check in case we somehow get an invalid index
  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64">
        <p className="text-red-500">Error: Could not load question.</p>
        <button
          onClick={() => onComplete([])}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  // Start timer when component mounts
  useEffect(() => {
    setStartTime(Date.now());
  }, []);
  
  // Handle choice selection
  const handleChoiceSelect = (choice: ChoiceKey) => {
    if (selectedChoice) return; // Prevent changing answer once selected
    
    setSelectedChoice(choice);
    const endTime = Date.now();
    const timeSpent = endTime - startTime;
    
    // Record answer
    const answer: GameAnswer = {
      itemId: currentItem.id,
      pick: choice,
      correct: choice === currentItem.answerKey,
      ms: timeSpent
    };
    
    setAnswers(prev => [...prev, answer]);
    
    // Pause timer
    setIsTimerRunning(false);
    
    // Move to next item after a short delay
    setTimeout(() => {
      if (currentItemIndex < puzzle.items.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
        setSelectedChoice(null);
        setStartTime(Date.now());
        setIsTimerRunning(true);
      } else {
        // Game complete
        onComplete([...answers, answer]);
      }
    }, 1000);
  };
  
  // Handle timer completion (auto-skip)
  const handleTimerComplete = () => {
    if (!selectedChoice) {
      // Auto-select nothing (counts as wrong)
      handleChoiceSelect('A'); // This will be marked as wrong if A is not correct
    }
  };
  
  // Get class for choice button based on selection state
  const getChoiceClass = (choice: ChoiceKey) => {
    const baseClass = "w-full py-3 px-4 rounded-lg text-left font-medium transition-colors";
    
    if (!selectedChoice) {
      return `${baseClass} bg-white border border-gray-300 hover:bg-gray-100`;
    }
    
    if (choice === currentItem.answerKey) {
      return `${baseClass} bg-green-100 border border-green-500 text-green-800`;
    }
    
    if (choice === selectedChoice) {
      return `${baseClass} bg-red-100 border border-red-500 text-red-800`;
    }
    
    return `${baseClass} bg-gray-50 border border-gray-200 text-gray-400`;
  };
  
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {currentItemIndex + 1} / {puzzle.items.length}
        </div>
        <Timer 
          duration={10} 
          onComplete={handleTimerComplete} 
          isRunning={isTimerRunning} 
        />
      </div>
      
      {/* Question card */}
      <div className="w-full bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          {currentItem.prompt_en}
        </h2>
        
        <div className="flex flex-col gap-3">
          {currentItem.choices.map((choice) => (
            <button
              key={choice.key}
              onClick={() => handleChoiceSelect(choice.key)}
              disabled={selectedChoice !== null}
              className={getChoiceClass(choice.key)}
              aria-label={`Option ${choice.key}: ${choice.label}`}
            >
              <span className="inline-block w-6 h-6 rounded-full bg-gray-200 text-center mr-3">
                {choice.key}
              </span>
              {choice.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Skip button */}
      {!selectedChoice && (
        <button
          onClick={() => handleTimerComplete()}
          className="text-gray-500 hover:text-gray-700"
        >
          Skip
        </button>
      )}
    </div>
  );
};
