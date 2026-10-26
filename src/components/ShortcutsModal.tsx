import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Enter', desc: 'Start or resume dictation' },
    { key: 'Escape', desc: 'Pause speech immediately' },
    { key: 'Alt + R', desc: 'Replay the current sentence' },
    { key: 'Alt + ←', desc: 'Go to the previous sentence' },
    { key: 'Alt + →', desc: 'Skip to the next sentence' },
    { key: 'Enter', desc: 'Submit the current sentence for review' },
    { key: 'Ctrl + Backspace', desc: 'Clear current typing box' },
    { key: 'Ctrl + Shift + ↑', desc: 'Increase speech speed (+0.1x)' },
    { key: 'Ctrl + Shift + ↓', desc: 'Decrease speech speed (-0.1x)' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 120
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-main)',
          maxWidth: '480px',
          width: '100%',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Keyboard size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '4px', borderRadius: '6px', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.6rem',
                backgroundColor: idx % 2 === 0 ? 'var(--bg-muted)' : 'transparent',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{sc.desc}</span>
              <kbd style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-main)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
              }}>
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
