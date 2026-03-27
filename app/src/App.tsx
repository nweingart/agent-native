import { useState, useCallback } from 'react';
import { PokedexShell } from './components/Pokedex/PokedexShell';
import { CameraCapture } from './components/Camera/CameraCapture';
import { CollectionGrid } from './components/Collection/CollectionGrid';
import { AnimalDetail } from './components/Detail/AnimalDetail';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { useCollection } from './hooks/useCollection';
import { useIdentify } from './hooks/useIdentify';
import './App.css';

type View = { type: 'collection' } | { type: 'camera' } | { type: 'detail'; id: string };

export default function App() {
  const [view, setView] = useState<View>({ type: 'collection' });
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { entries, addEntry, removeEntry, clearAll, getEntry } = useCollection();
  const { identify, isLoading, error: identifyError } = useIdentify();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCapture = useCallback(
    async (imageDataUrl: string) => {
      try {
        const result = await identify(imageDataUrl);
        addEntry(result);
        showToast(`${result.commonName} added to your Pokédex!`);
        setView({ type: 'collection' });
      } catch {
        // error is displayed by useIdentify
      }
    },
    [identify, addEntry, showToast],
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeEntry(id);
      setView({ type: 'collection' });
      showToast('Animal released.');
    },
    [removeEntry, showToast],
  );

  return (
    <PokedexShell onSettingsClick={() => setShowSettings(true)}>
      {view.type === 'collection' && (
        <CollectionGrid
          entries={entries}
          onSelect={(id) => setView({ type: 'detail', id })}
          onCapture={() => setView({ type: 'camera' })}
        />
      )}

      {view.type === 'camera' && (
        <CameraCapture
          onCapture={handleCapture}
          onBack={() => setView({ type: 'collection' })}
          isIdentifying={isLoading}
        />
      )}

      {view.type === 'detail' && (() => {
        const animal = getEntry(view.id);
        if (!animal) {
          setView({ type: 'collection' });
          return null;
        }
        const idx = entries.findIndex((e) => e.id === view.id);
        return (
          <AnimalDetail
            animal={animal}
            entryNumber={idx + 1}
            onBack={() => setView({ type: 'collection' })}
            onDelete={handleDelete}
          />
        );
      })()}

      {identifyError && (
        <div className="toast toast-error">{identifyError}</div>
      )}

      {toast && <div className="toast toast-success">{toast}</div>}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onClearCollection={clearAll}
          collectionSize={entries.length}
        />
      )}
    </PokedexShell>
  );
}
