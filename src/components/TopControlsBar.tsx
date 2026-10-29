import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Volume1,
  HelpCircle, 
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Repeat,
  Sun,
  Moon
} from 'lucide-react';
import { Lesson, VoiceAccent } from '../types';

interface TopControlsBarProps {
  lesson: Lesson;
  sentenceIndex: number;
  totalSentences: number;
  speechState: {
    isPlaying: boolean;
    isPaused: boolean;
    currentChunkIndex: number;
    totalChunks: number;
  };
  speechSpeed: number;
  voiceAccent: VoiceAccent;
  repeatCount: 1 | 2 | 3;
  wordsPerChunk: number;
  dictationPauseMs: number;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onStartOrResume: () => void;
  onPause: () => void;
  onReplayActiveChunk: () => void;
  onPronounceSlow: () => void;
  onReplaySentence: () => void;
  onPreviousSentence: () => void;
  onSkipSentence: () => void;
  onRestartSentence: () => void;
  onChangeSpeed: (newSpeed: number) => void;
  onChangeAccent: (accent: VoiceAccent) => void;
  onChangeRepeat: (newRepeat: 1 | 2 | 3) => void;
  onChangeWordsPerChunk: (words: number) => void;
  onPacingPreset: (preset: 'slow' | 'teacher' | 'natural' | 'sound_out') => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onSoundItOut?: () => void;
  isSoundOutMode?: boolean;
  theme?: string;
  onChangeTheme?: (theme: string) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const TopControlsBar: React.FC<TopControlsBarProps> = ({
  lesson,
  sentenceIndex,
  totalSentences,
  speechState,
  speechSpeed,
  voiceAccent,
  repeatCount,
  wordsPerChunk,
  isSidebarOpen,
  onToggleSidebar,
  onStartOrResume,
  onPause,
  onReplayActiveChunk,
  onPronounceSlow,
  onReplaySentence,
  onPreviousSentence,
  onSkipSentence,
  onRestartSentence,
  onChangeSpeed,
  onChangeAccent,
  onChangeRepeat,
  onChangeWordsPerChunk,
  onPacingPreset,
  onOpenShortcuts,
  onOpenSettings,
  onSoundItOut,
  isSoundOutMode = false,
  theme = 'dark',
  onChangeTheme,
  isFocusMode = false,
  onToggleFocusMode
}) => {
  const progressPct = Math.round(((sentenceIndex + 1) / totalSentences) * 100);

  const handleSpeedStep = (delta: number) => {
    const next = Math.round((speechSpeed + delta) * 10) / 10;
    if (next >= 0.5 && next <= 1.5) {
      onChangeSpeed(next);
    }
  };

  const cycleRepeat = () => {
    const nextRepeat: 1 | 2 | 3 = repeatCount === 1 ? 2 : repeatCount === 2 ? 3 : 1;
    onChangeRepeat(nextRepeat);
  };

  const chunkOptions = [
    { label: '1 word', val: 1 },
    { label: '2 words', val: 2 },
    { label: '3 words', val: 3 },
    { label: '4 words', val: 4 },
    { label: 'Sentence', val: 0 }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-main)',
      padding: '0.6rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      {/* Upper line: Sidebar Toggle, Title, Progress, and Action triggers */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Permanent Desktop & Mobile Sidebar Toggle Button */}
          <button 
            onClick={onToggleSidebar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: isSidebarOpen ? 'var(--bg-muted)' : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title={isSidebarOpen ? "Hide Lessons Sidebar (Ctrl+\\)" : "Show Lessons Sidebar (Ctrl+\\)"}
            aria-label="Toggle Lessons Sidebar"
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            <span>{isSidebarOpen ? 'Hide' : 'Lessons'}</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-main)'
              }}>
                {lesson.levelName}
              </span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                #{lesson.id} {lesson.title}
              </h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sentence {sentenceIndex + 1} of {totalSentences} ({progressPct}% completed)
            </div>
          </div>
        </div>

        {/* Right side tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onChangeTheme && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select
                value={theme}
                onChange={(e) => onChangeTheme(e.target.value)}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <option value="dark">AMOLED Dark (Pure Black)</option>
                <option value="light">Crisp White</option>
              </select>
            </div>
          )}

          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              title="Toggle Distraction-Free Focus Practice (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isFocusMode ? 'var(--accent)' : 'var(--border-main)'}`,
                backgroundColor: isFocusMode ? 'var(--color-amber-bg)' : 'var(--bg-surface)',
                fontSize: '0.78rem',
                color: isFocusMode ? 'var(--color-amber)' : 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              <span>🎯 Focus</span>
            </button>
          )}

          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-surface)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}
          >
            <HelpCircle size={14} />
            <span className="desktop-only">Shortcuts</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            style={{
              padding: '5px 7px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)'
            }}
          >
            <SettingsIcon size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: 'var(--bg-muted)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPct}%`,
          height: '100%',
          backgroundColor: 'var(--brand-primary)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Middle line: Words at once setting */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem',
        padding: '0.4rem 0.65rem',
        backgroundColor: 'var(--bg-muted)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Dictate Words at Once:
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {chunkOptions.map(opt => (
              <button
                key={opt.val}
                onClick={() => onChangeWordsPerChunk(opt.val)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: wordsPerChunk === opt.val ? 700 : 500,
                  backgroundColor: wordsPerChunk === opt.val ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: wordsPerChunk === opt.val ? 'var(--brand-text)' : 'var(--text-secondary)',
                  border: wordsPerChunk === opt.val ? '1px solid var(--brand-primary)' : '1px solid var(--border-main)'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {wordsPerChunk > 0 ? (
            <span>Sounds {wordsPerChunk} words → you write → next {wordsPerChunk} words sound</span>
          ) : (
            <span>Full sentence dictation mode</span>
          )}
        </div>
      </div>

      {/* Lower line: Voice controls & Pacing */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.1rem'
      }}>
        {/* Playback action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {speechState.isPlaying && !speechState.isPaused ? (
            <button
              onClick={onPause}
              title="Pause Voice (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-text)',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1px solid var(--brand-primary)'
              }}
            >
              <Pause size={15} />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onStartOrResume}
              title={`Read ${wordsPerChunk > 0 ? `${wordsPerChunk} words` : 'sentence'} (Ctrl+Enter)`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-text)',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1px solid var(--brand-primary)'
              }}
            >
              <Play size={15} />
              <span>{speechState.isPaused ? 'Resume' : isSoundOutMode ? `Sound Out (${wordsPerChunk > 0 ? `${wordsPerChunk} words` : 'sentence'})` : wordsPerChunk > 0 ? `Read (${wordsPerChunk} words)` : 'Teacher Read'}</span>
            </button>
          )}

          <button
            onClick={onReplayActiveChunk}
            title="Replay Current Words (Alt+R)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <RotateCcw size={14} />
            <span>Replay {wordsPerChunk > 0 ? `${wordsPerChunk} Words` : 'Phrase'}</span>
          </button>

          {/* Slow & Clear Pronunciation Button */}
          <button
            onClick={onPronounceSlow}
            title="Listen with slow, crystal-clear word pronunciation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer'
            }}
          >
            <Volume1 size={14} />
            <span>Slow & Clear</span>
          </button>

          {onSoundItOut && (
            <button
              onClick={onSoundItOut}
              title="Sound Out (articulates each syllable slowly for phonics spelling)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 11px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-amber)',
                fontSize: '0.82rem',
                color: 'var(--color-amber)',
                fontWeight: 600,
                backgroundColor: 'var(--color-amber-bg)',
                cursor: 'pointer'
              }}
            >
              <span>🔤 Sound It Out</span>
            </button>
          )}

          {wordsPerChunk > 0 && (
            <button
              onClick={onReplaySentence}
              title="Replay Full Sentence"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <Volume2 size={13} />
              <span>Full Sentence</span>
            </button>
          )}

          <button
            onClick={onPreviousSentence}
            disabled={sentenceIndex === 0}
            title="Previous Sentence (Alt+Left)"
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-surface)',
              color: sentenceIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
              opacity: sentenceIndex === 0 ? 0.4 : 1
            }}
          >
            <SkipBack size={15} />
          </button>

          <button
            onClick={onSkipSentence}
            title="Next Sentence (Alt+Right)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-main)',
              fontSize: '0.82rem',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)'
            }}
          >
            <span>Next</span>
            <SkipForward size={14} />
          </button>

          <button
            onClick={onRestartSentence}
            title="Clear and Restart Current Sentence"
            style={{
              fontSize: '0.78rem',
              padding: '6px 8px',
              borderRadius: '8px',
              color: 'var(--text-muted)'
            }}
          >
            Restart
          </button>
        </div>

        {/* Voice accent, pacing presets, repeat mode, and speed controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Accent Switcher (Indian / US / UK) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => onChangeAccent('en-IN')}
              title="Indian English Accent (en-IN)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: voiceAccent === 'en-IN' ? 700 : 500,
                backgroundColor: voiceAccent === 'en-IN' ? 'var(--color-amber-bg)' : 'transparent',
                color: voiceAccent === 'en-IN' ? 'var(--color-amber)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-IN' ? '1px solid var(--color-amber)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              <span>🇮🇳 Indian Accent</span>
            </button>
            <button
              onClick={() => onChangeAccent('en-US')}
              title="US English Accent (en-US)"
              style={{
                padding: '3px 7px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: voiceAccent === 'en-US' ? 700 : 500,
                backgroundColor: voiceAccent === 'en-US' ? 'var(--brand-primary)' : 'transparent',
                color: voiceAccent === 'en-US' ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-US' ? '1px solid var(--brand-primary)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              <span>🇺🇸 US</span>
            </button>
            <button
              onClick={() => onChangeAccent('en-GB')}
              title="UK English Accent (en-GB)"
              style={{
                padding: '3px 7px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: voiceAccent === 'en-GB' ? 700 : 500,
                backgroundColor: voiceAccent === 'en-GB' ? 'var(--brand-primary)' : 'transparent',
                color: voiceAccent === 'en-GB' ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-GB' ? '1px solid var(--brand-primary)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              <span>🇬🇧 UK</span>
            </button>
          </div>

          {/* Teacher Pacing Presets & Reading Modes */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => onPacingPreset('slow')}
              title="Slow speed (0.7x)"
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: !isSoundOutMode && speechSpeed === 0.7 ? 700 : 500,
                backgroundColor: !isSoundOutMode && speechSpeed === 0.7 ? 'var(--brand-primary)' : 'transparent',
                color: !isSoundOutMode && speechSpeed === 0.7 ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: !isSoundOutMode && speechSpeed === 0.7 ? '1px solid var(--brand-primary)' : '1px solid transparent'
              }}
            >
              Slow
            </button>
            <button
              onClick={() => onPacingPreset('teacher')}
              title="Teacher Pace (0.8x)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: !isSoundOutMode && speechSpeed === 0.8 ? 700 : 500,
                backgroundColor: !isSoundOutMode && speechSpeed === 0.8 ? 'var(--brand-primary)' : 'transparent',
                color: !isSoundOutMode && speechSpeed === 0.8 ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: !isSoundOutMode && speechSpeed === 0.8 ? '1px solid var(--brand-primary)' : '1px solid transparent'
              }}
            >
              <GraduationCap size={13} />
              <span>Teacher</span>
            </button>
            <button
              onClick={() => onPacingPreset('natural')}
              title="Natural speed (1.0x)"
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: !isSoundOutMode && speechSpeed === 1.0 ? 700 : 500,
                backgroundColor: !isSoundOutMode && speechSpeed === 1.0 ? 'var(--brand-primary)' : 'transparent',
                color: !isSoundOutMode && speechSpeed === 1.0 ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: !isSoundOutMode && speechSpeed === 1.0 ? '1px solid var(--brand-primary)' : '1px solid transparent'
              }}
            >
              Normal
            </button>
            <button
              onClick={() => onPacingPreset('sound_out')}
              title="Sound Out Reading Mode: Automatically speaks phonics syllables"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: isSoundOutMode ? 700 : 500,
                backgroundColor: isSoundOutMode ? 'var(--color-amber-bg)' : 'transparent',
                color: isSoundOutMode ? 'var(--color-amber)' : 'var(--text-secondary)',
                border: isSoundOutMode ? '1px solid var(--color-amber)' : '1px solid transparent'
              }}
            >
              <span>🔤 Sound Out</span>
            </button>
          </div>

          {/* Repeat count toggle */}
          <button
            onClick={cycleRepeat}
            title="Repeat words 1x, 2x, or 3x"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: repeatCount > 1 ? 'var(--color-green-bg)' : 'transparent',
              fontSize: '0.78rem',
              color: repeatCount > 1 ? 'var(--color-green)' : 'var(--text-secondary)',
              fontWeight: 700
            }}
          >
            <Repeat size={13} />
            <span>{repeatCount}x</span>
          </button>

          {/* Speed Stepper */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '2px 4px'
          }}>
            <button
              onClick={() => handleSpeedStep(-0.1)}
              disabled={speechSpeed <= 0.5}
              style={{
                padding: '2px 6px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: speechSpeed <= 0.5 ? 'var(--text-muted)' : 'var(--text-primary)'
              }}
              aria-label="Decrease speed"
            >
              -
            </button>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 600,
              minWidth: '38px',
              textAlign: 'center',
              color: 'var(--text-primary)'
            }}>
              {speechSpeed.toFixed(1)}x
            </span>
            <button
              onClick={() => handleSpeedStep(0.1)}
              disabled={speechSpeed >= 1.5}
              style={{
                padding: '2px 6px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: speechSpeed >= 1.5 ? 'var(--text-muted)' : 'var(--text-primary)'
              }}
              aria-label="Increase speed"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
