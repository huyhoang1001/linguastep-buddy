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
 * Plays a gentle, calming rhythmic purr sound: "*Purrrr~*"
 */
export function playPurrSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.8;

    // Carrier oscillator: deep low frequency
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(48, now);

    // Modulator oscillator: rhythmic purr vibrato (22-26 Hz)
    const mod = ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(24, now);

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(15, now);

    mod.connect(osc.frequency);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(0.14, now + 0.1);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(mainGain);
    mainGain.connect(ctx.destination);

    mod.start(now);
    osc.start(now);

    mod.stop(now + duration);
    osc.stop(now + duration);
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
