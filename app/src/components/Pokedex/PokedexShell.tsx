import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onSettingsClick: () => void;
  title?: string;
}

export function PokedexShell({ children, onSettingsClick, title = 'Animal Pokédex' }: Props) {
  return (
    <div className="pokedex-shell">
      <div className="pokedex-top">
        <div className="pokedex-lights">
          <div className="pokedex-light-big" />
          <div className="pokedex-light-small red" />
          <div className="pokedex-light-small yellow" />
          <div className="pokedex-light-small green" />
        </div>
      </div>
      <div className="pokedex-header">
        <h1 className="pokedex-title">{title}</h1>
        <button className="btn-icon" onClick={onSettingsClick} aria-label="Settings">
          <SettingsIcon />
        </button>
      </div>
      <div className="pokedex-screen">{children}</div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
      <path
        fillRule="evenodd"
        d="M11.49 1.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  );
}
