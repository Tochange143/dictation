#!/usr/bin/env python3
import os
import json
import re

LESSONS_DIR = "/home/nika/dictation/src/data/lessons"
os.makedirs(LESSONS_DIR, exist_ok=True)

def word_count(text):
    return len(re.findall(r'\b[a-zA-Z0-9_\'-]+\b', text))

def split_sentences(text):
    # Regex split on sentence endings preserving punctuation
    raw_sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    cleaned = []
    for s in raw_sentences:
        s = s.strip()
        if s:
            cleaned.append(s)
    return cleaned

def chunk_sentence(sentence, max_words=15):
    words = sentence.split()
    if len(words) <= max_words:
        return [sentence]
    
    # Split by punctuation clauses
    clause_parts = re.split(r'([,;:—])\s*', sentence)
    clauses = []
    i = 0
    while i < len(clause_parts):
        part = clause_parts[i]
        punct = clause_parts[i+1] if i + 1 < len(clause_parts) else ""
        combined = (part + punct).strip()
        if combined:
            clauses.append(combined)
        i += 2
        
    chunks = []
    current_words = []
    
    for clause in clauses:
        clause_words = clause.split()
        if current_words and len(current_words) + len(clause_words) > max_words:
            chunks.append(" ".join(current_words))
            current_words = []
            
        if len(clause_words) > max_words:
            # Sub-break long clause
            sub_words = clause_words
            while len(sub_words) > max_words:
                chunks.append(" ".join(sub_words[:max_words]))
                sub_words = sub_words[max_words:]
            if sub_words:
                current_words.extend(sub_words)
        else:
            current_words.extend(clause_words)
            
    if current_words:
        chunks.append(" ".join(current_words))
        
    return chunks if chunks else [sentence]

def adjust_text_to_target_words(text_paragraphs, target_min=950, target_max=1050):
    full_text = " ".join(text_paragraphs)
    words = full_text.split()
    count = len(words)
    
    # If within range, return paragraphs
    if target_min <= count <= target_max:
        return full_text
        
    # If too short, we need expansion sentences; if too long, trim
    sentences = split_sentences(full_text)
    
    # Recalculate
    running = []
    cur_count = 0
    for s in sentences:
        s_count = len(s.split())
        if cur_count + s_count <= target_max:
            running.append(s)
            cur_count += s_count
        else:
            break
            
    return " ".join(running)

print("Helper functions ready")
