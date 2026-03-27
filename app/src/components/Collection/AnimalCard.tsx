import type { AnimalEntry } from '../../types/animal';
import { RarityBadge } from '../Shared/RarityBadge';

interface Props {
  animal: AnimalEntry;
  index: number;
  onClick: () => void;
}

export function AnimalCard({ animal, index, onClick }: Props) {
  return (
    <button
      className="animal-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="animal-card-image">
        <img src={animal.photoDataUrl} alt={animal.commonName} loading="lazy" />
        <span className="animal-card-number">#{String(index + 1).padStart(3, '0')}</span>
      </div>
      <div className="animal-card-info">
        <h3 className="animal-card-name">{animal.commonName}</h3>
        <RarityBadge rarity={animal.rarity} />
      </div>
    </button>
  );
}
