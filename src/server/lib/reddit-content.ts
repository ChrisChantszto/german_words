import { reddit } from '@devvit/web/server';
import { WordMatchItem, WordMatchDaily } from '../../shared/types/api';
import { GameStorage } from './storage';

// Default subreddit to fetch content from
const DEFAULT_SUBREDDIT = 'German'; // or any German language learning subreddit

// Map of English words to German translations based on common Reddit topics
// This will be used as a fallback and to map post titles to translations
const TOPIC_TRANSLATIONS: Record<string, string[]> = {
  'learn': ['lernen', 'studieren', 'üben'],
  'help': ['Hilfe', 'helfen', 'unterstützen'],
  'question': ['Frage', 'fragen', 'Anfrage'],
  'beginner': ['Anfänger', 'Neuling', 'Einsteiger'],
  'practice': ['Übung', 'üben', 'praktizieren'],
  'grammar': ['Grammatik', 'Sprachlehre', 'Syntax'],
  'vocabulary': ['Wortschatz', 'Vokabular', 'Wörter'],
  'deutsch': ['Deutsch', 'deutsche Sprache', 'Germanisch'],
  'language': ['Sprache', 'Sprachkenntnisse', 'Linguistik'],
  'course': ['Kurs', 'Lehrgang', 'Unterricht'],
  'resource': ['Ressource', 'Hilfsmittel', 'Quelle'],
  'book': ['Buch', 'Lehrbuch', 'Lektüre'],
  'app': ['App', 'Anwendung', 'Programm'],
  'website': ['Webseite', 'Internetseite', 'Homepage'],
  'podcast': ['Podcast', 'Hörsendung', 'Audiobeitrag'],
  'video': ['Video', 'Film', 'Aufnahme'],
  'music': ['Musik', 'Lieder', 'Melodie'],
  'movie': ['Film', 'Kinofilm', 'Spielfilm'],
  'tv': ['Fernsehen', 'Fernseher', 'TV-Sendung'],
  'news': ['Nachrichten', 'Neuigkeiten', 'Berichterstattung'],
  'article': ['Artikel', 'Beitrag', 'Aufsatz'],
  'conversation': ['Gespräch', 'Konversation', 'Unterhaltung'],
  'speaking': ['Sprechen', 'Aussprache', 'mündlich'],
  'listening': ['Hören', 'Hörverstehen', 'zuhören'],
  'reading': ['Lesen', 'Leseverständnis', 'Lektüre'],
  'writing': ['Schreiben', 'Aufsatz', 'verfassen'],
  'translation': ['Übersetzung', 'übersetzen', 'Dolmetschen'],
  'word': ['Wort', 'Begriff', 'Ausdruck'],
  'sentence': ['Satz', 'Aussage', 'Phrase'],
  'pronunciation': ['Aussprache', 'Betonung', 'Artikulation'],
  'accent': ['Akzent', 'Betonung', 'Dialekt'],
  'dialect': ['Dialekt', 'Mundart', 'regionale Sprache'],
  'slang': ['Slang', 'Umgangssprache', 'Jargon'],
  'idiom': ['Redewendung', 'Sprichwort', 'Redensart'],
  'expression': ['Ausdruck', 'Redewendung', 'Formulierung'],
  'phrase': ['Phrase', 'Ausdruck', 'Wendung'],
  'verb': ['Verb', 'Zeitwort', 'Tätigkeitswort'],
  'noun': ['Substantiv', 'Nomen', 'Hauptwort'],
  'adjective': ['Adjektiv', 'Eigenschaftswort', 'Beiwort'],
  'adverb': ['Adverb', 'Umstandswort', 'Nebenwort'],
  'preposition': ['Präposition', 'Verhältniswort', 'Vorwort'],
  'conjunction': ['Konjunktion', 'Bindewort', 'Verbindungswort'],
  'pronoun': ['Pronomen', 'Fürwort', 'Stellvertreter'],
  'tense': ['Zeitform', 'Tempus', 'Verbform'],
  'case': ['Fall', 'Kasus', 'grammatischer Fall'],
  'gender': ['Geschlecht', 'Genus', 'grammatisches Geschlecht'],
  'plural': ['Plural', 'Mehrzahl', 'Pluralform'],
  'singular': ['Singular', 'Einzahl', 'Singularform']
};

/**
 * Extracts potential German/English word pairs from Reddit post titles
 */
function extractWordsFromTitle(title: string): { english: string; german: string }[] {
  const words = title.toLowerCase().split(/\s+/);
  const pairs: { english: string; german: string }[] = [];
  
  // Look for words we know translations for
  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length < 3) continue; // Skip very short words
    
    if (TOPIC_TRANSLATIONS[cleanWord]) {
      // Found a word we have translations for
      const germanOptions = TOPIC_TRANSLATIONS[cleanWord];
      const randomGerman = germanOptions[Math.floor(Math.random() * germanOptions.length)] || 'Wort'; // Default to 'word' if undefined
      pairs.push({
        english: cleanWord,
        german: randomGerman
      });
    }
  }
  
  return pairs;
}

/**
 * Creates a WordMatchItem from an English/German word pair
 */
function createWordMatchItem(pair: { english: string; german: string }, index: number): WordMatchItem {
  // Generate two incorrect options
  const allGermanWords = Object.values(TOPIC_TRANSLATIONS).flat();
  const incorrectOptions: string[] = [];
  
  // Ensure we have at least two incorrect options
  while (incorrectOptions.length < 2 && allGermanWords.length > 0) {
    const randomIndex = Math.floor(Math.random() * allGermanWords.length);
    const option = allGermanWords[randomIndex];
    
    if (option && option !== pair.german && !incorrectOptions.includes(option)) {
      incorrectOptions.push(option);
    }
  }
  
  // If we couldn't find enough options, add some defaults
  if (incorrectOptions.length < 2) {
    if (incorrectOptions.length === 0) {
      incorrectOptions.push("falsch"); // wrong
    }
    incorrectOptions.push("nicht richtig"); // not correct
  }
  
  // Randomize the order of choices
  const choices = [
    { key: "A" as const, label: pair.german },
    { key: "B" as const, label: incorrectOptions[0] || "" },
    { key: "C" as const, label: incorrectOptions[1] || "" }
  ].sort(() => Math.random() - 0.5);
  
  // Find which choice has the correct answer
  const correctChoice = choices.find(c => c.label === pair.german);
  
  return {
    id: `reddit-${index}`,
    prompt_en: pair.english,
    direction: "EN->L2",
    choices: choices,
    answerKey: correctChoice?.key || "A",
    note: `This word was derived from Reddit content.`,
    tags: ["reddit", "de-DE"]
  };
}

export class RedditContentManager {
  /**
   * Fetches hot posts from a subreddit and generates word pairs
   */
  static async fetchRedditContent(subredditName = DEFAULT_SUBREDDIT): Promise<WordMatchItem[]> {
    try {
      // Get hot posts from the subreddit
      const response = await reddit.getHotPosts({
        subredditName: subredditName,
        limit: 20
      });
      
      // Extract word pairs from post titles
      const allPairs: { english: string; german: string }[] = [];
      
      // Process the posts from the response
      const posts = await response.all();
      
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        if (post && post.title) {
          const pairs = extractWordsFromTitle(post.title);
          allPairs.push(...pairs);
        }
      }
      
      // Create WordMatchItems from the pairs (up to 8 items)
      const uniquePairs = Array.from(new Map(allPairs.map(pair => 
        [pair.english, pair]
      )).values()).slice(0, 8);
      
      return uniquePairs.map((pair, index) => createWordMatchItem(pair, index));
    } catch (error) {
      console.error('Error fetching Reddit content:', error);
      return [];
    }
  }
  
  /**
   * Refreshes the word bank with content from Reddit
   */
  static async refreshWordBank(subredditName = DEFAULT_SUBREDDIT): Promise<boolean> {
    try {
      // Get existing word bank
      let wordBank = await GameStorage.getWordBank('de');
      
      // If no word bank exists, initialize with empty array
      if (!wordBank) {
        wordBank = [];
      }
      
      // Fetch new content from Reddit
      const redditItems = await this.fetchRedditContent(subredditName);
      
      if (redditItems.length === 0) {
        return false;
      }
      
      // Filter out any existing items with the same IDs
      const existingIds = new Set(wordBank.map(item => item.id));
      const newItems = redditItems.filter(item => !existingIds.has(item.id));
      
      // Add new items to the word bank
      const updatedWordBank = [...wordBank, ...newItems];
      
      // Save the updated word bank
      await GameStorage.saveWordBank('de', updatedWordBank);
      
      return true;
    } catch (error) {
      console.error('Error refreshing word bank:', error);
      return false;
    }
  }
  
  /**
   * Creates a daily puzzle using Reddit content
   */
  static async createRedditPuzzle(date: Date, lang: string = 'de'): Promise<boolean> {
    try {
      const seed = `${date.toISOString().slice(0, 10)}:${lang}:reddit`;
      
      // Fetch content from Reddit
      const redditItems = await this.fetchRedditContent();
      
      if (redditItems.length < 8) {
        console.log('Not enough Reddit content for a full puzzle');
        return false;
      }
      
      // Create the puzzle
      const puzzle: WordMatchDaily = {
        id: seed,
        lang,
        date: date.toISOString().slice(0, 10),
        items: redditItems.slice(0, 8),
        meta: {
          author: 'reddit',
          source: DEFAULT_SUBREDDIT,
          difficulty: 2 as const
        }
      };
      
      // Save the puzzle
      await GameStorage.savePuzzle(puzzle);
      
      return true;
    } catch (error) {
      console.error('Error creating Reddit puzzle:', error);
      return false;
    }
  }
}
