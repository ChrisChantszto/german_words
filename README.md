# German Hangman Game for Reddit

A German language learning game built on Reddit's Devvit platform. Test your German vocabulary with a classic Hangman game featuring words from various categories and difficulty levels.

## Features

- **German Vocabulary**: Learn and practice German words across multiple categories
- **Difficulty Levels**: Words categorized as easy, medium, or hard based on length and complexity
- **Dynamic Word Pool**: Words are fetched from Random Words API and stored in Redis
- **Hint System**: Each word comes with a helpful hint to guide players
- **Score Tracking**: Track your performance with a scoring system and streaks
- **Admin Tools**: Moderators can add custom words and enrich the word pool

## How to Play

1. Start a new game by selecting a difficulty level (easy, medium, or hard)
2. Guess letters by clicking on the on-screen keyboard
3. Each incorrect guess adds a part to the hangman drawing
4. You win if you guess the word before the hangman is complete (6 incorrect guesses)
5. Use the provided hint if you're stuck!

## Technical Architecture

### Data Flow

1. **Word Source**: German words are fetched from [Random Words API](https://random-words-api.kushcreates.com)
2. **Persistence**: All words are stored in Redis for fast retrieval and to avoid repeated API calls
3. **Enrichment**: The word pool grows automatically when:
   - The app initializes
   - A word is needed but Redis is empty for that difficulty level
   - A moderator triggers manual enrichment

### Key Components

- **Word Enricher**: Fetches random German words with various categories and lengths
- **Difficulty Estimator**: Categorizes words as easy (≤5 letters), medium (6-9 letters), or hard (≥10 letters)
- **Redis Storage**: Words stored in hash tables by difficulty level
- **Hangman Game Logic**: Manages game state, scoring, and user interaction

## Development

### Prerequisites

- Node.js 22 or higher
- Reddit developer account
- Devvit CLI installed (`npm install -g @devvit/cli`)

### Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Test in the Devvit playground

### Configuration

The app requires HTTP access to external domains:
- `random-words-api.kushcreates.com`: For fetching German words
- `api.open-thesaurus.de`: Alternative word source (legacy)

These domains must be approved in your Devvit Developer Settings.

### Redis Data Structure

Words are stored in Redis using the following keys:
- `german_words:easy`: Easy difficulty words
- `german_words:medium`: Medium difficulty words
- `german_words:hard`: Hard difficulty words

Each key contains a hash mapping words to their hints.

## Admin Features

Moderators have access to:
- **Word Manager**: View all words in the Redis store
- **Word Enricher**: Add random words from the Random Words API
- **Custom Word Tool**: Add specific words with custom hints and difficulty levels
- **Redis Inspector**: View and manage the Redis data store

## Credits

- Word data provided by [Random Words API](https://random-words-api.kushcreates.com)
- Built with [Devvit](https://developers.reddit.com/), [React](https://react.dev/), and [Express](https://expressjs.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## License

[MIT License](LICENSE)

## Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit.
- `npm run build`: Builds your client and server projects
- `npm run deploy`: Uploads a new version of your app
- `npm run launch`: Publishes your app for review
- `npm run login`: Logs your CLI into Reddit
- `npm run check`: Type checks, lints, and prettifies your app

## Cursor Integration

This template comes with a pre-configured cursor environment. To get started, [download cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted.
