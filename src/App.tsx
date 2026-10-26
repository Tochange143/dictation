import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Lesson, LessonProgress, SentenceEvaluation, UserSettings, WordFeedback } from './types';
import { fetchLessonById } from './data/lessonsIndex';
import { getLiveFeedback, evaluateSentence, tokenizeSentence } from './utils/evaluator';
import { getStoryChunks, StoryChunk } from './utils/chunker';
import { speechEngine, SpeechState } from './services/speechEngine';
import { 
  loadAllProgress, 
  saveLessonProgress, 
  loadSettings, 
  saveSettings, 
  loadLastActive, 
  saveLastActive,
  resetAllProgress,
  syncFromServer
} from './services/storage';

import { Sidebar } from './components/Sidebar';
import { TopControlsBar } from './components/TopControlsBar';
import { FeedbackPanel } from './components/FeedbackPanel';
import { TypingPanel } from './components/TypingPanel';
import { LessonSummaryModal } from './components/LessonSummaryModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // Application State
  const [currentLessonId, setCurrentLessonId] = useState<number>(1);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(true);

  // Continuous Story Dictation State
  const [typedInput, setTypedInput] = useState<string>('');
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);

  // Settings & Progress
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [progressMap, setProgressMap] = useState<Record<number, LessonProgress>>(loadAllProgress);
  const [dictationPauseMs, setDictationPauseMs] = useState<number>(settings.dictationPauseMs || 2500);

  // Live Speech State
  const [speechState, setSpeechState] = useState<SpeechState>({
    isPlaying: false,
    isPaused: false,
    currentChunkIndex: 0,
    totalChunks: 0,
    currentSentenceText: ''
  });

  // Modals & UI Controls
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Final evaluation when lesson completes
  const [currentEvaluation, setCurrentEvaluation] = useState<SentenceEvaluation | null>(null);

  // Lesson runtime statistics
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [sessionRetries, setSessionRetries] = useState<number>(0);
  const [misspelledTracker, setMisspelledTracker] = useState<Record<string, number>>({});

  // Sync with backend server on startup
  useEffect(() => {
    syncFromServer().then(data => {
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.progress && Object.keys(data.progress).length > 0) {
        setProgressMap(data.progress);
      }
      if (data.lastActive && data.lastActive.lessonId >= 1) {
        setCurrentLessonId(data.lastActive.lessonId);
      }
    });
  }, []);

  // Initialize Speech Engine settings
  useEffect(() => {
    speechEngine.setSpeed(settings.speechSpeed);
    speechEngine.setRepeatCount(settings.repeatCount);
    speechEngine.setDictationPause(dictationPauseMs);
    if (settings.selectedVoiceURI) {
      speechEngine.setVoice(settings.selectedVoiceURI);
    }
    const unsub = speechEngine.subscribe(setSpeechState);
    return unsub;
  }, [settings.speechSpeed, settings.repeatCount, settings.selectedVoiceURI, dictationPauseMs]);

  // Full continuous text of the current lesson
  const fullLessonStory = useMemo(() => {
    if (!currentLesson) return '';
    return currentLesson.sentences.map(s => s.text).join(' ');
  }, [currentLesson]);

  // Total words in the full lesson
  const totalLessonWords = useMemo(() => {
    if (!fullLessonStory) return 0;
    return tokenizeSentence(fullLessonStory).length;
  }, [fullLessonStory]);

  // Story chunks across the entire lesson
  // Splits each sentence into exact N words (default 3 words at once)
  const storyChunks: StoryChunk[] = useMemo(() => {
    if (!currentLesson) return [];
    return getStoryChunks(currentLesson.sentences, settings.wordsPerChunk);
  }, [currentLesson, settings.wordsPerChunk]);

  // Active Story Chunk being dictated
  const currentChunk: StoryChunk | undefined = storyChunks[activeChunkIndex];

  // Fetch lesson data when lesson ID changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingLesson(true);
    speechEngine.cancel();

    fetchLessonById(currentLessonId)
      .then((data) => {
        if (!isCancelled) {
          setCurrentLesson(data);
          setIsLoadingLesson(false);
          setSessionStartTime(Date.now());
          setSessionRetries(0);
          setMisspelledTracker({});
          setTypedInput('');
          setActiveChunkIndex(0);
          setCurrentEvaluation(null);
          setIsSummaryOpen(false);

          // Restore last active position for this lesson if available
          const lastActive = loadLastActive();
          if (lastActive && lastActive.lessonId === currentLessonId && lastActive.typedText) {
            setTypedInput(lastActive.typedText);
            const typedTokens = tokenizeSentence(lastActive.typedText);
            // Calculate starting chunk based on restored typed words
            const chunks = getStoryChunks(data.sentences, settings.wordsPerChunk);
            let restoredChunkIdx = 0;
            for (let i = 0; i < chunks.length; i++) {
              if (typedTokens.length >= chunks[i].cumulativeWordsEnd) {
                restoredChunkIdx = Math.min(i + 1, chunks.length - 1);
              } else {
                break;
              }
            }
            setActiveChunkIndex(restoredChunkIdx);
          } else {
            // First time loading lesson: teacher starts dictating first 3 words after short breath
            setTimeout(() => {
              const chunks = getStoryChunks(data.sentences, settings.wordsPerChunk);
              if (chunks.length > 0) {
                speechEngine.speakDiscreteChunk(chunks[0].text, 0, chunks.length);
              }
            }, 600);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load lesson', err);
        if (!isCancelled) {
          setIsLoadingLesson(false);
        }
      });

    return () => {
      isCancelled = true;
      speechEngine.cancel();
    };
  }, [currentLessonId, settings.wordsPerChunk]);

  // Save last active state to server & localStorage
  useEffect(() => {
    if (currentLesson) {
      saveLastActive({
        lessonId: currentLessonId,
        sentenceIndex: currentChunk ? currentChunk.sentenceIndex : 0,
        typedText: typedInput
      });
    }
  }, [currentLessonId, currentChunk, typedInput, currentLesson]);

  // Compute live word-by-word feedback for the continuous story!
  // All typed words remain in the paragraph in green/red/missing. Trailing untyped words stay invisible.
  const liveFeedbacks: WordFeedback[] = useMemo(() => {
    if (!fullLessonStory || !typedInput.trim()) return [];
    return getLiveFeedback(fullLessonStory, typedInput);
  }, [fullLessonStory, typedInput]);

  // Live match accuracy
  const liveAccuracy = useMemo(() => {
    if (liveFeedbacks.length === 0) return undefined;
    const correctCount = liveFeedbacks.filter(f => f.status === 'correct').length;
    return Math.max(0, Math.round((correctCount / liveFeedbacks.length) * 100));
  }, [liveFeedbacks]);

  // Speak discrete active chunk (e.g. 3 words at once)
  const speakActiveChunk = useCallback((chunkIdx?: number) => {
    if (!storyChunks || storyChunks.length === 0) return;
    const idx = chunkIdx !== undefined ? chunkIdx : activeChunkIndex;
    if (idx >= 0 && idx < storyChunks.length) {
      const chunk = storyChunks[idx];
      speechEngine.speakDiscreteChunk(chunk.text, idx, storyChunks.length);
    }
  }, [storyChunks, activeChunkIndex]);

  // Speak full current sentence
  const speakCurrentSentence = useCallback(() => {
    if (!currentLesson || !currentChunk) return;
    const s = currentLesson.sentences[currentChunk.sentenceIndex];
    if (s) {
      speechEngine.speakDiscreteChunk(s.text, activeChunkIndex, storyChunks.length);
    }
  }, [currentLesson, currentChunk, activeChunkIndex, storyChunks.length]);

  // Complete lesson when all chunks are written
  const finishLesson = useCallback(() => {
    if (!currentLesson) return;
    speechEngine.cancel();

    const evaluation = evaluateSentence(fullLessonStory, typedInput);
    setCurrentEvaluation(evaluation);

    const updatedProgress: LessonProgress = {
      lessonId: currentLesson.id,
      currentSentenceIndex: currentLesson.sentences.length,
      completed: true,
      completedAt: new Date().toISOString(),
      bestAccuracy: Math.max(progressMap[currentLesson.id]?.bestAccuracy || 0, evaluation.accuracy),
      totalAttempts: (progressMap[currentLesson.id]?.totalAttempts || 0) + 1,
      totalCorrectWords: (progressMap[currentLesson.id]?.totalCorrectWords || 0) + evaluation.correctWordsCount,
      totalIncorrectWords: (progressMap[currentLesson.id]?.totalIncorrectWords || 0) + evaluation.incorrectWordsCount,
      timeSpentSeconds: Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000)),
      misspelledWordCounts: { ...(progressMap[currentLesson.id]?.misspelledWordCounts || {}), ...misspelledTracker }
    };

    saveLessonProgress(updatedProgress);
    setProgressMap(prev => ({ ...prev, [currentLesson.id]: updatedProgress }));
    setIsSummaryOpen(true);
  }, [currentLesson, fullLessonStory, typedInput, progressMap, sessionStartTime, misspelledTracker]);

  // REAL-TIME AUDIO TRIGGER:
  // "it will dictate the three words at once, after user write them after that only next three word will sound"
  // When user writes the words of the current chunk, teacher reads the NEXT chunk automatically!
  useEffect(() => {
    if (!currentLesson || storyChunks.length === 0 || !currentChunk) return;

    const typedTokens = tokenizeSentence(typedInput);
    const typedWordsCount = typedTokens.length;

    // Check if user has written up to the end of the current chunk
    if (typedWordsCount >= currentChunk.cumulativeWordsEnd) {
      if (activeChunkIndex + 1 < storyChunks.length) {
        const nextIdx = activeChunkIndex + 1;
        setActiveChunkIndex(nextIdx);

        // Teacher dictates the next 3 words!
        const timer = setTimeout(() => {
          speakActiveChunk(nextIdx);
        }, 350);

        return () => clearTimeout(timer);
      } else if (activeChunkIndex === storyChunks.length - 1 && !isSummaryOpen) {
        // All words of the entire lesson finished!
        const timer = setTimeout(() => {
          finishLesson();
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [typedInput, storyChunks, activeChunkIndex, currentChunk, currentLesson, isSummaryOpen, speakActiveChunk, finishLesson]);

  // Track misspelled words for vocabulary improvement review
  useEffect(() => {
    if (liveFeedbacks.length === 0) return;
    const latestFeedback = liveFeedbacks[liveFeedbacks.length - 1];
    if (latestFeedback && latestFeedback.status === 'incorrect' && latestFeedback.expectedWord) {
      const cleanExpected = latestFeedback.expectedWord.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanExpected) {
        setMisspelledTracker(prev => ({
          ...prev,
          [cleanExpected]: (prev[cleanExpected] || 0) + 1
        }));
      }
    }
  }, [liveFeedbacks]);

  // Controls Handlers
  const handleSelectLesson = useCallback((lessonId: number) => {
    setCurrentLessonId(lessonId);
    setIsSidebarOpen(false);
  }, []);

  const handlePreviousChunk = useCallback(() => {
    if (activeChunkIndex > 0) {
      const prevIdx = activeChunkIndex - 1;
      setActiveChunkIndex(prevIdx);
      speakActiveChunk(prevIdx);
    }
  }, [activeChunkIndex, speakActiveChunk]);

  const handleSkipChunk = useCallback(() => {
    if (activeChunkIndex + 1 < storyChunks.length) {
      const nextIdx = activeChunkIndex + 1;
      setActiveChunkIndex(nextIdx);
      speakActiveChunk(nextIdx);
    }
  }, [activeChunkIndex, storyChunks.length, speakActiveChunk]);

  const handleRestartStory = useCallback(() => {
    if (window.confirm('Do you want to restart this story from the beginning?')) {
      speechEngine.cancel();
      setActiveChunkIndex(0);
      setTypedInput('');
      setSessionRetries(prev => prev + 1);
      setTimeout(() => {
        speakActiveChunk(0);
      }, 400);
    }
  }, [speakActiveChunk]);

  const handleChangeWordsPerChunk = useCallback((words: number) => {
    const updated = { ...settings, wordsPerChunk: words };
    setSettings(updated);
    saveSettings(updated);
  }, [settings]);

  const handlePacingPreset = useCallback((preset: 'slow' | 'teacher' | 'natural') => {
    let speed = 0.8;
    let words = 3;

    if (preset === 'slow') {
      speed = 0.6;
      words = 2;
    } else if (preset === 'teacher') {
      speed = 0.8;
      words = 3;
    } else if (preset === 'natural') {
      speed = 1.0;
      words = 4;
    }

    const updated = { ...settings, speechSpeed: speed, wordsPerChunk: words };
    setSettings(updated);
    speechEngine.setSpeed(speed);
    saveSettings(updated);
  }, [settings]);

  const handleResetAllProgress = useCallback(() => {
    resetAllProgress();
    setProgressMap({});
    setCurrentLessonId(1);
    setTypedInput('');
    setActiveChunkIndex(0);
    setIsSettingsOpen(false);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Replay Words: Alt+R
      if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        speakActiveChunk();
        return;
      }

      // Pause/Resume Speech: Alt+P
      if (e.altKey && e.code === 'KeyP') {
        e.preventDefault();
        if (speechState.isPlaying) {
          speechEngine.pause();
        } else if (speechState.isPaused) {
          speechEngine.resume();
        } else {
          speakActiveChunk();
        }
        return;
      }

      // Close modal on Escape
      if (e.key === 'Escape') {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isSidebarOpen) setIsSidebarOpen(false);
        if (isSummaryOpen) setIsSummaryOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [speakActiveChunk, speechState, isShortcutsOpen, isSettingsOpen, isSidebarOpen, isSummaryOpen]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-main)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)'
    }}>
      {/* Left Sidebar: 100 Lessons Curriculum */}
      <Sidebar
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
        progressMap={progressMap}
        lastActive={{ lessonId: currentLessonId, sentenceIndex: currentChunk ? currentChunk.sentenceIndex : 0 }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Practice Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {isLoadingLesson || !currentLesson ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}>
            Loading Lesson #{currentLessonId}...
          </div>
        ) : (
          <>
            {/* Top Controls Bar with Words-at-once selector */}
            <TopControlsBar
              lesson={currentLesson}
              sentenceIndex={currentChunk ? currentChunk.sentenceIndex : 0}
              totalSentences={currentLesson.sentences.length}
              speechState={speechState}
              speechSpeed={settings.speechSpeed}
              repeatCount={settings.repeatCount}
              wordsPerChunk={settings.wordsPerChunk}
              dictationPauseMs={dictationPauseMs}
              onStartOrResume={() => {
                if (speechState.isPaused) {
                  speechEngine.resume();
                } else {
                  speakActiveChunk();
                }
              }}
              onPause={() => speechEngine.pause()}
              onReplayActiveChunk={() => speakActiveChunk()}
              onReplaySentence={speakCurrentSentence}
              onPreviousSentence={handlePreviousChunk}
              onSkipSentence={handleSkipChunk}
              onRestartSentence={handleRestartStory}
              onChangeSpeed={(newSpeed) => {
                const updated = { ...settings, speechSpeed: newSpeed };
                setSettings(updated);
                speechEngine.setSpeed(newSpeed);
                saveSettings(updated);
              }}
              onChangeRepeat={(newRepeat) => {
                const updated = { ...settings, repeatCount: newRepeat };
                setSettings(updated);
                speechEngine.setRepeatCount(newRepeat);
                saveSettings(updated);
              }}
              onChangeWordsPerChunk={handleChangeWordsPerChunk}
              onPacingPreset={handlePacingPreset}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />

            {/* Core Practice Layout: Continuous Story Feedback above, Writing notebook below */}
            <div style={{
              flex: 1,
              padding: '1.5rem',
              maxWidth: '960px',
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              {/* Top Panel: Live Dictation Continuous Story Feedback */}
              <FeedbackPanel
                feedbacks={liveFeedbacks}
                isSpeaking={speechState.isPlaying}
                activeChunkIndex={activeChunkIndex}
                totalChunks={storyChunks.length}
                currentWordsSpokenText={currentChunk ? currentChunk.text : ''}
                totalWordsInLesson={totalLessonWords}
                lessonTitle={currentLesson.title}
              />

              {/* Bottom Panel: Live Continuous Notebook Writing Area */}
              <TypingPanel
                value={typedInput}
                onChange={setTypedInput}
                onClear={() => setTypedInput('')}
                onReplayCurrent={() => speakActiveChunk()}
                accuracy={liveAccuracy}
                wordCount={typedInput.trim() ? tokenizeSentence(typedInput).length : 0}
                isSpeaking={speechState.isPlaying}
              />
            </div>
          </>
        )}
      </main>

      {/* Lesson Complete Summary Modal */}
      {currentLesson && (
        <LessonSummaryModal
          isOpen={isSummaryOpen}
          lesson={currentLesson}
          accuracy={currentEvaluation ? currentEvaluation.accuracy : (liveAccuracy || 100)}
          totalCorrectWords={currentEvaluation ? currentEvaluation.correctWordsCount : totalLessonWords}
          totalIncorrectWords={Object.keys(misspelledTracker).length}
          timeSpentSeconds={Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000))}
          retriesCount={sessionRetries}
          misspelledWordCounts={misspelledTracker}
          onRetryLesson={() => {
            setIsSummaryOpen(false);
            setActiveChunkIndex(0);
            setTypedInput('');
            setTimeout(() => {
              speakActiveChunk(0);
            }, 400);
          }}
          onNextLesson={() => {
            setIsSummaryOpen(false);
            if (currentLessonId < 100) {
              handleSelectLesson(currentLessonId + 1);
            }
          }}
          onClose={() => setIsSummaryOpen(false)}
          hasNextLesson={currentLessonId < 100}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
        onResetProgress={handleResetAllProgress}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
