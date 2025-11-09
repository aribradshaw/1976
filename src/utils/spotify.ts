// Spotify Web API integration utilities
// Note: For production, you'll need a backend server to securely handle token exchange
// This implementation uses the Authorization Code flow which requires a backend

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = `${window.location.origin}`;
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';

export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * Generate a random string for state parameter
 */
function generateRandomString(length: number): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Get stored Spotify token from localStorage
 */
export function getStoredToken(): SpotifyToken | null {
  const stored = localStorage.getItem('spotify_token');
  if (!stored) return null;
  
  try {
    const token: SpotifyToken = JSON.parse(stored);
    // Check if token is expired
    if (token.expires_at && Date.now() >= token.expires_at) {
      localStorage.removeItem('spotify_token');
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Store Spotify token in localStorage
 */
export function storeToken(token: SpotifyToken): void {
  if (token.expires_in) {
    token.expires_at = Date.now() + (token.expires_in * 1000);
  }
  localStorage.setItem('spotify_token', JSON.stringify(token));
}

/**
 * Remove stored Spotify token
 */
export function removeStoredToken(): void {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_auth_state');
}

/**
 * Check if user is connected to Spotify
 */
export function isSpotifyConnected(): boolean {
  return getStoredToken() !== null;
}

/**
 * Initiate Spotify OAuth flow
 * Note: This uses Implicit Grant flow (deprecated but works for frontend-only apps)
 * For production, use Authorization Code flow with a backend
 */
export function connectSpotify(): void {
  if (!SPOTIFY_CLIENT_ID) {
    console.error('Spotify Client ID not configured. Please set VITE_SPOTIFY_CLIENT_ID in your .env file.');
    alert('Spotify integration is not configured. Please set VITE_SPOTIFY_CLIENT_ID in your .env file.');
    return;
  }

  const state = generateRandomString(16);
  localStorage.setItem('spotify_auth_state', state);

  // Use Implicit Grant flow for frontend-only (deprecated but functional)
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'token'); // Implicit Grant
  authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.append('scope', SPOTIFY_SCOPES);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('show_dialog', 'true');

  window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback and extract token from URL hash
 */
export function handleSpotifyCallback(): boolean {
  const hash = window.location.hash;
  if (!hash) return false;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const tokenType = params.get('token_type');
  const expiresIn = params.get('expires_in');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.error('Spotify auth error:', error);
    return false;
  }

  const storedState = localStorage.getItem('spotify_auth_state');
  if (state !== storedState) {
    console.error('State mismatch in Spotify callback');
    return false;
  }

  if (accessToken && tokenType && expiresIn) {
    const token: SpotifyToken = {
      access_token: accessToken,
      token_type: tokenType,
      expires_in: parseInt(expiresIn, 10),
    };
    storeToken(token);
    localStorage.removeItem('spotify_auth_state');
    
    // Clean up URL hash
    window.history.replaceState(null, '', window.location.pathname);
    return true;
  }

  return false;
}

/**
 * Search for a track on Spotify
 */
export async function searchTrack(artist: string, track: string): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const query = `artist:${artist} track:${track}`;
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, remove it
        removeStoredToken();
      }
      return null;
    }

    const data = await response.json();
    if (data.tracks?.items?.length > 0) {
      return data.tracks.items[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error searching for track:', error);
    return null;
  }
}

/**
 * Play a track on Spotify
 */
export async function playTrack(trackId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    // First, get the user's available devices
    const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
    });

    if (!devicesResponse.ok) {
      if (devicesResponse.status === 401) {
        removeStoredToken();
      }
      return false;
    }

    const devicesData = await devicesResponse.json();
    const activeDevice = devicesData.devices?.find((d: any) => d.is_active) || devicesData.devices?.[0];

    if (!activeDevice) {
      alert('No active Spotify device found. Please open Spotify on a device and try again.');
      return false;
    }

    // Play the track
    const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [`spotify:track:${trackId}`],
      }),
    });

    return playResponse.ok;
  } catch (error) {
    console.error('Error playing track:', error);
    return false;
  }
}

/**
 * Disconnect Spotify (remove token)
 */
export function disconnectSpotify(): void {
  removeStoredToken();
}

