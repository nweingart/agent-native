import type { AnimalEntry } from '../../types/animal';
import { RarityBadge } from '../Shared/RarityBadge';

interface Props {
  animal: AnimalEntry;
  entryNumber: number;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function AnimalDetail({ animal, entryNumber, onBack, onDelete }: Props) {
  const date = new Date(animal.discoveredAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="detail-container">
      <div className="detail-top-bar">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          &larr; Back
        </button>
        <span className="detail-number">#{String(entryNumber).padStart(3, '0')}</span>
      </div>

      <div className="detail-image">
        <img src={animal.photoDataUrl} alt={animal.commonName} />
      </div>

      <div className="detail-info">
        <div className="detail-name-row">
          <h2 className="detail-name">{animal.commonName}</h2>
          <RarityBadge rarity={animal.rarity} />
        </div>
        <p className="detail-scientific">{animal.scientificName}</p>

        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-label">Habitat</span>
            <span className="detail-stat-value">{animal.habitat}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Diet</span>
            <span className="detail-stat-value">{animal.diet}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Rarity Score</span>
            <div className="detail-rarity-bar">
              <div
                className="detail-rarity-fill"
                style={{ width: `${animal.rarityScore}%` }}
              />
              <span className="detail-rarity-score">{animal.rarityScore}/100</span>
            </div>
          </div>
        </div>

        <div className="detail-fun-fact">
          <span className="detail-fun-fact-label">Fun Fact</span>
          <p>{animal.funFact}</p>
        </div>

        <p className="detail-date">Discovered {date}</p>

        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(animal.id)}
        >
          Release
        </button>
      </div>
    </div>
  );
}
