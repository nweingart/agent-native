export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AnimalEntry {
  id: string;
  photoDataUrl: string;
  commonName: string;
  scientificName: string;
  habitat: string;
  diet: string;
  funFact: string;
  rarity: Rarity;
  rarityScore: number;
  discoveredAt: string;
}
