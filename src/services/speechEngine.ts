export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentChunkIndex: number;
  totalChunks: number;
  currentSentenceText: string;
}

export type SpeechCallback = (state: SpeechState) => void;

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  private isPlaying = false;
  private isPaused = false;
  private currentChunks: string[] = [];
  private currentChunkIndex = 0;
  private currentRepeat = 1;
  private targetRepeats = 1;

  private speed = 0.8;
  private pitch = 1.0;
  private fullSentenceText = '';
  private dictationPauseMs = 3000; // 3 seconds pause between chunks for writing
  private pauseTimeout: any = null;

  private listeners: Set<SpeechCallback> = new Set();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
    }
  }

  private initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      this.voices = this.synth?.getVoices() || [];
      if (this.voices.length > 0 && !this.selectedVoice) {
        // Prefer natural English voices (Google US/UK, Samantha, Daniel, etc.)
        const enVoices = this.voices.filter(v => v.lang.startsWith('en'));
        const preferred = enVoices.find(v => 
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('Samantha') || 
          v.name.includes('Daniel')
        ) || enVoices[0] || this.voices[0];
        
        this.selectedVoice = preferred || null;
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  public setVoice(voiceURI: string) {
    const voice = this.voices.find(v => v.voiceURI === voiceURI);
    if (voice) {
      this.selectedVoice = voice;
    }
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  public setSpeed(newSpeed: number) {
    const clamped = Math.max(0.5, Math.min(1.5, Math.round(newSpeed * 10) / 10));
    this.speed = clamped;
    // If currently playing, we can restart the current chunk at the new speed
    if (this.isPlaying && !this.isPaused) {
      this.playCurrentChunk();
    }
  }

  public getSpeed(): number {
    return this.speed;
  }

  public setRepeatCount(count: 1 | 2 | 3) {
    this.targetRepeats = count;
  }

  public getRepeatCount(): number {
    return this.targetRepeats;
  }

  public setDictationPause(ms: number) {
    this.dictationPauseMs = Math.max(500, Math.min(10000, ms));
  }

  public getDictationPause(): number {
    return this.dictationPauseMs;
  }

  public setPacingPreset(preset: 'slow' | 'teacher' | 'natural') {
    if (preset === 'slow') {
      this.setSpeed(0.7);
      this.setDictationPause(4000);
    } else if (preset === 'teacher') {
      this.setSpeed(0.8);
      this.setDictationPause(3000);
    } else if (preset === 'natural') {
      this.setSpeed(1.0);
      this.setDictationPause(1500);
    }
  }

  public subscribe(cb: SpeechCallback): () => void {
    this.listeners.add(cb);
    this.notify();
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const state: SpeechState = {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentChunkIndex: this.currentChunkIndex,
      totalChunks: this.currentChunks.length,
      currentSentenceText: this.fullSentenceText
    };
    this.listeners.forEach(cb => cb(state));
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Speak a discrete chunk (e.g. 3 words at once) and stop, waiting for user input.
   */
  public speakDiscreteChunk(chunkText: string, chunkIndex: number, totalChunks: number) {
    this.cancel();
    if (!chunkText || !chunkText.trim() || !this.synth) return;

    this.currentChunks = [chunkText];
    this.currentChunkIndex = chunkIndex;
    this.fullSentenceText = chunkText;

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.rate = this.speed;
    utterance.pitch = this.pitch;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      const state: SpeechState = {
        isPlaying: true,
        isPaused: false,
        currentChunkIndex: chunkIndex,
        totalChunks: totalChunks,
        currentSentenceText: chunkText
      };
      this.listeners.forEach(cb => cb(state));
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      const state: SpeechState = {
        isPlaying: false,
        isPaused: false,
        currentChunkIndex: chunkIndex,
        totalChunks: totalChunks,
        currentSentenceText: chunkText
      };
      this.listeners.forEach(cb => cb(state));
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.notify();
    };

    this.currentUtterance = utterance;
    if (this.synth.paused) {
      this.synth.resume();
    }
    setTimeout(() => {
      if (this.synth && this.currentUtterance === utterance) {
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.speak(utterance);
      }
    }, 25);
  }

  /**
   * Speak an entire sentence by breaking it into chunks if needed.
   */
  public speakSentence(chunks: string[], fullText: string, resetRepeats = true) {
    this.cancel();

    if (!chunks || chunks.length === 0) return;

    this.currentChunks = chunks;
    this.currentChunkIndex = 0;
    this.fullSentenceText = fullText;
    if (resetRepeats) {
      this.currentRepeat = 1;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.notify();

    this.playCurrentChunk();
  }

  /**
   * Replay just the current speech chunk
   */
  public replayChunk() {
    if (this.currentChunks.length === 0) return;
    this.cancelUtteranceOnly();
    this.isPlaying = true;
    this.isPaused = false;
    this.playCurrentChunk();
  }

  /**
   * Replay the full sentence from the first chunk
   */
  public replaySentence() {
    if (this.currentChunks.length === 0) return;
    this.currentChunkIndex = 0;
    this.currentRepeat = 1;
    this.cancelUtteranceOnly();
    this.isPlaying = true;
    this.isPaused = false;
    this.playCurrentChunk();
  }

  public pause() {
    if (!this.synth || !this.isPlaying) return;
    this.synth.pause();
    this.isPaused = true;
    this.notify();
  }

  public resume() {
    if (!this.synth) return;
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notify();
    } else if (!this.isPlaying && this.currentChunks.length > 0) {
      this.playCurrentChunk();
    }
  }

  public cancel() {
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.notify();
  }

  private cancelUtteranceOnly() {
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  private playCurrentChunk() {
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }

    if (!this.synth || this.currentChunkIndex >= this.currentChunks.length) {
      this.isPlaying = false;
      this.isPaused = false;
      this.notify();
      return;
    }

    const chunkText = this.currentChunks[this.currentChunkIndex];
    this.cancelUtteranceOnly();

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.rate = this.speed;
    utterance.pitch = this.pitch;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.notify();
    };

    utterance.onend = () => {
      // Check if chunk should repeat
      if (this.currentRepeat < this.targetRepeats) {
        this.currentRepeat++;
        this.pauseTimeout = setTimeout(() => {
          if (this.isPlaying) {
            this.playCurrentChunk();
          }
        }, Math.min(1500, this.dictationPauseMs / 2));
        return;
      }

      // Reset repeat for next chunk
      this.currentRepeat = 1;

      // Check if more chunks exist in current sentence
      if (this.currentChunkIndex + 1 < this.currentChunks.length) {
        this.currentChunkIndex++;
        this.notify();
        // Comfortable dictation pause between chunks so learner can write while listening!
        this.pauseTimeout = setTimeout(() => {
          if (this.isPlaying) {
            this.playCurrentChunk();
          }
        }, this.dictationPauseMs);
      } else {
        // All chunks finished for this sentence
        this.isPlaying = false;
        this.isPaused = false;
        this.notify();
      }
    };

    utterance.onerror = (e) => {
      // Don't treat cancellation as a hard failure
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech synthesis utterance error:', e);
      }
      this.isPlaying = false;
      this.isPaused = false;
      this.notify();
    };

    this.currentUtterance = utterance;
    if (this.synth.paused) {
      this.synth.resume();
    }
    setTimeout(() => {
      if (this.synth && this.currentUtterance === utterance) {
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.speak(utterance);
      }
    }, 25);
  }
}

export const speechEngine = new SpeechEngine();
