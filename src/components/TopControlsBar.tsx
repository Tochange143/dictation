import React from 'react';
import { Lesson, VoiceAccent } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  Volume1, 
  Settings as SettingsIcon, 
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Repeat
} from 'lucide-react';

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
    { label: '1w', val: 1 },
    { label: '2w', val: 2 },
    { label: '3w', val: 3 },
    { label: '4w', val: 4 },
    { label: 'Sentence', val: 0 }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-main)',
      padding: '0.35rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.3rem'
    }}>
      {/* Row 1: Lesson info, Primary Playback Controls, Utility triggers */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.45rem'
      }}>
        {/* Left: Lessons toggle, title, sentence count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={onToggleSidebar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: isSidebarOpen ? 'var(--bg-muted)' : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title={isSidebarOpen ? "Hide Sidebar (Ctrl+\\)" : "Show Sidebar (Ctrl+\\)"}
          >
            {isSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            <span>{isSidebarOpen ? 'Hide' : 'Lessons'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}>
              {lesson.levelName}
            </span>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              #{lesson.id} {lesson.title}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ({sentenceIndex + 1}/{totalSentences} • {progressPct}%)
            </span>
          </div>

          {/* Primary Playback buttons right in Row 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.4rem' }}>
            {speechState.isPlaying && !speechState.isPaused ? (
              <button
                onClick={onPause}
                title="Pause Voice (Esc)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--brand-text)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: '1px solid var(--brand-primary)'
                }}
              >
                <Pause size={13} />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onStartOrResume}
                title={`Read ${wordsPerChunk > 0 ? `${wordsPerChunk} words` : 'sentence'} (Ctrl+Enter)`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--brand-text)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: '1px solid var(--brand-primary)'
                }}
              >
                <Play size={13} />
                <span>
                  {speechState.isPaused ? 'Resume' : isSoundOutMode ? `Sound Out (${wordsPerChunk > 0 ? `${wordsPerChunk}w` : 'Sent'})` : wordsPerChunk > 0 ? `Read (${wordsPerChunk}w)` : 'Read'}
                </span>
              </button>
            )}

            <button
              onClick={onReplayActiveChunk}
              title="Replay Current Words (Alt+R)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                fontWeight: 600,
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <RotateCcw size={12} />
              <span>Replay</span>
            </button>

            {onSoundItOut && (
              <button
                onClick={onSoundItOut}
                title="Sound Out (articulates each syllable slowly for phonics spelling)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-amber)',
                  fontSize: '0.78rem',
                  color: 'var(--color-amber)',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-amber-bg)',
                  cursor: 'pointer'
                }}
              >
                <span>🔤 Sound Out</span>
              </button>
            )}

            <button
              onClick={onPronounceSlow}
              title="Slow & Clear Pronunciation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <Volume1 size={13} />
              <span>Slow</span>
            </button>

            <button
              onClick={onSkipSentence}
              title="Next Sentence (Ctrl+Right)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <span>Next</span>
              <SkipForward size={12} />
            </button>
          </div>
        </div>

        {/* Right side: Focus, Theme, Shortcuts, Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              title="Toggle Distraction-Free Focus Practice (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 7px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isFocusMode ? 'var(--accent)' : 'var(--border-main)'}`,
                backgroundColor: isFocusMode ? 'var(--color-amber-bg)' : 'var(--bg-surface)',
                fontSize: '0.75rem',
                color: isFocusMode ? 'var(--color-amber)' : 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              <span>🎯 Focus</span>
            </button>
          )}

          {onChangeTheme && (
            <select
              value={theme}
              onChange={(e) => onChangeTheme(e.target.value)}
              style={{
                fontSize: '0.72rem',
                padding: '3px 5px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <option value="dark">AMOLED Black</option>
              <option value="light">Crisp White</option>
            </select>
          )}

          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-surface)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)'
            }}
          >
            <HelpCircle size={13} />
            <span className="desktop-only">Keys</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            style={{
              padding: '3px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)'
            }}
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>

      {/* Row 2: Words-at-a-time, Accent, Pacing Presets, Repeat, Speed */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.4rem',
        paddingTop: '0.1rem'
      }}>
        {/* Left: Words Per Chunk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Chunk:
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {chunkOptions.map(opt => (
              <button
                key={opt.val}
                onClick={() => onChangeWordsPerChunk(opt.val)}
                style={{
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
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

        {/* Right: Accent, Pacing, Repeat, Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {/* Accent switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '4px',
            padding: '1px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => onChangeAccent('en-IN')}
              title="Indian English Accent (en-IN)"
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.7rem',
                fontWeight: voiceAccent === 'en-IN' ? 700 : 500,
                backgroundColor: voiceAccent === 'en-IN' ? 'var(--color-amber-bg)' : 'transparent',
                color: voiceAccent === 'en-IN' ? 'var(--color-amber)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-IN' ? '1px solid var(--color-amber)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              🇮🇳 IN
            </button>
            <button
              onClick={() => onChangeAccent('en-US')}
              title="US English Accent (en-US)"
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.7rem',
                fontWeight: voiceAccent === 'en-US' ? 700 : 500,
                backgroundColor: voiceAccent === 'en-US' ? 'var(--brand-primary)' : 'transparent',
                color: voiceAccent === 'en-US' ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-US' ? '1px solid var(--brand-primary)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              🇺🇸 US
            </button>
            <button
              onClick={() => onChangeAccent('en-GB')}
              title="UK English Accent (en-GB)"
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.7rem',
                fontWeight: voiceAccent === 'en-GB' ? 700 : 500,
                backgroundColor: voiceAccent === 'en-GB' ? 'var(--brand-primary)' : 'transparent',
                color: voiceAccent === 'en-GB' ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-GB' ? '1px solid var(--brand-primary)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              🇬🇧 UK
            </button>
          </div>

          {/* Teacher Pacing Presets & Reading Modes */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '4px',
            padding: '1px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => onPacingPreset('slow')}
              title="Slow speed (0.7x)"
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.7rem',
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
                gap: '2px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.7rem',
                fontWeight: !isSoundOutMode && speechSpeed === 0.8 ? 700 : 500,
                backgroundColor: !isSoundOutMode && speechSpeed === 0.8 ? 'var(--brand-primary)' : 'transparent',
                color: !isSoundOutMode && speechSpeed === 0.8 ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: !isSoundOutMode && speechSpeed === 0.8 ? '1px solid var(--brand-primary)' : '1px solid transparent'
              }}
            >
              <GraduationCap size={11} />
              <span>Teacher</span>
            </button>
            <button
              onClick={() => onPacingPreset('natural')}
              title="Natural speed (1.0x)"
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.7rem',
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
                gap: '2px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.7rem',
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
            title={`Repeat words ${repeatCount} time(s). Click to change.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: repeatCount > 1 ? 'var(--color-green-bg)' : 'var(--bg-surface)',
              color: repeatCount > 1 ? 'var(--color-green)' : 'var(--text-secondary)',
              fontSize: '0.7rem',
              fontWeight: 600
            }}
          >
            <Repeat size={11} />
            <span>{repeatCount}x</span>
          </button>

          {/* Speed Stepper */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            padding: '1px 3px'
          }}>
            <button
              onClick={() => handleSpeedStep(-0.1)}
              disabled={speechSpeed <= 0.5}
              style={{
                padding: '1px 4px',
                border: 'none',
                backgroundColor: 'transparent',
                color: speechSpeed <= 0.5 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: speechSpeed <= 0.5 ? 'not-allowed' : 'pointer'
              }}
            >
              -
            </button>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0 4px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)'
            }}>
              {speechSpeed.toFixed(1)}x
            </span>
            <button
              onClick={() => handleSpeedStep(0.1)}
              disabled={speechSpeed >= 1.5}
              style={{
                padding: '1px 4px',
                border: 'none',
                backgroundColor: 'transparent',
                color: speechSpeed >= 1.5 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: speechSpeed >= 1.5 ? 'not-allowed' : 'pointer'
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Thin 2px Progress Bar */}
      <div style={{
        width: '100%',
        height: '2px',
        backgroundColor: 'var(--border-subtle)',
        borderRadius: '1px',
        overflow: 'hidden'
      }}>
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--brand-primary)',
            width: `${progressPct}%`,
            transition: 'width 0.2s ease'
          }}
        />
      </div>
    </header>
  );
};
