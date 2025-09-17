/**
 * Redis Test Script
 * 
 * This script demonstrates how to:
 * 1. View all words stored in Redis
 * 2. Test the WordEnricherRedis functionality
 * 3. Inspect Redis keys and values
 */

import { redis } from '@devvit/redis';
import { WordEnricherRedis } from '../lib/word-enricher-redis';
import { OpenThesaurusAPI } from '../lib/openthesaurus-api';
// Note: Base JSON word list removed from runtime path; we operate Redis-only now.

/**
 * Check if specific Redis keys exist
 * Note: Devvit Redis doesn't support the KEYS command, so we use a predefined list of keys
 */
async function checkRedisKeys(keys: string[]): Promise<string[]> {
  try {
    console.log(`Checking ${keys.length} predefined Redis keys:`);
    
    const existingKeys: string[] = [];
    
    // Check each key
    for (const key of keys) {
      const exists = await redis.exists(key);
      if (exists) {
        existingKeys.push(key);
        console.log(`- ${key}: exists`);
      } else {
        console.log(`- ${key}: does not exist`);
      }
    }
    
    return existingKeys;
  } catch (error) {
    console.error('Error checking Redis keys:', error);
    return [];
  }
}

/**
 * View content of a Redis hash
 */
async function viewRedisHash(key: string): Promise<void> {
  try {
    const hash = await redis.hGetAll(key);
    console.log(`Contents of Redis hash "${key}":`);
    
    if (!hash || Object.keys(hash).length === 0) {
      console.log('(empty)');
      return;
    }
    
    // Print each word and its hint
    Object.entries(hash).forEach(([word, hint]) => {
      console.log(`- "${word}": "${hint}"`);
    });
    
    console.log(`Total: ${Object.keys(hash).length} items`);
  } catch (error) {
    console.error(`Error viewing Redis hash "${key}":`, error);
  }
}

/**
 * Add test words to Redis
 */
async function addTestWords(): Promise<void> {
  try {
    console.log('Adding test words to Redis...');
    
    // Initialize Redis-backed word pools
    await WordEnricherRedis.initialize();
    
    // Add some test words
    const words = [
      { word: 'apfel', hint: 'A fruit', difficulty: 'easy' as const },
      { word: 'banane', hint: 'A yellow fruit', difficulty: 'easy' as const },
      { word: 'computer', hint: 'An electronic device', difficulty: 'medium' as const },
      { word: 'bibliothek', hint: 'A place with books', difficulty: 'medium' as const },
      { word: 'universität', hint: 'A place of higher education', difficulty: 'hard' as const }
    ];
    
    for (const { word, hint, difficulty } of words) {
      const added = await WordEnricherRedis.addWord(word, hint, difficulty);
      console.log(`Added "${word}" (${difficulty}): ${added ? 'success' : 'already exists'}`);
    }
    
    // Add words from OpenThesaurus
    console.log('\nAdding words from OpenThesaurus...');
    const searchTerms = ['wetter', 'essen', 'sport'];
    
    for (const term of searchTerms) {
      console.log(`\nSearching for words related to "${term}"...`);
      const count = await WordEnricherRedis.searchAndAddWords(term, 3);
      console.log(`Added ${count} words related to "${term}"`);
    }
  } catch (error) {
    console.error('Error adding test words:', error);
  }
}

/**
 * View all words in memory
 */
async function viewAllWords(): Promise<void> {
  try {
    const words = await WordEnricherRedis.getAllWords();
    
    console.log('\nAll words in memory:');
    console.log(`- Easy: ${words.easy.length} words`);
    console.log(`- Medium: ${words.medium.length} words`);
    console.log(`- Hard: ${words.hard.length} words`);
    console.log(`- Total: ${words.easy.length + words.medium.length + words.hard.length} words`);
  } catch (error) {
    console.error('Error viewing all words:', error);
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log('=== Redis Test Script ===\n');
  
  // Define the keys we want to check
  const germanWordKeys = [
    'german_words:easy',
    'german_words:medium',
    'german_words:hard'
  ];
  
  // Check Redis keys (before adding words)
  console.log('Redis keys before adding words:');
  await checkRedisKeys(germanWordKeys);
  
  // Add test words
  await addTestWords();
  
  // Check Redis keys (after adding words)
  console.log('\nRedis keys after adding words:');
  const existingKeys = await checkRedisKeys(germanWordKeys);
  
  // View content of each hash
  console.log('\nViewing content of each Redis hash:');
  for (const key of existingKeys) {
    console.log('\n-----------------------------------');
    await viewRedisHash(key);
  }
  
  // View all words in memory
  await viewAllWords();
  
  console.log('\n=== Test Complete ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
