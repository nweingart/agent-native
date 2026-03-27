import type { AnimalEntry } from '../../types/animal';
import { AnimalCard } from './AnimalCard';
import { EmptyState } from '../Shared/EmptyState';

interface Props {
  entries: AnimalEntry[];
  onSelect: (id: string) => void;
  onCapture: () => void;
}

export function CollectionGrid({ entries, onSelect, onCapture }: Props) {
  if (entries.length === 0) {
    return <EmptyState onCapture={onCapture} />;
  }

  return (
    <div className="collection-container">
      <div className="collection-header">
        <span className="collection-count">{entries.length} discovered</span>
        <button className="btn btn-primary btn-sm" onClick={onCapture}>
          + Scan
        </button>
      </div>
      <div className="collection-grid">
        {entries.map((animal, i) => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            index={i}
            onClick={() => onSelect(animal.id)}
          />
        ))}
      </div>
    </div>
  );
}
