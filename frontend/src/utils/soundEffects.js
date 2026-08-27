/**
 * Zero-Dependency Web Audio API Sound Synthesizer & Physical Haptics Engine for TripVault
 * Generates crisp, studio-grade haptic UI audio effects and real device vibrations with 0ms latency.
 */

class SoundEffectsEngine {
  constructor() {
    this.ctx = null;
    this.enabled = typeof window !== 'undefined' 
      ? localStorage.getItem('tripvault_sound_enabled') !== 'false' 
      : true;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripvault_sound_enabled', val ? 'true' : 'false');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * 📳 Device Haptic Vibration Trigger
   */
  triggerHaptic(pattern = 10) {
    if (!this.enabled) return;
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Haptics fail-safe
    }
  }

  /**
   * 💸 Warm Soothing Expense Confirmation (Soft Marimba / Apple-style Silk Bell)
   */
  playExpenseSound() {
    this.triggerHaptic(12);
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Lowpass filter to eliminate any harsh high frequencies
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.5, now);
      filter.connect(this.ctx.destination);

      // 1. Warm Acoustic Body (F4 -> A4)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(349.23, now); // F4
      osc1.frequency.exponentialRampToValueAtTime(440.00, now + 0.05); // A4

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc1.connect(gain1);
      gain1.connect(filter);
      osc1.start(now);
      osc1.stop(now + 0.24);

      // 2. Silky Harmonic Bell (C5)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.04); // C5

      gain2.gain.setValueAtTime(0.001, now + 0.04);
      gain2.gain.linearRampToValueAtTime(0.13, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc2.connect(gain2);
      gain2.connect(filter);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.32);

      // 3. Subtle Warm Sub-Thump (F3)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(174.61, now); // F3
      osc3.frequency.exponentialRampToValueAtTime(110.00, now + 0.08);

      gain3.gain.setValueAtTime(0.12, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc3.connect(gain3);
      gain3.connect(filter);
      osc3.start(now);
      osc3.stop(now + 0.10);
    } catch {
      // Audio autoplay policy fail-safe
    }
  }

  /**
   * 🤝 Triumph Chord / Settle Up Chime (When a debt is settled)
   */
  playSettleSound() {
    this.triggerHaptic([25, 35, 30, 35, 20]);
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major triad

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.01, start + 0.5);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {
      // Audio fail-safe
    }
  }

  /**
   * 🚀 Vault Opening / Join Chime (When entering a new vault or joining)
   */
  playJoinSound() {
    this.triggerHaptic([20, 50, 25]);
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch {
      // Fail-safe
    }
  }

  /**
   * 🗑️ Subtle Delete Pop (When an expense or member is removed)
   */
  playDeleteSound() {
    this.triggerHaptic([35, 25, 35]);
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Fail-safe
    }
  }

  /**
   * 🔘 Tactile Mechanical Haptic Tick (For buttons, chip amounts & toggles)
   */
  playHapticTick() {
    this.triggerHaptic(8);
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // High-precision mechanical micro-tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.015);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.015);
    } catch {
      // Fail-safe
    }
  }

  /**
   * 🔘 Alias for playHapticTick
   */
  playClickSound() {
    this.playHapticTick();
  }
}

export const sound = new SoundEffectsEngine();
