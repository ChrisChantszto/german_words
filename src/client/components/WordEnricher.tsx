import React, { useState } from 'react';
import axios from 'axios';

type WordEnricherProps = {
  onWordsAdded?: () => void;
};

export const WordEnricher: React.FC<WordEnricherProps> = ({ onWordsAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // For custom word addition
  const [customWord, setCustomWord] = useState('');
  const [customHint, setCustomHint] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [customLoading, setCustomLoading] = useState(false);
  const [customResult, setCustomResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleEnrichWords = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await axios.post('/api/words/enrich', {
        searchTerm: searchTerm.trim(),
        count
      });
      
      setResult({
        success: true,
        message: response.data.message
      });
      
      if (onWordsAdded) {
        onWordsAdded();
      }
    } catch (error) {
      console.error('Error enriching words:', error);
      setResult({
        success: false,
        message: 'Failed to enrich word list. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomWord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customWord.trim() || !customHint.trim()) return;
    
    setCustomLoading(true);
    setCustomResult(null);
    
    try {
      const response = await axios.post('/api/words/add', {
        word: customWord.trim().toLowerCase(),
        hint: customHint.trim(),
        difficulty: customDifficulty
      });
      
      setCustomResult({
        success: true,
        message: response.data.message
      });
      
      // Reset form on success
      setCustomWord('');
      setCustomHint('');
      
      if (onWordsAdded) {
        onWordsAdded();
      }
    } catch (error: any) {
      console.error('Error adding custom word:', error);
      setCustomResult({
        success: false,
        message: error.response?.data?.error || 'Failed to add word. Please try again.'
      });
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Enrich German Word List</h2>
      
      {/* OpenThesaurus attribution */}
      <div className="bg-gray-100 p-3 rounded-lg mb-6 text-sm">
        <p>
          Word data provided by{' '}
          <a 
            href="https://www.openthesaurus.de" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            OpenThesaurus.de
          </a>
        </p>
        <p className="mt-2">
          <span className="font-medium">Note:</span> Words are stored in Redis and will persist between sessions.
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold mb-3">Find Related Words</h3>
        <form onSubmit={handleEnrichWords}>
          <div className="mb-4">
            <label htmlFor="searchTerm" className="block text-gray-700 mb-1">
              Search Term
            </label>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter a German word (e.g., wetter)"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="count" className="block text-gray-700 mb-1">
              Number of Words to Add
            </label>
            <input
              type="number"
              id="count"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-bold"
          >
            {loading ? 'Searching...' : 'Find Related Words'}
          </button>
          
          {result && (
            <div className={`mt-3 p-3 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {result.message}
            </div>
          )}
        </form>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-3">Add Custom Word</h3>
        <form onSubmit={handleAddCustomWord}>
          <div className="mb-4">
            <label htmlFor="customWord" className="block text-gray-700 mb-1">
              Word
            </label>
            <input
              type="text"
              id="customWord"
              value={customWord}
              onChange={(e) => setCustomWord(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter a German word"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="customHint" className="block text-gray-700 mb-1">
              Hint
            </label>
            <input
              type="text"
              id="customHint"
              value={customHint}
              onChange={(e) => setCustomHint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter a hint for the word"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="customDifficulty" className="block text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              id="customDifficulty"
              value={customDifficulty}
              onChange={(e) => setCustomDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={customLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-bold"
          >
            {customLoading ? 'Adding...' : 'Add Custom Word'}
          </button>
          
          {customResult && (
            <div className={`mt-3 p-3 rounded-md ${customResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {customResult.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
