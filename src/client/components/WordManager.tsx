import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HangmanDifficulty } from '../../shared/types/api';

interface Word {
  word: string;
  hint: string;
}

interface WordsByDifficulty {
  easy: Word[];
  medium: Word[];
  hard: Word[];
}

export const WordManager: React.FC = () => {
  const [words, setWords] = useState<WordsByDifficulty>({ easy: [], medium: [], hard: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HangmanDifficulty>('medium');
  
  // For adding new words
  const [searchTerm, setSearchTerm] = useState('');
  const [count, setCount] = useState(5);
  const [addingWords, setAddingWords] = useState(false);
  const [addResult, setAddResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // For adding custom words
  const [customWord, setCustomWord] = useState('');
  const [customHint, setCustomHint] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<HangmanDifficulty>('medium');
  const [addingCustomWord, setAddingCustomWord] = useState(false);
  const [customWordResult, setCustomWordResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load words on component mount
  useEffect(() => {
    loadWords();
  }, []);

  // Load words from the server
  const loadWords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/words');
      setWords(response.data.data);
    } catch (err) {
      console.error('Error loading words:', err);
      setError('Failed to load words. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding words from OpenThesaurus
  const handleAddWords = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setAddingWords(true);
    setAddResult(null);
    
    try {
      const response = await axios.post('/api/words/enrich', {
        searchTerm: searchTerm.trim(),
        count
      });
      
      setAddResult({
        success: true,
        message: `Added ${response.data.addedCount} new words related to "${searchTerm}"`
      });
      
      // Reload words to show the new additions
      loadWords();
    } catch (err) {
      console.error('Error adding words:', err);
      setAddResult({
        success: false,
        message: 'Failed to add words. Please try again.'
      });
    } finally {
      setAddingWords(false);
    }
  };

  // Handle adding a custom word
  const handleAddCustomWord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customWord.trim() || !customHint.trim()) return;
    
    setAddingCustomWord(true);
    setCustomWordResult(null);
    
    try {
      const response = await axios.post('/api/words/add', {
        word: customWord.trim().toLowerCase(),
        hint: customHint.trim(),
        difficulty: customDifficulty
      });
      
      setCustomWordResult({
        success: true,
        message: `Successfully added "${customWord}" to the word list`
      });
      
      // Reset form on success
      setCustomWord('');
      setCustomHint('');
      
      // Reload words to show the new addition
      loadWords();
    } catch (err: any) {
      console.error('Error adding custom word:', err);
      setCustomWordResult({
        success: false,
        message: err.response?.data?.error || 'Failed to add word. Please try again.'
      });
    } finally {
      setAddingCustomWord(false);
    }
  };

  // Render loading state
  if (loading && !words.easy.length && !words.medium.length && !words.hard.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading words...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // Get active words based on selected tab
  const activeWords = words[activeTab] || [];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">German Word Manager</h1>
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Word list section */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Word List</h2>
            
            {/* Difficulty tabs */}
            <div className="flex border-b mb-4">
              <button
                className={`py-2 px-4 ${activeTab === 'easy' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
                onClick={() => setActiveTab('easy')}
              >
                Easy ({words.easy.length})
              </button>
              <button
                className={`py-2 px-4 ${activeTab === 'medium' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
                onClick={() => setActiveTab('medium')}
              >
                Medium ({words.medium.length})
              </button>
              <button
                className={`py-2 px-4 ${activeTab === 'hard' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
                onClick={() => setActiveTab('hard')}
              >
                Hard ({words.hard.length})
              </button>
            </div>
            
            {/* Word list */}
            <div className="h-64 overflow-y-auto border rounded-md">
              {activeWords.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No words found for this difficulty level.
                </div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Word
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hint
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeWords.map((word, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {word.word}
                        </td>
                        <td className="px-4 py-2">
                          {word.hint}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              Total: {words.easy.length + words.medium.length + words.hard.length} words
              <button 
                className="ml-4 text-blue-500 hover:underline"
                onClick={loadWords}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Add words section */}
        <div>
          {/* Add words from OpenThesaurus */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">Find Related Words</h2>
            <form onSubmit={handleAddWords}>
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
                disabled={addingWords}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-bold"
              >
                {addingWords ? 'Searching...' : 'Find Related Words'}
              </button>
              
              {addResult && (
                <div className={`mt-3 p-3 rounded-md ${addResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {addResult.message}
                </div>
              )}
            </form>
          </div>
          
          {/* Add custom word */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-3">Add Custom Word</h2>
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
                  onChange={(e) => setCustomDifficulty(e.target.value as HangmanDifficulty)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={addingCustomWord}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-bold"
              >
                {addingCustomWord ? 'Adding...' : 'Add Custom Word'}
              </button>
              
              {customWordResult && (
                <div className={`mt-3 p-3 rounded-md ${customWordResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {customWordResult.message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
