import React, { useState, useEffect } from 'react';

type TimerProps = {
  duration: number; // in seconds
  onComplete?: () => void;
  isRunning: boolean;
};

export const Timer: React.FC<TimerProps> = ({ duration, onComplete, isRunning }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Calculate progress percentage
  const progress = (duration - timeLeft) / duration * 100;
  
  // Format time as seconds
  const formatTime = (seconds: number): string => {
    return seconds.toFixed(1);
  };
  
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    if (isRunning) {
      setStartTime(Date.now());
      
      timerId = setInterval(() => {
        const elapsed = (Date.now() - (startTime || Date.now())) / 1000;
        const remaining = duration - elapsed;
        
        if (remaining <= 0) {
          setTimeLeft(0);
          clearInterval(timerId);
          onComplete?.();
        } else {
          setTimeLeft(remaining);
        }
      }, 100);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [duration, onComplete, isRunning, startTime]);
  
  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);
  
  // Color changes based on time left
  const getColor = () => {
    if (timeLeft > duration * 0.6) return 'text-green-600';
    if (timeLeft > duration * 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Timer circle background */}
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={timeLeft > duration * 0.3 ? '#22c55e' : '#ef4444'}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            transform="rotate(-90 50 50)"
            strokeLinecap="round"
          />
        </svg>
        <span className={`text-xl font-bold ${getColor()}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};
