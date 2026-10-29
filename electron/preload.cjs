const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Lessons
  getLessons: () => ipcRenderer.invoke('db:get-lessons'),
  getLesson: (id) => ipcRenderer.invoke('db:get-lesson', id),

  // Progress
  getProgress: () => ipcRenderer.invoke('db:get-progress'),
  getLessonProgress: (id) => ipcRenderer.invoke('db:get-lesson-progress', id),
  saveProgress: (progress) => ipcRenderer.invoke('db:save-progress', progress),

  // Typed Story
  getStory: (lessonId) => ipcRenderer.invoke('db:get-story', lessonId),
  saveStory: (lessonId, typedText, activeChunkIndex) =>
    ipcRenderer.invoke('db:save-story', lessonId, typedText, activeChunkIndex),

  // Settings
  getSettings: () => ipcRenderer.invoke('db:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('db:save-settings', settings),

  // Last Active
  getLastActive: () => ipcRenderer.invoke('db:get-last-active'),
  saveLastActive: (state) => ipcRenderer.invoke('db:save-last-active', state),

  // Reset
  resetAll: () => ipcRenderer.invoke('db:reset-all'),

  // System info
  getHealth: () => ipcRenderer.invoke('db:get-health')
});
