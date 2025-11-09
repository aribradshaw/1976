import { useState, useEffect } from 'react';
import { getSongForWeek } from '../data/weeklySongs';
import { 
  isSpotifyConnected, 
  connectSpotify, 
  disconnectSpotify, 
  searchTrack, 
  playTrack,
  handleSpotifyCallback,
  getCurrentlyPlayingTrackId,
  pausePlayback,
  resumePlayback,
  getPlaybackState
} from '../utils/spotify';
import { FaSpotify, FaPlay, FaPause } from 'react-icons/fa';
import { playClickSound } from '../utils/sounds';
import './SpotifyPlayer.css';

interface SpotifyPlayerProps {
  currentWeek: number;
  disableAutoPlay?: boolean; // If true, don't automatically play songs
}

export default function SpotifyPlayer({ currentWeek, disableAutoPlay = false }: SpotifyPlayerProps) {
  const [connected, setConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [lastPlayedWeek, setLastPlayedWeek] = useState<number | null>(null);

  useEffect(() => {
    // Check for OAuth callback (Authorization Code flow uses query params, not hash)
    const checkCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('code')) {
        const success = await handleSpotifyCallback();
        if (success) {
          setConnected(true);
        }
      } else {
        setConnected(isSpotifyConnected());
      }
    };
    checkCallback();
  }, []);

  useEffect(() => {
    if (!disableAutoPlay && connected && currentWeek && currentWeek !== lastPlayedWeek) {
      // When week changes and Spotify is connected, automatically play the new week's song
      handlePlayWeekSong();
      setLastPlayedWeek(currentWeek);
    }
  }, [currentWeek, connected, lastPlayedWeek, disableAutoPlay]);

  // Poll for playback state to keep UI in sync
  useEffect(() => {
    if (!connected) return;

    const checkPlaybackState = async () => {
      const state = await getPlaybackState();
      if (state) {
        setIsPlaying(state.isPlaying);
      }
    };

    // Check immediately
    checkPlaybackState();

    // Poll every 2 seconds
    const interval = setInterval(checkPlaybackState, 2000);

    return () => clearInterval(interval);
  }, [connected]);

  const handleConnect = async () => {
    playClickSound(); // Play random click sound
    await connectSpotify();
  };

  const handleDisconnect = () => {
    playClickSound(); // Play random click sound
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
      // If we have a spotifyId, use it directly
      let trackId: string | undefined = song.spotifyId;
      
      // Otherwise, search for the track
      if (!trackId) {
        const foundTrackId = await searchTrack(song.artist, song.track);
        trackId = foundTrackId || undefined;
      }

      if (!trackId) {
        console.warn(`Could not find "${song.track}" by ${song.artist} on Spotify.`);
        return;
      }

      // Check if this track is already playing
      const currentlyPlayingId = await getCurrentlyPlayingTrackId();
      if (currentlyPlayingId === trackId) {
        // Same song is already playing, don't restart it
        setCurrentSong(`${song.artist} - ${song.track}`);
        const state = await getPlaybackState();
        setIsPlaying(state?.isPlaying || false);
        return;
      }

      // Different song, play it
      setIsPlaying(true);
      const success = await playTrack(trackId);
      if (success) {
        setCurrentSong(`${song.artist} - ${song.track}`);
      } else {
        setIsPlaying(false);
        // Don't show alert for automatic playback failures
        console.warn('Failed to play track automatically. Make sure Spotify is open on a device.');
      }
    } catch (error) {
      console.error('Error playing song:', error);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    playClickSound(); // Play click sound
    if (!connected) return;

    if (isPlaying) {
      // Pause
      const success = await pausePlayback();
      if (success) {
        setIsPlaying(false);
      }
    } else {
      // Resume or play current week's song
      const song = getSongForWeek(currentWeek);
      if (!song) return;

      try {
        let trackId: string | undefined = song.spotifyId;
        if (!trackId) {
          const foundTrackId = await searchTrack(song.artist, song.track);
          trackId = foundTrackId || undefined;
        }

        if (trackId) {
          // Check if this track is already loaded
          const currentlyPlayingId = await getCurrentlyPlayingTrackId();
          if (currentlyPlayingId === trackId) {
            // Same track, just resume
            const success = await resumePlayback();
            if (success) {
              setIsPlaying(true);
            }
          } else {
            // Different track or nothing playing, play the week's song
            const success = await playTrack(trackId);
            if (success) {
              setCurrentSong(`${song.artist} - ${song.track}`);
              setIsPlaying(true);
            }
          }
        }
      } catch (error) {
        console.error('Error playing/pausing:', error);
      }
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
          <div className="spotify-controls">
            <button 
              className="spotify-play-pause-btn" 
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            {isPlaying && currentSong && (
              <span className="spotify-playing">Now playing on Spotify...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

