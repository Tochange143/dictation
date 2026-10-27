import { describe, it, expect, beforeEach, vi } from 'vitest';
import { speechEngine, isIndianVoice, sanitizeSpeechText } from '../src/services/speechEngine';

describe('Speech Engine Service', () => {
  it('cleans and normalizes text for speech articulation without TTS glitches', () => {
    expect(sanitizeSpeechText('"Hello," she said.')).toBe('Hello, she said.');
    expect(sanitizeSpeechText('Word—another word')).toBe('Word , another word');
    expect(sanitizeSpeechText('[Missing word]')).toBe('Missing word');
  });

  it('manages speech speed with boundary clamps (0.5x to 1.5x)', () => {
    speechEngine.setSpeed(0.8);
    expect(speechEngine.getSpeed()).toBe(0.8);

    // Clamp below 0.5
    speechEngine.setSpeed(0.2);
    expect(speechEngine.getSpeed()).toBe(0.5);

    // Clamp above 1.5
    speechEngine.setSpeed(2.0);
    expect(speechEngine.getSpeed()).toBe(1.5);

    // Normal valid setting
    speechEngine.setSpeed(1.1);
    expect(speechEngine.getSpeed()).toBe(1.1);
  });

  it('manages repeat count (1x, 2x, 3x)', () => {
    speechEngine.setRepeatCount(2);
    expect(speechEngine.getRepeatCount()).toBe(2);

    speechEngine.setRepeatCount(3);
    expect(speechEngine.getRepeatCount()).toBe(3);

    speechEngine.setRepeatCount(1);
    expect(speechEngine.getRepeatCount()).toBe(1);
  });

  it('handles state subscriptions cleanly', () => {
    let capturedState: any = null;
    const unsubscribe = speechEngine.subscribe((state) => {
      capturedState = state;
    });

    expect(capturedState).toBeTruthy();
    expect(typeof capturedState.isPlaying).toBe('boolean');
    expect(typeof capturedState.isPaused).toBe('boolean');

    unsubscribe();
  });

  it('identifies Indian English voices accurately across platforms', () => {
    // Windows / Edge voices
    expect(isIndianVoice({ name: 'Microsoft Heera - English (India)', lang: 'en-IN' })).toBe(true);
    expect(isIndianVoice({ name: 'Microsoft Ravi - English (India)', lang: 'en-IN' })).toBe(true);
    expect(isIndianVoice({ name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN' })).toBe(true);
    expect(isIndianVoice({ name: 'Microsoft Prabhat Online (Natural) - English (India)', lang: 'en-IN' })).toBe(true);
    
    // Google / Chrome / Android voices
    expect(isIndianVoice({ name: 'Google English (India)', lang: 'en-IN' })).toBe(true);
    expect(isIndianVoice({ name: 'Google हिन्दी', lang: 'hi-IN' })).toBe(true);

    // Apple macOS / iOS voices
    expect(isIndianVoice({ name: 'Rishi', lang: 'en-IN' })).toBe(true);
    expect(isIndianVoice({ name: 'Veena', lang: 'en-IN' })).toBe(true);
    expect(isIndianVoice({ name: 'Sangeeta', lang: 'en-IN' })).toBe(true);

    // Non-Indian voices
    expect(isIndianVoice({ name: 'Google US English', lang: 'en-US' })).toBe(false);
    expect(isIndianVoice({ name: 'Microsoft David - English (United States)', lang: 'en-US' })).toBe(false);
    expect(isIndianVoice({ name: 'Daniel', lang: 'en-GB' })).toBe(false);
  });

  it('manages preferred voice accent and defaults to Indian Accent (en-IN)', () => {
    expect(speechEngine.getAccent()).toBe('en-IN');

    speechEngine.setAccent('en-US');
    expect(speechEngine.getAccent()).toBe('en-US');

    speechEngine.setAccent('en-GB');
    expect(speechEngine.getAccent()).toBe('en-GB');

    speechEngine.setAccent('en-IN');
    expect(speechEngine.getAccent()).toBe('en-IN');
  });
});
