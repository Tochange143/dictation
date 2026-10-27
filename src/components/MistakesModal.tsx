import React, { useState } from 'react';
import { Volume2, CheckCircle2, RotateCcw, X, Sparkles, BookOpen } from 'lucide-react';
import { speechEngine } from '../services/speechEngine';
import { lookupWord } from '../services/dictionary';

interface MistakesModalProps {
  isOpen: boolean;
  misspelledCounts: Record<string, number>;
  onClose: () => void;
  onClearMistakes?: () => void;
}

export const MistakesModal: React.FC<MistakesModalProps> = ({
  isOpen,
  misspelledCounts,
  onClose,
  onClearMistakes
}) => {
  const words = Object.keys(misspelledCounts).filter(w => w.trim().length > 0);
  const [typedMap, setTypedMap] = useState<Record<string, string>>({});
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleInputChange = (word: string, inputVal: string) => {
    setTypedMap(prev => ({ ...prev, [word]: inputVal }));
    const cleanInput = inputVal.trim().toLowerCase();
    const cleanTarget = word.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      setMasteredWords(prev => {
        const next = new Set(prev);
        next.add(word);
        return next;
      });
    }
  };

  const speakWord = (word: string) => {
    speechEngine.speakDiscreteChunk(word, 0, 1);
  };

  const handleResetDrill = () => {
    setTypedMap({});
    setMasteredWords(new Set());
  };

  const allMastered = words.length > 0 && masteredWords.size === words.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 130
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-main)',
          maxWidth: '560px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} style={{ color: 'var(--brand-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Misspelled Words Practice Drill
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Listen to the pronunciation and practice typing your challenging words.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '4px', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {words.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <CheckCircle2 size={26} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Zero Misspelled Words!
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Outstanding listening and typing! You have not made any spelling mistakes in this session.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <span>
                <strong>{masteredWords.size}</strong> of <strong>{words.length}</strong> words mastered
              </span>
              <button
                onClick={handleResetDrill}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--brand-primary)',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
                <span>Reset Drill</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.round((masteredWords.size / words.length) * 100)}%`,
                height: '100%',
                backgroundColor: 'var(--color-green)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Word cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {words.map(word => {
                const isMastered = masteredWords.has(word);
                const count = misspelledCounts[word] || 1;
                const def = lookupWord(word);
                const userVal = typedMap[word] || '';

                return (
                  <div
                    key={word}
                    style={{
                      border: isMastered ? '1.5px solid #86efac' : '1px solid var(--border-main)',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      backgroundColor: isMastered ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                          onClick={() => speakWord(word)}
                          title={`Listen to pronunciation of "${word}"`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: 'var(--brand-primary)',
                            cursor: 'pointer',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          <Volume2 size={15} />
                        </button>
                        <div>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {word}
                          </span>
                          {def.phonetic && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                              {def.phonetic}
                            </span>
                          )}
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-muted)',
                            color: 'var(--text-secondary)'
                          }}>
                            {def.partOfSpeech}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                        {count} {count === 1 ? 'attempt missed' : 'attempts missed'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0' }}>
                      {def.definition}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <input
                        type="text"
                        value={userVal}
                        disabled={isMastered}
                        onChange={(e) => handleInputChange(word, e.target.value)}
                        placeholder={`Type "${word}" here...`}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.75rem',
                          borderRadius: '6px',
                          border: isMastered ? '1px solid #86efac' : '1px solid var(--border-main)',
                          backgroundColor: isMastered ? '#ffffff' : 'transparent',
                          fontSize: '0.88rem',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                      {isMastered && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803d', fontSize: '0.8rem', fontWeight: 700 }}>
                          <CheckCircle2 size={16} />
                          <span>Mastered!</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {allMastered && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1.5px solid #6ee7b7',
                borderRadius: '8px',
                padding: '0.85rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#065f46',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                <Sparkles size={18} />
                <span>Great job! You have mastered all misspelled words!</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem'
        }}>
          {onClearMistakes && words.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all recorded spelling mistakes for this session?')) {
                  onClearMistakes();
                  onClose();
                }
              }}
              style={{
                fontSize: '0.78rem',
                color: '#dc2626',
                padding: '4px 8px',
                cursor: 'pointer'
              }}
            >
              Clear Mistake History
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
