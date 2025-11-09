import { connectSpotify } from '../utils/spotify';
import { playClickSound } from '../utils/sounds';
import { FaSpotify } from 'react-icons/fa';
import './SpotifyConnectionModal.css';

interface SpotifyConnectionModalProps {
  isOpen: boolean;
  onConnect: () => void;
  onSkip: () => void;
}

export default function SpotifyConnectionModal({ isOpen, onConnect, onSkip }: SpotifyConnectionModalProps) {
  if (!isOpen) return null;

  const handleConnect = async () => {
    playClickSound();
    await connectSpotify();
    // connectSpotify will redirect to Spotify, so onConnect won't be called
    // But we'll call it anyway in case the redirect fails
    onConnect();
  };

  const handleSkip = () => {
    playClickSound();
    onSkip();
  };

  return (
    <div className="spotify-connection-modal-overlay">
      <div className="spotify-connection-modal">
        <div className="spotify-connection-modal-header">
          <h2>Connect Spotify?</h2>
        </div>
        <div className="spotify-connection-modal-content">
          <p className="spotify-connection-description">
            Connect your Spotify account to automatically play the #1 Billboard song from each week during gameplay.
          </p>
          <p className="spotify-connection-note">
            You can always connect later from the settings menu.
          </p>
          <div className="spotify-connection-buttons">
            <button 
              className="spotify-connect-btn-modal"
              onClick={handleConnect}
            >
              <FaSpotify className="spotify-icon-modal" />
              <span>Connect Spotify</span>
            </button>
            <button 
              className="spotify-skip-btn-modal"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

