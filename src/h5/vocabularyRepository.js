import { normalizeVocabularyUnits, normalizeVocabularyWords } from '../shared/vocabulary.js';

const STORAGE_KEY = 'diandu:vocabulary-progress';

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export class VocabularyRepository {
  constructor(api) {
    this.api = api;
  }

  async getUnits(bookId) {
    const data = await this.api.getVocabularyUnits(bookId);
    return normalizeVocabularyUnits(data);
  }

  async getWords(unitId) {
    const data = await this.api.getVocabularyWords(unitId);
    return normalizeVocabularyWords(data);
  }

  async getProgress(bookId) {
    try {
      return await this.api.getVocabularyProgress(bookId);
    } catch {
      return Object.values(readProgress());
    }
  }

  async saveProgress(payload) {
    try {
      await this.api.saveVocabularyProgress(payload);
    } catch {
      const progress = readProgress();
      progress[payload.word_id] = {
        ...progress[payload.word_id],
        ...payload,
        last_studied_at: new Date().toISOString(),
      };
      writeProgress(progress);
    }
  }
}
