const app = getApp();
const api = require('../../utils/api');
const {
  StudyStep,
  buildChooseOptions,
  createStudySession,
  evaluateChoice,
  evaluateSpelling,
  getStudyResult,
} = require('../../utils/vocabulary');

Page({
  data: {
    words: [],
    session: null,
    word: null,
    options: [],
    choiceFeedback: null,
    spellingInput: '',
    spellingHint: '',
    result: null,
  },
  audio: null,
  onLoad() {
    const words = app.globalData.vocabularyWords || [];
    const session = createStudySession(words);
    this.audio = wx.createInnerAudioContext();
    this.setData({ words, session });
    this.refreshWord();
  },
  onUnload() {
    if (this.audio) this.audio.destroy();
  },
  refreshWord(extra = {}) {
    const session = extra.session || this.data.session;
    const word = this.data.words[session.currentIndex];
    this.setData({
      word,
      options: word ? buildChooseOptions(word, this.data.words) : [],
      choiceFeedback: null,
      spellingInput: '',
      spellingHint: '',
      ...extra,
    });
  },
  nextStep() {
    this.setData({ session: { ...this.data.session, step: StudyStep.choose } });
    this.refreshWord();
  },
  choose(event) {
    const index = Number(event.currentTarget.dataset.index);
    const selected = this.data.options[index];
    const passed = evaluateChoice(this.data.word, selected && selected.text);
    const session = this.updateCurrentResult({ choosePassed: passed, wrongCount: passed ? 0 : 1 });
    this.setData({ session, choiceFeedback: { index, passed } });
    setTimeout(() => {
      this.setData({ session: { ...this.data.session, step: StudyStep.spell }, choiceFeedback: null });
    }, 650);
  },
  updateCurrentResult(patch) {
    const word = this.data.word;
    const session = this.data.session;
    return {
      ...session,
      wordResults: session.wordResults.map((item) => (
        item.wordId === word.id ? { ...item, ...patch } : item
      )),
    };
  },
  inputSpell(event) {
    this.setData({ spellingInput: event.detail.value });
  },
  submitSpell() {
    const currentResult = this.data.session.wordResults.find((item) => item.wordId === this.data.word.id) || {};
    const checked = evaluateSpelling(this.data.word, this.data.spellingInput, currentResult.wrongCount || 0);
    if (!checked.correct) {
      this.setData({
        session: this.updateCurrentResult({ wrongCount: checked.hintLevel }),
        spellingHint: checked.hint,
      });
      return;
    }
    const session = this.updateCurrentResult({ spellPassed: true });
    api.saveVocabularyProgress({
      word_id: this.data.word.id,
      learned: true,
      choose_passed: Boolean(session.wordResults.find((item) => item.wordId === this.data.word.id).choosePassed),
      spell_passed: true,
      mastery: 100,
      wrong_count: session.wordResults.find((item) => item.wordId === this.data.word.id).wrongCount || 0,
    });
    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= this.data.words.length) {
      const finished = { ...session, finishedAt: Date.now() };
      this.setData({ session: finished, result: getStudyResult(finished) });
      return;
    }
    this.refreshWord({ session: { ...session, currentIndex: nextIndex, step: StudyStep.learn } });
  },
  play() {
    if (!this.data.word || !this.data.word.audioUrl) return;
    this.audio.stop();
    this.audio.src = this.data.word.audioUrl;
    this.audio.play();
  },
  continueReader() {
    const book = app.globalData.currentBook || {};
    const bookId = book.id || book.book_id;
    wx.redirectTo({
      url: `/pages/reader/reader?book_id=${bookId || ''}&page=${app.globalData.currentPage || 1}&end_page=${book.end_page || ''}&book_name=${encodeURIComponent(book.book_name || '')}`,
    });
  },
  goBack() {
    wx.navigateBack();
  },
});
