import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + \\', desc: 'Toggle / Hide Lessons Sidebar' },
    { key: 'Ctrl + S', desc: 'Show or hide current words / sentence (Help)' },
    { key: 'Alt + R', desc: 'Replay current words' },
    { key: 'Alt + P', desc: 'Pause or resume speech' },
    { key: 'Alt + Right', desc: 'Skip to next chunk' },
    { key: 'Alt + Left', desc: 'Go back to previous chunk' },
    { key: 'Escape', desc: 'Pause speech or close modal' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 120
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-main)',
          maxWidth: '480px',
          width: '100%',
          padding: '1.5rem',
          boxShadow: '0 20px 35px rgba(0, 0, 0, 0.45)',
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
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                color: 'var(--accent)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
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
