import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Lesson, LessonProgress, SentenceEvaluation, UserSettings, WordFeedback, VoiceAccent } from './types';
import { fetchLessonById } from './data/lessonsIndex';
import { getLiveFeedback, evaluateSentence, tokenizeSentence } from './utils/evaluator';
import { getStoryChunks, StoryChunk } from './utils/chunker';
import { speechEngine, SpeechState } from './services/speechEngine';
import { 
  loadAllProgress, 
  loadSettings, 
  saveSettings, 
  loadLastActive, 
  saveLastActive,
  saveLessonTypedStory,
  loadLessonTypedStory,
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

const RootRedirect: React.FC = () => {
  const lastActive = loadLastActive();
  const targetId = (lastActive && lastActive.lessonId >= 1 && lastActive.lessonId <= 100)
    ? lastActive.lessonId
    : 1;
  return <Navigate to={`/lesson/${targetId}`} replace />;
};

export const DictationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Validate lesson ID from React Router params (between 1 and 100)
  const currentLessonId = useMemo(() => {
    const parsed = parseInt(id || '1', 10);
    return !isNaN(parsed) && parsed >= 1 && parsed <= 100 ? parsed : 1;
  }, [id]);

  // Current Lesson state fetched from backend
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
  const [isHelpVisible, setIsHelpVisible] = useState<boolean>(false);

  // Final evaluation when lesson completes
  const [currentEvaluation, setCurrentEvaluation] = useState<SentenceEvaluation | null>(null);

  // Track the highest chunk index that has been spoken by the teacher
  const lastSpokenChunkRef = useRef<number>(-1);

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
    });
  }, []);

  // Initialize Speech Engine settings
  useEffect(() => {
    speechEngine.setSpeed(settings.speechSpeed);
    speechEngine.setRepeatCount(settings.repeatCount);
    speechEngine.setDictationPause(dictationPauseMs);
    if (settings.voiceAccent) {
      speechEngine.setAccent(settings.voiceAccent);
    }
    if (settings.selectedVoiceURI) {
      speechEngine.setVoice(settings.selectedVoiceURI);
    }
    const unsub = speechEngine.subscribe(setSpeechState);
    return unsub;
  }, [settings.speechSpeed, settings.repeatCount, settings.selectedVoiceURI, settings.voiceAccent, dictationPauseMs]);

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
  const storyChunks: StoryChunk[] = useMemo(() => {
    if (!currentLesson) return [];
    return getStoryChunks(currentLesson.sentences, settings.wordsPerChunk);
  }, [currentLesson, settings.wordsPerChunk]);

  // Active Story Chunk being dictated
  const currentChunk: StoryChunk | undefined = storyChunks[activeChunkIndex];

  // Current Spoken Words / Sentence Help text for Ctrl+S
  const currentHelpText = useMemo(() => {
    if (!currentChunk) return '';
    if (currentLesson && currentLesson.sentences[currentChunk.sentenceIndex]) {
      const sentenceText = currentLesson.sentences[currentChunk.sentenceIndex].text;
      if (sentenceText.trim() !== currentChunk.text.trim()) {
        return `${currentChunk.text}  (Full: "${sentenceText}")`;
      }
    }
    return currentChunk.text;
  }, [currentChunk, currentLesson]);

  // Fetch lesson data from backend server when route param changes
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
          setCurrentEvaluation(null);
          setIsSummaryOpen(false);

          // Restore saved typed story strictly for this lesson ID
          const savedStory = loadLessonTypedStory(data.id);
          const restoredText = (savedStory && typeof savedStory.typedText === 'string')
            ? savedStory.typedText
            : '';

          if (restoredText.trim()) {
            setTypedInput(restoredText);
            const typedTokens = tokenizeSentence(restoredText);
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
            lastSpokenChunkRef.current = restoredChunkIdx;
          } else {
            // Fresh lesson: teacher starts reading first 3 words
            setTypedInput('');
            setActiveChunkIndex(0);
            lastSpokenChunkRef.current = 0;
            setTimeout(() => {
              const chunks = getStoryChunks(data.sentences, settings.wordsPerChunk);
              if (chunks.length > 0) {
                lastSpokenChunkRef.current = 0;
                speechEngine.speakDiscreteChunk(chunks[0].text, 0, chunks.length);
              }
            }, 500);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load lesson from backend', err);
        if (!isCancelled) {
          setIsLoadingLesson(false);
        }
      });

    return () => {
      isCancelled = true;
      speechEngine.cancel();
    };
  }, [currentLessonId, settings.wordsPerChunk]);

  // Save typed text immediately to localStorage and debounced to backend server
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!currentLesson || currentLesson.id !== currentLessonId) return;

    // Instant local save (zero latency, offline resilient)
    try {
      localStorage.setItem(`dictation_story_${currentLessonId}`, JSON.stringify({
        typedText: typedInput,
        activeChunkIndex
      }));
      localStorage.setItem('dictation_last_state_v1', JSON.stringify({
        lessonId: currentLessonId,
        sentenceIndex: currentChunk ? currentChunk.sentenceIndex : 0,
        activeChunkIndex,
        typedText: typedInput
      }));
    } catch {}

    // Debounced sync to backend server
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      if (currentLesson && currentLesson.id === currentLessonId) {
        saveLastActive({
          lessonId: currentLessonId,
          sentenceIndex: currentChunk ? currentChunk.sentenceIndex : 0,
          activeChunkIndex,
          typedText: typedInput
        });
        saveLessonTypedStory(currentLessonId, typedInput, activeChunkIndex);
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [currentLessonId, currentChunk, activeChunkIndex, typedInput, currentLesson]);

  // Compute live word-by-word feedback for continuous story
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

    saveLessonTypedStory(currentLesson.id, typedInput, activeChunkIndex);
    setProgressMap(prev => ({ ...prev, [currentLesson.id]: updatedProgress }));
    setIsSummaryOpen(true);
  }, [currentLesson, fullLessonStory, typedInput, activeChunkIndex, progressMap, sessionStartTime, misspelledTracker]);

  // Real-time audio trigger: speak next 3 words when user finishes current words
  useEffect(() => {
    if (!currentLesson || storyChunks.length === 0) return;

    const typedTokens = tokenizeSentence(typedInput);
    const typedWordsCount = typedTokens.length;

    // Determine target chunk based on cumulative word count typed
    let targetChunkIdx = 0;
    for (let i = 0; i < storyChunks.length; i++) {
      if (typedWordsCount >= storyChunks[i].cumulativeWordsEnd) {
        targetChunkIdx = Math.min(i + 1, storyChunks.length - 1);
      } else {
        break;
      }
    }

    if (targetChunkIdx !== activeChunkIndex) {
      setActiveChunkIndex(targetChunkIdx);
    }

    if (targetChunkIdx > lastSpokenChunkRef.current && targetChunkIdx < storyChunks.length) {
      lastSpokenChunkRef.current = targetChunkIdx;
      speechEngine.speakDiscreteChunk(
        storyChunks[targetChunkIdx].text,
        targetChunkIdx,
        storyChunks.length
      );
    } else if (
      targetChunkIdx === storyChunks.length - 1 &&
      typedWordsCount >= storyChunks[storyChunks.length - 1].cumulativeWordsEnd &&
      !isSummaryOpen
    ) {
      finishLesson();
    } else if (targetChunkIdx < lastSpokenChunkRef.current) {
      lastSpokenChunkRef.current = targetChunkIdx;
    }
  }, [typedInput, storyChunks, activeChunkIndex, currentLesson, isSummaryOpen, finishLesson]);

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

  // Navigate cleanly using React Router
  const handleSelectLesson = useCallback((newLessonId: number) => {
    if (newLessonId === currentLessonId) {
      setIsSidebarOpen(false);
      return;
    }
    // Flush current lesson progress before switching
    if (currentLesson && currentLesson.id === currentLessonId) {
      saveLessonTypedStory(currentLesson.id, typedInput, activeChunkIndex);
    }
    setTypedInput('');
    setActiveChunkIndex(0);
    lastSpokenChunkRef.current = -1;
    setIsSidebarOpen(false);
    navigate(`/lesson/${newLessonId}`);
  }, [currentLesson, currentLessonId, typedInput, activeChunkIndex, navigate]);

  const handlePreviousChunk = useCallback(() => {
    if (activeChunkIndex > 0) {
      const prevIdx = activeChunkIndex - 1;
      lastSpokenChunkRef.current = prevIdx;
      setActiveChunkIndex(prevIdx);
      speakActiveChunk(prevIdx);
    }
  }, [activeChunkIndex, speakActiveChunk]);

  const handleSkipChunk = useCallback(() => {
    if (activeChunkIndex + 1 < storyChunks.length) {
      const nextIdx = activeChunkIndex + 1;
      lastSpokenChunkRef.current = nextIdx;
      setActiveChunkIndex(nextIdx);
      speakActiveChunk(nextIdx);
    }
  }, [activeChunkIndex, storyChunks.length, speakActiveChunk]);

  const handleRestartStory = useCallback(() => {
    if (window.confirm('Do you want to restart this story from the beginning?')) {
      speechEngine.cancel();
      lastSpokenChunkRef.current = 0;
      setActiveChunkIndex(0);
      setTypedInput('');
      setSessionRetries(prev => prev + 1);
      saveLessonTypedStory(currentLessonId, '', 0);
      setTimeout(() => {
        lastSpokenChunkRef.current = 0;
        speakActiveChunk(0);
      }, 400);
    }
  }, [currentLessonId, speakActiveChunk]);

  const handleChangeWordsPerChunk = useCallback((words: number) => {
    const updated = { ...settings, wordsPerChunk: words };
    setSettings(updated);
    saveSettings(updated);
  }, [settings]);

  const handleAccentChange = useCallback((accent: VoiceAccent) => {
    speechEngine.setAccent(accent);
    const bestVoice = speechEngine.getSelectedVoice();
    const updated: UserSettings = {
      ...settings,
      voiceAccent: accent,
      selectedVoiceURI: bestVoice ? bestVoice.voiceURI : (accent === 'en-IN' ? 'auto:en-IN' : null)
    };
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
    setTypedInput('');
    setActiveChunkIndex(0);
    setIsSettingsOpen(false);
    navigate('/lesson/1');
  }, [navigate]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Show/Hide Words Help: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        setIsHelpVisible(prev => !prev);
        return;
      }

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
              voiceAccent={settings.voiceAccent || 'en-IN'}
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
              onChangeAccent={handleAccentChange}
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
              padding: '1rem 1.25rem',
              maxWidth: '1100px',
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              {/* Top Panel: Live Dictation Continuous Story Feedback */}
              <FeedbackPanel
                feedbacks={liveFeedbacks}
                isSpeaking={speechState.isPlaying}
                activeChunkIndex={activeChunkIndex}
                totalChunks={storyChunks.length}
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
                helpText={currentHelpText}
                isHelpVisible={isHelpVisible}
                onToggleHelp={() => setIsHelpVisible(prev => !prev)}
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

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/lesson/:id" element={<DictationPage />} />
      <Route path="*" element={<Navigate to="/lesson/1" replace />} />
    </Routes>
  );
};

export default App;
