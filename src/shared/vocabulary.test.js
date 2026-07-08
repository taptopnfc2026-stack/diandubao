import { describe, expect, it } from 'vitest';
import {
  StudyStep,
  buildChooseOptions,
  createStudySession,
  evaluateChoice,
  evaluateSpelling,
  getStudyResult,
  getVisibleSpellingHint,
  normalizeVocabularyUnits,
  normalizeVocabularyWords,
} from './vocabulary.js';

const words = [
  { id: 1, word: 'name', phonetic: '[neɪm]', meaning: '名字；名称', sort: 1 },
  { id: 2, word: 'nice', phonetic: '[naɪs]', meaning: '友好的', sort: 2 },
  { id: 3, word: 'family', phonetic: '[ˈfæməli]', meaning: '家庭', sort: 3 },
];

describe('vocabulary helpers', () => {
  it('normalizes units and words for textbook vocabulary', () => {
    expect(normalizeVocabularyUnits([{ unit_id: 1, unit_name: 'Unit 1' }]))
      .toEqual([{ id: 1, title: 'Unit 1', raw: { unit_id: 1, unit_name: 'Unit 1' } }]);

    expect(normalizeVocabularyWords(words)[0]).toMatchObject({
      id: 1,
      word: 'name',
      phonetic: '[neɪm]',
      meaning: '名字；名称',
    });
  });

  it('creates a learn choose spell study session', () => {
    const session = createStudySession(words, 1000);

    expect(session.step).toBe(StudyStep.learn);
    expect(session.currentIndex).toBe(0);
    expect(session.flow).toEqual([StudyStep.learn, StudyStep.choose, StudyStep.spell]);
  });

  it('builds deterministic choose options and checks answers', () => {
    const options = buildChooseOptions(words[0], words);

    expect(options).toHaveLength(3);
    expect(options.some((item) => item.correct && item.text === '名字；名称')).toBe(true);
    expect(evaluateChoice(words[0], '名字；名称')).toBe(true);
    expect(evaluateChoice(words[0], '苹果')).toBe(false);
  });

  it('evaluates spelling with progressive hints', () => {
    expect(evaluateSpelling(words[0], 'Name')).toEqual({ correct: true, hintLevel: 0, hint: '' });
    expect(evaluateSpelling(words[0], 'nam', 0)).toEqual({ correct: false, hintLevel: 1, hint: 'n' });
    expect(getVisibleSpellingHint('name', 2)).toBe('n _ _ _');
    expect(getVisibleSpellingHint('name', 3)).toBe('name');
  });

  it('summarizes result statistics', () => {
    const result = getStudyResult({
      startedAt: 1000,
      finishedAt: 301000,
      wordResults: [
        { wordId: 1, choosePassed: true, spellPassed: true, wrongCount: 0 },
        { wordId: 2, choosePassed: false, spellPassed: true, wrongCount: 1 },
      ],
    });

    expect(result).toEqual({ total: 2, correctRate: 75, durationMinutes: 5 });
  });
});
