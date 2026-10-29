import electron from 'electron';
const { ipcMain } = electron;
import {
  lessonsDao,
  progressDao,
  lastActiveDao,
  settingsDao
} from '../server/db.js';

export function setupIpcHandlers() {
  // Health
  ipcMain.handle('db:get-health', async () => {
    return { status: 'ok', backend: 'electron-ipc-sqlite', timestamp: new Date().toISOString() };
  });

  // Lessons
  ipcMain.handle('db:get-lessons', async () => {
    try {
      return lessonsDao.getAll();
    } catch (err) {
      console.error('IPC db:get-lessons error:', err);
      throw err;
    }
  });

  ipcMain.handle('db:get-lesson', async (_event, id) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid lesson ID');
    return lessonsDao.getById(numId);
  });

  // Progress
  ipcMain.handle('db:get-progress', async () => {
    try {
      return progressDao.getAll();
    } catch (err) {
      console.error('IPC db:get-progress error:', err);
      throw err;
    }
  });

  ipcMain.handle('db:get-lesson-progress', async (_event, id) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid lesson ID');
    const p = progressDao.getById(numId);
    return p || {
      lessonId: numId,
      currentSentenceIndex: 0,
      activeChunkIndex: 0,
      typedText: '',
      completed: false
    };
  });

  ipcMain.handle('db:save-progress', async (_event, progress) => {
    if (!progress || typeof progress.lessonId !== 'number') {
      throw new Error('Invalid progress payload');
    }
    progressDao.save(progress);
    return progressDao.getById(progress.lessonId);
  });

  // Story
  ipcMain.handle('db:get-story', async (_event, id) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid lesson ID');
    const p = progressDao.getById(numId);
    return {
      lessonId: numId,
      typedText: p ? p.typedText : '',
      activeChunkIndex: p ? p.activeChunkIndex : 0
    };
  });

  ipcMain.handle('db:save-story', async (_event, id, typedText, activeChunkIndex) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid lesson ID');
    progressDao.saveStory(numId, typedText || '', activeChunkIndex || 0);
    lastActiveDao.save({
      lessonId: numId,
      sentenceIndex: 0,
      activeChunkIndex: activeChunkIndex || 0,
      typedText: typedText || ''
    });
    return { success: true, lessonId: numId };
  });

  // Settings
  ipcMain.handle('db:get-settings', async () => {
    return settingsDao.get();
  });

  ipcMain.handle('db:save-settings', async (_event, settings) => {
    return settingsDao.save(settings);
  });

  // Last Active
  ipcMain.handle('db:get-last-active', async () => {
    return lastActiveDao.get();
  });

  ipcMain.handle('db:save-last-active', async (_event, state) => {
    lastActiveDao.save(state);
    return lastActiveDao.get();
  });

  // Reset
  ipcMain.handle('db:reset-all', async () => {
    progressDao.resetAll();
    return { success: true };
  });
}
