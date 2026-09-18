// sound.js — Web Audio API Synthesized Sound Manager
// 100% self-contained: zero external audio assets, zero latency, offline & mobile friendly.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('talktostrangers_muted');
        if (saved !== null) {
          this.muted = saved === 'true';
        }
      } catch (e) {
        // LocalStorage access issues
      }
    }
  }

  initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('talktostrangers_muted', String(this.muted));
    } catch (e) {}
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1, delay = 0) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const startTime = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {}
  }

  // Sent message: crisp subtle pop
  playSent() {
    this.playTone(520, 'sine', 0.08, 0.08);
  }

  // Incoming message: friendly two-tone ping
  playReceived() {
    this.playTone(587.33, 'sine', 0.1, 0.12, 0); // D5
    this.playTone(880, 'sine', 0.14, 0.12, 0.09); // A5
  }

  // Match found: uplifting chime chord
  playMatch() {
    this.playTone(440, 'triangle', 0.18, 0.12, 0); // A4
    this.playTone(554.37, 'triangle', 0.18, 0.12, 0.08); // C#5
    this.playTone(659.25, 'triangle', 0.22, 0.14, 0.16); // E5
  }

  // Stranger skipped/left: soft descending drop
  playDisconnect() {
    this.playTone(400, 'sine', 0.14, 0.08, 0);
    this.playTone(280, 'sine', 0.18, 0.08, 0.1);
  }

  // Game invite received: dual doorbell ding
  playGameInvite() {
    this.playTone(659.25, 'sine', 0.15, 0.15, 0); // E5
    this.playTone(523.25, 'sine', 0.22, 0.15, 0.15); // C5
  }

  // Game piece placed / move made
  playGameMove() {
    this.playTone(480, 'triangle', 0.06, 0.1);
  }

  // Game victory fanfare
  playGameWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.25, 0.15, idx * 0.1);
    });
  }

  // Game draw or loss
  playGameLoss() {
    this.playTone(350, 'sawtooth', 0.2, 0.08, 0);
    this.playTone(280, 'sawtooth', 0.3, 0.08, 0.18);
  }
}

export const sound = new SoundManager();
