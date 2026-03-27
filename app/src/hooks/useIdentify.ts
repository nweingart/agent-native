import { useState, useCallback } from 'react';
import { identifyAnimal } from '../services/claude';
import { compressImage } from '../utils/image';
import { scoreToRarity } from '../utils/rarity';
import type { AnimalEntry } from '../types/animal';
import { getItem } from '../utils/storage';

type IdentifyResult = Omit<AnimalEntry, 'id' | 'discoveredAt'>;

export function useIdentify() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identify = useCallback(
    async (imageDataUrl: string): Promise<IdentifyResult> => {
      const apiKey = getItem<string>('pokedex-api-key', '');
      if (!apiKey) throw new Error('Please set your Anthropic API key in Settings.');

      setIsLoading(true);
      setError(null);

      try {
        // Compress for API (max 1024px wide)
        const apiImage = await compressImage(imageDataUrl, 1024, 0.8);
        const result = await identifyAnimal(apiImage, apiKey);

        // Compress for storage (smaller, max 400px)
        const storageImage = await compressImage(imageDataUrl, 400, 0.6);

        return {
          photoDataUrl: storageImage,
          commonName: result.commonName,
          scientificName: result.scientificName,
          habitat: result.habitat,
          diet: result.diet,
          funFact: result.funFact,
          rarityScore: result.rarityScore,
          rarity: scoreToRarity(result.rarityScore),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Identification failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { identify, isLoading, error, clearError: () => setError(null) };
}
