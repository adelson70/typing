/**
 * Keystroke sound.
 *
 * Synthesised with the Web Audio API rather than loaded as audio files: a
 * sample set would be tens of kilobytes fetched on a page whose entire point is
 * to load instantly, and a keystroke sound is a short percussive click that
 * synthesis handles well.
 *
 * The design target is a soft, low-profile "tock" — closer to a well-damped
 * keyboard than to a mechanical click. Sound during typing is heard hundreds of
 * times a minute, so anything sharp becomes irritating within a session.
 */

/** A single AudioContext for the page; creating one per keystroke leaks. */
let context: AudioContext | null = null;
/** Shared bus, so overlapping keystrokes cannot sum into clipping. */
let masterGain: GainNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!context) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    try {
      context = new Ctor();
      masterGain = context.createGain();
      // Deliberately quiet. This plays on every keystroke, and a level that
      // seems fine for one press is fatiguing across a five-minute test.
      masterGain.gain.value = 0.22;
      masterGain.connect(context.destination);
    } catch {
      return null;
    }
  }

  return context;
}

/**
 * Browsers suspend audio until a user gesture. Called from the first keystroke,
 * which is itself a gesture, so playback is allowed from then on.
 */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
}

export type KeySoundKind = 'key' | 'error' | 'space';

/**
 * Plays one keystroke.
 *
 * Every call builds a fresh oscillator and envelope: Web Audio source nodes are
 * single-use by design, and reusing one throws.
 */
export function playKeySound(kind: KeySoundKind = 'key'): void {
  const ctx = getContext();
  if (!ctx || !masterGain || ctx.state !== 'running') return;

  try {
    const now = ctx.currentTime;

    // A short noise burst gives the attack its "thock"; a sine under it
    // supplies the body. Noise alone sounds like static, tone alone like a beep.
    const duration = kind === 'error' ? 0.09 : 0.05;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Pitch carries the meaning: a lower tone for the wider space bar, a
    // dissonant low tone for an error. The player learns these without being
    // told, which is why the error tone is distinct rather than merely louder.
    const frequency = kind === 'error' ? 150 : kind === 'space' ? 190 : 260;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    // A quick downward sweep reads as a physical impact rather than a note.
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + duration);

    // Rolling off the top removes the click's harshness.
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(kind === 'error' ? 900 : 1_800, now);
    filter.Q.value = 0.7;

    // Near-instant attack, exponential decay. A linear decay sounds abrupt
    // because loudness perception is logarithmic.
    const peak = kind === 'error' ? 0.9 : 0.6;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);

    // Release the nodes once they have finished, or a long session accumulates
    // thousands of disconnected graphs.
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {
    // Audio failure must never interrupt typing.
  }
}

/** Sets the master level, 0–1. */
export function setSoundVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume)) * 0.35;
  }
}
