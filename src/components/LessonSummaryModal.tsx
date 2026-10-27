import React from 'react';
import { Lesson } from '../types';
import { 
  Trophy, 
  RotateCcw, 
  ArrowRight, 
  X, 
  Clock, 
  Target, 
  CheckCircle2, 
  ListFilter 
} from 'lucide-react';

interface LessonSummaryModalProps {
  isOpen: boolean;
  lesson: Lesson;
  accuracy: number;
  totalCorrectWords: number;
  totalIncorrectWords: number;
  timeSpentSeconds: number;
  retriesCount: number;
  misspelledWordCounts: Record<string, number>;
  onRetryLesson: () => void;
  onNextLesson: () => void;
  onClose: () => void;
  hasNextLesson: boolean;
}

export const LessonSummaryModal: React.FC<LessonSummaryModalProps> = ({
  isOpen,
  lesson,
  accuracy,
  totalCorrectWords,
  totalIncorrectWords,
  timeSpentSeconds,
  retriesCount,
  misspelledWordCounts,
  onRetryLesson,
  onNextLesson,
  onClose,
  hasNextLesson
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const trickyWords = Object.entries(misspelledWordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

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
        zIndex: 110
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-main)',
          maxWidth: '580px',
          width: '100%',
          padding: '2rem',
          boxShadow: '0 25px 35px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Celebration Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(245, 158, 11, 0.4)'
            }}>
              <Trophy size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Lesson Complete!
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                #{lesson.id} {lesson.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.75rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-green)' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Accuracy
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {lesson.sentences.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Sentences
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalCorrectWords}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Correct Words
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {timeFormatted}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Time Spent
            </div>
          </div>
        </div>

        {/* Words to Review */}
        {trickyWords.length > 0 && (
          <div style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            backgroundColor: 'var(--bg-muted)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.6rem'
            }}>
              <ListFilter size={14} style={{ color: 'var(--color-red)' }} />
              <span>Words that Need More Practice</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {trickyWords.map(([word, count]) => (
                <span
                  key={word}
                  style={{
                    fontSize: '0.8rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-red-bg)',
                    color: 'var(--color-red)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{word}</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>({count}x)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={onRetryLesson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-main)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-muted)'
            }}
          >
            <RotateCcw size={15} />
            <span>Practice Again</span>
          </button>

          {hasNextLesson && (
            <button
              onClick={onNextLesson}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--brand-primary)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <span>Continue to Next Lesson</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
