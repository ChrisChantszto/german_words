import React from 'react';

type StreakBadgeProps = {
  streak: number;
  maxStreak: number;
};

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, maxStreak }) => {
  return (
    <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
      <span className="text-orange-600 font-bold">🔥 {streak}</span>
      <span className="text-xs text-gray-500">
        Best: {maxStreak}
      </span>
    </div>
  );
};
