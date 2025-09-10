import { WordMatchDaily, WordMatchItem } from '../../shared/types/api';
import { GameStorage } from './storage';
import { getTodaySeed, selectRandomItems } from './seed';

// German word bank - sample content for the game
const GERMAN_WORD_BANK: WordMatchItem[] = [
  {
    id: "w1",
    prompt_en: "embarrassed",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "embarazada" },
      { key: "B", label: "verlegen" },
      { key: "C", label: "peinlich" }
    ],
    answerKey: "B",
    note: "Verlegen means embarrassed/shy. Peinlich means embarrassing (adjective).",
    tags: ["emotion", "de-DE"],
    variants: ["schüchtern"]
  },
  {
    id: "w2", 
    prompt_en: "kitchen",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "die Küche" },
      { key: "B", label: "das Zimmer" },
      { key: "C", label: "der Keller" }
    ],
    answerKey: "A",
    note: "Die Küche is the kitchen. Das Zimmer is room, der Keller is basement.",
    tags: ["house", "de-DE"]
  },
  {
    id: "w3",
    prompt_en: "friend",
    direction: "EN->L2", 
    choices: [
      { key: "A", label: "der Feind" },
      { key: "B", label: "der Fremde" },
      { key: "C", label: "der Freund" }
    ],
    answerKey: "C",
    note: "Der Freund is friend (male). Der Feind is enemy, der Fremde is stranger.",
    tags: ["people", "de-DE"],
    variants: ["die Freundin"]
  },
  {
    id: "w4",
    prompt_en: "beautiful",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "hässlich" },
      { key: "B", label: "schön" },
      { key: "C", label: "groß" }
    ],
    answerKey: "B",
    note: "Schön means beautiful. Hässlich means ugly, groß means big/tall.",
    tags: ["adjective", "de-DE"]
  },
  {
    id: "w5",
    prompt_en: "to eat",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "trinken" },
      { key: "B", label: "schlafen" },
      { key: "C", label: "essen" }
    ],
    answerKey: "C",
    note: "Essen means to eat. Trinken is to drink, schlafen is to sleep.",
    tags: ["verb", "de-DE"]
  },
  {
    id: "w6",
    prompt_en: "car",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "das Auto" },
      { key: "B", label: "der Zug" },
      { key: "C", label: "das Fahrrad" }
    ],
    answerKey: "A",
    note: "Das Auto is car. Der Zug is train, das Fahrrad is bicycle.",
    tags: ["transport", "de-DE"]
  },
  {
    id: "w7",
    prompt_en: "water",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "das Bier" },
      { key: "B", label: "das Wasser" },
      { key: "C", label: "der Wein" }
    ],
    answerKey: "B",
    note: "Das Wasser is water. Das Bier is beer, der Wein is wine.",
    tags: ["drink", "de-DE"]
  },
  {
    id: "w8",
    prompt_en: "house",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "das Haus" },
      { key: "B", label: "die Straße" },
      { key: "C", label: "der Park" }
    ],
    answerKey: "A",
    note: "Das Haus is house. Die Straße is street, der Park is park.",
    tags: ["building", "de-DE"]
  },
  {
    id: "w9",
    prompt_en: "good",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "schlecht" },
      { key: "B", label: "gut" },
      { key: "C", label: "okay" }
    ],
    answerKey: "B",
    note: "Gut means good. Schlecht means bad, okay means okay.",
    tags: ["adjective", "de-DE"]
  },
  {
    id: "w10",
    prompt_en: "dog",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "die Katze" },
      { key: "B", label: "der Vogel" },
      { key: "C", label: "der Hund" }
    ],
    answerKey: "C",
    note: "Der Hund is dog. Die Katze is cat, der Vogel is bird.",
    tags: ["animal", "de-DE"]
  },
  {
    id: "w11",
    prompt_en: "book",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "das Buch" },
      { key: "B", label: "der Stift" },
      { key: "C", label: "das Papier" }
    ],
    answerKey: "A",
    note: "Das Buch is book. Der Stift is pen, das Papier is paper.",
    tags: ["object", "de-DE"]
  },
  {
    id: "w12",
    prompt_en: "red",
    direction: "EN->L2",
    choices: [
      { key: "A", label: "blau" },
      { key: "B", label: "rot" },
      { key: "C", label: "grün" }
    ],
    answerKey: "B",
    note: "Rot means red. Blau is blue, grün is green.",
    tags: ["color", "de-DE"]
  }
];

export class ContentManager {
  static async getDailyPuzzle(seed: string): Promise<WordMatchDaily> {
    // Try to get existing puzzle first
    let puzzle = await GameStorage.getPuzzle(seed);
    
    if (!puzzle) {
      // Generate new puzzle from word bank
      puzzle = await this.generatePuzzleFromBank(seed);
      await GameStorage.savePuzzle(puzzle);
    }
    
    return puzzle;
  }

  private static async generatePuzzleFromBank(seed: string): Promise<WordMatchDaily> {
    // Get word bank for German
    let wordBank = await GameStorage.getWordBank('de');
    
    if (!wordBank) {
      // Initialize with default German words
      wordBank = GERMAN_WORD_BANK;
      await GameStorage.saveWordBank('de', wordBank);
    }

    // Select 8 random items using the seed
    const selectedItems = selectRandomItems(wordBank, 8, seed);
    
    // Parse seed to get date and language
    const [dateStr, lang] = seed.split(':');
    
    if (!dateStr) {
      throw new Error('Invalid seed format');
    }
    
    return {
      id: seed,
      lang: lang || 'de',
      date: dateStr,
      items: selectedItems,
      meta: {
        author: 'system',
        difficulty: 1
      }
    };
  }

  static async initializeContent(): Promise<void> {
    // Initialize German word bank if it doesn't exist
    const existingBank = await GameStorage.getWordBank('de');
    if (!existingBank) {
      await GameStorage.saveWordBank('de', GERMAN_WORD_BANK);
    }
  }
}
