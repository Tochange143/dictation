import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Lesson, LessonProgress, SentenceEvaluation, UserSettings, WordFeedback } from './types';
import { fetchLessonById } from './data/lessonsIndex';
import { getLiveFeedback, evaluateSentence, tokenizeSentence } from './utils/evaluator';
import { getWordChunks } from './utils/chunker';
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
  const [sentenceIndex, setSentenceIndex] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(true);

  // Active Word Chunk Index within current sentence (e.g. chunk 0 = first 3 words, chunk 1 = next 3 words)
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);

  // Continuous Story History
  const [completedSentences, setCompletedSentences] = useState<string[]>([]);

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

  // Current Sentence Evaluation
  const [currentEvaluation, setCurrentEvaluation] = useState<SentenceEvaluation | null>(null);

  // Lesson runtime statistics
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [sessionRetries, setSessionRetries] = useState<number>(0);
  const [misspelledTracker, setMisspelledTracker] = useState<Record<string, number>>({});

  // Auto-advance timer ref
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setSentenceIndex(data.lastActive.sentenceIndex || 0);
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

          // Populate completed sentences up to current sentenceIndex
          const completed: string[] = [];
          for (let i = 0; i < sentenceIndex && i < data.sentences.length; i++) {
            completed.push(data.sentences[i].text);
          }
          setCompletedSentences(completed);
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
  }, [currentLessonId]);

  // Current active sentence
  const currentSentence = useMemo(() => {
    if (!currentLesson || !currentLesson.sentences[sentenceIndex]) return null;
    return currentLesson.sentences[sentenceIndex];
  }, [currentLesson, sentenceIndex]);

  // Word chunks for current sentence based on wordsPerChunk setting (e.g. 3 words at once)
  const currentWordChunks = useMemo(() => {
    if (!currentSentence) return [];
    return getWordChunks(currentSentence.text, settings.wordsPerChunk);
  }, [currentSentence, settings.wordsPerChunk]);

  // Save last active position whenever lesson or sentence changes
  useEffect(() => {
    if (currentLesson) {
      saveLastActive({ lessonId: currentLessonId, sentenceIndex });
    }
  }, [currentLessonId, sentenceIndex, currentLesson]);

  // Compute live word-by-word feedback
  const liveFeedbacks: WordFeedback[] = useMemo(() => {
    if (!currentSentence || !typedInput.trim()) return [];
    return getLiveFeedback(currentSentence.text, typedInput);
  }, [currentSentence, typedInput]);

  // Check if current sentence is completely correct in real-time
  const isSentenceFullyCorrect = useMemo(() => {
    if (!currentSentence || !typedInput.trim()) return false;
    const evalResult = evaluateSentence(currentSentence.text, typedInput);
    return evalResult.isFullyCorrect;
  }, [currentSentence, typedInput]);

  // Compute live accuracy percentage
  const liveAccuracy = useMemo(() => {
    if (!currentSentence || !typedInput.trim()) return undefined;
    return evaluateSentence(currentSentence.text, typedInput).accuracy;
  }, [currentSentence, typedInput]);

  // Speak discrete active chunk (e.g. 3 words at a time)
  const speakActiveChunk = useCallback((chunkIdx?: number) => {
    if (!currentWordChunks || currentWordChunks.length === 0) return;
    const idx = chunkIdx !== undefined ? chunkIdx : activeChunkIndex;
    if (idx >= 0 && idx < currentWordChunks.length) {
      const textToSpeak = currentWordChunks[idx];
      speechEngine.speakDiscreteChunk(textToSpeak, idx, currentWordChunks.length);
    }
  }, [currentWordChunks, activeChunkIndex]);

  // Speak full sentence
  const speakFullSentence = useCallback(() => {
    if (!currentSentence) return;
    speechEngine.speakSentence(currentSentence.chunks, currentSentence.text, true);
  }, [currentSentence]);

  // Move smoothly to next sentence in the continuous story
  const advanceToNextSentence = useCallback(() => {
    if (!currentLesson || !currentSentence) return;
    speechEngine.cancel();

    // Evaluate current sentence and track any mistakes
    const evaluation = evaluateSentence(currentSentence.text, typedInput);
    setCurrentEvaluation(evaluation);

    if (evaluation.misspelledWords.length > 0) {
      setMisspelledTracker(prev => {
        const next = { ...prev };
        for (const item of evaluation.misspelledWords) {
          const w = item.expected.toLowerCase().replace(/[^a-z]/g, '');
          if (w) next[w] = (next[w] || 0) + 1;
        }
        return next;
      });
    }

    // Save lesson progress
    const updatedProgress: LessonProgress = {
      lessonId: currentLesson.id,
      currentSentenceIndex: sentenceIndex + 1,
      completed: sentenceIndex + 1 >= currentLesson.sentences.length,
      bestAccuracy: Math.max(progressMap[currentLesson.id]?.bestAccuracy || 0, evaluation.accuracy),
      totalAttempts: (progressMap[currentLesson.id]?.totalAttempts || 0) + 1,
      totalCorrectWords: (progressMap[currentLesson.id]?.totalCorrectWords || 0) + evaluation.correctWordsCount,
      totalIncorrectWords: (progressMap[currentLesson.id]?.totalIncorrectWords || 0) + evaluation.incorrectWordsCount,
      timeSpentSeconds: Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000)),
      misspelledWordCounts: { ...(progressMap[currentLesson.id]?.misspelledWordCounts || {}), ...misspelledTracker }
    };
    saveLessonProgress(updatedProgress);
    setProgressMap(prev => ({ ...prev, [currentLesson.id]: updatedProgress }));

    // Append to continuous story transcript
    setCompletedSentences(prev => [...prev, currentSentence.text]);

    if (sentenceIndex + 1 < currentLesson.sentences.length) {
      setSentenceIndex(prev => prev + 1);
      setTypedInput('');
      setActiveChunkIndex(0);
      setCurrentEvaluation(null);

      // Teacher dictates first words of next sentence after brief breath
      setTimeout(() => {
        if (currentLesson.sentences[sentenceIndex + 1]) {
          const nextChunks = getWordChunks(currentLesson.sentences[sentenceIndex + 1].text, settings.wordsPerChunk);
          if (nextChunks.length > 0) {
            speechEngine.speakDiscreteChunk(nextChunks[0], 0, nextChunks.length);
          }
        }
      }, 750);
    } else {
      finishCurrentLesson(evaluation);
    }
  }, [currentLesson, currentSentence, sentenceIndex, typedInput, settings.wordsPerChunk, progressMap, sessionStartTime, misspelledTracker]);

  // Detect when user finishes writing the current 3 words to dictate the NEXT 3 words!
  // "it will dictate the three words at once , after user write them after that only next three word will sound"
  useEffect(() => {
    if (!currentSentence || settings.wordsPerChunk <= 0 || currentWordChunks.length <= 1) {
      return;
    }

    const typedWords = tokenizeSentence(typedInput);
    const typedWordsCount = typedWords.length;
    
    // Words required to finish the current chunk
    const targetWordsForNextChunk = (activeChunkIndex + 1) * settings.wordsPerChunk;

    // If user has written the required words for current chunk and there are more chunks
    if (typedWordsCount >= targetWordsForNextChunk && activeChunkIndex + 1 < currentWordChunks.length) {
      const nextIdx = activeChunkIndex + 1;
      setActiveChunkIndex(nextIdx);

      // Teacher sounds the next 3 words!
      setTimeout(() => {
        speakActiveChunk(nextIdx);
      }, 400);
    }
  }, [typedInput, currentSentence, settings.wordsPerChunk, currentWordChunks, activeChunkIndex, speakActiveChunk]);

  // Live Auto-Advance: when user writes entire sentence 100% correctly, seamlessly continue!
  useEffect(() => {
    if (!currentSentence || isSummaryOpen) return;

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (typedInput.trim()) {
      const evalResult = evaluateSentence(currentSentence.text, typedInput);
      if (evalResult.isFullyCorrect) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          advanceToNextSentence();
        }, 1000);
      }
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [typedInput, currentSentence, isSummaryOpen, advanceToNextSentence]);

  // Complete lesson and compute final progress
  const finishCurrentLesson = (finalEval?: SentenceEvaluation) => {
    if (!currentLesson) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000));
    const overallAccuracy = finalEval ? finalEval.accuracy : 98;

    const existingProgress = progressMap[currentLesson.id];
    const newProgress: LessonProgress = {
      lessonId: currentLesson.id,
      currentSentenceIndex: sentenceIndex,
      completed: true,
      completedAt: new Date().toISOString(),
      bestAccuracy: Math.max(existingProgress?.bestAccuracy || 0, overallAccuracy),
      totalAttempts: (existingProgress?.totalAttempts || 0) + 1,
      totalCorrectWords: (existingProgress?.totalCorrectWords || 0) + currentLesson.wordCount,
      totalIncorrectWords: (existingProgress?.totalIncorrectWords || 0) + Object.keys(misspelledTracker).length,
      timeSpentSeconds: (existingProgress?.timeSpentSeconds || 0) + timeSpent,
      misspelledWordCounts: { ...(existingProgress?.misspelledWordCounts || {}), ...misspelledTracker }
    };

    saveLessonProgress(newProgress);
    setProgressMap(loadAllProgress());
    setIsSummaryOpen(true);
  };

  // Skip sentence directly without interruption
  const handleSkipSentence = () => {
    if (!currentLesson || !currentSentence) return;
    speechEngine.cancel();
    setCompletedSentences(prev => [...prev, currentSentence.text]);

    if (sentenceIndex + 1 < currentLesson.sentences.length) {
      setSentenceIndex(prev => prev + 1);
      setTypedInput('');
      setActiveChunkIndex(0);
      setCurrentEvaluation(null);
      setTimeout(() => {
        if (currentLesson.sentences[sentenceIndex + 1]) {
          const nextChunks = getWordChunks(currentLesson.sentences[sentenceIndex + 1].text, settings.wordsPerChunk);
          if (nextChunks.length > 0) {
            speechEngine.speakDiscreteChunk(nextChunks[0], 0, nextChunks.length);
          }
        }
      }, 500);
    }
  };

  // Previous sentence
  const handlePreviousSentence = () => {
    if (sentenceIndex > 0) {
      speechEngine.cancel();
      setSentenceIndex(prev => prev - 1);
      setCompletedSentences(prev => prev.slice(0, -1));
      setTypedInput('');
      setActiveChunkIndex(0);
      setCurrentEvaluation(null);
    }
  };

  // Restart current sentence
  const handleRestartSentence = () => {
    setTypedInput('');
    setActiveChunkIndex(0);
    setCurrentEvaluation(null);
    speakActiveChunk(0);
  };

  // Change words per chunk setting (1, 2, 3, 4, or 0 for full sentence)
  const handleChangeWordsPerChunk = (numWords: number) => {
    const updated = { ...settings, wordsPerChunk: numWords };
    setSettings(updated);
    saveSettings(updated);
    setActiveChunkIndex(0);
  };

  // Pacing preset selection
  const handlePacingPreset = (preset: 'slow' | 'teacher' | 'natural') => {
    speechEngine.setPacingPreset(preset);
    if (preset === 'slow') {
      const updated = { ...settings, speechSpeed: 0.7 };
      setSettings(updated);
      setDictationPauseMs(4000);
      saveSettings(updated);
    } else if (preset === 'teacher') {
      const updated = { ...settings, speechSpeed: 0.8 };
      setSettings(updated);
      setDictationPauseMs(2500);
      saveSettings(updated);
    } else if (preset === 'natural') {
      const updated = { ...settings, speechSpeed: 1.0 };
      setSettings(updated);
      setDictationPauseMs(1500);
      saveSettings(updated);
    }
  };

  // Select new lesson from sidebar
  const handleSelectLesson = (id: number) => {
    if (id === currentLessonId) return;
    setCurrentLessonId(id);
    setSentenceIndex(0);
    setActiveChunkIndex(0);
    setCompletedSentences([]);
    setTypedInput('');
  };

  // Reset all progress
  const handleResetAllProgress = () => {
    resetAllProgress();
    setProgressMap({});
    setSentenceIndex(0);
    setActiveChunkIndex(0);
    setCompletedSentences([]);
    setTypedInput('');
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Escape: Pause immediately
      if (e.key === 'Escape') {
        speechEngine.pause();
        return;
      }

      // Ctrl + Enter: Read current words
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (speechState.isPaused) {
          speechEngine.resume();
        } else {
          speakActiveChunk();
        }
        return;
      }

      // Alt + R: Replay current words
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        speakActiveChunk();
        return;
      }

      // Alt + Left Arrow: Previous sentence
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousSentence();
        return;
      }

      // Alt + Right Arrow: Next sentence
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkipSentence();
        return;
      }

      // Ctrl + Backspace: Clear typed text
      if (e.ctrlKey && e.key === 'Backspace' && typedInput.trim().length > 0) {
        setTypedInput('');
        return;
      }

      // Ctrl + Shift + Arrow Up: Increase speech speed
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        const nextSpeed = Math.min(1.5, Math.round((settings.speechSpeed + 0.1) * 10) / 10);
        setSettings(prev => ({ ...prev, speechSpeed: nextSpeed }));
        speechEngine.setSpeed(nextSpeed);
        saveSettings({ ...settings, speechSpeed: nextSpeed });
        return;
      }

      // Ctrl + Shift + Arrow Down: Decrease speech speed
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        const nextSpeed = Math.max(0.5, Math.round((settings.speechSpeed - 0.1) * 10) / 10);
        setSettings(prev => ({ ...prev, speechSpeed: nextSpeed }));
        speechEngine.setSpeed(nextSpeed);
        saveSettings({ ...settings, speechSpeed: nextSpeed });
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [speechState.isPaused, speakActiveChunk, settings, typedInput, handlePreviousSentence, handleSkipSentence]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Left Sidebar: Lessons */}
      <Sidebar
        currentLessonId={currentLessonId}
        progressMap={progressMap}
        lastActive={loadLastActive()}
        onSelectLesson={handleSelectLesson}
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
              sentenceIndex={sentenceIndex}
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
              onReplaySentence={speakFullSentence}
              onPreviousSentence={handlePreviousSentence}
              onSkipSentence={handleSkipSentence}
              onRestartSentence={handleRestartSentence}
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

            {/* Core Practice Layout matching sketch: Live feedback above, Writing area below */}
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
              {/* Top Panel: Live Dictation Feedback */}
              <FeedbackPanel
                feedbacks={liveFeedbacks}
                isSpeaking={speechState.isPlaying}
                speechChunkIndex={activeChunkIndex}
                totalSpeechChunks={currentWordChunks.length}
                completedSentences={completedSentences}
                currentSentenceNumber={sentenceIndex + 1}
                totalSentences={currentLesson.sentences.length}
              />

              {/* Bottom Panel: Live Continuous Writing Area */}
              <TypingPanel
                value={typedInput}
                onChange={setTypedInput}
                onEnterNext={advanceToNextSentence}
                onClear={() => setTypedInput('')}
                onReplayCurrent={() => speakActiveChunk()}
                isFullyCorrect={isSentenceFullyCorrect}
                accuracy={liveAccuracy}
                wordCount={typedInput.trim() ? typedInput.trim().split(/\s+/).length : 0}
              />
            </div>
          </>
        )}
      </main>

      {/* Lesson Complete Summary Modal (shown only upon completing the entire lesson) */}
      {currentLesson && (
        <LessonSummaryModal
          isOpen={isSummaryOpen}
          lesson={currentLesson}
          accuracy={currentEvaluation ? currentEvaluation.accuracy : 100}
          totalCorrectWords={currentLesson.wordCount}
          totalIncorrectWords={Object.keys(misspelledTracker).length}
          timeSpentSeconds={Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000))}
          retriesCount={sessionRetries}
          misspelledWordCounts={misspelledTracker}
          onRetryLesson={() => {
            setIsSummaryOpen(false);
            setSentenceIndex(0);
            setActiveChunkIndex(0);
            setCompletedSentences([]);
            setTypedInput('');
            speakActiveChunk(0);
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
