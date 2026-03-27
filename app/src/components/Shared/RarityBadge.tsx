import type { Rarity } from '../../types/animal';
import { rarityLabel } from '../../utils/rarity';

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return <span className={`rarity-badge rarity-${rarity}`}>{rarityLabel[rarity]}</span>;
}
