import React, { useState } from 'react';
import { WordFeedback } from '../types';
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react';

interface FeedbackPanelProps {
  feedbacks: WordFeedback[];
  isSpeaking: boolean;
  speechChunkIndex: number;
  totalSpeechChunks: number;
  completedSentences?: string[];
  currentSentenceNumber: number;
  totalSentences: number;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedbacks,
  isSpeaking,
  speechChunkIndex,
  totalSpeechChunks,
  completedSentences = [],
  currentSentenceNumber,
  totalSentences
}) => {
  const [showStoryHistory, setShowStoryHistory] = useState<boolean>(false);

  const hasAttemptedWords = feedbacks.length > 0;
  const correctCount = feedbacks.filter(f => f.status === 'correct').length;
  const missingCount = feedbacks.filter(f => f.status === 'missing').length;
  const incorrectCount = feedbacks.filter(f => f.status === 'incorrect').length;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid var(--border-main)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        minHeight: '170px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'border-color 0.2s ease'
      }}
    >
      {/* Top Status Line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)'
          }}>
            Live Dictation Feedback
          </span>

          <span style={{
            fontSize: '0.72rem',
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-muted)',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}>
            Sentence {currentSentenceNumber} of {totalSentences}
          </span>

          {isSpeaking && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: '#eff6ff',
              color: 'var(--accent)',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              <Volume2 size={12} className="animate-pulse" />
              <span>Teacher reading{totalSpeechChunks > 1 ? ` (part ${speechChunkIndex + 1}/${totalSpeechChunks})` : ''}...</span>
            </div>
          )}
        </div>

        {/* Right side: Word breakdown counters or Story toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {completedSentences.length > 0 && (
            <button
              onClick={() => setShowStoryHistory(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: showStoryHistory ? 'var(--bg-muted)' : 'transparent'
              }}
            >
              <span>Story History ({completedSentences.length})</span>
              {showStoryHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

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

      {/* Story History Dropdown if expanded */}
      {showStoryHistory && completedSentences.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-muted)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '0.75rem',
          fontSize: '0.95rem',
          lineHeight: '1.6rem',
          color: 'var(--color-green)',
          maxHeight: '120px',
          overflowY: 'auto',
          border: '1px solid var(--border-subtle)'
        }}>
          {completedSentences.join(' ')}
        </div>
      )}

      {/* Main Feedback Content Area for the Current Sentence */}
      <div
        style={{
          fontSize: '1.5rem',
          lineHeight: '2.3rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          wordBreak: 'break-word',
          minHeight: '75px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: '0.5rem',
          rowGap: '0.45rem'
        }}
      >
        {!hasAttemptedWords ? (
          <span style={{
            color: 'var(--text-muted)',
            fontSize: '1.25rem',
            fontWeight: 400,
            userSelect: 'none',
            fontStyle: 'italic'
          }}>
            Listen to the sentence and write below... (Words will appear here as you type)
          </span>
        ) : (
          feedbacks.map((item, idx) => {
            if (item.status === 'missing') {
              return (
                <span
                  key={idx}
                  className="word-missing"
                  title="Missing word here! You forgot a word in this position."
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
        <span>Untyped words stay invisible • Real-time live dictation</span>
      </div>
    </div>
  );
};
