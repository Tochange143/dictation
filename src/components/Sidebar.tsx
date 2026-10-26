import React, { useState, useMemo } from 'react';
import { LessonProgress } from '../types';
import { LESSON_MANIFEST } from '../data/lessonsIndex';
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Search, 
  X
} from 'lucide-react';

interface SidebarProps {
  currentLessonId: number;
  progressMap: Record<number, LessonProgress>;
  lastActive: { lessonId: number; sentenceIndex: number } | null;
  onSelectLesson: (id: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentLessonId,
  progressMap,
  lastActive,
  onSelectLesson,
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true
  });

  const toggleLevel = (lvl: number) => {
    setExpandedLevels(prev => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return LESSON_MANIFEST;
    const q = searchQuery.toLowerCase().trim();
    return LESSON_MANIFEST.filter(
      l => l.title.toLowerCase().includes(q) || 
           l.id.toString() === q ||
           l.levelName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const levelGroups = useMemo(() => {
    return {
      1: filteredLessons.filter(l => l.level === 1),
      2: filteredLessons.filter(l => l.level === 2),
      3: filteredLessons.filter(l => l.level === 3)
    };
  }, [filteredLessons]);

  const lastActiveLesson = useMemo(() => {
    if (!lastActive) return null;
    return LESSON_MANIFEST.find(l => l.id === lastActive.lessonId) || null;
  }, [lastActive]);

  const completedCount = useMemo(() => {
    return Object.values(progressMap).filter(p => p.completed).length;
  }, [progressMap]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 90
          }}
          className="mobile-only"
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '320px',
          minWidth: '320px',
          height: '100vh',
          backgroundColor: '#ffffff',
          borderRight: '1.5px solid var(--border-main)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 95
        }}
        className={`sidebar-container ${isOpen ? 'is-open' : ''}`}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Lessons
              </h1>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {completedCount} of 100 Completed
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mobile-only"
            style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-secondary)' }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Continue Where I Stopped Banner */}
        {lastActiveLesson && lastActiveLesson.id !== currentLessonId && (
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-muted)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Continue Practicing
            </div>
            <button
              onClick={() => {
                onSelectLesson(lastActiveLesson.id);
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--border-main)',
                borderRadius: '8px',
                textAlign: 'left'
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  #{lastActiveLesson.id} {lastActiveLesson.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Sentence {lastActive?.sentenceIndex ? lastActive.sentenceIndex + 1 : 1}
                </div>
              </div>
              <Play size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            </button>
          </div>
        )}

        {/* Search Input */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '8px',
            padding: '0.45rem 0.65rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <Search size={15} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search 100 lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Lessons List categorized by Level */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0.75rem' }}>
          {[
            { level: 1, name: 'Level 1: Beginner' },
            { level: 2, name: 'Level 2: Intermediate' },
            { level: 3, name: 'Level 3: Advanced' }
          ].map(({ level, name }) => {
            const lessons = levelGroups[level as 1 | 2 | 3];
            const isExpanded = expandedLevels[level];
            const completedInLevel = lessons.filter(l => progressMap[l.id]?.completed).length;

            return (
              <div key={level} style={{ marginBottom: '0.75rem' }}>
                <button
                  onClick={() => toggleLevel(level)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-muted)',
                    marginBottom: '0.3rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {completedInLevel}/{lessons.length}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '0.2rem' }}>
                    {lessons.map(lesson => {
                      const isActive = lesson.id === currentLessonId;
                      const progress = progressMap[lesson.id];
                      const isCompleted = progress?.completed;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            onSelectLesson(lesson.id);
                            onClose();
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px',
                            border: isActive ? '1.5px solid var(--brand-primary)' : '1px solid transparent',
                            backgroundColor: isActive ? 'var(--bg-muted)' : 'transparent',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                              minWidth: '24px'
                            }}>
                              {String(lesson.id).padStart(2, '0')}
                            </span>
                            <span style={{
                              fontSize: '0.82rem',
                              fontWeight: isActive ? 700 : 400,
                              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {lesson.title}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            {isCompleted && (
                              <CheckCircle2 size={14} style={{ color: 'var(--color-green)' }} />
                            )}
                            {progress?.bestAccuracy !== undefined && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: isCompleted ? 'var(--color-green-bg)' : 'var(--bg-muted)',
                                color: isCompleted ? 'var(--color-green)' : 'var(--text-muted)',
                                fontWeight: 700
                              }}>
                                {progress.bestAccuracy}%
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
