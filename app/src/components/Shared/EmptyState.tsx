export function EmptyState({ onCapture }: { onCapture: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">?</div>
      <h2>No Animals Yet</h2>
      <p>Take a photo or upload an image of an animal to start your collection!</p>
      <button className="btn btn-primary" onClick={onCapture}>
        Start Scanning
      </button>
    </div>
  );
}
