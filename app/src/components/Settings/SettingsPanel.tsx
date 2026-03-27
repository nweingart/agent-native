import { useState } from 'react';
import { getItem, setItem } from '../../utils/storage';

interface Props {
  onClose: () => void;
  onClearCollection: () => void;
  collectionSize: number;
}

export function SettingsPanel({ onClose, onClearCollection, collectionSize }: Props) {
  const [apiKey, setApiKey] = useState(() => getItem<string>('pokedex-api-key', ''));
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveKey = () => {
    setItem('pokedex-api-key', apiKey);
  };

  const handleClear = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    onClearCollection();
    setShowConfirm(false);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="settings-section">
          <label className="settings-label" htmlFor="api-key">
            Anthropic API Key
          </label>
          <p className="settings-hint">
            Required to identify animals. Your key stays in your browser and is only sent to the Anthropic API.
          </p>
          <div className="settings-input-row">
            <input
              id="api-key"
              type="password"
              className="settings-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveKey}>
              Save
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Collection</h3>
          <p className="settings-hint">
            {collectionSize} animal{collectionSize !== 1 ? 's' : ''} in your Pokédex.
          </p>
          <button className="btn btn-danger btn-sm" onClick={handleClear}>
            {showConfirm ? 'Are you sure? Click again to confirm' : 'Clear All Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
