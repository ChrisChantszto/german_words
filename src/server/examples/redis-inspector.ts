/**
 * Redis Inspector
 * 
 * A utility script to inspect Redis storage in the Devvit environment.
 * This script provides functions to:
 * 1. List all Redis keys
 * 2. View the content of string values
 * 3. View the content of hash values
 * 4. Delete keys
 */

import { redis } from '@devvit/redis';

/**
 * Available Redis data types
 */
type RedisDataType = 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream' | 'unknown';

/**
 * Check if specific Redis keys exist
 * Note: Devvit Redis doesn't support the KEYS command, so we use a predefined list of keys
 */
async function checkKeys(keys: string[]): Promise<string[]> {
  try {
    console.log(`Checking ${keys.length} predefined Redis keys:`);
    
    const existingKeys: string[] = [];
    
    // Check each key
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key) {
        const exists = await redis.exists(key);
        if (exists) {
          existingKeys.push(key);
          console.log(`${i + 1}. ${key}: exists`);
        } else {
          console.log(`${i + 1}. ${key}: does not exist`);
        }
      }
    }
    
    return existingKeys;
  } catch (error) {
    console.error('Error checking Redis keys:', error);
    return [];
  }
}

/**
 * Get the type of a Redis key
 */
async function getKeyType(key: string): Promise<RedisDataType> {
  try {
    const type = await redis.type(key) as RedisDataType;
    return type;
  } catch (error) {
    console.error(`Error getting type for key "${key}":`, error);
    return 'unknown';
  }
}

/**
 * View the content of a Redis key
 */
async function viewKey(key: string): Promise<void> {
  try {
    // Check if key exists
    const exists = await redis.exists(key);
    if (!exists) {
      console.log(`Key "${key}" does not exist.`);
      return;
    }
    
    // Get key type
    const type = await getKeyType(key);
    console.log(`Key: ${key} (Type: ${type})`);
    
    // View content based on type
    switch (type) {
      case 'string':
        await viewStringValue(key);
        break;
      case 'hash':
        await viewHashValue(key);
        break;
      case 'list':
        await viewListValue(key);
        break;
      case 'set':
        await viewSetValue(key);
        break;
      case 'zset':
        await viewZSetValue(key);
        break;
      default:
        console.log(`Viewing content for type "${type}" is not supported.`);
    }
  } catch (error) {
    console.error(`Error viewing key "${key}":`, error);
  }
}

/**
 * View the content of a Redis string value
 */
async function viewStringValue(key: string): Promise<void> {
  try {
    const value = await redis.get(key);
    console.log('Value:');
    
    // Try to parse as JSON
    try {
      const jsonValue = JSON.parse(value || '');
      console.log(JSON.stringify(jsonValue, null, 2));
    } catch {
      // Not JSON, display as plain string
      console.log(value);
    }
  } catch (error) {
    console.error(`Error viewing string value for key "${key}":`, error);
  }
}

/**
 * View the content of a Redis hash value
 */
async function viewHashValue(key: string): Promise<void> {
  try {
    const hash = await redis.hGetAll(key);
    const fields = Object.keys(hash);
    
    console.log(`Hash with ${fields.length} fields:`);
    
    if (fields.length === 0) {
      console.log('(empty hash)');
      return;
    }
    
    // Display all fields and values
    fields.forEach(field => {
      console.log(`- ${field}: ${hash[field]}`);
    });
  } catch (error) {
    console.error(`Error viewing hash value for key "${key}":`, error);
  }
}

/**
 * Note: List operations are not fully supported in Devvit Redis
 * This is just a placeholder function
 */
async function viewListValue(key: string): Promise<void> {
  try {
    console.log(`List operations not fully supported in Devvit Redis for key "${key}"`);
    console.log('Please use string or hash operations instead.');
  } catch (error) {
    console.error(`Error viewing list value for key "${key}":`, error);
  }
}

/**
 * Note: Set operations are not fully supported in Devvit Redis
 * This is just a placeholder function
 */
async function viewSetValue(key: string): Promise<void> {
  try {
    console.log(`Set operations not fully supported in Devvit Redis for key "${key}"`);
    console.log('Please use string or hash operations instead.');
  } catch (error) {
    console.error(`Error viewing set value for key "${key}":`, error);
  }
}

/**
 * View the content of a Redis sorted set value
 */
async function viewZSetValue(key: string): Promise<void> {
  try {
    // Check if key exists
    const exists = await redis.exists(key);
    if (!exists) {
      console.log(`Key "${key}" does not exist.`);
      return;
    }
    
    // Get all members (without scores since withScores is not supported)
    const members = await redis.zRange(key, 0, -1);
    
    console.log(`Sorted set with ${members.length} members:`);
    
    if (members.length === 0) {
      console.log('(empty sorted set)');
      return;
    }
    
    // Display members (without scores)
    members.forEach(member => {
      console.log(`- ${member}`);
    });
  } catch (error) {
    console.error(`Error viewing sorted set value for key "${key}":`, error);
  }
}

/**
 * Delete a Redis key if it exists
 */
async function deleteKey(key: string): Promise<void> {
  try {
    // Check if key exists first
    const exists = await redis.exists(key);
    if (!exists) {
      console.log(`Key "${key}" does not exist`);
      return;
    }
    
    // Delete the key
    await redis.del(key);
    console.log(`Successfully deleted key "${key}"`);
  } catch (error) {
    console.error(`Error deleting key "${key}":`, error);
  }
}

/**
 * Run the Redis inspector
 */
async function runInspector(): Promise<void> {
  console.log('=== Redis Inspector ===\n');
  
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
  
  // Check keys
  console.log('Checking Redis keys:');
  const existingKeys = await checkKeys(keysToCheck);
  
  if (existingKeys.length === 0) {
    console.log('No Redis keys found. Try adding some data first.');
    return;
  }
  
  // Categorize keys
  const germanWordsKeys = existingKeys.filter(key => key.startsWith('german_words:'));
  const userKeys = existingKeys.filter(key => key.startsWith('user:'));
  
  // View content of German words keys
  if (germanWordsKeys.length > 0) {
    console.log('\nViewing content of German words keys:');
    for (const key of germanWordsKeys) {
      console.log('\n-----------------------------------');
      await viewKey(key);
    }
  }
  
  // View content of a few user keys (if any)
  if (userKeys.length > 0) {
    console.log('\nViewing content of a sample of user keys:');
    const sampleSize = Math.min(userKeys.length, 5);
    for (let i = 0; i < sampleSize; i++) {
      const key = userKeys[i];
      if (key) {
        console.log('\n-----------------------------------');
        await viewKey(key);
      }
    }
    
    if (userKeys.length > sampleSize) {
      console.log(`\n... and ${userKeys.length - sampleSize} more user keys (showing first ${sampleSize} only)`);
    }
  }
  
  console.log('\n=== Inspection Complete ===');
}

// Run the inspector
runInspector().catch(error => {
  console.error('Error running Redis inspector:', error);
});
