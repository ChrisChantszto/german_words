import React from 'react';
import { UserState } from '../../shared/types/api';
import { StreakBadge } from './StreakBadge';

type HomeProps = {
  username: string;
  userState: UserState;
  onPlayDaily: () => void;
  onPlayPractice: () => void;
  onPlayReddit: () => void;
};

export const Home: React.FC<HomeProps> = ({
  username,
  userState,
  onPlayDaily,
  onPlayPractice,
  onPlayReddit
}) => {
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2">Deutsch Matching</h1>
      <p className="text-gray-600 mb-6 text-center">
        Match the correct German translations in 1-3 minutes!
      </p>
      
      {/* User info */}
      <div className="w-full bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Welcome,</p>
            <p className="font-bold text-xl">{username}</p>
          </div>
          <StreakBadge streak={userState.streak} maxStreak={userState.maxStreak} />
        </div>
      </div>
      
      {/* Play buttons */}
      <div className="w-full space-y-4">
        <button
          onClick={onPlayDaily}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold text-lg"
        >
          Play Daily Challenge
        </button>
        
        <button
          onClick={onPlayPractice}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-4 rounded-lg font-bold text-lg"
        >
          Practice Mode
        </button>
        
        <button
          onClick={onPlayReddit}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg font-bold text-lg"
        >
          Reddit Challenge
        </button>
      </div>
      
      {/* Game info */}
      <div className="mt-8 w-full bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">How to Play</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You'll see 8 words to translate</li>
          <li>Pick the correct translation from 3 options</li>
          <li>Try to answer within 10 seconds per word</li>
          <li>Get 5+ correct to maintain your streak</li>
          <li>Perfect score earns a bonus star ⭐</li>
        </ul>
      </div>
    </div>
  );
};
