/**
 * Built-in English Learner Dictionary Service
 * Provides quick definitions, parts of speech, and pronunciations
 * without external network dependencies.
 */

export interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
}

const COMMON_DICTIONARY: Record<string, WordDefinition> = {
  // Lesson 1-5 core words
  'cat': { word: 'cat', phonetic: '/kæt/', partOfSpeech: 'noun', definition: 'A small domesticated carnivorous mammal with soft fur and retractable claws.', example: 'The cat is sitting on the mat.' },
  'mat': { word: 'mat', phonetic: '/mæt/', partOfSpeech: 'noun', definition: 'A piece of fabric or coarse material placed on a floor.', example: 'Wipe your shoes on the mat.' },
  'rug': { word: 'rug', phonetic: '/rʌɡ/', partOfSpeech: 'noun', definition: 'A floor covering of thick woven material, smaller than a carpet.', example: 'The red mat is on the rug.' },
  'fat': { word: 'fat', phonetic: '/fæt/', partOfSpeech: 'adjective', definition: 'Having a large amount of excess flesh; plump or thick.', example: 'The fat cat sat on a mat.' },
  'boy': { word: 'boy', phonetic: '/bɔɪ/', partOfSpeech: 'noun', definition: 'A male child or young man.', example: 'I am a boy named Sam.' },
  'pet': { word: 'pet', phonetic: '/pɛt/', partOfSpeech: 'noun', definition: 'A domestic animal kept for companionship or pleasure.', example: 'The dog is my favorite pet.' },
  'sun': { word: 'sun', phonetic: '/sʌn/', partOfSpeech: 'noun', definition: 'The star around which the earth orbits, providing light and heat.', example: 'The sun is hot today.' },
  'sky': { word: 'sky', phonetic: '/skaɪ/', partOfSpeech: 'noun', definition: 'The region of the atmosphere and outer space seen from the earth.', example: 'The sun is up in the sky.' },
  'cap': { word: 'cap', phonetic: '/kæp/', partOfSpeech: 'noun', definition: 'A kind of soft, flat hat, typically with a visor.', example: 'Sam has a blue cap.' },
  'bed': { word: 'bed', phonetic: '/bɛd/', partOfSpeech: 'noun', definition: 'A piece of furniture for sleep or rest.', example: 'The cat ran to the bed.' },
  'hot': { word: 'hot', phonetic: '/hɒt/', partOfSpeech: 'adjective', definition: 'Having a high degree of heat or a high temperature.', example: 'The summer day is hot.' },
  'red': { word: 'red', phonetic: '/rɛd/', partOfSpeech: 'adjective', definition: 'Of a color at the end of the spectrum, like blood or a ruby.', example: 'She has a red pen.' },
  'pen': { word: 'pen', phonetic: '/pɛn/', partOfSpeech: 'noun', definition: 'An instrument for writing or drawing with ink.', example: 'Write with a blue pen.' },
  'box': { word: 'box', phonetic: '/bɒks/', partOfSpeech: 'noun', definition: 'A container with flat sides and a lid.', example: 'Put the toys in the box.' },
  'dog': { word: 'dog', phonetic: '/dɒɡ/', partOfSpeech: 'noun', definition: 'A domesticated carnivorous mammal with keen sense of smell.', example: 'The dog barked at the ball.' },
  'hop': { word: 'hop', phonetic: '/hɒp/', partOfSpeech: 'verb', definition: 'To spring or leap on one foot or with all feet at once.', example: 'The frog can hop far.' },
  'sit': { word: 'sit', phonetic: '/sɪt/', partOfSpeech: 'verb', definition: 'To rest with the torso vertical and the body supported on the buttocks.', example: 'Sit on the comfortable chair.' },
  'run': { word: 'run', phonetic: '/rʌn/', partOfSpeech: 'verb', definition: 'To move at a speed faster than a walk.', example: 'Children run in the playground.' },
  'see': { word: 'see', phonetic: '/siː/', partOfSpeech: 'verb', definition: 'To perceive with the eyes; observe visually.', example: 'I see a bird in the tree.' },
  'rest': { word: 'rest', phonetic: '/rɛst/', partOfSpeech: 'verb', definition: 'To cease work or movement in order to relax or sleep.', example: 'We rest after a long day.' },
  'cup': { word: 'cup', phonetic: '/kʌp/', partOfSpeech: 'noun', definition: 'A small bowl-shaped container for drinking from.', example: 'A cup of hot tea.' },
  'tea': { word: 'tea', phonetic: '/tiː/', partOfSpeech: 'noun', definition: 'A hot drink made by infusing dried crushed leaves in boiling water.', example: 'She drinks tea every morning.' },
  'milk': { word: 'milk', phonetic: '/mɪlk/', partOfSpeech: 'noun', definition: 'An opaque white fluid rich in fat and protein secreted by mammals.', example: 'The kitten drinks warm milk.' },
  'park': { word: 'park', phonetic: '/pɑːrk/', partOfSpeech: 'noun', definition: 'A large public green area in a town used for recreation.', example: 'We walk in the park on Sundays.' },
  'fun': { word: 'fun', phonetic: '/fʌn/', partOfSpeech: 'noun', definition: 'Enjoyment, amusement, or lighthearted pleasure.', example: 'Reading stories is lots of fun.' },

  // Intermediate core words
  'family': { word: 'family', phonetic: '/ˈfæməli/', partOfSpeech: 'noun', definition: 'A group of one or more parents and their children living together.', example: 'My family enjoys dinner together.' },
  'friend': { word: 'friend', phonetic: '/frɛnd/', partOfSpeech: 'noun', definition: 'A person whom one knows and with whom one has a bond of mutual affection.', example: 'A true friend is always supportive.' },
  'school': { word: 'school', phonetic: '/skuːl/', partOfSpeech: 'noun', definition: 'An institution for educating children or learners.', example: 'Students walk to school in the morning.' },
  'teacher': { word: 'teacher', phonetic: '/ˈtiːtʃər/', partOfSpeech: 'noun', definition: 'A person who teaches, especially in a school or university.', example: 'The teacher explained the lesson clearly.' },
  'student': { word: 'student', phonetic: '/ˈstjuːdənt/', partOfSpeech: 'noun', definition: 'A person who is studying at a school, college, or university.', example: 'Every student practiced typing.' },
  'library': { word: 'library', phonetic: '/ˈlaɪbrəri/', partOfSpeech: 'noun', definition: 'A building or room containing collections of books and periodicals.', example: 'Quiet study is respected in the library.' },
  'morning': { word: 'morning', phonetic: '/ˈmɔːrnɪŋ/', partOfSpeech: 'noun', definition: 'The period of time between sunrise and noon.', example: 'The crisp morning air felt refreshing.' },
  'evening': { word: 'evening', phonetic: '/ˈiːvnɪŋ/', partOfSpeech: 'noun', definition: 'The period of time at the end of the day, usually from about 6 PM to bedtime.', example: 'They read together in the evening.' },
  'weather': { word: 'weather', phonetic: '/ˈwɛðər/', partOfSpeech: 'noun', definition: 'The state of the atmosphere at a place and time regarding heat, cloudiness, or rain.', example: 'The weather is pleasant and sunny.' },
  'travel': { word: 'travel', phonetic: '/ˈtrævəl/', partOfSpeech: 'verb', definition: 'To make a journey, typically of some length or abroad.', example: 'They love to travel to historic cities.' },
  'journey': { word: 'journey', phonetic: '/ˈdʒɜːrni/', partOfSpeech: 'noun', definition: 'An act of traveling from one place to another.', example: 'A journey of a thousand miles begins with a single step.' },
  'practice': { word: 'practice', phonetic: '/ˈpræktɪs/', partOfSpeech: 'noun / verb', definition: 'Repeated exercise in an activity or skill to acquire or maintain proficiency.', example: 'Daily dictation practice builds confidence.' },
  'language': { word: 'language', phonetic: '/ˈlæŋɡwɪdʒ/', partOfSpeech: 'noun', definition: 'The system of communication used by a particular community or country.', example: 'English is a global language of communication.' },
  'sentence': { word: 'sentence', phonetic: '/ˈsɛntəns/', partOfSpeech: 'noun', definition: 'A set of words that is complete in itself, conveying a statement, question, or command.', example: 'Write a complete sentence with proper punctuation.' },
  'progress': { word: 'progress', phonetic: '/ˈprɒɡrɛs/', partOfSpeech: 'noun', definition: 'Forward movement toward a destination or toward achieving a goal.', example: 'You have made steady progress in dictation.' },

  // Advanced core words
  'accurate': { word: 'accurate', phonetic: '/ˈækjərət/', partOfSpeech: 'adjective', definition: 'Correct in all details; exact and free from error.', example: 'Accurate spelling reflects careful attention.' },
  'fluency': { word: 'fluency', phonetic: '/ˈfluːənsi/', partOfSpeech: 'noun', definition: 'The ability to speak or write a foreign language easily and accurately.', example: 'Consistent listening practice accelerates speech fluency.' },
  'vocabulary': { word: 'vocabulary', phonetic: '/vəˈkæbjʊləri/', partOfSpeech: 'noun', definition: 'The body of words known to an individual person or used in a particular language.', example: 'Expanding your vocabulary enriches writing.' },
  'comprehension': { word: 'comprehension', phonetic: '/ˌkɒmprɪˈhɛnʃən/', partOfSpeech: 'noun', definition: 'The ability to understand something completely.', example: 'Reading aloud improves auditory comprehension.' },
  'negotiation': { word: 'negotiation', phonetic: '/nɪˌɡoʊʃiˈeɪʃən/', partOfSpeech: 'noun', definition: 'Discussion aimed at reaching an agreement between different parties.', example: 'Tactful negotiation requires active listening.' },
  'perspective': { word: 'perspective', phonetic: '/pərˈspɛktɪv/', partOfSpeech: 'noun', definition: 'A particular attitude toward or way of regarding something; a point of view.', example: 'Traveling broadens your cultural perspective.' },
  'eloquent': { word: 'eloquent', phonetic: '/ˈɛləkwənt/', partOfSpeech: 'adjective', definition: 'Fluent or persuasive in speaking or writing.', example: 'She delivered an eloquent and inspiring keynote.' },
  'discernment': { word: 'discernment', phonetic: '/dɪˈsɜːrnmənt/', partOfSpeech: 'noun', definition: 'The ability to judge well and distinguish subtle differences.', example: 'Intellectual discernment guides wise decisions.' },
  'curiosity': { word: 'curiosity', phonetic: '/ˌkjʊəriˈɒsɪti/', partOfSpeech: 'noun', definition: 'A strong desire to know or learn something new.', example: 'Lifelong curiosity fuels continuous personal growth.' }
};

export function lookupWord(rawWord: string): WordDefinition {
  const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) {
    return {
      word: rawWord,
      partOfSpeech: 'word',
      definition: 'A unit of language, consisting of one or more spoken sounds or written representations.'
    };
  }

  // Exact match
  if (COMMON_DICTIONARY[clean]) {
    return COMMON_DICTIONARY[clean];
  }

  // Common morphological fallbacks
  if (clean.endsWith('ing')) {
    const b1 = clean.slice(0, -3);
    const b2 = b1.length >= 3 && b1[b1.length - 1] === b1[b1.length - 2] ? b1.slice(0, -1) : b1;
    const base = COMMON_DICTIONARY[b1] || COMMON_DICTIONARY[b2];
    if (base) {
      return {
        word: clean,
        partOfSpeech: 'verb (present participle)',
        definition: `The continuous action of ${base.word}: ${base.definition.toLowerCase()}`,
        example: base.example
      };
    }
  }

  if (clean.endsWith('ed')) {
    const b1 = clean.slice(0, -2);
    const b2 = b1.length >= 3 && b1[b1.length - 1] === b1[b1.length - 2] ? b1.slice(0, -1) : b1;
    const base = COMMON_DICTIONARY[b1] || COMMON_DICTIONARY[b2];
    if (base) {
      return {
        word: clean,
        partOfSpeech: 'verb (past tense)',
        definition: `Past form of ${base.word}: performed the action of ${base.definition.toLowerCase()}`,
        example: base.example
      };
    }
  }

  if (clean.endsWith('s') && COMMON_DICTIONARY[clean.slice(0, -1)]) {
    const base = COMMON_DICTIONARY[clean.slice(0, -1)];
    return {
      word: clean,
      partOfSpeech: base.partOfSpeech.includes('noun') ? 'noun (plural)' : 'verb (3rd person)',
      definition: base.definition,
      example: base.example
    };
  }

  // General helpful phonetic & lexical decomposition
  return {
    word: clean,
    partOfSpeech: 'vocabulary word',
    definition: `An English word found in this lesson. Practice listening to its pronunciation and spelling.`,
    example: `Pay close attention to how "${clean}" is pronounced by the teacher.`
  };
}
