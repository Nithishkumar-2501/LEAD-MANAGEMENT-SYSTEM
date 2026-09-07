/**
 * ============================================================================
 * AudioProcessor - Audio Visualizer & Ringtone Synthesizer
 * ============================================================================
 * Uses native Web Audio API (zero external audio file dependencies).
 */

class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.animationId = null;
    this.ringOscillator1 = null;
    this.ringOscillator2 = null;
    this.ringGain = null;
    this.ringInterval = null;
    this.isRinging = false;
  }

  getOrCreateContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // -------------------------------------------------------------
  // 1. Live Voice Audio Visualizer (Dynamic Canvas Waveform)
  // -------------------------------------------------------------
  startVisualizer(mediaStream, canvasElement) {
    if (!mediaStream || !canvasElement) return;

    this.stopVisualizer();

    const ctx = this.getOrCreateContext();
    const canvasCtx = canvasElement.getContext("2d");

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(mediaStream);
    source.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      const barWidth = (canvasElement.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvasElement.height * 0.9;

        // Gradient glow
        const gradient = canvasCtx.createLinearGradient(0, canvasElement.height, 0, 0);
        gradient.addColorStop(0, "#10b981"); // Emerald
        gradient.addColorStop(0.5, "#38bdf8"); // Sky blue
        gradient.addColorStop(1, "#818cf8"); // Indigo

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(
          x,
          canvasElement.height - barHeight,
          barWidth - 1,
          barHeight
        );

        x += barWidth;
      }
    };

    draw();
  }

  stopVisualizer() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // -------------------------------------------------------------
  // 2. Realistic Dual-Tone Ringtone Synthesizer (440Hz + 480Hz US/Global Standard)
  // -------------------------------------------------------------
  startRingtone() {
    if (this.isRinging) return;
    this.isRinging = true;

    const ctx = this.getOrCreateContext();

    const playChimeBurst = () => {
      if (!this.isRinging) return;

      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // Standard 440 Hz
        osc2.frequency.setValueAtTime(480, ctx.currentTime); // Standard 480 Hz

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.8);
        osc2.stop(ctx.currentTime + 1.8);
      } catch (err) {
        console.warn("[Ringtone Error]", err);
      }
    };

    playChimeBurst();
    this.ringInterval = setInterval(playChimeBurst, 3000);
  }

  stopRingtone() {
    this.isRinging = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

window.AudioProcessor = AudioProcessor;
