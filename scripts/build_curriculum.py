#!/usr/bin/env python3
import os
import json
import re

LESSONS_DIR = "/home/nika/dictation/src/data/lessons"
os.makedirs(LESSONS_DIR, exist_ok=True)

def count_words(text):
    return len(re.findall(r'\b[a-zA-Z0-9_\'-]+\b', text))

def split_into_sentences(text):
    raw = re.split(r'(?<=[.!?])\s+', text.strip())
    res = []
    for s in raw:
        s = s.strip()
        if s:
            res.append(s)
    return res

def chunk_sentence(sentence, max_words=15):
    words = sentence.split()
    if len(words) <= max_words:
        return [sentence]
    
    parts = re.split(r'([,;:—])\s*', sentence)
    clauses = []
    i = 0
    while i < len(parts):
        chunk = parts[i]
        delim = parts[i+1] if i + 1 < len(parts) else ""
        combined = (chunk + delim).strip()
        if combined:
            clauses.append(combined)
        i += 2
        
    chunks = []
    current = []
    for clause in clauses:
        c_words = clause.split()
        if current and len(current) + len(c_words) > max_words:
            chunks.append(" ".join(current))
            current = []
        if len(c_words) > max_words:
            sub = c_words
            while len(sub) > max_words:
                chunks.append(" ".join(sub[:max_words]))
                sub = sub[max_words:]
            if sub:
                current.extend(sub)
        else:
            current.extend(c_words)
    if current:
        chunks.append(" ".join(current))
    return chunks if chunks else [sentence]

# Import or define the lesson specs
from lessons_data import ALL_LESSON_SPECS

print(f"Total lesson specs loaded: {len(ALL_LESSON_SPECS)}")

manifest = []

for spec in ALL_LESSON_SPECS:
    num = spec['id']
    title = spec['title']
    level = spec['level']
    level_name = spec['levelName']
    desc = spec['description']
    text = spec['text'].strip()

    # Verify and adjust word count to exactly 950-1050 range
    sentences = split_into_sentences(text)
    
    # Process into lesson sentences with chunks
    lesson_sentences = []
    for idx, s in enumerate(sentences):
        chunks = chunk_sentence(s, max_words=15)
        lesson_sentences.append({
            "id": f"s-{num}-{idx+1}",
            "text": s,
            "chunks": chunks
        })

    total_words = count_words(" ".join(s['text'] for s in lesson_sentences))
    
    lesson_obj = {
        "id": num,
        "title": title,
        "level": level,
        "levelName": level_name,
        "description": desc,
        "wordCount": total_words,
        "sentences": lesson_sentences
    }

    filename = f"lesson-{num:03d}.json"
    filepath = os.path.join(LESSONS_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(lesson_obj, f, indent=2, ensure_ascii=False)

    manifest.append({
        "id": num,
        "title": title,
        "level": level,
        "levelName": level_name,
        "description": desc,
        "wordCount": total_words,
        "sentenceCount": len(lesson_sentences),
        "fileName": filename
    })

print("Writing manifest and index...")
manifest_path = "/home/nika/dictation/src/data/lessonsManifest.json"
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

# Generate TypeScript index that allows loading
ts_index_content = """import manifestData from './lessonsManifest.json';
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

// Dynamic importer for individual lessons to optimize memory and load time
const lessonModules = import.meta.glob<Lesson>('./lessons/lesson-*.json', { eager: false, import: 'default' });

export async function fetchLessonById(id: number): Promise<Lesson> {
  const padId = String(id).padStart(3, '0');
  const path = `./lessons/lesson-${padId}.json`;
  const loader = lessonModules[path];
  if (!loader) {
    throw new Error(`Lesson ${id} not found at ${path}`);
  }
  const lesson = await loader();
  return lesson;
}

export function getLessonSummary(id: number): LessonSummary | undefined {
  return LESSON_MANIFEST.find(l => l.id === id);
}
"""

with open("/home/nika/dictation/src/data/lessonsIndex.ts", 'w', encoding='utf-8') as f:
    f.write(ts_index_content)

print(f"Successfully generated {len(manifest)} lessons!")
# Verify words range
out_of_range = [m for m in manifest if m['wordCount'] < 950 or m['wordCount'] > 1050]
if out_of_range:
    print(f"WARNING: {len(out_of_range)} lessons out of 950-1050 range:")
    for m in out_of_range:
        print(f"  Lesson {m['id']}: {m['wordCount']} words")
else:
    print("ALL 100 LESSONS ARE STRICTLY WITHIN 950-1050 WORDS!")
