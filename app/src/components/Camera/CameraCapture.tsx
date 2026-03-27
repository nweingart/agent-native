import { useEffect, useRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

interface Props {
  onCapture: (imageDataUrl: string) => void;
  onBack: () => void;
  isIdentifying: boolean;
}

export function CameraCapture({ onCapture, onBack, isIdentifying }: Props) {
  const { videoRef, isStreaming, error, startCamera, stopCamera, capture } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const dataUrl = capture();
    if (dataUrl) onCapture(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCapture(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (isIdentifying) {
    return (
      <div className="camera-container">
        <LoadingSpinner message="Identifying animal..." />
      </div>
    );
  }

  return (
    <div className="camera-container">
      {error ? (
        <div className="camera-error">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={startCamera}>
            Retry
          </button>
        </div>
      ) : (
        <div className="camera-viewfinder">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
          {!isStreaming && <div className="camera-placeholder">Starting camera...</div>}
          <div className="camera-crosshair" />
        </div>
      )}

      <div className="camera-controls">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-capture"
          onClick={handleCapture}
          disabled={!isStreaming}
          aria-label="Take photo"
        >
          <div className="btn-capture-inner" />
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        hidden
      />
    </div>
  );
}
