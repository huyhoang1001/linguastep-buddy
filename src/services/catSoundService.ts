/**
 * Web Audio API Kitten Meow & Purr Synthesizer
 * Generates natural, cute cat chibi vocalizations without any external assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a cheerful high-pitched kitten meow: "Mew~!"
 */
export function playMeowSound(pitchMultiplier = 1.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Cat vocal tract formant filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(2.5, now);

    osc.type = 'triangle'; // Warmer, more organic than sine or saw

    // Pitch envelope: starting around 600Hz, rising to ~850Hz, then falling to 500Hz
    const baseFreq = 580 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.38);

    // Amplitude envelope: soft attack, sustained meow, gentle fade out
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (err) {
    console.warn('Audio synthesis note:', err);
  }
}

/**
 * Plays a double cheerful meow for correct answers: "Mew-Mew! 🐾"
 */
export function playCorrectMeowChime() {
  playMeowSound(1.05);
  setTimeout(() => {
    playMeowSound(1.25);
  }, 160);
}

/**
 * Plays an adorable baby kitten vocalization: high-sweet "Meww~!"
 */
export function playBabyCatMeow(pitchMultiplier = 1.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Sweet baby kitten formant filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1750, now);
    filter.Q.setValueAtTime(2.6, now);

    osc.type = 'triangle';

    // Cute baby kitten pitch: high, cheerful, with a sweet affectionate upward chirp
    const baseFreq = 820 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.48, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.30);

    // Dynamic amplitude envelope: soft attack, adorable rounded chirp
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (err) {
    console.warn('Baby cat audio synthesis note:', err);
  }
}

/**
 * Plays a dedicated baby-kitten petting interaction sound: cute soft baby mew followed by a gentle warm purr
 */
export function playPatHeadSound() {
  playBabyCatMeow(1.15);
  setTimeout(() => {
    playPurrSound();
  }, 180);
}

/**
 * Plays a gentle, calming rhythmic purr sound: "*Purrrr~*"
 * Engineered with audible harmonics (135Hz + 270Hz) and rhythmic 25Hz chest vibration,
 * ensuring rich, realistic audibility on all laptop, mobile, and desktop speakers.
 */
export function playPurrSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 1.1;

    // 1. Primary chest motor carrier (audible 135 Hz low-mid)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135, now);

    // 2. Warm harmonic overtone (270 Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(270, now);

    // 3. Feline purr LFO flutter modulator (25 Hz standard feline purr pulse)
    const mod = ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(25, now);

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(28, now);
    mod.connect(osc.frequency);
    mod.connect(osc2.frequency);

    // 4. Throat formant filter for warm vibrating feline purr
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    // 5. Volume amplitude shaping with two gentle rhythmic breath cycles
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    // Breath 1
    mainGain.gain.linearRampToValueAtTime(0.18, now + 0.12);
    mainGain.gain.exponentialRampToValueAtTime(0.08, now + 0.48);
    // Breath 2
    mainGain.gain.linearRampToValueAtTime(0.20, now + 0.65);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);

    mod.start(now);
    osc.start(now);
    osc2.start(now);

    mod.stop(now + duration);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  } catch (err) {
    console.warn('Purr synthesis note:', err);
  }
}

/**
 * Plays an energetic kitten alert sound when time is running low: "Mew! Mew! ⏰"
 */
export function playUrgentMeowAlert() {
  playMeowSound(1.15);
  setTimeout(() => {
    playMeowSound(1.35);
  }, 140);
}

/**
 * Plays a pleasant milestone chime followed by a contented kitten purr when time is up
 */
export function playTimesUpChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // 3-note melodic arpeggio (C5: 523Hz, E5: 659Hz, G5: 784Hz)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });

    setTimeout(() => {
      playMeowSound(1.0);
    }, 450);
  } catch (err) {
    console.warn('Times-up chime error:', err);
  }
}
