/**
 * Ambient Sound Synthesizer using Web Audio API
 * Generates White Noise, Rain Ambiance, and Lo-Fi Downtempo Beats procedurally
 * without relying on external assets or network connections.
 */

export type AmbientSoundType = 'white_noise' | 'rain' | 'lofi';

class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType | null = null;
  private isRunning: boolean = false;
  private volume: number = 0.5;

  // Cleanup callbacks for active generators
  private stopActiveSound: (() => void) | null = null;
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public getActiveType(): AmbientSoundType | null {
    return this.currentType;
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  public play(type: AmbientSoundType) {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (this.isRunning && this.currentType === type) {
      return;
    }

    // Stop current sound smoothly
    this.stopCurrent();

    this.currentType = type;
    this.isRunning = true;

    if (type === 'white_noise') {
      this.stopActiveSound = this.startWhiteNoise(ctx);
    } else if (type === 'rain') {
      this.stopActiveSound = this.startRain(ctx);
    } else if (type === 'lofi') {
      this.stopActiveSound = this.startLoFi(ctx);
    }
    this.notify();
  }

  public pause() {
    this.stopCurrent();
    this.isRunning = false;
    this.notify();
  }

  public stopCurrent() {
    if (this.stopActiveSound) {
      try {
        this.stopActiveSound();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.stopActiveSound = null;
    }
  }

  public toggle(type?: AmbientSoundType) {
    const targetType = type || this.currentType || 'white_noise';
    if (this.isRunning) {
      if (type && type !== this.currentType) {
        this.play(type);
      } else {
        this.pause();
      }
    } else {
      this.play(targetType);
    }
  }

  // ----------------------------------------------------
  // 1. WHITE NOISE GENERATOR
  // ----------------------------------------------------
  private startWhiteNoise(ctx: AudioContext): () => void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Warm bandpass filter to eliminate harsh shrill highs and muddy sub-rumble
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, ctx.currentTime);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(200, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.setTargetAtTime(0.35, ctx.currentTime, 0.2);

    whiteNoise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain!);

    whiteNoise.start();

    return () => {
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
      setTimeout(() => {
        try {
          whiteNoise.stop();
          whiteNoise.disconnect();
          highpass.disconnect();
          lowpass.disconnect();
          gain.disconnect();
        } catch (e) {}
      }, 150);
    };
  }

  // ----------------------------------------------------
  // 2. RAIN AMBIANCE GENERATOR
  // ----------------------------------------------------
  private startRain(ctx: AudioContext): () => void {
    const bufferSize = ctx.sampleRate * 2;
    // Generate pink-brown noise buffer
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
        b6 = white * 0.115926;
      }
    }

    const rainSource = ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    // Filter 1: Gentle body of rain
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(850, ctx.currentTime);

    // Filter 2: High hiss of raindrops on leaves
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(320, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.001, ctx.currentTime);
    rainGain.gain.setTargetAtTime(0.45, ctx.currentTime, 0.2);

    rainSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(rainGain);
    rainGain.connect(this.masterGain!);

    rainSource.start();

    // Occasional gentle water drops
    let dropInterval: any = null;
    const playRandomDrop = () => {
      if (!this.isRunning || this.currentType !== 'rain') return;
      const osc = ctx.createOscillator();
      const dropGain = ctx.createGain();
      const dropFilter = ctx.createBiquadFilter();

      const freq = 600 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.08);

      dropFilter.type = 'bandpass';
      dropFilter.frequency.setValueAtTime(freq, ctx.currentTime);

      dropGain.gain.setValueAtTime(0.02 * (0.5 + Math.random() * 0.5), ctx.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(dropFilter);
      dropFilter.connect(dropGain);
      dropGain.connect(this.masterGain!);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
      setTimeout(() => {
        try {
          osc.disconnect();
          dropFilter.disconnect();
          dropGain.disconnect();
        } catch (e) {}
      }, 100);
    };

    dropInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        playRandomDrop();
      }
    }, 400);

    return () => {
      clearInterval(dropInterval);
      rainGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
      setTimeout(() => {
        try {
          rainSource.stop();
          rainSource.disconnect();
          highpass.disconnect();
          lowpass.disconnect();
          rainGain.disconnect();
        } catch (e) {}
      }, 150);
    };
  }

  // ----------------------------------------------------
  // 3. LO-FI BEATS & CHORD GENERATOR
  // ----------------------------------------------------
  private startLoFi(ctx: AudioContext): () => void {
    let isStopped = false;
    let timerId: any = null;

    // 1. Subtle Vinyl Crackle / Warm Tape Hiss
    const crackleBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const cData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < cData.length; i++) {
      const r = Math.random();
      // Occasional needle pop + subtle hiss
      cData[i] = r > 0.9992 ? (Math.random() * 2 - 1) * 0.4 : (Math.random() * 2 - 1) * 0.015;
    }
    const crackleSource = ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.setValueAtTime(2200, ctx.currentTime);
    crackleFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.12, ctx.currentTime);

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain!);
    crackleSource.start();

    // 2. Chord Progression: Dm9 -> G13 -> Cmaj9 -> Am9 (Warm jazzy lo-fi progression)
    // Note frequencies in Hz
    const chords = [
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9: D3, F3, A3, C4, E4
      [98.00, 174.61, 246.94, 329.63],          // G13: G2, F3, B3, E4
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9: C3, E3, G3, B3, D4
      [110.00, 196.00, 261.63, 329.63, 493.88], // Am9: A2, G3, C4, E4, B4
    ];

    let chordIdx = 0;
    const bpm = 74;
    const beatDuration = 60 / bpm; // ~0.81s per beat
    const chordDuration = beatDuration * 4; // 4 beats per bar

    const playMellowChord = (notes: number[], startTime: number, duration: number) => {
      notes.forEach((freq, noteIdx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Warm triangle wave with slight sine blend
        osc.type = noteIdx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Warm lowpass filter to mimic Rhodes vintage electric piano
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, startTime);
        filter.frequency.exponentialRampToValueAtTime(380, startTime + duration);

        // Soft envelope: gentle attack, sustained warmth, smooth release
        const noteVol = noteIdx === 0 ? 0.08 : 0.04;
        oscGain.gain.setValueAtTime(0.0001, startTime);
        oscGain.gain.linearRampToValueAtTime(noteVol, startTime + 0.15);
        oscGain.gain.setTargetAtTime(noteVol * 0.7, startTime + 0.2, duration * 0.4);
        oscGain.gain.setTargetAtTime(0.0001, startTime + duration - 0.2, 0.1);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain!);

        osc.start(startTime);
        osc.stop(startTime + duration);

        setTimeout(() => {
          try {
            osc.disconnect();
            filter.disconnect();
            oscGain.disconnect();
          } catch (e) {}
        }, (startTime - ctx.currentTime + duration + 0.1) * 1000);
      });
    };

    // Soft lo-fi kick on beat 1 and beat 3
    const playKick = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(80, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(time);
      osc.stop(time + 0.16);
    };

    // Soft lo-fi rimshot/snare on beat 2 and beat 4
    const playSnare = (time: number) => {
      const noise = ctx.createBufferSource();
      const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = nBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = nBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      noise.start(time);
      noise.stop(time + 0.13);
    };

    // Soft lo-fi closed hi-hat
    const playHat = (time: number, accent: boolean) => {
      const noise = ctx.createBufferSource();
      const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = nBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = nBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(accent ? 0.045 : 0.025, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      noise.start(time);
      noise.stop(time + 0.05);
    };

    // Scheduler loop
    let nextBarTime = ctx.currentTime + 0.05;

    const scheduleBar = () => {
      if (isStopped) return;

      const currentChord = chords[chordIdx % chords.length];
      playMellowChord(currentChord, nextBarTime, chordDuration);

      // Drum pattern across the 4 beats
      playKick(nextBarTime);                         // Beat 1
      playSnare(nextBarTime + beatDuration);         // Beat 2
      playKick(nextBarTime + beatDuration * 2);     // Beat 3
      playSnare(nextBarTime + beatDuration * 3);     // Beat 4

      // Hi-hats on 8th notes with subtle swing
      for (let b = 0; b < 4; b++) {
        playHat(nextBarTime + beatDuration * b, true);
        playHat(nextBarTime + beatDuration * b + beatDuration * 0.54, false); // subtle swing
      }

      chordIdx++;
      nextBarTime += chordDuration;

      const delay = (nextBarTime - ctx.currentTime - 0.2) * 1000;
      timerId = setTimeout(scheduleBar, Math.max(100, delay));
    };

    scheduleBar();

    return () => {
      isStopped = true;
      if (timerId) clearTimeout(timerId);
      try {
        crackleGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
        setTimeout(() => {
          try {
            crackleSource.stop();
            crackleSource.disconnect();
            crackleFilter.disconnect();
            crackleGain.disconnect();
          } catch (e) {}
        }, 120);
      } catch (e) {}
    };
  }

  public cleanup() {
    this.stopCurrent();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

// Singleton audio manager
export const ambientSound = new AmbientAudioManager();
