export const StudyStep = {
  learn: 'learn',
  read: 'read',
  choose: 'choose',
  split: 'split',
  blend: 'blend',
  spell: 'spell',
};

export const ACTIVE_STUDY_FLOW = [StudyStep.learn, StudyStep.choose, StudyStep.spell];

function arrayFrom(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUrl(value) {
  return value ? String(value).replace(/\\\//g, '/') : '';
}

export function normalizeVocabularyUnits(data = []) {
  return arrayFrom(data).map((item) => ({
    id: item.id ?? item.unit_id,
    title: item.title || item.unit_name || item.name || `Unit ${item.id ?? item.unit_id}`,
    raw: item,
  }));
}

export function normalizeVocabularyWords(data = []) {
  return arrayFrom(data)
    .map((item) => ({
      id: item.id,
      bookId: item.book_id,
      unitId: item.unit_id,
      word: item.word || '',
      phonetic: item.phonetic || '',
      meaning: item.meaning || '',
      audioUrl: normalizeUrl(item.audio_url),
      exampleEn: item.example_en || '',
      exampleCn: item.example_cn || '',
      imageUrl: normalizeUrl(item.image_url),
      sort: Number(item.sort || 0),
      raw: item,
    }))
    .sort((a, b) => a.sort - b.sort || Number(a.id || 0) - Number(b.id || 0));
}

export function createStudySession(words = [], now = Date.now()) {
  return {
    flow: ACTIVE_STUDY_FLOW,
    step: StudyStep.learn,
    currentIndex: 0,
    startedAt: now,
    finishedAt: null,
    wordResults: normalizeVocabularyWords(words).map((word) => ({
      wordId: word.id,
      choosePassed: false,
      spellPassed: false,
      wrongCount: 0,
    })),
  };
}

export function buildChooseOptions(word, allWords = []) {
  const distractors = normalizeVocabularyWords(allWords)
    .filter((item) => item.id !== word.id && item.meaning)
    .slice(0, 2)
    .map((item) => ({ text: item.meaning, correct: false }));
  return [{ text: word.meaning, correct: true }, ...distractors].slice(0, 3);
}

export function evaluateChoice(word, selectedMeaning) {
  return String(selectedMeaning || '').trim() === String(word.meaning || '').trim();
}

export function getVisibleSpellingHint(answer, hintLevel = 0) {
  const letters = String(answer || '').split('');
  if (hintLevel <= 0) return '';
  if (hintLevel === 1) return letters[0] || '';
  if (hintLevel === 2) return letters.map((letter, index) => (index === 0 ? letter : '_')).join(' ');
  return String(answer || '');
}

export function evaluateSpelling(word, input, wrongCount = 0) {
  const correct = String(input || '').trim().toLowerCase() === String(word.word || '').trim().toLowerCase();
  if (correct) return { correct: true, hintLevel: 0, hint: '' };
  const hintLevel = Math.min(3, Number(wrongCount || 0) + 1);
  return { correct: false, hintLevel, hint: getVisibleSpellingHint(word.word, hintLevel) };
}

export function getStudyResult(session = {}) {
  const results = arrayFrom(session.wordResults);
  const total = results.length;
  const passed = results.reduce((sum, item) => (
    sum + (item.choosePassed ? 1 : 0) + (item.spellPassed ? 1 : 0)
  ), 0);
  const possible = total * 2;
  const correctRate = possible ? Math.round((passed / possible) * 100) : 0;
  const durationMs = Number(session.finishedAt || Date.now()) - Number(session.startedAt || Date.now());
  return {
    total,
    correctRate,
    durationMinutes: Math.max(1, Math.round(durationMs / 60000)),
  };
}
