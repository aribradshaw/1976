import './CRTOverlay.css';

export default function CRTOverlay() {
  return (
    <div className="crt-overlay">
      <div className="crt-scanlines"></div>
      <div className="crt-noise"></div>
      <div className="crt-vignette"></div>
    </div>
  );
}

