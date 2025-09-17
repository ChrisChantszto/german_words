import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RedisStats {
  germanWordsKeys: string[];
  wordCounts: {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  };
}

export const RedisStatus: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RedisStats | null>(null);
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    fetchRedisStatus();
  }, []);

  const fetchRedisStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/redis/status');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching Redis status:', err);
      setError('Failed to fetch Redis status');
    } finally {
      setLoading(false);
    }
  };

  const runRedisTest = async () => {
    setRunningTest(true);
    setTestResult(null);
    
    try {
      const response = await axios.post('/api/redis/test');
      setTestResult(response.data);
      
      // Refresh stats after test
      fetchRedisStatus();
    } catch (err) {
      console.error('Error running Redis test:', err);
      setTestResult({
        success: false,
        message: 'Failed to run Redis test'
      });
    } finally {
      setRunningTest(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-gray-500">Loading Redis status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
          onClick={fetchRedisStatus}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Redis Status</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
          onClick={fetchRedisStatus}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {stats && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-semibold mb-2">Word Counts</h3>
              <ul className="text-sm">
                <li>Easy: {stats.wordCounts.easy} words</li>
                <li>Medium: {stats.wordCounts.medium} words</li>
                <li>Hard: {stats.wordCounts.hard} words</li>
                <li className="font-bold mt-1">Total: {stats.wordCounts.total} words</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-semibold mb-2">Redis Keys</h3>
              <ul className="text-sm">
                {stats.germanWordsKeys.map((key, index) => (
                  <li key={index}>{key}</li>
                ))}
                {stats.germanWordsKeys.length === 0 && (
                  <li className="text-gray-500">No keys found</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <button
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          onClick={runRedisTest}
          disabled={runningTest}
        >
          {runningTest ? 'Running Test...' : 'Run Redis Test'}
        </button>
        
        {testResult && (
          <div className={`mt-4 p-4 rounded ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold mb-2">{testResult.success ? 'Test Successful' : 'Test Failed'}</h3>
            <p>{testResult.message}</p>
            
            {testResult.success && testResult.results && (
              <div className="mt-2">
                <p>Added {testResult.results.addedTestWords} test words</p>
                <p>Added {testResult.results.enrichedWords} enriched words</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
