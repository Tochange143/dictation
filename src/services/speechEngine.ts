export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentChunkIndex: number;
  totalChunks: number;
  currentSentenceText: string;
}

export type SpeechCallback = (state: SpeechState) => void;

export function isIndianVoice(voice: { lang?: string; name?: string }): boolean {
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  const name = (voice.name || '').toLowerCase();

  if (
    lang.startsWith('en-in') ||
    lang.startsWith('hi-in') ||
    lang.startsWith('te-in') ||
    lang.startsWith('ta-in') ||
    lang.startsWith('mr-in') ||
    lang.startsWith('bn-in') ||
    lang.startsWith('gu-in') ||
    lang.startsWith('kn-in') ||
    lang === 'en-in' ||
    lang === 'hi'
  ) {
    return true;
  }

  const indianKeywords = [
    'india',
    'indian',
    'heera',     // Microsoft Heera (Windows English India)
    'ravi',      // Microsoft Ravi (Windows English India)
    'neerja',    // Microsoft Neerja (Edge Natural English India)
    'prabhat',   // Microsoft Prabhat (Edge Natural English India)
    'rishi',     // Apple Rishi (macOS/iOS English India)
    'veena',     // Apple Veena (macOS/iOS English India)
    'sangeeta',  // Apple Sangeeta (macOS/iOS English India)
    'swara',     // Edge/Android Swara
    'madhur',    // Edge/Android Madhur
    'ananya',    // Android/Cloud TTS Ananya
    'aarav',     // Android/Cloud TTS Aarav
    'kavya',     // Android/Cloud TTS Kavya
    'हिन्दी',
    'hindi'
  ];

  return indianKeywords.some(keyword => name.includes(keyword));
}

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private selectedVoiceURI: string | null = null;
  private preferredAccent: 'en-IN' | 'en-US' | 'en-GB' | 'all' = 'en-IN';

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
      if (this.voices.length > 0) {
        if (this.selectedVoiceURI) {
          const match = this.voices.find(v => v.voiceURI === this.selectedVoiceURI);
          if (match) {
            this.selectedVoice = match;
            return;
          }
        }
        // Auto-select best voice matching preferred accent (defaults to Indian accent)
        this.pickBestVoiceForAccent(this.preferredAccent);
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
    return this.voices.filter(v => (v.lang && v.lang.startsWith('en')) || isIndianVoice(v));
  }

  public getIndianVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(v => isIndianVoice(v));
  }

  public pickBestVoiceForAccent(accent: 'en-IN' | 'en-US' | 'en-GB' | 'all'): SpeechSynthesisVoice | null {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }

    if (accent === 'en-IN') {
      const indianVoices = this.voices.filter(v => isIndianVoice(v));
      if (indianVoices.length > 0) {
        const preferred = indianVoices.find(v => 
          v.name.includes('Natural') || 
          v.name.includes('Online') || 
          v.name.includes('Heera') || 
          v.name.includes('Neerja') || 
          v.name.includes('Ravi') || 
          v.name.includes('Google') ||
          v.name.includes('Rishi')
        ) || indianVoices[0];
        this.selectedVoice = preferred;
        return preferred;
      }
      this.selectedVoice = null;
      return null;
    }

    if (accent === 'en-US') {
      const usVoices = this.voices.filter(v => {
        const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
        return lang.startsWith('en-us') && !isIndianVoice(v);
      });
      if (usVoices.length > 0) {
        const preferred = usVoices.find(v => 
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('Samantha') || 
          v.name.includes('Guy') || 
          v.name.includes('Jenny')
        ) || usVoices[0];
        this.selectedVoice = preferred;
        return preferred;
      }
    }

    if (accent === 'en-GB') {
      const ukVoices = this.voices.filter(v => {
        const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
        return lang.startsWith('en-gb') && !isIndianVoice(v);
      });
      if (ukVoices.length > 0) {
        const preferred = ukVoices.find(v => 
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('Daniel') || 
          v.name.includes('Sonia')
        ) || ukVoices[0];
        this.selectedVoice = preferred;
        return preferred;
      }
    }

    const enVoices = this.voices.filter(v => (v.lang || '').startsWith('en'));
    if (enVoices.length > 0) {
      this.selectedVoice = enVoices[0];
      return enVoices[0];
    }
    return null;
  }

  public setAccent(accent: 'en-IN' | 'en-US' | 'en-GB' | 'all') {
    this.preferredAccent = accent;
    this.pickBestVoiceForAccent(accent);
  }

  public getAccent(): 'en-IN' | 'en-US' | 'en-GB' | 'all' {
    return this.preferredAccent;
  }

  public setVoice(voiceURI: string | null) {
    this.selectedVoiceURI = voiceURI;
    if (!voiceURI || voiceURI === 'auto:en-IN') {
      this.preferredAccent = 'en-IN';
      this.pickBestVoiceForAccent('en-IN');
      return;
    }
    if (voiceURI === 'auto:en-US') {
      this.preferredAccent = 'en-US';
      this.pickBestVoiceForAccent('en-US');
      return;
    }
    if (voiceURI === 'auto:en-GB') {
      this.preferredAccent = 'en-GB';
      this.pickBestVoiceForAccent('en-GB');
      return;
    }

    const voice = this.voices.find(v => v.voiceURI === voiceURI);
    if (voice) {
      this.selectedVoice = voice;
      if (isIndianVoice(voice)) {
        this.preferredAccent = 'en-IN';
      }
    }
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  public testVoice(sampleText = 'Hello! This is your English dictation teacher.') {
    this.speakDiscreteChunk(sampleText, 0, 1);
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
      utterance.lang = this.selectedVoice.lang || (this.preferredAccent === 'en-IN' ? 'en-IN' : 'en-US');
    } else {
      utterance.lang = this.preferredAccent === 'en-IN' ? 'en-IN' : 'en-US';
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
      utterance.lang = this.selectedVoice.lang || (this.preferredAccent === 'en-IN' ? 'en-IN' : 'en-US');
    } else {
      utterance.lang = this.preferredAccent === 'en-IN' ? 'en-IN' : 'en-US';
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
