# English Dictation Practice Application

An English dictation web application designed to train English listening, spelling, typing accuracy, vocabulary acquisition, and sentence comprehension.

Built strictly according to the hand-drawn UI design specification:
- **Left Sidebar**: "Lessons" navigation across 100 lessons organized into 3 difficulty tiers (Level 1: Beginner, Level 2: Intermediate, Level 3: Advanced), with completion tracking and "Continue where I stopped" resume functionality.
- **Top Panel**: Large rounded rectangular **Live Dictation Feedback** panel where words are evaluated word-by-word in real time. Correct words turn green; incorrect words turn red; untyped words remain completely invisible. Never leaks the hidden sentence or length indicators.
- **Bottom Panel**: Large rounded rectangular **Typing Area** with focus retention, smooth text wrapping, and distraction-free keyboard input.

---

## Key Features

### 1. 100-Lesson Curriculum (~100,000 Total Words)
All 100 lessons are fully generated and validated with **strict word counts between 950 and 1,050 words each** (total: 103,342 words):
- **Level 1: Beginner (Lessons 1–35)**:
  - Lessons 1–5 start with simple 2-letter and 3-letter words (*am, an, at, as, in, is, it, on, up, us, we, he, me, my, no, go, do, to, so, by, cat, dog, sun, man, pen, cup, bed, box, run, sit, big, red, hot, get, had, can, his, her, you, the*).
  - Sentences such as *"I am Sam."*, *"I see a cat."*, *"The cat is on the bed."*, *"Tom has a red bag."*, *"We go to the park."*.
  - Gradually progresses to sight words, phonics patterns, simple present and past tenses, everyday vocabulary, and short dialogues.
- **Level 2: Intermediate (Lessons 36–70)**:
  - Longer, compound and complex sentences.
  - Topics: University life, campus dorms, coffee shop jobs, cooking dinner with roommates, train travel, budgeting, bike repairs, job interviews, and community projects.
- **Level 3: Advanced (Lessons 71–100)**:
  - Intricate sentence structures, nuanced vocabulary, idioms, and discourse.
  - Topics: High-stakes negotiation, habit formation neurobiology, artificial intelligence ethics, biophilic architecture, sleep consolidation, literature craft, and philosophy of mind.

### 2. Live Word-by-Word Sequence Alignment & Missing Space Indicators
- Uses a **Dynamic Programming sequence alignment algorithm** (Needleman-Wunsch variant) rather than naive index comparison.
- If a word is omitted or extra words are inserted, subsequent correct words do not cascade into false negatives.
- **Color rules**:
  - **Green**: Correct word.
  - **Red**: Incorrect word (displays the user's typed word; does *not* leak the correct spelling before submission).
  - **Missing Space `[ ___ ]`**: If you forget or skip a word in the sentence, a distinct missing space indicator `[ ___ ]` appears above in the feedback panel so you immediately know where a word was missed!
  - **Untyped words**: Completely invisible (no blank spots, dots, or underscores revealing word lengths).
  - Preserves punctuation and natural capitalization handling (case-insensitive by default).

### 3. Word-Chunk Dictation (3 Words at Once)
- Dictates **3 words at a time** by default!
- The teacher speaks 3 words → waits for you to write them → **only after you type them does the next 3 words sound**!
- You can customize the word chunk setting anytime in the top bar:
  - `1 word`, `2 words`, `3 words` (*Default*), `4 words`, or `Sentence` (full sentence mode).
- Press <kbd>Alt + R</kbd> or click *Replay 3 Words* to hear the active words again anytime.

### 4. Continuous Flow & Missing Space Indicators
- **Zero Interruption**: No intrusive popup dialogs or roadblocks.
- **Missing Space `[ ___ ]`**: If you forget or skip a word in the sentence, a distinct missing space indicator `[ ___ ]` appears above in the feedback panel so you immediately know where a word was missed.
- As you write, correct words turn green, incorrect words turn red, and untyped words remain invisible.
- Moving to the next sentence occurs automatically upon finishing or by pressing <kbd>Enter</kbd>.

### 5. Backend Server & Dual-Layer Persistence
- Full Node.js Express backend server (`server/index.js`) running on port `3001`.
- Automatically persists user progress, settings, and active lesson state to `server/data/`.
- Dual-layer persistence: updates locally in `localStorage` for instant offline responsiveness while automatically synchronizing with the backend REST API:
  - `GET /api/progress`, `POST /api/progress`
  - `GET /api/settings`, `POST /api/settings`
  - `GET /api/last-active`, `POST /api/last-active`
  - `POST /api/reset`

### 6. Keyboard Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Enter` | Start or resume dictation speech |
| `Escape` | Pause speech immediately |
| `Alt + R` | Replay current words |
| `Alt + ←` | Go to previous sentence |
| `Alt + →` | Skip to next sentence |
| `Enter` | Move to next sentence in story |
| `Ctrl + Backspace` | Clear typing box |
| `Ctrl + Shift + ↑` | Increase speech speed (+0.1×) |
| `Ctrl + Shift + ↓` | Decrease speech speed (-0.1×) |
- Includes a safe "Reset Progress" option with confirmation.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended, tested on v22)
- npm (v9 or higher)

### Installation
```bash
# Clone or navigate to the project directory
cd dictation

# Install dependencies
npm install
```

### Running the Application in Development Mode
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Unit Tests
```bash
npm test
```
Runs the 23 unit tests across sequence evaluation, sentence chunking, curriculum verification, storage persistence, and speech engine services.

### Building for Production
```bash
npm run build
```
Generates the optimized production build in `dist/` with on-demand code-splitting for all 100 lessons.

### Previewing Production Build
```bash
npm run preview
```

---

## Project Structure

```
dictation/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx             # Left lessons navigation & level accordion
│   │   ├── TopControlsBar.tsx      # Playback, speed, sentence progress controls
│   │   ├── FeedbackPanel.tsx       # Live word-by-word feedback (green/red/invisible)
│   │   ├── TypingPanel.tsx         # Comfortable textarea with focus retention
│   │   ├── SentenceReviewModal.tsx # Post-submission feedback & mistake breakdown
│   │   ├── LessonSummaryModal.tsx  # End-of-lesson completion report & stats
│   │   ├── ShortcutsModal.tsx      # Keyboard shortcuts cheat sheet
│   │   └── SettingsModal.tsx       # Voice, speed, repeats, auto-advance options
│   ├── data/
│   │   ├── lessons/                # 100 JSON lesson files (lesson-001.json to 100.json)
│   │   ├── lessonsManifest.json    # Metadata manifest for all 100 lessons
│   │   └── lessonsIndex.ts         # TypeScript dynamic loaders
│   ├── services/
│   │   ├── speechEngine.ts         # Web Speech API wrapper with chunking & repeat
│   │   └── storage.ts              # LocalStorage persistence service
│   ├── utils/
│   │   ├── chunker.ts              # Natural clause-based sentence chunking
│   │   └── evaluator.ts            # Dynamic programming word sequence alignment
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces and types
│   ├── App.tsx                     # Main application container
│   ├── index.css                   # Minimalist design matching sketch
│   └── main.tsx                    # React root mount
├── tests/
│   ├── chunker.test.ts             # Chunker unit tests
│   ├── curriculum.test.ts          # Validates all 100 lessons and word counts
│   ├── evaluator.test.ts           # Evaluator word-by-word alignment tests
│   ├── speechEngine.test.ts        # Speech engine methods and bounds tests
│   └── storage.test.ts             # LocalStorage serialization tests
├── scripts/
│   ├── generate_level1.py          # Level 1 lesson content generator
│   ├── generate_level2.py          # Level 2 lesson content generator
│   ├── generate_level3.py          # Level 3 lesson content generator
│   └── validate_and_build_manifest.py # Curriculum validator & manifest builder
├── package.json
├── tsconfig.json
└── vite.config.ts
```
