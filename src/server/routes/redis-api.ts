/**
 * API routes for testing Redis storage
 */
import express from 'express';
import { redis } from '@devvit/redis';
import { GameStorage } from '../lib/storage';
import { WordEnricherRedis } from '../lib/word-enricher-redis';

const router = express.Router();

/**
 * GET /api/redis/status
 * Get Redis status and statistics
 */
router.get('/status', async (_req, res) => {
  try {
    // Initialize WordEnricherRedis
    await WordEnricherRedis.initialize();
    
    // Get stats
    const stats = await GameStorage.viewRedisStats();
    
    res.json({
      success: true,
      status: 'Redis is operational',
      stats
    });
  } catch (error) {
    console.error('Error getting Redis status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Redis status'
    });
  }
});

/**
 * POST /api/redis/test
 * Run Redis tests
 */
router.post('/test', async (_req, res) => {
  try {
    console.log('Running Redis tests...');
    
    // Initialize WordEnricherRedis
    await WordEnricherRedis.initialize();
    
    // Add some test words
    const testWords = [
      { word: 'apfel', hint: 'A fruit', difficulty: 'easy' as const },
      { word: 'banane', hint: 'A yellow fruit', difficulty: 'easy' as const },
      { word: 'computer', hint: 'An electronic device', difficulty: 'medium' as const },
      { word: 'bibliothek', hint: 'A place with books', difficulty: 'medium' as const },
      { word: 'universität', hint: 'A place of higher education', difficulty: 'hard' as const }
    ];
    
    const addedCount = await GameStorage.addTestWords(testWords);
    
    // Enrich with OpenThesaurus
    const searchTerms = ['wetter', 'essen', 'sport'];
    let enrichedCount = 0;
    
    for (const term of searchTerms) {
      const count = await GameStorage.enrichWordsWithTerm(term, 3);
      enrichedCount += count;
    }
    
    // Get stats
    const stats = await GameStorage.viewRedisStats();
    
    res.json({
      success: true,
      message: 'Redis tests completed successfully',
      results: {
        addedTestWords: addedCount,
        enrichedWords: enrichedCount,
        germanWordsKeys: stats.germanWordsKeys,
        wordCounts: stats.wordCounts
      }
    });
  } catch (error) {
    console.error('Error running Redis tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run Redis tests'
    });
  }
});

/**
 * GET /api/redis/keys
 * Check specific Redis keys
 */
router.get('/keys', async (_req, res) => {
  try {
    // Define the keys we want to check
    const keysToCheck = [
      // German words keys
      'german_words:easy',
      'german_words:medium',
      'german_words:hard',
      // User keys (examples)
      'user:t2_test:streak',
      'user:t2_test:maxStreak',
      'user:t2_test:lastPlayed',
      // Game keys (examples)
      'hangman:game:2025-09-17:de:hangman'
    ];
    
    // Check each key
    const keyStatus: Record<string, boolean> = {};
    
    for (const key of keysToCheck) {
      if (key) {
        const exists = await redis.exists(key);
        keyStatus[key] = !!exists;
      }
    }
    
    res.json({
      success: true,
      keyStatus
    });
  } catch (error) {
    console.error('Error checking Redis keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Redis keys'
    });
  }
});

/**
 * GET /api/redis/hash/:key
 * View contents of a Redis hash
 */
router.get('/hash/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    // Check if key exists
    const exists = await redis.exists(key);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: `Key "${key}" does not exist`
      });
    }
    
    // Get hash contents
    const hash = await redis.hGetAll(key);
    
    res.json({
      success: true,
      key,
      type: 'hash',
      data: hash,
      count: Object.keys(hash).length
    });
  } catch (error) {
    console.error(`Error viewing Redis hash "${req.params.key}":`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to view Redis hash'
    });
  }
});

export default router;
