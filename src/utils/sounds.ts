// Sound effects utility for button clicks and UI interactions

const BASE_URL = import.meta.env.BASE_URL;

const CLICK_SOUNDS = [
  `${BASE_URL}audio/clicks/ESM_BG_Cinematic_FX_ui_button_one_shot_digital_mouse_double_click_02.wav`,
  `${BASE_URL}audio/clicks/ESM_Builder_Game_Switch_3_Click_Button_Tab_Select_Particle_Chirp.wav`,
  `${BASE_URL}audio/clicks/ESM_GW_foley_one_shot_gun_handling_trigger_22_rifle_click_squeeze_pull_5.wav`,
  `${BASE_URL}audio/clicks/ESM_Perfect_Clean_App_Button_Click_2_Organic_Simple_Classic_Game_Click.wav`,
];

// Cache audio elements for better performance
const audioCache = new Map<string, HTMLAudioElement>();

// Default volume (0.5 = 50%)
const DEFAULT_VOLUME = 0.5;

/**
 * Get the current sound volume from localStorage or return default
 */
export function getSoundVolume(): number {
  const stored = localStorage.getItem('soundVolume');
  if (stored !== null) {
    const volume = parseFloat(stored);
    if (!isNaN(volume) && volume >= 0 && volume <= 1) {
      return volume;
    }
  }
  return DEFAULT_VOLUME;
}

/**
 * Set the sound volume and update all cached audio elements
 */
export function setSoundVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  localStorage.setItem('soundVolume', clampedVolume.toString());
  
  // Update all cached audio elements
  audioCache.forEach((audio) => {
    audio.volume = clampedVolume;
  });
}

/**
 * Get a random click sound path
 */
function getRandomClickSound(): string {
  return CLICK_SOUNDS[Math.floor(Math.random() * CLICK_SOUNDS.length)];
}

/**
 * Get or create an audio element for a sound file
 */
function getAudioElement(src: string): HTMLAudioElement {
  if (!audioCache.has(src)) {
    const audio = new Audio(src);
    audio.volume = getSoundVolume(); // Use current volume setting
    audioCache.set(src, audio);
  } else {
    // Update volume for existing audio elements to ensure they're at current setting
    const audio = audioCache.get(src)!;
    audio.volume = getSoundVolume();
  }
  return audioCache.get(src)!;
}

/**
 * Play a random click sound
 */
export function playClickSound(): void {
  const soundPath = getRandomClickSound();
  const audio = getAudioElement(soundPath);
  
  // Reset to beginning and play
  audio.currentTime = 0;
  audio.play().catch(error => {
    // Ignore errors (user might not have interacted with page yet)
    console.debug('Could not play click sound:', error);
  });
}

/**
 * Play the end turn sound (using ESM game notification sound)
 */
export function playEndTurnSound(): void {
  // Use ESM game notification sound for end week button
  const endTurnSound = `${BASE_URL}audio/ESM_Game_Notification_83_Coin_Blip_Select_Tap_Button.wav`;
  const audio = getAudioElement(endTurnSound);
  
  // Reset to beginning and play
  audio.currentTime = 0;
  audio.play().catch(error => {
    // Ignore errors (user might not have interacted with page yet)
    console.debug('Could not play end turn sound:', error);
  });
}

/**
 * Play state select sound
 */
export function playStateSelectSound(): void {
  const stateSelectSound = `${BASE_URL}audio/stateselect.wav`;
  const audio = getAudioElement(stateSelectSound);
  
  // Reset to beginning and play
  audio.currentTime = 0;
  audio.play().catch(error => {
    // Ignore errors (user might not have interacted with page yet)
    console.debug('Could not play state select sound:', error);
  });
}

/**
 * Play state deselect sound
 */
export function playStateDeselectSound(): void {
  const stateDeselectSound = `${BASE_URL}audio/deselectstate.wav`;
  const audio = getAudioElement(stateDeselectSound);
  
  // Reset to beginning and play
  audio.currentTime = 0;
  audio.play().catch(error => {
    // Ignore errors (user might not have interacted with page yet)
    console.debug('Could not play state deselect sound:', error);
  });
}

