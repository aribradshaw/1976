// Billboard Hot 100 #1 songs for each week of the 1976 campaign
// Week 1 is the first week, Week 25 is election week (Nov 2, 1976)

export interface WeeklySong {
  week: number;
  artist: string;
  track: string;
  spotifyId?: string; // Will be populated when searching Spotify
}

export const WEEKLY_SONGS: WeeklySong[] = [
  { week: 1, artist: 'The Sylvers', track: 'Boogie Fever', spotifyId: '3FZB0xezeoc1ddx72eg7iF' },
  { week: 2, artist: 'Wings', track: 'Silly Love Songs' },
  { week: 3, artist: 'Diana Ross', track: 'Love Hangover' },
  { week: 4, artist: 'Diana Ross', track: 'Love Hangover' },
  { week: 5, artist: 'Wings', track: 'Silly Love Songs' },
  { week: 6, artist: 'Wings', track: 'Silly Love Songs' },
  { week: 7, artist: 'Wings', track: 'Silly Love Songs' },
  { week: 8, artist: 'Wings', track: 'Silly Love Songs' },
  { week: 9, artist: 'Starland Vocal Band', track: 'Afternoon Delight' },
  { week: 10, artist: 'Starland Vocal Band', track: 'Afternoon Delight' },
  { week: 11, artist: 'The Manhattans', track: 'Kiss and Say Goodbye' },
  { week: 12, artist: 'The Manhattans', track: 'Kiss and Say Goodbye' },
  { week: 13, artist: 'Elton John', track: "Don't Go Breaking My Heart", spotifyId: '7HW5WIw7ZgZORCzUxv5gW5' }, // Elton John and Kiki Dee
  { week: 14, artist: 'Elton John', track: "Don't Go Breaking My Heart", spotifyId: '7HW5WIw7ZgZORCzUxv5gW5' },
  { week: 15, artist: 'Elton John', track: "Don't Go Breaking My Heart", spotifyId: '7HW5WIw7ZgZORCzUxv5gW5' },
  { week: 16, artist: 'Elton John', track: "Don't Go Breaking My Heart", spotifyId: '7HW5WIw7ZgZORCzUxv5gW5' },
  { week: 17, artist: 'Bee Gees', track: 'You Should Be Dancing' },
  { week: 18, artist: 'KC and the Sunshine Band', track: '(Shake, Shake, Shake) Shake Your Booty' },
  { week: 19, artist: 'KC and the Sunshine Band', track: '(Shake, Shake, Shake) Shake Your Booty' },
  { week: 20, artist: 'Wild Cherry', track: 'Play That Funky Music' },
  { week: 21, artist: 'Wild Cherry', track: 'Play That Funky Music' },
  { week: 22, artist: 'Walter Murphy', track: 'A Fifth of Beethoven' },
  { week: 23, artist: 'Rick Dees', track: 'Disco Duck' },
  { week: 24, artist: 'Chicago', track: "If You Leave Me Now" },
  { week: 25, artist: 'Chicago', track: "If You Leave Me Now" },
];

/**
 * Get the #1 song for a specific week
 */
export function getSongForWeek(week: number): WeeklySong | null {
  return WEEKLY_SONGS.find(song => song.week === week) || null;
}

