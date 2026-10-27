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
  Repeat
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
  onPacingPreset: (preset: 'slow' | 'teacher' | 'natural') => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
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
  onOpenSettings
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
      borderBottom: '1.5px solid var(--border-main)',
      padding: '0.65rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
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
              padding: '6px 11px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-main)',
              backgroundColor: isSidebarOpen ? 'var(--bg-muted)' : 'var(--brand-primary)',
              color: isSidebarOpen ? 'var(--text-secondary)' : '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
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
                borderRadius: '4px',
                backgroundColor: lesson.level === 1 ? 'rgba(34, 197, 94, 0.2)' : lesson.level === 2 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(192, 132, 252, 0.2)',
                color: lesson.level === 1 ? '#4ade80' : lesson.level === 2 ? '#38bdf8' : '#c084fc'
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
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-muted)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}
          >
            <HelpCircle size={15} />
            <span className="desktop-only">Shortcuts</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-secondary)'
            }}
          >
            <SettingsIcon size={16} />
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
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: wordsPerChunk === opt.val ? 700 : 500,
                  backgroundColor: wordsPerChunk === opt.val ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: wordsPerChunk === opt.val ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-main)',
                  boxShadow: wordsPerChunk === opt.val ? '0 1px 3px rgba(59, 130, 246, 0.3)' : 'none'
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
                borderRadius: '8px',
                backgroundColor: 'var(--brand-primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
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
                borderRadius: '8px',
                backgroundColor: 'var(--brand-primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Play size={15} />
              <span>{speechState.isPaused ? 'Resume' : wordsPerChunk > 0 ? `Read (${wordsPerChunk} words)` : 'Teacher Read'}</span>
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
              borderRadius: '8px',
              border: '1.5px solid var(--border-main)',
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
              borderRadius: '8px',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              fontSize: '0.82rem',
              color: '#38bdf8',
              fontWeight: 600,
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              cursor: 'pointer'
            }}
          >
            <Volume1 size={14} />
            <span>Slow & Clear</span>
          </button>

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
                backgroundColor: voiceAccent === 'en-IN' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: voiceAccent === 'en-IN' ? '#fbbf24' : 'var(--text-secondary)',
                border: voiceAccent === 'en-IN' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
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
                backgroundColor: voiceAccent === 'en-US' ? 'var(--bg-surface)' : 'transparent',
                color: voiceAccent === 'en-US' ? 'var(--accent)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-US' ? '1px solid var(--border-main)' : '1px solid transparent',
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
                backgroundColor: voiceAccent === 'en-GB' ? 'var(--bg-surface)' : 'transparent',
                color: voiceAccent === 'en-GB' ? 'var(--accent)' : 'var(--text-secondary)',
                border: voiceAccent === 'en-GB' ? '1px solid var(--border-main)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              <span>🇬🇧 UK</span>
            </button>
          </div>

          {/* Teacher Pacing Presets */}
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
                fontWeight: speechSpeed === 0.7 ? 700 : 500,
                backgroundColor: speechSpeed === 0.7 ? 'var(--bg-surface)' : 'transparent',
                color: speechSpeed === 0.7 ? 'var(--accent)' : 'var(--text-secondary)'
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
                fontWeight: speechSpeed === 0.8 ? 700 : 500,
                backgroundColor: speechSpeed === 0.8 ? 'var(--bg-surface)' : 'transparent',
                color: speechSpeed === 0.8 ? 'var(--accent)' : 'var(--text-secondary)'
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
                fontWeight: speechSpeed === 1.0 ? 700 : 500,
                backgroundColor: speechSpeed === 1.0 ? 'var(--bg-surface)' : 'transparent',
                color: speechSpeed === 1.0 ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              Normal
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
