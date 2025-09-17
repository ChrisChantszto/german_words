/**
 * Redis Viewer
 * 
 * A simplified utility script to view Redis data in the Devvit environment.
 * This script is compatible with the limited Redis API provided by Devvit.
 */

import { redis } from '@devvit/redis';
import { WordEnricherRedis } from '../lib/word-enricher-redis';

/**
 * View the content of a Redis hash
 */
async function viewRedisHash(key: string): Promise<void> {
  try {
    console.log(`\nContents of Redis hash "${key}":`);
    
    // Check if key exists
    const exists = await redis.exists(key);
    if (!exists) {
      console.log(`(key does not exist)`);
      return;
    }
    
    // Get all hash fields and values
    const hash = await redis.hGetAll(key);
    const fields = Object.keys(hash);
    
    if (fields.length === 0) {
      console.log('(empty hash)');
      return;
    }
    
    // Print each word and its hint
    fields.forEach((word) => {
      console.log(`- "${word}": "${hash[word]}"`);
    });
    
    console.log(`Total: ${fields.length} items`);
  } catch (error) {
    console.error(`Error viewing Redis hash "${key}":`, error);
  }
}

/**
 * View the content of a Redis string
 */
async function viewRedisString(key: string): Promise<void> {
  try {
    console.log(`\nContents of Redis string "${key}":`);
    
    // Check if key exists
    const exists = await redis.exists(key);
    if (!exists) {
      console.log(`(key does not exist)`);
      return;
    }
    
    // Get string value
    const value = await redis.get(key);
    
    // Try to parse as JSON
    try {
      const jsonValue = JSON.parse(value || '');
      console.log(JSON.stringify(jsonValue, null, 2));
    } catch {
      // Not JSON, display as plain string
      console.log(value);
    }
  } catch (error) {
    console.error(`Error viewing Redis string "${key}":`, error);
  }
}

/**
 * View German words in Redis
 */
async function viewGermanWords(): Promise<void> {
  try {
    console.log('\n=== German Words in Redis ===');
    
    // Initialize WordEnricherRedis
    await WordEnricherRedis.initialize();
    
    // Get all words
    const words = await WordEnricherRedis.getAllWords();
    
    // Print summary
    console.log('\nWord counts:');
    console.log(`- Easy: ${words.easy.length} words`);
    console.log(`- Medium: ${words.medium.length} words`);
    console.log(`- Hard: ${words.hard.length} words`);
    console.log(`- Total: ${words.easy.length + words.medium.length + words.hard.length} words`);
    
    // View the Redis hashes
    await viewRedisHash('german_words:easy');
    await viewRedisHash('german_words:medium');
    await viewRedisHash('german_words:hard');
  } catch (error) {
    console.error('Error viewing German words:', error);
  }
}

/**
 * View user data in Redis
 */
async function viewUserData(): Promise<void> {
  try {
    console.log('\n=== User Data in Redis ===');
    
    // Since we can't list keys in Devvit Redis, we'll check for some common user IDs
    const testUserIds = ['t2_test', 'user123', 'admin'];
    
    for (const userId of testUserIds) {
      // Check if user exists
      const userKey = `user:${userId}:streak`;
      const exists = await redis.exists(userKey);
      
      if (exists) {
        console.log(`\nFound user: ${userId}`);
        
        // View user state
        const streak = await redis.get(`user:${userId}:streak`);
        const maxStreak = await redis.get(`user:${userId}:maxStreak`);
        const lastPlayed = await redis.get(`user:${userId}:lastPlayed`);
        
        console.log(`- Streak: ${streak || 0}`);
        console.log(`- Max Streak: ${maxStreak || 0}`);
        console.log(`- Last Played: ${lastPlayed || 'never'}`);
      }
    }
  } catch (error) {
    console.error('Error viewing user data:', error);
  }
}

/**
 * Add test data to Redis
 */
async function addTestData(): Promise<void> {
  try {
    console.log('\n=== Adding Test Data to Redis ===');
    
    // Add some test words
    await WordEnricherRedis.addWord('schmetterling', 'A colorful flying insect', 'medium');
    await WordEnricherRedis.addWord('regenbogen', 'Colorful arc in the sky after rain', 'medium');
    await WordEnricherRedis.addWord('sonnenschein', 'Bright light from the sky during day', 'hard');
    
    // Add some test user data
    await redis.set('user:t2_test:streak', '3');
    await redis.set('user:t2_test:maxStreak', '5');
    await redis.set('user:t2_test:lastPlayed', new Date().toISOString().slice(0, 10));
    
    console.log('Test data added successfully');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

/**
 * Run the Redis viewer
 */
async function runViewer(): Promise<void> {
  console.log('=== Redis Viewer ===');
  
  // Add test data
  await addTestData();
  
  // View German words
  await viewGermanWords();
  
  // View user data
  await viewUserData();
  
  // View specific keys
  await viewRedisString('hangman:game:2025-09-17:de:hangman');
  
  console.log('\n=== Viewing Complete ===');
}

// Run the viewer
runViewer().catch(error => {
  console.error('Error running Redis viewer:', error);
});
