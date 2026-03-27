export function LoadingSpinner({ message = 'Scanning...' }: { message?: string }) {
  return (
    <div className="loading-spinner">
      <div className="spinner-pokeball" />
      <p className="spinner-text">{message}</p>
    </div>
  );
}
