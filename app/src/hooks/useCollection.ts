import { useState, useCallback } from 'react';
import type { AnimalEntry } from '../types/animal';
import { getItem, setItem } from '../utils/storage';

const STORAGE_KEY = 'pokedex-collection';

export function useCollection() {
  const [entries, setEntries] = useState<AnimalEntry[]>(() =>
    getItem<AnimalEntry[]>(STORAGE_KEY, []),
  );

  const addEntry = useCallback(
    (entry: Omit<AnimalEntry, 'id' | 'discoveredAt'>) => {
      const newEntry: AnimalEntry = {
        ...entry,
        id: crypto.randomUUID(),
        discoveredAt: new Date().toISOString(),
      };
      setEntries((prev) => {
        const next = [newEntry, ...prev];
        setItem(STORAGE_KEY, next);
        return next;
      });
      return newEntry;
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    setItem(STORAGE_KEY, []);
  }, []);

  const getEntry = useCallback(
    (id: string) => entries.find((e) => e.id === id),
    [entries],
  );

  return { entries, addEntry, removeEntry, clearAll, getEntry };
}
