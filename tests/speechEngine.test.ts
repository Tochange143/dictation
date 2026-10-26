import { describe, it, expect, beforeEach, vi } from 'vitest';
import { speechEngine } from '../src/services/speechEngine';

describe('Speech Engine Service', () => {
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
});
