import React, { useRef, useEffect, useState } from 'react';
import { WordFeedback } from '../types';
import { Volume2, Eye, EyeOff, BookOpen, Plus, X } from 'lucide-react';
import { lookupWord, WordDefinition } from '../services/dictionary';
import { speechEngine } from '../services/speechEngine';

interface FeedbackPanelProps {
  feedbacks: WordFeedback[];
  isSpeaking: boolean;
  activeChunkIndex: number;
  totalChunks: number;
  totalWordsInLesson: number;
  lessonTitle: string;
  onInsertWord?: (word: string) => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedbacks,
  isSpeaking,
  activeChunkIndex,
  totalChunks,
  totalWordsInLesson,
  lessonTitle,
  onInsertWord
}) => {
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [showMissingWords, setShowMissingWords] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [selectedDictWord, setSelectedDictWord] = useState<WordDefinition | null>(null);

  const hasAttemptedWords = feedbacks.length > 0;
  const correctCount = feedbacks.filter(f => f.status === 'correct').length;
  const missingCount = feedbacks.filter(f => f.status === 'missing').length;
  const incorrectCount = feedbacks.filter(f => f.status === 'incorrect').length;

  // Auto-scroll as continuous story grows (only if user is already near bottom)
  useEffect(() => {
    const el = contentContainerRef.current;
    if (el) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom || feedbacks.length <= 10) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [feedbacks.length]);

  const toggleRevealIndex = (idx: number) => {
    setRevealedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const progressPercent = totalWordsInLesson > 0 
    ? Math.min(100, Math.round((correctCount / totalWordsInLesson) * 100))
    : 0;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid var(--border-main)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.1rem 1.25rem',
        minHeight: '170px',
        maxHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'border-color 0.2s ease'
      }}
    >
      {/* Top Status Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        paddingBottom: '0.6rem',
        borderBottom: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)'
          }}>
            Live Dictation Story
          </span>

          <span style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-muted)',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}>
            {lessonTitle} • {correctCount} / {totalWordsInLesson} words ({progressPercent}%)
          </span>

          {isSpeaking && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 10px',
              borderRadius: '999px',
              backgroundColor: '#eff6ff',
              color: 'var(--accent)',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
                <span className="wave-bar wave-bar-1" />
                <span className="wave-bar wave-bar-2" />
                <span className="wave-bar wave-bar-3" />
                <span className="wave-bar wave-bar-4" />
              </div>
              <span>
                Teacher speaking...
                {totalChunks > 0 ? ` (part ${activeChunkIndex + 1}/${totalChunks})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Word breakdown badges and Show Missing Words toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {hasAttemptedWords && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                {correctCount} correct
              </span>

              {missingCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>
                    {missingCount} missing
                  </span>
                  <button
                    onClick={() => setShowMissingWords(prev => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1.5px solid #d97706',
                      backgroundColor: showMissingWords ? '#fef3c7' : '#ffffff',
                      color: '#b45309',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={showMissingWords ? "Hide missing words and show [ ___ ]" : "Show and replace [ ___ ] with the actual missing words"}
                  >
                    {showMissingWords ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showMissingWords ? 'Hide Missing' : 'Show Missing Words'}</span>
                  </button>
                </div>
              )}

              {incorrectCount > 0 && (
                <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>
                  {incorrectCount} wrong
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Continuous Story Feedback Container */}
      <div
        ref={contentContainerRef}
        style={{
          fontSize: '1.45rem',
          lineHeight: '2.4rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          wordBreak: 'break-word',
          flex: 1,
          overflowY: 'auto',
          paddingRight: '0.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: '0.45rem',
          rowGap: '0.4rem'
        }}
      >
        {!hasAttemptedWords ? (
          <span style={{
            color: 'var(--text-muted)',
            fontSize: '1.25rem',
            fontWeight: 400,
            userSelect: 'none',
            fontStyle: 'italic',
            lineHeight: '2rem'
          }}>
            Listen to the spoken words and write in the notebook below... Your words will appear continuously in this story. Untyped words stay invisible.
          </span>
        ) : (
          feedbacks.map((item, idx) => {
            if (item.status === 'missing') {
              const isRevealed = showMissingWords || revealedIndices.has(idx);
              const missingWordText = item.expectedWord || '___';
              return (
                <span
                  key={idx}
                  className="word-missing"
                  onClick={() => toggleRevealIndex(idx)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isRevealed ? '#fef3c7' : 'transparent',
                    color: isRevealed ? '#b45309' : '#d97706',
                    padding: isRevealed ? '0 6px' : '0',
                    borderRadius: '4px',
                    border: isRevealed ? '1.5px dashed #d97706' : 'none',
                    fontWeight: isRevealed ? 700 : 600,
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={isRevealed ? `Missing word: "${missingWordText}". Click to hide.` : `Missing word! Click to reveal what word was skipped.`}
                >
                  <span>{isRevealed ? `[ ${missingWordText} ]` : '[ ___ ]'}</span>
                  {isRevealed && item.expectedPunctuation && (
                    <span className="word-punct" style={{ color: '#b45309' }}>{item.expectedPunctuation}</span>
                  )}
                  {isRevealed && onInsertWord && item.expectedWord && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInsertWord(missingWordText);
                      }}
                      style={{
                        padding: '1px 5px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        borderRadius: '3px',
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        lineHeight: '1.2'
                      }}
                      title="Insert this word into your typing notebook"
                    >
                      + Insert
                    </button>
                  )}
                </span>
              );
            }

            const isCorrect = item.status === 'correct';
            const wordToLookup = item.expectedWord || item.word;
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedDictWord(lookupWord(wordToLookup))}
                title={`Click to define "${wordToLookup}" & hear pronunciation`}
              >
                <span
                  className={isCorrect ? 'word-correct' : 'word-incorrect'}
                  style={{
                    backgroundColor: isCorrect ? 'transparent' : 'var(--color-red-bg)',
                    padding: isCorrect ? '0' : '0 4px',
                    borderRadius: isCorrect ? '0' : '4px'
                  }}
                >
                  {item.word}
                </span>
                {/* Preserve original punctuation when word is correct */}
                {isCorrect && item.expectedPunctuation && (
                  <span className="word-punct">{item.expectedPunctuation}</span>
                )}
                {!isCorrect && item.punctuation && (
                  <span className="word-punct">{item.punctuation}</span>
                )}
              </span>
            );
          })
        )}
      </div>

      {/* Bottom helper guidance */}
      <div style={{
        marginTop: '0.75rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span><strong style={{ color: 'var(--color-green)' }}>Green</strong> = correct</span>
          <span><strong style={{ color: 'var(--color-red)' }}>Red</strong> = incorrect</span>
          <span><strong style={{ color: '#d97706' }}>[ ___ ]</strong> = missing (click &ldquo;Show Missing Words&rdquo;)</span>
          <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>💡 Click any word to define</span>
        </div>
        <span>Continuous story dictation • Screen never clears</span>
      </div>

      {/* Floating Vocabulary Tooltip Card */}
      {selectedDictWord && (
        <div style={{
          position: 'absolute',
          bottom: '2.5rem',
          right: '1.25rem',
          maxWidth: '340px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1.5px solid var(--border-main)',
          padding: '0.85rem 1rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.16)',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedDictWord.word}
              </span>
              {selectedDictWord.phonetic && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selectedDictWord.phonetic}
                </span>
              )}
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-secondary)'
              }}>
                {selectedDictWord.partOfSpeech}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => speechEngine.speakDiscreteChunk(selectedDictWord.word, 0, 1)}
                title="Pronounce this word"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: 'var(--brand-primary)',
                  cursor: 'pointer',
                  border: '1px solid #bfdbfe'
                }}
              >
                <Volume2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDictWord(null)}
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  border: 'none',
                  backgroundColor: 'transparent'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.25rem' }}>
            {selectedDictWord.definition}
          </p>

          {selectedDictWord.example && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
              e.g. &ldquo;{selectedDictWord.example}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
};
