// List of German words for the Hangman game
// Words are categorized by difficulty level

export const germanWords = {
  easy: [
    { word: "hallo", hint: "A common greeting" },
    { word: "danke", hint: "What you say when someone helps you" },
    { word: "bitte", hint: "Please or you're welcome" },
    { word: "haus", hint: "Where you live" },
    { word: "katze", hint: "A common pet that meows" },
    { word: "hund", hint: "A common pet that barks" },
    { word: "buch", hint: "You read this" },
    { word: "tisch", hint: "You eat on this" },
    { word: "stuhl", hint: "You sit on this" },
    { word: "auto", hint: "A vehicle with four wheels" }
  ],
  medium: [
    { word: "schule", hint: "Where children learn" },
    { word: "freund", hint: "Someone you like spending time with" },
    { word: "familie", hint: "Your relatives" },
    { word: "wasser", hint: "You drink this" },
    { word: "sommer", hint: "The hot season" },
    { word: "winter", hint: "The cold season" },
    { word: "frühstück", hint: "First meal of the day" },
    { word: "fenster", hint: "You look outside through this" },
    { word: "straße", hint: "Cars drive on this" },
    { word: "kuchen", hint: "A sweet dessert" }
  ],
  hard: [
    { word: "sehenswürdigkeit", hint: "Tourist attraction" },
    { word: "geschwindigkeit", hint: "How fast something moves" },
    { word: "freundschaft", hint: "The relationship between friends" },
    { word: "wissenschaft", hint: "Study of the natural world" },
    { word: "verantwortung", hint: "Being accountable for something" },
    { word: "entschuldigung", hint: "What you say when you're sorry" },
    { word: "überraschung", hint: "Something unexpected" },
    { word: "schwierigkeiten", hint: "Problems or challenges" },
    { word: "wahrscheinlich", hint: "Not certain but likely" },
    { word: "zusammenfassung", hint: "A brief overview" }
  ]
};

// Function to get a random word based on difficulty
export function getRandomWord(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
  const words = germanWords[difficulty];
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

// Function to get a word by index (for deterministic selection based on seed)
export function getWordByIndex(difficulty: 'easy' | 'medium' | 'hard', index: number) {
  const words = germanWords[difficulty];
  const safeIndex = index % words.length;
  return words[safeIndex];
}
