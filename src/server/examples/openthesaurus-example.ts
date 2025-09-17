/**
 * Example usage of the OpenThesaurus API integration
 * 
 * This file demonstrates how to use the OpenThesaurus API to:
 * 1. Search for German words
 * 2. Find synonyms
 * 3. Enrich the word list
 * 4. Add custom words
 */

import { OpenThesaurusAPI } from '../lib/openthesaurus-api';
import { enrichWordList, addCustomWord } from '../lib/german-words';
import { WordEnricherRedis } from '../lib/word-enricher-redis';

/**
 * Example 1: Search for words starting with a prefix
 */
async function searchWordsExample() {
  console.log('Example 1: Searching for words starting with "haus"');
  
  try {
    const words = await OpenThesaurusAPI.getWordsStartingWith('haus');
    console.log(`Found ${words.length} words starting with "haus":`);
    console.log(words.slice(0, 10)); // Show first 10 results
  } catch (error) {
    console.error('Error searching for words:', error);
  }
}

/**
 * Example 2: Find synonyms for a word
 */
async function findSynonymsExample() {
  console.log('\nExample 2: Finding synonyms for "schnell"');
  
  try {
    const synonyms = await OpenThesaurusAPI.getSynonyms('schnell');
    console.log(`Found ${synonyms.length} synonyms for "schnell":`);
    console.log(synonyms);
  } catch (error) {
    console.error('Error finding synonyms:', error);
  }
}

/**
 * Example 3: Enrich the word list with new words
 */
async function enrichWordListExample() {
  console.log('\nExample 3: Enriching word list with words related to "wetter" (weather)');
  
  try {
    // Before enrichment
    const beforeCount = (await WordEnricherRedis.getAllWords()).medium.length;
    console.log(`Before enrichment: ${beforeCount} medium difficulty words`);
    
    // Enrich with weather-related words
    const addedCount = await enrichWordList('wetter', 5);
    console.log(`Added ${addedCount} new words related to "wetter"`);
    
    // After enrichment
    const afterCount = (await WordEnricherRedis.getAllWords()).medium.length;
    console.log(`After enrichment: ${afterCount} medium difficulty words`);
  } catch (error) {
    console.error('Error enriching word list:', error);
  }
}

/**
 * Example 4: Add a custom word with hint
 */
async function addCustomWordExample() {
  console.log('\nExample 4: Adding a custom word');
  
  try {
    const added = await addCustomWord(
      'regenschirm',
      'You use this when it rains',
      'medium'
    );
    
    if (added) {
      console.log('Successfully added "regenschirm" to the word list');
    } else {
      console.log('Word "regenschirm" already exists in the list');
    }
  } catch (error) {
    console.error('Error adding custom word:', error);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('OpenThesaurus API Integration Examples\n');
  
  // Initialize WordEnricherRedis
  await WordEnricherRedis.initialize();
  
  // Print current Redis-backed word counts
  const initial = await WordEnricherRedis.getAllWords();
  console.log('Current word counts (Redis):');
  console.log(`Easy: ${initial.easy.length} words`);
  console.log(`Medium: ${initial.medium.length} words`);
  console.log(`Hard: ${initial.hard.length} words`);
  console.log('');
  
  // Run examples
  await searchWordsExample();
  await findSynonymsExample();
  await enrichWordListExample();
  await addCustomWordExample();
  
  // Print final word counts
  const enrichedWords = await WordEnricherRedis.getAllWords();
  console.log('\nFinal word counts after enrichment:');
  console.log(`Easy: ${enrichedWords.easy.length} words`);
  console.log(`Medium: ${enrichedWords.medium.length} words`);
  console.log(`Hard: ${enrichedWords.hard.length} words`);
}

// Run the examples
runExamples().catch(error => {
  console.error('Error running examples:', error);
});
