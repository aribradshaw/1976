import { useState, useEffect } from 'react';
import { getSongForWeek } from '../data/weeklySongs';
import { 
  isSpotifyConnected, 
  connectSpotify, 
  disconnectSpotify, 
  searchTrack, 
  playTrack,
  handleSpotifyCallback
} from '../utils/spotify';
import { FaSpotify } from 'react-icons/fa';
import './SpotifyPlayer.css';

interface SpotifyPlayerProps {
  currentWeek: number;
}

export default function SpotifyPlayer({ currentWeek }: SpotifyPlayerProps) {
  const [connected, setConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [lastPlayedWeek, setLastPlayedWeek] = useState<number | null>(null);

  useEffect(() => {
    // Check for OAuth callback
    if (window.location.hash) {
      const success = handleSpotifyCallback();
      if (success) {
        setConnected(true);
      }
    } else {
      setConnected(isSpotifyConnected());
    }
  }, []);

  useEffect(() => {
    if (connected && currentWeek && currentWeek !== lastPlayedWeek) {
      // When week changes and Spotify is connected, automatically play the new week's song
      handlePlayWeekSong();
      setLastPlayedWeek(currentWeek);
    }
  }, [currentWeek, connected, lastPlayedWeek]);

  const handleConnect = () => {
    connectSpotify();
  };

  const handleDisconnect = () => {
    disconnectSpotify();
    setConnected(false);
    setIsPlaying(false);
    setCurrentSong(null);
    setLastPlayedWeek(null);
  };

  const handlePlayWeekSong = async () => {
    if (!connected) return;

    const song = getSongForWeek(currentWeek);
    if (!song) return;

    try {
      setIsPlaying(true);
      
      // If we have a spotifyId, use it directly
      let trackId = song.spotifyId;
      
      // Otherwise, search for the track
      if (!trackId) {
        trackId = await searchTrack(song.artist, song.track);
      }

      if (trackId) {
        const success = await playTrack(trackId);
        if (success) {
          setCurrentSong(`${song.artist} - ${song.track}`);
        } else {
          setIsPlaying(false);
          // Don't show alert for automatic playback failures
          console.warn('Failed to play track automatically. Make sure Spotify is open on a device.');
        }
      } else {
        setIsPlaying(false);
        console.warn(`Could not find "${song.track}" by ${song.artist} on Spotify.`);
      }
    } catch (error) {
      console.error('Error playing song:', error);
      setIsPlaying(false);
    }
  };

  if (!connected) {
    return (
      <div className="spotify-player">
        <button className="spotify-connect-btn" onClick={handleConnect}>
          <FaSpotify className="spotify-icon" />
          <span>Connect Spotify</span>
        </button>
        <p className="spotify-hint">Play the #1 song from each week automatically</p>
        <p className="spotify-note">Requires Spotify Premium and an active device</p>
      </div>
    );
  }

  const song = getSongForWeek(currentWeek);

  return (
    <div className="spotify-player connected">
      <div className="spotify-status">
        <FaSpotify className="spotify-icon" />
        <span className="spotify-status-text">Connected</span>
        <button className="spotify-disconnect-btn" onClick={handleDisconnect}>
          Disconnect
        </button>
      </div>
      {song && (
        <div className="spotify-song-info">
          <p className="spotify-current-song">
            Week {currentWeek}: <strong>{song.artist} - {song.track}</strong>
          </p>
          {isPlaying && currentSong && (
            <p className="spotify-playing">Now playing on Spotify...</p>
          )}
        </div>
      )}
    </div>
  );
}

