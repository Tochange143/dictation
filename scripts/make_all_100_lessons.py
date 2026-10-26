#!/usr/bin/env python3
"""
Generator for all 100 Dictation Lessons.
Ensures every lesson has:
- Unique title
- Correct difficulty level (1-35: Beginner, 36-70: Intermediate, 71-100: Advanced)
- Meaningful story, dialogue, and natural progression
- Word count strictly between 950 and 1050 words
- Properly split sentences and TTS chunks
"""

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

def finalize_lesson(num, title, level, level_name, desc, raw_story_sentences):
    # Ensure word count is strictly between 950 and 1050 words
    selected_sentences = []
    cur_count = 0
    
    for s in raw_story_sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        sc = count_words(s_clean)
        if cur_count + sc <= 1045:
            selected_sentences.append(s_clean)
            cur_count += sc
        else:
            # We reached near the limit
            if cur_count >= 950:
                break
    
    # If still below 950, check and print
    if cur_count < 950:
        raise ValueError(f"Lesson {num} has only {cur_count} words! Needs at least 950.")
    if cur_count > 1050:
        raise ValueError(f"Lesson {num} has {cur_count} words! Exceeds 1050.")

    lesson_sentences = []
    for idx, s in enumerate(selected_sentences):
        chunks = chunk_sentence(s, max_words=15)
        lesson_sentences.append({
            "id": f"s-{num}-{idx+1}",
            "text": s,
            "chunks": chunks
        })

    lesson_obj = {
        "id": num,
        "title": title,
        "level": level,
        "levelName": level_name,
        "description": desc,
        "wordCount": cur_count,
        "sentences": lesson_sentences
    }

    filename = f"lesson-{num:03d}.json"
    filepath = os.path.join(LESSONS_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(lesson_obj, f, indent=2, ensure_ascii=False)

    return {
        "id": num,
        "title": title,
        "level": level,
        "levelName": level_name,
        "description": desc,
        "wordCount": cur_count,
        "sentenceCount": len(lesson_sentences),
        "fileName": filename
    }
