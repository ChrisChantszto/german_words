/**
 * API routes for managing German words
 */
import express from 'express';
import { addCustomWord } from '../lib/german-words';
import { WordEnricherRedis } from '../lib/word-enricher-redis';
import { HangmanDifficulty } from '../../shared/types/api';

const router = express.Router();

/**
 * GET /api/words
 * Get all words by difficulty
 */
router.get('/', async (_req, res) => {
  try {
    const words = await WordEnricherRedis.getAllWords();
    res.json({
      success: true,
      data: words,
      counts: {
        easy: words.easy.length,
        medium: words.medium.length,
        hard: words.hard.length,
        total: words.easy.length + words.medium.length + words.hard.length
      }
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch words'
    });
  }
});

/**
 * POST /api/words/enrich/random
 * Randomly enrich the word list using a random seed term and count.
 * Useful for background enrichment to grow the Redis-backed pool organically.
 */
router.post('/enrich/random', async (_req, res) => {
  try {
    // Randomize desired count 4..8
    const count = 4 + Math.floor(Math.random() * 5);
    const addedCount = await WordEnricherRedis.enrichWithRandomGermanWords(count);

    res.json({
      success: true,
      source: 'random-words-api',
      requested: count,
      addedCount
    });
  } catch (error) {
    console.error('Error enriching word list randomly:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to randomly enrich word list'
    });
  }
});

/**
 * GET /api/words/:difficulty
 * Get words by difficulty level
 */
router.get('/:difficulty', async (req, res) => {
  try {
    const difficulty = req.params.difficulty as HangmanDifficulty;
    
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level. Must be easy, medium, or hard.'
      });
    }
    
    const words = await WordEnricherRedis.getWords(difficulty);
    res.json({
      success: true,
      data: words,
      count: words.length
    });
  } catch (error) {
    console.error('Error fetching words by difficulty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch words'
    });
  }
});

/**
 * POST /api/words/enrich
 * Enrich the word list with words related to a search term
 */
router.post('/enrich', async (req, res) => {
  try {
    // Support an optional count; ignore any searchTerm to use pure random source
    const { count = 10 } = req.body || {};
    const capped = Math.min(Math.max(Number(count) || 10, 1), 20);
    const addedCount = await WordEnricherRedis.enrichWithRandomGermanWords(capped);
    res.json({
      success: true,
      addedCount,
      message: `Added ${addedCount} random German words`
    });
  } catch (error) {
    console.error('Error enriching word list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich word list'
    });
  }
});

/**
 * POST /api/words/add
 * Add a custom word to the list
 */
router.post('/add', async (req, res) => {
  try {
    const { word, hint, difficulty } = req.body;
    
    if (!word || !hint) {
      return res.status(400).json({
        success: false,
        error: 'Word and hint are required'
      });
    }
    
    const added = await addCustomWord(word, hint, difficulty);
    
    if (added) {
      res.json({
        success: true,
        message: `Successfully added "${word}" to the word list`
      });
    } else {
      res.status(409).json({
        success: false,
        error: `Word "${word}" already exists in the list`
      });
    }
  } catch (error) {
    console.error('Error adding custom word:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add custom word'
    });
  }
});

export default router;
