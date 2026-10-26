import React, { useRef, useEffect } from 'react';
import { WordFeedback } from '../types';
import { Volume2 } from 'lucide-react';

interface FeedbackPanelProps {
  feedbacks: WordFeedback[];
  isSpeaking: boolean;
  activeChunkIndex: number;
  totalChunks: number;
  currentWordsSpokenText?: string;
  totalWordsInLesson: number;
  lessonTitle: string;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedbacks,
  isSpeaking,
  activeChunkIndex,
  totalChunks,
  currentWordsSpokenText = '',
  totalWordsInLesson,
  lessonTitle
}) => {
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const hasAttemptedWords = feedbacks.length > 0;
  const correctCount = feedbacks.filter(f => f.status === 'correct').length;
  const missingCount = feedbacks.filter(f => f.status === 'missing').length;
  const incorrectCount = feedbacks.filter(f => f.status === 'incorrect').length;

  // Auto-scroll as continuous story grows
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = contentContainerRef.current.scrollHeight;
    }
  }, [feedbacks.length]);

  const progressPercent = totalWordsInLesson > 0 
    ? Math.min(100, Math.round((correctCount / totalWordsInLesson) * 100))
    : 0;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid var(--border-main)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        minHeight: '200px',
        maxHeight: '340px',
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
              gap: '5px',
              padding: '2px 9px',
              borderRadius: '999px',
              backgroundColor: '#eff6ff',
              color: 'var(--accent)',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              <Volume2 size={13} className="animate-pulse" />
              <span>
                Teacher reading{currentWordsSpokenText ? `: "${currentWordsSpokenText}"` : ''} 
                {totalChunks > 0 ? ` (part ${activeChunkIndex + 1}/${totalChunks})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Word breakdown badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                <span style={{ color: '#d97706', fontWeight: 600 }}>
                  {missingCount} missing
                </span>
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
              return (
                <span
                  key={idx}
                  className="word-missing"
                  title="Missing word here! You forgot or skipped a word in this position."
                >
                  [ ___ ]
                </span>
              );
            }

            const isCorrect = item.status === 'correct';
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  position: 'relative'
                }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span><strong style={{ color: 'var(--color-green)' }}>Green</strong> = correct</span>
          <span><strong style={{ color: 'var(--color-red)' }}>Red</strong> = incorrect</span>
          <span><strong style={{ color: '#d97706' }}>[ ___ ]</strong> = missing word space</span>
        </div>
        <span>Continuous story dictation • Screen never clears or blanks</span>
      </div>
    </div>
  );
};
