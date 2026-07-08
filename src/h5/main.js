import { createH5Api } from '../shared/api.js';
import { buildTapRegions, normalizeAudioItems } from '../shared/coordinate.js';
import './styles.css';

const PREVIEW_BOOK = { id: 103, book_name: '预览教材', start_page: 1 };
const api = createH5Api();
const audio = new Audio();
const app = document.querySelector('#app');

const state = {
  view: 'home',
  loading: false,
  error: '',
  home: null,
  books: [],
  chapters: [],
  currentBook: null,
  currentPage: 1,
  readerPages: [],
  tapRegions: [],
  selectedAudio: '',
};

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function normalizeUrl(value) {
  if (!value) return '';
  return String(value).replace(/\\\//g, '/');
}

function getBookFromHome(data) {
  return normalizeBook(data?.info || data?.book || data?.pg || null);
}

function getPageFromHome(data) {
  return Number(data?.view_page || data?.cur_page || data?.pg?.cur_page || data?.info?.cur_page || 1) || 1;
}

function getBookId(book) {
  return book?.id || book?.book_id || '';
}

function normalizeBook(book) {
  if (!book) return null;
  const id = getBookId(book);
  return id ? { ...book, id } : book;
}

async function run(task) {
  setState({ loading: true, error: '' });
  try {
    await task();
  } catch (error) {
    setState({ error: error.message || '请求失败' });
  } finally {
    setState({ loading: false });
  }
}

async function loadHome() {
  await run(async () => {
    const data = await api.index();
    const currentBook = getBookFromHome(data) || PREVIEW_BOOK;
    setState({
      view: 'home',
      home: data,
      currentBook,
      currentPage: getPageFromHome(data),
    });
  });
}

async function loadBooks() {
  await run(async () => {
    const data = await api.booklist({ cat_id: 7, type: 0 });
    const books = firstArray(data?.list, data?.books, data);
    setState({ view: 'books', books });
  });
}

async function selectBook(book) {
  await run(async () => {
    const data = await api.updateuserbook(book.id);
    const currentBook = normalizeBook({ ...book, ...(data?.info || {}) });
    const currentPage = Number(data?.view_page || data?.cur_page || currentBook.start_page || 1) || 1;
    setState({
      view: 'home',
      currentBook,
      currentPage,
      chapters: [],
      readerPages: [],
      tapRegions: [],
    });
  });
}

async function loadChapters(book = state.currentBook) {
  const bookId = getBookId(book);
  if (!bookId) {
    await loadBooks();
    return;
  }
  await run(async () => {
    const data = await api.bookchapter(bookId);
    const chapters = firstArray(data?.chapers, data?.chapters, data?.list, data);
    setState({ view: 'chapters', currentBook: normalizeBook(book), chapters });
  });
}

async function loadReader(book = state.currentBook || PREVIEW_BOOK, page = state.currentPage || 1) {
  const bookId = getBookId(book);
  if (!bookId) {
    await loadBooks();
    return;
  }
  await run(async () => {
    const data = await api.bookpage(bookId, page);
    const nestedPages = Array.isArray(data?.pages?.pages) ? data.pages.pages : null;
    const pages = firstArray(nestedPages, data?.pages, data?.list);
    const normalizedPages = pages.map((item) => ({
      ...item,
      bg_img: normalizeUrl(item.bg_img),
      word_mp3: normalizeAudioItems(item.word_mp3),
    }));
    const nextPage = Number(normalizedPages[0]?.c_page || page) || 1;
    setState({
      view: 'reader',
      currentBook: normalizeBook(book),
      currentPage: nextPage,
      readerPages: normalizedPages,
      tapRegions: [],
    });
  });
}

async function savePage(page) {
  const bookId = getBookId(state.currentBook);
  if (!bookId) return;
  try {
    await api.updatebookpage(bookId, page);
  } catch {
    // H5 preview keeps reading usable even if anonymous progress saving fails.
  }
}

function playRegion(index) {
  const region = state.tapRegions[index];
  if (!region?.audioUrl) return;
  audio.pause();
  audio.onended = null;
  audio.src = normalizeUrl(region.audioUrl);
  audio.play().catch(() => setState({ error: '音频播放失败，请再点一次' }));
  state.selectedAudio = region.audioUrl;
  renderTapLayer();
}

window.diandu = {
  loadHome,
  loadBooks,
  selectBookById(id) {
    const book = state.books.find((item) => String(item.id) === String(id));
    if (book) selectBook(book);
  },
  loadChapters,
  openChapter(index) {
    const chapter = state.chapters[index];
    const page = Number(chapter?.start_page || 1) || 1;
    loadReader(state.currentBook, page);
  },
  loadReader,
  nextPage() {
    const next = state.currentPage + 1;
    savePage(next);
    loadReader(state.currentBook, next);
  },
  prevPage() {
    const prev = Math.max(1, state.currentPage - 1);
    savePage(prev);
    loadReader(state.currentBook, prev);
  },
  replay() {
    if (audio.src) audio.play().catch(() => setState({ error: '音频播放失败，请再点一次' }));
  },
  playAll() {
    playRegionQueue(0);
  },
  playRegion,
};

function playRegionQueue(index) {
  const region = state.tapRegions[index];
  if (!region?.audioUrl) return;
  audio.pause();
  audio.src = normalizeUrl(region.audioUrl);
  audio.onended = () => playRegionQueue(index + 1);
  audio.play().catch(() => setState({ error: '连读播放失败，请再试一次' }));
  state.selectedAudio = region.audioUrl;
  renderTapLayer();
}

function renderShell(content) {
  app.innerHTML = `
    <main class="phone">
      ${state.loading ? '<div class="toast">加载中...</div>' : ''}
      ${state.error ? `<button class="toast error" onclick="diandu.loadHome()">${escapeHtml(state.error)}</button>` : ''}
      ${content}
    </main>
  `;
}

function renderHome() {
  const book = state.currentBook || {};
  const cover = normalizeUrl(book.book_img || book.bookurl || '');
  renderShell(`
    <section class="hero">
      <div class="topbar">
        <h1>英语点读助手</h1>
        <button onclick="diandu.loadBooks()">切换教材</button>
      </div>
      <div class="book-card">
        ${cover ? `<img src="${cover}" alt="${escapeHtml(book.book_name)}" />` : '<div class="cover-empty">请选择教材</div>'}
        <strong>${escapeHtml(book.book_name || '请选择教材')}</strong>
        <span>已学 ${escapeHtml(state.currentPage || 1)} 页</span>
      </div>
      <button class="primary" onclick="diandu.loadReader()">开始点读</button>
    </section>
    <section class="panel">
      <h2>音标学习</h2>
      <div class="quick-grid">
        <button>音标点读</button>
        <button>字母点读</button>
        <button>自然拼读</button>
      </div>
    </section>
  `);
}

function renderBooks() {
  renderShell(`
    <header class="nav"><button onclick="diandu.loadHome()">‹</button><strong>选择教材</strong><span></span></header>
    <section class="book-grid">
      ${state.books.map((book) => {
        const cover = normalizeUrl(book.book_img || book.bookurl || '');
        return `
          <button class="book-option" onclick="diandu.selectBookById('${book.id}')">
            ${cover ? `<img src="${cover}" alt="${escapeHtml(book.book_name)}" />` : '<div class="cover-empty small">暂无封面</div>'}
            <span>${escapeHtml(book.book_name)}</span>
          </button>
        `;
      }).join('')}
    </section>
  `);
}

function renderChapters() {
  renderShell(`
    <header class="nav"><button onclick="diandu.loadHome()">‹</button><strong>目录</strong><span></span></header>
    <section class="chapter-list">
      ${state.chapters.map((chapter, index) => `
        <button onclick="diandu.openChapter(${index})">
          <span>${escapeHtml(chapter.chapter_name || `第 ${index + 1} 课`)}</span>
          <small>${escapeHtml(chapter.start_page || '')}-${escapeHtml(chapter.end_page || '')}</small>
        </button>
      `).join('')}
    </section>
  `);
}

function firstPage() {
  return state.readerPages[0] || null;
}

function renderReader() {
  const page = firstPage();
  const bookName = state.currentBook?.book_name || '五年级上册';
  renderShell(`
    <header class="reader-nav">
      <button class="back-button" onclick="diandu.loadHome()" aria-label="返回">‹</button>
      <strong>点读学习</strong>
      <div class="mini-capsule" aria-label="小程序菜单">
        <span>•••</span><i></i><b></b><em></em>
      </div>
    </header>
    <div class="reader-meta">
      <span>${escapeHtml(bookName)}</span>
      <button onclick="diandu.loadChapters()">目录 ›</button>
    </div>
    <section class="reader">
      ${page?.bg_img ? `
        <div class="page-wrap">
          <img id="pageImage" src="${normalizeUrl(page.bg_img)}" alt="课本页面" />
          <div id="tapLayer" class="tap-layer"></div>
        </div>
      ` : '<div class="missing-page">暂无页面图片</div>'}
    </section>
    <footer class="reader-controls">
      <button class="tool-button" onclick="diandu.replay()"><span class="tool-icon">↻</span><small>复读</small></button>
      <button class="promo-button" onclick="diandu.replay()"><span class="promo-face"></span><small>免费领英语资料</small></button>
      <button class="tool-button" onclick="diandu.playAll()"><span class="tool-icon">☵</span><small>连读</small></button>
    </footer>
  `);

  queueMicrotask(() => attachTapLayer(page));
}

function attachTapLayer(page) {
  const img = document.querySelector('#pageImage');
  if (!img || !page) return;
  const update = () => {
    const rect = img.getBoundingClientRect();
    state.tapRegions = buildTapRegions(page, {
      left: 0,
      top: 0,
      width: rect.width,
      height: rect.height,
    });
    renderTapLayer();
  };
  if (img.complete) update();
  img.addEventListener('load', update, { once: true });
}

function renderTapLayer() {
  const layer = document.querySelector('#tapLayer');
  if (!layer) return;
  layer.innerHTML = state.tapRegions.map((region, index) => `
    <button
      class="tap-region${region.audioUrl === state.selectedAudio ? ' active' : ''}"
      style="left:${region.rect.left}px;top:${region.rect.top}px;width:${region.rect.width}px;height:${region.rect.height}px"
      onclick="diandu.playRegion(${index})"
      aria-label="${escapeHtml(region.text || '播放音频')}"
    ></button>
  `).join('');
}

function render() {
  if (state.view === 'books') renderBooks();
  else if (state.view === 'chapters') renderChapters();
  else if (state.view === 'reader') renderReader();
  else renderHome();
}

loadHome();
