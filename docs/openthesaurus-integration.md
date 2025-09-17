# OpenThesaurus API Integration

This document explains how to use the OpenThesaurus API integration to enhance the German word list for the Hangman game.

## Overview

The OpenThesaurus API integration allows you to:

1. Search for German words using various criteria
2. Find synonyms for German words
3. Enrich the word list with related words
4. Add custom words to the collection

## API Attribution

When using the OpenThesaurus API, you must include attribution according to their terms:

1. Include a visible link to [OpenThesaurus.de](https://www.openthesaurus.de) on any page that displays data from the API
2. Set a User-Agent header with contact information in all API requests
3. Respect the rate limit of 60 requests per minute

## Usage Examples

### Searching for Words

```typescript
import { OpenThesaurusAPI } from '../lib/openthesaurus-api';

// Find words starting with a prefix
const wordsStartingWithHaus = await OpenThesaurusAPI.getWordsStartingWith('haus');

// Find words containing a substring
const wordsWithWetter = await OpenThesaurusAPI.getWordsWithSubstring('wetter');

// Find similar words (for typo suggestions)
const similarWords = await OpenThesaurusAPI.getSimilarWords('schule');
```

### Finding Synonyms

```typescript
import { OpenThesaurusAPI } from '../lib/openthesaurus-api';

// Get synonyms for a word
const synonyms = await OpenThesaurusAPI.getSynonyms('schnell');
```

### Enriching the Word List

```typescript
import { enrichWordList } from '../lib/german-words';

// Add words related to "wetter" (weather)
const addedCount = await enrichWordList('wetter', 10);
console.log(`Added ${addedCount} new words`);
```

### Adding Custom Words

```typescript
import { addCustomWord } from '../lib/german-words';

// Add a custom word with hint and difficulty
const added = await addCustomWord(
  'regenschirm',
  'You use this when it rains',
  'medium'
);

if (added) {
  console.log('Word added successfully');
} else {
  console.log('Word already exists in the collection');
}
```

### Getting All Words

```typescript
import { WordEnricher } from '../lib/word-enricher';

// Get all words (original + enriched)
const allWords = await WordEnricher.getAllWords();

// Get words for a specific difficulty
const mediumWords = await WordEnricher.getWords('medium');
```

## Word Storage

Enriched words are stored in a cache file to persist between application restarts. The cache is located at:

```
/cache/enriched-words.json
```

## API Endpoints

The following API endpoints are available for managing words:

- `GET /api/words` - Get all words by difficulty
- `GET /api/words/:difficulty` - Get words by difficulty level
- `POST /api/words/enrich` - Enrich the word list with related words
- `POST /api/words/add` - Add a custom word to the list

## UI Component

A React component `WordEnricher` is available for adding words through the UI. It provides forms for:

1. Finding related words using a search term
2. Adding custom words with hints and difficulty levels

## Difficulty Estimation

Words are automatically categorized by difficulty based on their length:

- **Easy**: 1-5 characters
- **Medium**: 6-9 characters
- **Hard**: 10+ characters
