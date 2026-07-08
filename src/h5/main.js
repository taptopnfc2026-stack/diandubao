import { createH5Api } from '../shared/api.js';
import { buildTapRegions } from '../shared/coordinate.js';
import {
  flattenPhonicsGroups,
  getFirstAudioUrl,
  normalizeAlphabetLetters,
  normalizePhoneticDetail,
  normalizePhoneticList,
  normalizePhonicsDetail,
} from '../shared/learning.js';
import { getNextPageNumber, getSwipePageDelta, selectReaderPage } from '../shared/navigation.js';
import './styles.css';

const PREVIEW_BOOK = { id: 103, book_name: '预览教材', start_page: 1 };
const api = createH5Api();
const audio = new Audio();
const app = document.querySelector('#app');
const swipe = {
  startX: 0,
  startY: 0,
  started: false,
  lastTouchAt: 0,
};

const state = {
  view: 'home',
  loading: false,
  error: '',
  home: null,
  categories: [],
  activeCatId: 7,
  books: [],
  chapters: [],
  currentBook: null,
  currentPage: 1,
  readerPages: [],
  tapRegions: [],
  selectedAudio: '',
  phoneticTabs: [],
  activePhoneticType: 0,
  phoneticItemsByType: {},
  phoneticDetail: null,
  alphabetLetters: [],
  phonicsGroups: [],
  phonicsDetail: null,
  phonicsPeerItems: [],
  activePhonicsTab: 'mouth',
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

async function loadBooks(catId = state.currentBook?.cat_id || state.activeCatId || 7) {
  await run(async () => {
    const data = await api.booklist({ cat_id: catId, type: 0 });
    const categories = firstArray(data?.cates, state.categories);
    const books = firstArray(data?.books, data?.list, data);
    setState({
      view: 'books',
      categories,
      activeCatId: catId,
      books,
    });
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
    }));
    const selectedPage = selectReaderPage(normalizedPages, page);
    const nextPage = Number(selectedPage?.c_page || page) || 1;
    setState({
      view: 'reader',
      currentBook: normalizeBook(book),
      currentPage: nextPage,
      readerPages: selectedPage ? [selectedPage] : [],
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

function playAudioUrl(url) {
  if (!url) return;
  audio.pause();
  audio.onended = null;
  audio.src = normalizeUrl(url);
  audio.play().catch(() => setState({ error: '音频播放失败，请再点一次' }));
}

async function loadPhonetics(type = state.activePhoneticType || 0) {
  await run(async () => {
    const data = await api.getfayinlist();
    const normalized = normalizePhoneticList(data);
    setState({
      view: 'phonetics',
      phoneticTabs: normalized.tabs,
      activePhoneticType: Number(type),
      phoneticItemsByType: normalized.itemsByType,
    });
  });
}

async function openPhoneticDetail(id) {
  await run(async () => {
    const data = await api.getfayindetail(id);
    setState({ view: 'phoneticDetail', phoneticDetail: normalizePhoneticDetail(data) });
  });
}

async function loadAlphabet() {
  await run(async () => {
    const data = await api.getfayin();
    setState({ view: 'alphabet', alphabetLetters: normalizeAlphabetLetters(data) });
  });
}

async function loadPhonics() {
  await run(async () => {
    const data = await api.getpindu();
    setState({ view: 'phonics', phonicsGroups: flattenPhonicsGroups(data?.list || data), phonicsDetail: null });
  });
}

function getPhonicsPeers(id, typeKey = '') {
  const selectedGroup = state.phonicsGroups.find((group) => (
    String(group.key) === String(typeKey)
    || group.items.some((item) => String(item.id) === String(id))
  ));
  return selectedGroup?.items || state.phonicsGroups.flatMap((group) => group.items);
}

async function openPhonicsDetail(id, typeKey = '') {
  await run(async () => {
    const data = await api.getpindudetail(id);
    setState({
      view: 'phonicsDetail',
      phonicsDetail: normalizePhonicsDetail(data),
      phonicsPeerItems: getPhonicsPeers(id, typeKey),
      activePhonicsTab: 'mouth',
    });
  });
}

function getReaderMaxPage() {
  const max = Number(state.currentBook?.end_page);
  return Number.isFinite(max) && max > 0 ? max : Infinity;
}

function changeReaderPage(delta) {
  const nextPage = getNextPageNumber(state.currentPage, delta, { min: 1, max: getReaderMaxPage() });
  if (nextPage === state.currentPage) return;
  savePage(nextPage);
  loadReader(state.currentBook, nextPage);
}

function getEventPoint(event, key = 'touches') {
  const point = event[key]?.[0] || event;
  return { x: point.clientX, y: point.clientY };
}

window.diandu = {
  loadHome,
  loadBooks,
  selectCategory(id) {
    loadBooks(Number(id));
  },
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
    changeReaderPage(1);
  },
  prevPage() {
    changeReaderPage(-1);
  },
  swipeStart(event) {
    if (event.type === 'mousedown' && Date.now() - swipe.lastTouchAt < 700) return;
    if (event.type === 'mousedown' && event.button !== 0) return;
    const point = getEventPoint(event);
    swipe.startX = point.x;
    swipe.startY = point.y;
    swipe.started = true;
  },
  swipeEnd(event) {
    if (!swipe.started) return;
    if (event.type === 'touchend') swipe.lastTouchAt = Date.now();
    const point = getEventPoint(event, 'changedTouches');
    const delta = getSwipePageDelta({ x: swipe.startX, y: swipe.startY }, point);
    swipe.started = false;
    if (delta) changeReaderPage(delta);
  },
  replay() {
    if (audio.src) audio.play().catch(() => setState({ error: '音频播放失败，请再点一次' }));
  },
  playAll() {
    playRegionQueue(0);
  },
  playRegion,
  loadPhonetics,
  selectPhoneticTab(type) {
    setState({ activePhoneticType: Number(type) });
  },
  openPhoneticDetail,
  playPhoneticDetail(kind = 0) {
    playAudioUrl(state.phoneticDetail?.audioUrls?.[Number(kind)] || state.phoneticDetail?.audioUrls?.[0]);
  },
  loadAlphabet,
  playAlphabet(index) {
    playAudioUrl(state.alphabetLetters[Number(index)]?.audioUrl);
  },
  loadPhonics,
  openPhonicsDetail,
  selectPhonicsDetailTab(tab) {
    setState({ activePhonicsTab: tab });
  },
  playPhonicsDetail(url = '') {
    playAudioUrl(url || state.phonicsDetail?.audioUrl);
  },
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
        <button onclick="diandu.loadPhonetics()">音标点读</button>
        <button onclick="diandu.loadAlphabet()">字母点读</button>
        <button onclick="diandu.loadPhonics()">自然拼读</button>
      </div>
    </section>
  `);
}

function renderPhonetics() {
  const type = Number(state.activePhoneticType || 0);
  const items = state.phoneticItemsByType[type] || [];
  renderShell(`
    <header class="reader-nav compact-nav">
      <button class="back-button" onclick="diandu.loadHome()" aria-label="返回">‹</button>
      <strong>音标练习</strong>
      <div class="mini-capsule" aria-label="小程序菜单"><span>•••</span><i></i><b></b><em></em></div>
    </header>
    <div class="learning-tabs">
      ${state.phoneticTabs.map((tab) => `
        <button class="${Number(tab.id) === type ? 'active' : ''}" onclick="diandu.selectPhoneticTab(${tab.id})">${escapeHtml(tab.name)}</button>
      `).join('')}
    </div>
    <section class="phonetic-grid">
      ${items.map((item) => `
        <button class="phonetic-card" onclick="diandu.openPhoneticDetail(${item.id})">
          <strong>${escapeHtml(item.symbol)}</strong>
          <span>${escapeHtml(item.subtitle)}</span>
        </button>
      `).join('')}
    </section>
  `);
}

function renderPhoneticDetail() {
  const detail = state.phoneticDetail || {};
  renderShell(`
    <header class="reader-nav compact-nav">
      <button class="back-button" onclick="diandu.loadPhonetics()" aria-label="返回">‹</button>
      <strong>${escapeHtml(detail.symbol || '音标')}</strong>
      <div class="mini-capsule" aria-label="小程序菜单"><span>•••</span><i></i><b></b><em></em></div>
    </header>
    <section class="phonetic-detail">
      <strong class="detail-symbol">${escapeHtml(detail.symbol || '')}</strong>
      <span>${escapeHtml(detail.subtitle || '')}</span>
      <div class="audio-actions">
        <button onclick="diandu.playPhoneticDetail(0)">▶</button>
        <button onclick="diandu.playPhoneticDetail(1)">↻</button>
      </div>
      ${detail.image ? `
        <figure>
          <img src="${normalizeUrl(detail.image)}" alt="${escapeHtml(detail.symbol || '发音口型')}" />
          <figcaption>/${escapeHtml(detail.symbol || '')}/</figcaption>
        </figure>
      ` : ''}
      ${detail.explain ? `<p>${escapeHtml(detail.explain)}</p>` : ''}
    </section>
  `);
}

function renderAlphabet() {
  renderShell(`
    <header class="reader-nav compact-nav">
      <button class="back-button" onclick="diandu.loadHome()" aria-label="返回">‹</button>
      <strong>26个字母发音</strong>
      <div class="mini-capsule" aria-label="小程序菜单"><span>•••</span><i></i><b></b><em></em></div>
    </header>
    <section class="alphabet-grid">
      ${state.alphabetLetters.map((item, index) => `
        <button onclick="diandu.playAlphabet(${index})">
          ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" />` : `<strong>${escapeHtml(item.title)}</strong>`}
        </button>
      `).join('')}
    </section>
  `);
}

function renderPhonics() {
  renderShell(`
    <header class="phonics-hero">
      <button class="back-button" onclick="diandu.loadHome()" aria-label="返回">‹</button>
      <div>
        <strong>自然拼读速记营</strong>
        <span>匹配新课标要求，见字能读听音能写</span>
      </div>
    </header>
    <section class="phonics-panel">
      ${state.phonicsGroups.map((group) => `
        <div class="phonics-group">
          <h2>${escapeHtml(group.title)}</h2>
          <div class="phonics-chip-grid">
            ${group.items.map((item) => `<button onclick="diandu.openPhonicsDetail(${item.id}, '${escapeHtml(group.key)}')">${escapeHtml(item.name)}</button>`).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `);
}

function renderPhonicsDetailContent(detail) {
  if (state.activePhonicsTab === 'word') {
    return `
      <section class="phonics-list">
        ${detail.words.length ? detail.words.map((item) => `
          <article class="phonics-word-card">
            ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.text)}" />` : ''}
            <div>
              <strong>${escapeHtml(item.text)}</strong>
              <button onclick="diandu.playPhonicsDetail('${escapeHtml(item.audioUrl)}')">播放</button>
            </div>
          </article>
        `).join('') : '<p class="empty-text">暂无例词</p>'}
      </section>
    `;
  }

  if (state.activePhonicsTab === 'sentence') {
    return `
      <section class="phonics-list">
        ${detail.sentences.length ? detail.sentences.map((item) => `
          <article class="phonics-sentence-card">
            <strong>${escapeHtml(item.text)}</strong>
            ${item.translation ? `<span>${escapeHtml(item.translation)}</span>` : ''}
            <div>
              ${item.audioUrls.map((url, index) => `<button onclick="diandu.playPhonicsDetail('${escapeHtml(url)}')">${index === 0 ? '男声' : '女声'}</button>`).join('')}
            </div>
          </article>
        `).join('') : '<p class="empty-text">暂无例句</p>'}
      </section>
    `;
  }

  return `
    <section class="mouth-panel">
      <div class="mouth-figure">
        ${detail.image ? `<img src="${detail.image}" alt="${escapeHtml(detail.selectedPhonetic || detail.name)}" />` : ''}
        <button class="floating-audio" onclick="diandu.playPhonicsDetail()" aria-label="播放发音">▶</button>
      </div>
      <button class="method-pill">发音方法</button>
      <div class="step-list">
        ${detail.mouthSteps.length ? detail.mouthSteps.map((step, index) => `
          <article class="step-card">
            <strong>第${index + 1}步</strong>
            <p>${escapeHtml(step.text)}</p>
          </article>
        `).join('') : '<p class="empty-text">暂无发音方法</p>'}
      </div>
    </section>
  `;
}

function renderPhonicsDetail() {
  const detail = state.phonicsDetail || {};
  const selectedId = String(detail.id || '');
  const tabs = [
    ['mouth', '口型'],
    ['word', '例词'],
    ['sentence', '例句'],
  ];
  renderShell(`
    <header class="reader-nav compact-nav">
      <button class="back-button" onclick="diandu.loadPhonics()" aria-label="返回">‹</button>
      <strong>自然拼读</strong>
      <div class="mini-capsule" aria-label="小程序菜单"><span>•••</span><i></i><b></b><em></em></div>
    </header>
    <section class="phonics-detail-head">
      <div class="phonics-scroll-row">
        ${state.phonicsPeerItems.map((item) => `
          <button
            class="${String(item.id) === selectedId ? 'active' : ''}"
            onclick="diandu.openPhonicsDetail(${item.id}, '${escapeHtml(item.typeKey || '')}')"
          >${escapeHtml(item.name)}</button>
        `).join('')}
        <span>展开⌄</span>
      </div>
      ${detail.selectedPhonetic ? `<b>${escapeHtml(detail.selectedPhonetic)}</b>` : ''}
    </section>
    <section class="phonics-detail-body">
      <div class="detail-tabs">
        ${tabs.map(([key, label]) => `
          <button class="${state.activePhonicsTab === key ? 'active' : ''}" onclick="diandu.selectPhonicsDetailTab('${key}')">${label}</button>
        `).join('')}
      </div>
      ${renderPhonicsDetailContent(detail)}
    </section>
  `);
}

function renderBooks() {
  const activeCatId = Number(state.activeCatId || state.categories[0]?.id || 7);
  const selectedBookId = String(getBookId(state.currentBook));
  renderShell(`
    <header class="nav book-nav"><button onclick="diandu.loadHome()">‹</button><strong>选择教材</strong><span></span></header>
    <section class="book-picker">
      <aside class="category-list">
        ${state.categories.map((category) => `
          <button
            class="${Number(category.id) === activeCatId ? 'active' : ''}"
            onclick="diandu.selectCategory('${category.id}')"
          >${escapeHtml(category.name)}</button>
        `).join('')}
      </aside>
      <div class="book-panel">
        <h2>${escapeHtml(state.categories.find((item) => Number(item.id) === activeCatId)?.name || '教材')}</h2>
        <div class="book-grid">
          ${state.books.map((book) => {
            const cover = normalizeUrl(book.book_img || book.bookurl || '');
            const selected = String(getBookId(book)) === selectedBookId;
            return `
              <button class="book-option${selected ? ' selected' : ''}" onclick="diandu.selectBookById('${getBookId(book)}')">
                <span class="cover-frame">
                  ${cover ? `<img src="${cover}" alt="${escapeHtml(book.book_name)}" />` : '<span class="cover-empty small">暂无封面</span>'}
                  ${selected ? '<i class="checkmark">✓</i>' : ''}
                </span>
                <span>${escapeHtml(book.book_name)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
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
        <div
          class="page-wrap"
          ontouchstart="diandu.swipeStart(event)"
          ontouchend="diandu.swipeEnd(event)"
          onmousedown="diandu.swipeStart(event)"
          onmouseup="diandu.swipeEnd(event)"
        >
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
  else if (state.view === 'phonetics') renderPhonetics();
  else if (state.view === 'phoneticDetail') renderPhoneticDetail();
  else if (state.view === 'alphabet') renderAlphabet();
  else if (state.view === 'phonics') renderPhonics();
  else if (state.view === 'phonicsDetail') renderPhonicsDetail();
  else renderHome();
}

loadHome();
