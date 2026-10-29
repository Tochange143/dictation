export interface PhonicHint {
  type: 'phonetic_match' | 'silent_letter' | 'vowel_pattern' | 'suffix_pattern' | 'soft_consonant';
  title: string;
  soundPattern: string;
  ruleExplanation: string;
  example: string;
}

/**
 * Common English sound-to-spelling patterns to help learners who write based on sound.
 */
export function getPhonicHint(typedRaw: string, expectedRaw: string): PhonicHint | null {
  const typed = typedRaw.trim().toLowerCase().replace(/[^a-z]/g, '');
  const expected = expectedRaw.trim().toLowerCase().replace(/[^a-z]/g, '');

  if (!typed || !expected || typed === expected) return null;

  // 1. Silent Initial 'k' before 'n' (e.g., now -> know, nee -> knee, nife -> knife)
  if (expected.startsWith('kn') && typed.startsWith('n') && expected.slice(2) === typed.slice(1)) {
    return {
      type: 'silent_letter',
      title: 'Silent "K" Letter Rule',
      soundPattern: '/n/ sound spelled "kn"',
      ruleExplanation: 'The sound /n/ at the beginning of this word starts with a silent "k" (like know, knee, knife).',
      example: `${expected} (not ${typed})`
    };
  }

  // 2. Silent Initial 'w' before 'r' (e.g., rite -> write, rong -> wrong, rap -> wrap)
  if (expected.startsWith('wr') && typed.startsWith('r') && expected.slice(2) === typed.slice(1)) {
    return {
      type: 'silent_letter',
      title: 'Silent "W" Letter Rule',
      soundPattern: '/r/ sound spelled "wr"',
      ruleExplanation: 'The sound /r/ at the beginning is spelled with a silent "w" before "r" (like write, wrong, wrap).',
      example: `${expected} (not ${typed})`
    };
  }

  // 3. /f/ sound spelled with 'ph' (e.g., fone -> phone, foto -> photo, fiziks -> physics)
  if (expected.includes('ph') && typed.includes('f')) {
    const replaced = typed.replace(/f/g, 'ph');
    if (replaced === expected || levenshteinDistance(replaced, expected) <= 1) {
      return {
        type: 'phonetic_match',
        title: '/f/ Sound Spelled "ph"',
        soundPattern: '/f/ sound written as "ph"',
        ruleExplanation: 'Great sound listening! In English words derived from Greek, the /f/ sound is written with "ph" instead of "f".',
        example: `${expected} (use "ph")`
      };
    }
  }

  // 4. /aɪt/ sound spelled 'ight' (e.g., nite -> night, lite -> light, fite -> fight, brite -> bright)
  if (expected.endsWith('ight') && (typed.endsWith('ite') || typed.endsWith('yte'))) {
    const baseExpected = expected.replace(/ight$/, '');
    const baseTyped = typed.replace(/y?te$/, '');
    if (baseExpected === baseTyped || levenshteinDistance(baseExpected, baseTyped) <= 1) {
      return {
        type: 'vowel_pattern',
        title: 'Long "I" Spelled "-ight"',
        soundPattern: 'Long /aɪt/ sound written as "-ight"',
        ruleExplanation: 'The long /aɪ/ sound before "t" is spelled with the silent "-igh-" pattern (like night, light, bright).',
        example: `${expected} (use "-ight")`
      };
    }
  }

  // 5. Silent 'b' (e.g., dum -> dumb, clime -> climb, thum -> thumb, det -> debt, dout -> doubt)
  if (expected.endsWith('mb') && (typed.endsWith('m') || typed.endsWith('me'))) {
    return {
      type: 'silent_letter',
      title: 'Silent "B" After "M"',
      soundPattern: 'Silent "b" at the end of word',
      ruleExplanation: 'After the letter "m" at the end of root words, the letter "b" is silent (like climb, dumb, thumb, comb).',
      example: `${expected} (has silent "b")`
    };
  }

  // 6. Soft "C" sounding like /s/ (e.g., sity -> city, sent -> cent, serkle -> circle, pensil -> pencil)
  if (expected.includes('c') && typed.includes('s')) {
    const sReplaced = typed.replace(/s/g, 'c');
    if (sReplaced === expected || levenshteinDistance(sReplaced, expected) <= 1) {
      return {
        type: 'soft_consonant',
        title: 'Soft "C" Rule (/s/ Sound)',
        soundPattern: '"c" sounds like /s/ before e, i, y',
        ruleExplanation: 'The letter "c" makes the soft /s/ sound when followed by "e", "i", or "y" (like city, center, circle).',
        example: `${expected} (spelled with "c")`
      };
    }
  }

  // 7. Soft "G" sounding like /j/ or /dʒ/ (e.g., jant -> giant, jym -> gym, oranj -> orange)
  if (expected.includes('g') && typed.includes('j')) {
    const jReplaced = typed.replace(/j/g, 'g');
    if (jReplaced === expected || levenshteinDistance(jReplaced, expected) <= 1) {
      return {
        type: 'soft_consonant',
        title: 'Soft "G" Rule (/j/ Sound)',
        soundPattern: '"g" sounds like /dʒ/ before e, i, y',
        ruleExplanation: 'The letter "g" often makes the soft /j/ sound before "e", "i", or "y" (like giant, gym, gentle).',
        example: `${expected} (spelled with "g")`
      };
    }
  }

  // 8. Suffix "-tion" or "-sion" (e.g., akshun -> action, nashun -> nation, vishun -> vision)
  if ((expected.endsWith('tion') || expected.endsWith('sion')) && (typed.endsWith('shun') || typed.endsWith('shen'))) {
    return {
      type: 'suffix_pattern',
      title: 'Noun Suffix "-tion" / "-sion"',
      soundPattern: '/ʃən/ sound written as "-tion" or "-sion"',
      ruleExplanation: 'The /ʃən/ ("shun") ending in English nouns is almost always spelled "-tion" or "-sion".',
      example: `${expected} (use "-tion")`
    };
  }

  // 9. Suffix "-ture" (e.g., pikcher -> picture, fuchur -> future, nacher -> nature)
  if (expected.endsWith('ture') && (typed.endsWith('cher') || typed.endsWith('chur'))) {
    return {
      type: 'suffix_pattern',
      title: 'Suffix "-ture" (/tʃər/ Sound)',
      soundPattern: '/tʃər/ sound written as "-ture"',
      ruleExplanation: 'The /tʃər/ ("cher") ending in Latin-derived words is spelled "-ture" (like picture, nature, future).',
      example: `${expected} (use "-ture")`
    };
  }

  // 10. Vowel Digraph "ea" vs "ee" (e.g., cleen -> clean, dreem -> dream, speek -> speak)
  if (expected.includes('ea') && typed.includes('ee')) {
    const eeReplaced = typed.replace(/ee/g, 'ea');
    if (eeReplaced === expected || levenshteinDistance(eeReplaced, expected) <= 1) {
      return {
        type: 'vowel_pattern',
        title: 'Vowel Team "ea" (Long /iː/ Sound)',
        soundPattern: 'Long "E" sound spelled "ea"',
        ruleExplanation: 'Both "ee" and "ea" make the long /iː/ sound. In this word, the vowel team "ea" is used (like clean, dream, speak).',
        example: `${expected} (use "ea")`
      };
    }
  }

  // 11. Vowel Digraph "ai" vs "a_e" / "ay" (e.g., trane -> train, wate -> wait, brane -> brain)
  if (expected.includes('ai') && (typed.includes('a') && typed.endsWith('e'))) {
    return {
      type: 'vowel_pattern',
      title: 'Vowel Digraph "ai" (Long /eɪ/ Sound)',
      soundPattern: 'Long "A" sound spelled "ai"',
      ruleExplanation: 'The long /eɪ/ sound in the middle of a syllable is often spelled with "ai" (like train, wait, rain).',
      example: `${expected} (use "ai")`
    };
  }

  // 12. Vowel Digraph "oa" vs "o_e" (e.g., bote -> boat, cote -> coat, sowp -> soap)
  if (expected.includes('oa') && (typed.includes('o') && typed.endsWith('e'))) {
    return {
      type: 'vowel_pattern',
      title: 'Vowel Team "oa" (Long /oʊ/ Sound)',
      soundPattern: 'Long "O" sound spelled "oa"',
      ruleExplanation: 'The long /oʊ/ sound in the middle of many words is written with "oa" (like boat, coat, road, soap).',
      example: `${expected} (use "oa")`
    };
  }

  // 13. Silent "W" in words like whole (hole -> whole), write (rite -> write), sword
  if (expected.startsWith('wh') && typed.startsWith('h')) {
    return {
      type: 'silent_letter',
      title: 'Silent "W" in "wh-"',
      soundPattern: '"wh-" sound pattern',
      ruleExplanation: 'Words like "whole", "who", and "whose" start with "wh-" where the "w" is silent.',
      example: `${expected} (starts with "wh")`
    };
  }

  // 14. Unstressed Schwa ending "-er" vs "-or" / "-ar" (e.g., docter -> doctor, grammer -> grammar)
  if ((expected.endsWith('or') || expected.endsWith('ar')) && typed.endsWith('er')) {
    const correctEnding = expected.endsWith('or') ? '-or' : '-ar';
    return {
      type: 'vowel_pattern',
      title: `Unstressed Ending "${correctEnding}"`,
      soundPattern: 'Schwa /ər/ sound',
      ruleExplanation: `Because English vowels weaken to /ər/ in unstressed syllables, this word is spelled with "${correctEnding}" instead of "-er".`,
      example: `${expected} (ends with "${correctEnding}")`
    };
  }

  // 15. General close phonetic match check (Levenshtein distance <= 2 with same first/last consonants)
  if (levenshteinDistance(typed, expected) <= 2 && typed.length >= 4) {
    return {
      type: 'phonetic_match',
      title: 'Close Phonetic Match',
      soundPattern: 'Sound approximation',
      ruleExplanation: 'You are very close to the sound! Notice the spelling pattern differences between your letters and the word.',
      example: `${expected} (you typed: ${typed})`
    };
  }

  return null;
}

/**
 * Split an English word into intuitive phonic syllables for "Sound It Out" practice.
 * e.g., 'beautiful' -> ['beau', 'ti', 'ful'], 'dictation' -> ['dic', 'ta', 'tion']
 */
export function syllabifyWord(rawWord: string): string[] {
  const clean = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return [rawWord];
  if (clean.length <= 3) return [clean];

  // Specific common educational syllable overrides
  const customSyllables: Record<string, string[]> = {
    beautiful: ['beau', 'ti', 'ful'],
    together: ['to', 'geth', 'er'],
    dictation: ['dic', 'ta', 'tion'],
    practice: ['prac', 'tice'],
    language: ['lan', 'guage'],
    listening: ['lis', 'ten', 'ing'],
    phonics: ['phon', 'ics'],
    alphabet: ['al', 'pha', 'bet'],
    elephant: ['el', 'e', 'phant'],
    picture: ['pic', 'ture'],
    important: ['im', 'por', 'tant'],
    different: ['dif', 'fer', 'ent'],
    remember: ['re', 'mem', 'ber'],
    sentence: ['sen', 'tence'],
    computer: ['com', 'pu', 'ter'],
    education: ['ed', 'u', 'ca', 'tion'],
    exercise: ['ex', 'er', 'cise'],
    tomorrow: ['to', 'mor', 'row'],
    yesterday: ['yes', 'ter', 'day'],
    afternoon: ['af', 'ter', 'noon']
  };

  if (customSyllables[clean]) {
    return customSyllables[clean];
  }

  // Algorithmic syllabification based on vowel nuclei and consonant clusters
  const vowels = 'aeiouy';
  const syllables: string[] = [];
  let current = '';

  for (let i = 0; i < clean.length; i++) {
    current += clean[i];
    const isVowel = vowels.includes(clean[i]);
    const nextChar = clean[i + 1];
    const nextIsVowel = nextChar ? vowels.includes(nextChar) : false;
    const charAfterNext = clean[i + 2];
    const afterNextIsVowel = charAfterNext ? vowels.includes(charAfterNext) : false;

    // Boundary conditions
    if (isVowel && nextChar && !nextIsVowel) {
      // If single consonant followed by vowel (V-CV): divide before consonant
      if (afterNextIsVowel && i + 2 < clean.length) {
        syllables.push(current);
        current = '';
      }
      // If two consonants followed by vowel (VC-CV): divide between consonants
      else if (charAfterNext && !afterNextIsVowel && clean[i + 3] && vowels.includes(clean[i + 3])) {
        current += nextChar;
        i++;
        syllables.push(current);
        current = '';
      }
    }
  }

  if (current) {
    if (syllables.length > 0 && current.length <= 1) {
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
  }

  return syllables.length > 0 ? syllables : [clean];
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}
