// Spotify Web API integration utilities
// Note: For production, you'll need a backend server to securely handle token exchange
// This implementation uses the Authorization Code flow which requires a backend

// Debug: Log the environment variable
console.log('VITE_SPOTIFY_CLIENT_ID:', import.meta.env.VITE_SPOTIFY_CLIENT_ID);
console.log('All env vars:', import.meta.env);

// Fallback to hardcoded Client ID if env var is not available
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '143be4020f584a91b6f203515fa77685';

// Use 127.0.0.1 instead of localhost for Spotify redirect URI (localhost is not allowed)
// Replace localhost with 127.0.0.1 in the origin
// Include the full pathname to support subdirectory deployments
const getRedirectUri = () => {
  let origin = window.location.origin;
  // Replace localhost with 127.0.0.1 for Spotify compatibility
  if (origin.includes('localhost')) {
    origin = origin.replace('localhost', '127.0.0.1');
  }
  // Include the base pathname to support subdirectory deployments (e.g., /1976/)
  // Extract the base path from the current location's pathname
  const pathname = window.location.pathname;
  // Extract the first path segment (e.g., '1976' from '/1976/' or '/1976/some-route')
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    // Return origin + base path with trailing slash (e.g., 'https://www.brickstone.plus/1976/')
    return origin + '/' + pathSegments[0] + '/';
  }
  // If at root, return origin only
  return origin;
};

const SPOTIFY_REDIRECT_URI = getRedirectUri();
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';

export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  expires_at?: number;
}

interface SpotifyDevice {
  id: string;
  is_active: boolean;
}

interface SpotifyDevicesResponse {
  devices?: SpotifyDevice[];
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
 * Generate code verifier for PKCE
 */
function generateCodeVerifier(): string {
  return generateRandomString(128);
}

/**
 * Generate code challenge from verifier (SHA256 hash, base64url encoded)
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64 URL encode (without padding)
 */
function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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
  localStorage.removeItem('spotify_code_verifier');
}

/**
 * Check if user is connected to Spotify
 */
export function isSpotifyConnected(): boolean {
  return getStoredToken() !== null;
}

/**
 * Initiate Spotify OAuth flow
 * Uses Authorization Code flow with PKCE (recommended for frontend-only apps)
 */
export async function connectSpotify(): Promise<void> {
  if (!SPOTIFY_CLIENT_ID) {
    console.error('Spotify Client ID not configured. Please set VITE_SPOTIFY_CLIENT_ID in your .env file.');
    alert('Spotify integration is not configured. Please set VITE_SPOTIFY_CLIENT_ID in your .env file.');
    return;
  }

  const state = generateRandomString(16);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state and code verifier for later verification
  localStorage.setItem('spotify_auth_state', state);
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  // Use Authorization Code flow with PKCE
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code'); // Authorization Code
  authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.append('scope', SPOTIFY_SCOPES);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge_method', 'S256'); // PKCE with SHA256
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('show_dialog', 'true');

  window.location.href = authUrl.toString();
}

/**
 * Exchange authorization code for access token (Authorization Code flow with PKCE)
 */
async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<SpotifyToken | null> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange error:', errorData);
      return null;
    }

    const token: SpotifyToken = await response.json();
    storeToken(token);
    return token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

/**
 * Handle OAuth callback and exchange code for token (Authorization Code flow)
 */
export async function handleSpotifyCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.error('Spotify auth error:', error);
    return false;
  }

  if (!code) {
    return false; // No code in URL, not a callback
  }

  const storedState = localStorage.getItem('spotify_auth_state');
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  if (state !== storedState) {
    console.error('State mismatch in Spotify callback');
    return false;
  }

  if (!codeVerifier) {
    console.error('Code verifier not found');
    return false;
  }

  // Exchange code for token
  const token = await exchangeCodeForToken(code, codeVerifier);

  if (token) {
    // Clean up
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    
    // Clean up URL parameters
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
 * Get the currently playing track ID from Spotify
 */
export async function getCurrentlyPlayingTrackId(): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeStoredToken();
      }
      return null;
    }

    // 204 means no content (nothing playing)
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    return data.item?.id || null;
  } catch (error) {
    console.error('Error getting currently playing track:', error);
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

    const devicesData = await devicesResponse.json() as SpotifyDevicesResponse;
    const activeDevice = devicesData.devices?.find(device => device.is_active) || devicesData.devices?.[0];

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
 * Pause playback on Spotify
 */
export async function pausePlayback(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeStoredToken();
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error pausing playback:', error);
    return false;
  }
}

/**
 * Resume playback on Spotify
 */
export async function resumePlayback(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeStoredToken();
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error resuming playback:', error);
    return false;
  }
}

/**
 * Get current playback state (is playing or paused)
 */
export async function getPlaybackState(): Promise<{ isPlaying: boolean; trackId: string | null } | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeStoredToken();
      }
      return null;
    }

    // 204 means no content (nothing playing)
    if (response.status === 204) {
      return { isPlaying: false, trackId: null };
    }

    const data = await response.json();
    return {
      isPlaying: data.is_playing || false,
      trackId: data.item?.id || null,
    };
  } catch (error) {
    console.error('Error getting playback state:', error);
    return null;
  }
}

/**
 * Disconnect Spotify (remove token)
 */
export function disconnectSpotify(): void {
  removeStoredToken();
}

