/**
 * AudioHaptics — Web Audio API haptic simulator
 * Provides tactile-feeling audio cues that mimic mobile haptic patterns.
 */
export class AudioHaptics {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Typewriter tick — a high-frequency short blip for each character reveal */
  tick(): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.03);
    } catch { /* silent fail */ }
  }

  /** Button click — a clean UI pop for standard interactions */
  click(): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch { /* silent fail */ }
  }

  /** Dodge/evade — a sine wave swoosh for evading attacks */
  dodge(): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch { /* silent fail */ }
  }

  /** Heavy hit — low-frequency sawtooth distortion for taking heavy damage */
  heavy(): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch { /* silent fail */ }
  }

  /** Gold ring — high-pitch dual sine for gaining currency */
  gold(): void {
    try {
      const ctx = this.getCtx();
      [1047, 1319].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5 + i * 0.05);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + 0.55 + i * 0.05);
      });
    } catch { /* silent fail */ }
  }

  /** Triumph chord — C-Major for leveling up or defeating a boss */
  chord(): void {
    try {
      const ctx = this.getCtx();
      const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + 1.3);
      });
    } catch { /* silent fail */ }
  }

  /** Shield block — metallic clang for defensive success */
  shield(): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch { /* silent fail */ }
  }
}

export const audioHaptics = new AudioHaptics();
