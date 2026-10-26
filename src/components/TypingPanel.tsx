import React, { useRef, useEffect } from 'react';
import { Trash2, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TypingPanelProps {
  value: string;
  onChange: (newValue: string) => void;
  onEnterNext: () => void;
  onClear: () => void;
  onReplayCurrent: () => void;
  disabled?: boolean;
  wordCount: number;
  isFullyCorrect?: boolean;
  accuracy?: number;
}

export const TypingPanel: React.FC<TypingPanelProps> = ({
  value,
  onChange,
  onEnterNext,
  onClear,
  onReplayCurrent,
  disabled = false,
  wordCount,
  isFullyCorrect = false,
  accuracy
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatically focus on mount or when sentence advances
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter key moves to next sentence smoothly without any popup!
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnterNext();
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: `1.5px solid ${isFullyCorrect ? 'var(--color-green)' : 'var(--border-main)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        flex: 1,
        minHeight: '260px',
        boxShadow: isFullyCorrect 
          ? '0 0 0 3px rgba(21, 128, 61, 0.1), 0 1px 3px rgba(0, 0, 0, 0.04)' 
          : '0 1px 3px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* Top Header: Label, Word & Accuracy Counters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
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
            Typing Area
          </label>
          {accuracy !== undefined && value.trim().length > 0 && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: isFullyCorrect ? 'var(--color-green-bg)' : 'var(--bg-muted)',
              color: isFullyCorrect ? 'var(--color-green)' : 'var(--text-secondary)'
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
          color: 'var(--text-secondary)'
        }}>
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>•</span>
          <span>{value.length} chars</span>
        </div>
      </div>

      {/* Large Comfortable Textarea */}
      <textarea
        id="dictation-input"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type what you hear... (Words check live above. Press Enter to move to next sentence)"
        rows={5}
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontSize: '1.45rem',
          lineHeight: '2.2rem',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          backgroundColor: 'transparent',
          minHeight: '135px'
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
      />

      {/* Bottom Action and Tool Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={onReplayCurrent}
            title="Replay Voice (Alt+R)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-main)',
              backgroundColor: '#ffffff'
            }}
          >
            <RotateCcw size={13} />
            <span>Replay Voice</span>
          </button>

          {value.trim() && (
            <button
              onClick={onClear}
              title="Clear typed text (Ctrl+Backspace)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                padding: '5px 8px'
              }}
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Right side: Next Sentence Button (Enter) */}
        <button
          onClick={onEnterNext}
          title="Move to next sentence (Enter)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: '8px',
            backgroundColor: isFullyCorrect ? 'var(--color-green)' : 'var(--brand-primary)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
          }}
        >
          {isFullyCorrect && <CheckCircle2 size={15} />}
          <span>Next Sentence</span>
          <ArrowRight size={14} />
          <kbd style={{
            fontSize: '0.7rem',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            marginLeft: '4px',
            fontFamily: 'var(--font-mono)'
          }}>
            Enter
          </kbd>
        </button>
      </div>
    </div>
  );
};
