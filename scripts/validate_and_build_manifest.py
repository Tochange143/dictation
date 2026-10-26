#!/usr/bin/env python3
import os
import json

LESSONS_DIR = "/home/nika/dictation/src/data/lessons"
MANIFEST_PATH = "/home/nika/dictation/src/data/lessonsManifest.json"
INDEX_TS_PATH = "/home/nika/dictation/src/data/lessonsIndex.ts"

manifest = []
errors = []

for num in range(1, 101):
    fname = f"lesson-{num:03d}.json"
    fpath = os.path.join(LESSONS_DIR, fname)
    if not os.path.exists(fpath):
        errors.append(f"Missing file: {fname}")
        continue
    
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Validate schema
    if data.get('id') != num:
        errors.append(f"{fname}: ID mismatch (got {data.get('id')}, expected {num})")
    
    wc = data.get('wordCount', 0)
    if wc < 950 or wc > 1050:
        errors.append(f"{fname}: Word count out of bounds ({wc} words, must be 950-1050)")

    sentences = data.get('sentences', [])
    if len(sentences) == 0:
        errors.append(f"{fname}: No sentences found")

    manifest.append({
        "id": num,
        "title": data.get('title', ''),
        "level": data.get('level', 1),
        "levelName": data.get('levelName', 'Beginner'),
        "description": data.get('description', ''),
        "wordCount": wc,
        "sentenceCount": len(sentences),
        "fileName": fname
    })

if errors:
    print(f"Validation FAILED with {len(errors)} errors:")
    for err in errors:
        print(" - " + err)
    exit(1)

print(f"SUCCESS: All 100 lessons validated!")
print(f"Total word count: {sum(m['wordCount'] for m in manifest):,} words")
print(f"Total sentences: {sum(m['sentenceCount'] for m in manifest):,} sentences")
print(f"Min word count: {min(m['wordCount'] for m in manifest)}")
print(f"Max word count: {max(m['wordCount'] for m in manifest)}")

# Write manifest
with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

ts_content = """import manifestData from './lessonsManifest.json';
import { Lesson } from '../types';

export interface LessonSummary {
  id: number;
  title: string;
  level: 1 | 2 | 3;
  levelName: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  wordCount: number;
  sentenceCount: number;
  fileName: string;
}

export const LESSON_MANIFEST: LessonSummary[] = manifestData as LessonSummary[];

// Vite dynamic glob import for on-demand lazy loading of lessons
const lessonModules = import.meta.glob<{ default: Lesson }>('./lessons/lesson-*.json');

export async function fetchLessonById(id: number): Promise<Lesson> {
  const padId = String(id).padStart(3, '0');
  const path = `./lessons/lesson-${padId}.json`;
  const loader = lessonModules[path];
  if (!loader) {
    throw new Error(`Lesson ${id} not found at ${path}`);
  }
  const module = await loader();
  return module.default;
}

export function getLessonSummary(id: number): LessonSummary | undefined {
  return LESSON_MANIFEST.find(l => l.id === id);
}
"""

with open(INDEX_TS_PATH, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Wrote manifest ({MANIFEST_PATH}) and TypeScript index ({INDEX_TS_PATH})")
