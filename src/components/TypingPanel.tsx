import React, { useRef, useEffect } from 'react';
import { RotateCcw, Trash2, Volume2, Volume1, Eye, EyeOff } from 'lucide-react';

interface TypingPanelProps {
  value: string;
  onChange: (newValue: string) => void;
  onClear: () => void;
  onReplayCurrent: () => void;
  onPronounceSlow?: () => void;
  onSoundItOut?: () => void;
  disabled?: boolean;
  wordCount: number;
  accuracy?: number;
  isSpeaking?: boolean;
  helpText?: string;
  isHelpVisible?: boolean;
  onToggleHelp?: () => void;
}

export const TypingPanel: React.FC<TypingPanelProps> = ({
  value,
  onChange,
  onClear,
  onReplayCurrent,
  onPronounceSlow,
  onSoundItOut,
  disabled = false,
  wordCount,
  accuracy,
  isSpeaking = false,
  helpText,
  isHelpVisible = false,
  onToggleHelp
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (value.trim().length > 0 && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    } else if (value.trim().length === 0) {
      startTimeRef.current = null;
    }
  }, [value]);

  const elapsedMinutes = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 0;
  const liveWpm = elapsedMinutes > 0.08 && wordCount > 0 ? Math.min(180, Math.round(wordCount / elapsedMinutes)) : 0;

  // Automatically focus on mount or when enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleClearWithConfirm = () => {
    if (!value.trim()) return;
    if (window.confirm('Do you want to clear your typed text and start this lesson over?')) {
      onClear();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        flex: 1,
        minHeight: '210px',
        position: 'relative'
      }}
    >
      {/* Top Header: Label, Word & Accuracy Counters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label
            htmlFor="dictation-input"
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)'
            }}
          >
            Notebook Typing Area
          </label>
          {accuracy !== undefined && value.trim().length > 0 && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: accuracy >= 90 ? 'var(--color-green-bg)' : 'var(--bg-muted)',
              color: accuracy >= 90 ? 'var(--color-green)' : 'var(--text-secondary)'
            }}>
              {accuracy}% match
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)'
        }}>
          {liveWpm > 0 && (
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {liveWpm} WPM
            </span>
          )}
          {liveWpm > 0 && <span>•</span>}
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>•</span>
          <span>{value.length} chars</span>
        </div>
      </div>

      {/* Help / Peek Banner when Ctrl+S is triggered */}
      {isHelpVisible && helpText && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1.5px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '8px',
          padding: '0.65rem 0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.95rem',
          color: '#4ade80',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Eye size={16} style={{ color: '#4ade80' }} />
            <span><strong>Help / Spoken Words:</strong> &ldquo;{helpText}&rdquo;</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600 }}>
            Press Ctrl+S to hide
          </span>
        </div>
      )}

      {/* Large Comfortable Notebook Textarea */}
      <textarea
        id="dictation-input"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type what you hear... Write continuously as the teacher reads. Press Ctrl+S if you need help to see the current words."
        rows={4}
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontSize: '1.35rem',
          lineHeight: '2.2rem',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          backgroundColor: 'transparent',
          minHeight: '120px'
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
      />

      {/* Bottom Tool Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        {/* Left helper tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={onReplayCurrent}
            title="Replay Voice (Alt+R)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-muted)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <RotateCcw size={14} />
            <span>Replay Words</span>
            <kbd style={{
              fontSize: '0.68rem',
              padding: '1px 5px',
              borderRadius: '3px',
              backgroundColor: 'var(--bg-surface)',
              marginLeft: '2px',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)'
            }}>
              Alt+R
            </kbd>
          </button>

          {onPronounceSlow && (
            <button
              onClick={onPronounceSlow}
              title="Pronounce current words slowly and clearly"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
                color: 'var(--accent)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Volume1 size={14} />
              <span>Slow Pronounce</span>
            </button>
          )}

          {onSoundItOut && (
            <button
              onClick={onSoundItOut}
              title="Pronounce syllables slowly for phonic spelling (e.g. beau · ti · ful)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
                color: 'var(--color-amber)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--color-amber-bg)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <span>🔤 Sound It Out</span>
            </button>
          )}

          {onToggleHelp && (
            <button
              onClick={onToggleHelp}
              title="Show or hide spoken words hint (Ctrl+S)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                color: isHelpVisible ? 'var(--color-green)' : 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isHelpVisible ? 'var(--color-green)' : 'var(--border-main)'}`,
                backgroundColor: isHelpVisible ? 'var(--color-green-bg)' : 'var(--bg-muted)',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {isHelpVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{isHelpVisible ? 'Hide Words' : 'Show Words'}</span>
              <kbd style={{
                fontSize: '0.68rem',
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: isHelpVisible ? 'rgba(34, 197, 94, 0.25)' : 'var(--bg-surface)',
                marginLeft: '2px',
                color: isHelpVisible ? '#4ade80' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)'
              }}>
                Ctrl+S
              </kbd>
            </button>
          )}

          {value.trim() && (
            <button
              onClick={handleClearWithConfirm}
              title="Clear typed text"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Right Info: Live typing mode indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          {isSpeaking ? (
            <span style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={13} className="animate-pulse" />
              Listening to teacher...
            </span>
          ) : (
            <span>Continuous live writing</span>
          )}
        </div>
      </div>
    </div>
  );
};
