import React, { useRef, useEffect, useState } from 'react';
import { WordFeedback } from '../types';
import { Volume2, Volume1, Eye, EyeOff, BookOpen, Plus, X } from 'lucide-react';
import { lookupWord, WordDefinition } from '../services/dictionary';
import { speechEngine } from '../services/speechEngine';
import { syllabifyWord } from '../utils/phonics';

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
  const [selectedPhonicHint, setSelectedPhonicHint] = useState<WordFeedback['phonicHint'] | null>(null);

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
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        minHeight: '170px',
        maxHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
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
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-amber-bg)',
              color: 'var(--color-amber)',
              fontSize: '0.72rem',
              fontWeight: 600,
              border: '1px solid var(--border-main)'
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
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
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
                      border: '1.5px solid #f59e0b',
                      backgroundColor: showMissingWords ? 'rgba(245, 158, 11, 0.25)' : 'var(--bg-muted)',
                      color: '#fbbf24',
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
                    backgroundColor: isRevealed ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                    color: '#fbbf24',
                    padding: isRevealed ? '0 6px' : '0',
                    borderRadius: '4px',
                    border: isRevealed ? '1.5px dashed #f59e0b' : 'none',
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
                    <span className="word-punct" style={{ color: '#fbbf24' }}>{item.expectedPunctuation}</span>
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
                        backgroundColor: '#f59e0b',
                        color: '#090d16',
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
            const isPhonetic = Boolean(!isCorrect && item.isPhoneticMatch && item.phonicHint);
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
                onClick={() => {
                  setSelectedDictWord(lookupWord(wordToLookup));
                  setSelectedPhonicHint(item.phonicHint || null);
                }}
                title={isPhonetic
                  ? `Sound Match: "${item.word}" sounded right for "${wordToLookup}"! Click to see the phonics spelling rule.`
                  : `Click to define "${wordToLookup}" & hear pronunciation`}
              >
                <span
                  className={isCorrect ? 'word-correct' : isPhonetic ? 'word-phonetic' : 'word-incorrect'}
                  style={{
                    backgroundColor: isCorrect ? 'transparent' : isPhonetic ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-red-bg)',
                    borderBottom: isPhonetic ? '2px dashed #f59e0b' : 'none',
                    color: isPhonetic ? '#fbbf24' : undefined,
                    padding: isCorrect ? '0' : '0 4px',
                    borderRadius: isCorrect ? '0' : '4px'
                  }}
                >
                  {item.word}
                  {isPhonetic && (
                    <span style={{ fontSize: '0.65rem', marginLeft: '3px', verticalAlign: 'baseline', fontWeight: 700 }} title="Sound Match!">
                      🎯
                    </span>
                  )}
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
          <span><strong style={{ color: '#fbbf24' }}>🎯 Amber</strong> = sound match (click for rule)</span>
          <span><strong style={{ color: '#fbbf24' }}>[ ___ ]</strong> = missing (click &ldquo;Show Missing Words&rdquo;)</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>💡 Click any word to define & hear</span>
        </div>
        <span>Continuous story dictation • Screen never clears</span>
      </div>

      {/* Floating Vocabulary Tooltip Card */}
      {selectedDictWord && (
        <div style={{
          position: 'absolute',
          bottom: '2.5rem',
          right: '1.25rem',
          maxWidth: '360px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
          padding: '0.9rem 1.1rem',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedDictWord.word}
              </span>
              {selectedDictWord.phonetic && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-amber)', fontFamily: 'var(--font-mono)' }}>
                  {selectedDictWord.phonetic}
                </span>
              )}
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-secondary)'
              }}>
                {selectedDictWord.partOfSpeech}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Normal Pronunciation */}
              <button
                type="button"
                onClick={() => speechEngine.speakDiscreteChunk(selectedDictWord.word, 0, 1)}
                title="Pronounce word normally"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-main)'
                }}
              >
                <Volume2 size={13} />
              </button>

              {/* Slow & Clear Pronunciation */}
              <button
                type="button"
                onClick={() => speechEngine.speakDiscreteChunk(selectedDictWord.word, 0, 1, true)}
                title="Pronounce word slowly and clearly"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-main)'
                }}
              >
                <Volume1 size={13} />
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
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => speechEngine.speakPhonicSyllables(selectedDictWord.word)}
              title="Pronounce by syllables (Sound it out)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>🔤 Sound It Out:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {syllabifyWord(selectedDictWord.word).join(' · ')}
              </span>
            </button>
          </div>

          {selectedPhonicHint && (
            <div style={{
              marginTop: '0.35rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fbbf24' }}>
                  🎯 {selectedPhonicHint.title}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#fde68a', fontFamily: 'var(--font-mono)' }}>
                  {selectedPhonicHint.soundPattern}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.25rem' }}>
                {selectedPhonicHint.ruleExplanation}
              </p>
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.3rem' }}>
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
