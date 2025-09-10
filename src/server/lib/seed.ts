export const getTodaySeed = (date: Date, lang: string): string => {
  return `${date.toISOString().slice(0, 10)}:${lang}`;
};

export const seededShuffle = <T>(array: T[], seed: string): T[] => {
  const shuffled = [...array];
  let hash = 0;
  
  // Simple hash function for the seed
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash as a seed for shuffling
  let currentIndex = shuffled.length;
  let randomIndex: number;
  
  while (currentIndex !== 0) {
    // Generate pseudo-random number based on hash
    hash = (hash * 9301 + 49297) % 233280;
    randomIndex = Math.floor((hash / 233280) * currentIndex);
    currentIndex--;
    
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex]!, shuffled[currentIndex]!];
  }
  
  return shuffled;
};

export const selectRandomItems = <T>(items: T[], count: number, seed: string): T[] => {
  const shuffled = seededShuffle(items, seed);
  return shuffled.slice(0, count);
};
