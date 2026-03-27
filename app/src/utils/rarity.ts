import type { Rarity } from '../types/animal';

export function scoreToRarity(score: number): Rarity {
  if (score >= 91) return 'legendary';
  if (score >= 71) return 'epic';
  if (score >= 46) return 'rare';
  if (score >= 21) return 'uncommon';
  return 'common';
}

export const rarityLabel: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};
