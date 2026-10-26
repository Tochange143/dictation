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

def build_lesson(num, title, level, level_name, desc, sentences_pool):
    # Select sentences until word count is strictly between 960 and 1030 words
    selected = []
    cur_words = 0
    
    for s in sentences_pool:
        s = s.strip()
        if not s:
            continue
        cnt = count_words(s)
        if cur_words + cnt <= 1040:
            selected.append(s)
            cur_words += cnt
        elif cur_words >= 950:
            break
            
    if cur_words < 950:
        raise ValueError(f"Lesson {num} ({title}) has only {cur_words} words, needed >= 950")
    if cur_words > 1050:
        raise ValueError(f"Lesson {num} ({title}) has {cur_words} words, exceeded 1050")

    lesson_sentences = []
    for idx, s in enumerate(selected):
        lesson_sentences.append({
            "id": f"s-{num}-{idx+1}",
            "text": s,
            "chunks": chunk_sentence(s, max_words=15)
        })

    lesson_obj = {
        "id": num,
        "title": title,
        "level": level,
        "levelName": level_name,
        "description": desc,
        "wordCount": cur_words,
        "sentences": lesson_sentences
    }

    fname = f"lesson-{num:03d}.json"
    with open(os.path.join(LESSONS_DIR, fname), 'w', encoding='utf-8') as f:
        json.dump(lesson_obj, f, indent=2, ensure_ascii=False)

    return {
        "id": num,
        "title": title,
        "level": level,
        "levelName": level_name,
        "description": desc,
        "wordCount": cur_words,
        "sentenceCount": len(lesson_sentences),
        "fileName": fname
    }
