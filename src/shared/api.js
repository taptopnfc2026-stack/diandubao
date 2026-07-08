const MINI_BASE = 'https://diandu.xiongmaoxiazai.com';
const H5_BASE = import.meta.env.PROD ? MINI_BASE : '';

const previewBook = {
  book_id: 10168,
  book_name: '三年级上册',
  book_img: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/fengm/mymgw.jpg?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075876688&Signature=UqGaOel63EmWVpAEGeRZtiZZh6U%3D',
  cat_id: 7,
  start_page: 2,
  end_page: 90,
};

const previewChapters = [
  { id: 1125906, book_id: 10168, chapter_name: 'Unit 2 Different families', start_page: 14, end_page: 25 },
  { id: 1125907, book_id: 10168, chapter_name: 'What makes a family?', start_page: 14, end_page: 15 },
  { id: 1125908, book_id: 10168, chapter_name: 'Part A Who lives with you?', start_page: 16, end_page: 18 },
  { id: 1125909, book_id: 10168, chapter_name: 'Part B How are families different?', start_page: 19, end_page: 21 },
  { id: 1125910, book_id: 10168, chapter_name: 'Part C', start_page: 22, end_page: 25 },
];

const previewPhonetics = {
  cate: [{ id: 0, name: '元音' }, { id: 1, name: '辅音' }],
  list: [
    { id: 1, content: 'æ', combination: 'a', type: 0 },
    { id: 2, content: 'i', combination: 'i/y', type: 0 },
    { id: 3, content: 'i:', combination: 'ea/ee/ie/ei', type: 0 },
    { id: 25, content: 'p', combination: 'p/pp', type: 1 },
    { id: 26, content: 'b', combination: 'b/bb', type: 1 },
    { id: 27, content: 't', combination: 't/tt', type: 1 },
  ],
};

const previewAlphabet = [
  { id: 1, title: 'Aa', pic: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/pblc/A.png?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2076314472&Signature=c7on2ZFszlUYpwk406Zg1rXXaEE%3D', mp3: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/pblc/A.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2076314472&Signature=Gm8fbD1QcRZ7xdHcHn2ZF6ue400%3D' },
  { id: 2, title: 'Bb', pic: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/pblc/B.png?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2076314563&Signature=pYhvpF3JfFrdW7lBFFEdqsXYO48%3D', mp3: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/pblc/B.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2076314563&Signature=n2RDc%2FevQ3u%2FHVTqhzQGTKCCCdg%3D' },
  { id: 3, title: 'Cc', pic: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/pblc/C.png?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2076314563&Signature=U21d7kxkoHxMZK9xBEuej9CYji8%3D', mp3: '' },
];

const previewPhonics = {
  list: {
    1: [{ id: 1, name: 'a' }, { id: 2, name: 'e' }, { id: 3, name: 'i' }, { id: 4, name: 'o' }, { id: 5, name: 'u' }, { id: 23, name: 'y' }],
    2: [{ id: 6, name: 'b' }, { id: 7, name: 'c' }, { id: 8, name: 'd' }, { id: 9, name: 'f' }, { id: 10, name: 'g' }, { id: 11, name: 'h' }],
    3: [{ id: 27, name: 'aw' }, { id: 28, name: 'ai' }, { id: 29, name: 'ay' }, { id: 33, name: 'ee' }, { id: 34, name: 'ea' }],
  },
};

const previewPhonicsDetail = {
  details: {
    id: 9,
    zimu: 'f',
    c_type: 2,
    bg_img: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/read/shpimg_f.jpg?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2077580465&Signature=tvb8Sn7oMPUHpnIfqqwIi837oaU%3D',
    video_url: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/read/shpyp_f.mp4?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2077580465&Signature=8kVyNhw%2Fpb4kNuJGvCUJUIyXseA%3D',
    other_info: { 27: '[f]' },
    yinbiao: {
      id: 27,
      fy: '[f]',
      other_info: {
        image: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/readyb/fy_27.gif?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2077598294&Signature=utXzf8JLkcjmixGaE6%2F9n1JBP%2Bc%3D',
        sound: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/readyb/fy_27.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2077598294&Signature=bRJ7AGQpBSlwKgB%2FyD8B7xGetns%3D',
        mouth: [
          { id: 758, step_content: '上齿放在下唇的偏内侧，但不要咬唇。' },
          { id: 759, step_content: '同时，下唇向内收，轻触上齿，形成轻微的阻塞。' },
          { id: 760, step_content: '气流从唇齿间摩擦通过，声带不振动。' },
        ],
        word: [
          { id: 173, word: 'fat   [fæt]   adj.肥胖的', sound: '', image: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/readyb/wd_173.jpg?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2077598294&Signature=fMWGt4rmap0C44wocUBZe362mh0%3D' },
          { id: 174, word: 'fish   [fɪʃ]   n.鱼', sound: '', image: '' },
        ],
        sentence: [
          { id: 10751, sentence: 'That fat boy is my friend.', sound_man: '', sound_woman: '', translation: '那个胖胖的小男孩是我的朋友。' },
        ],
      },
    },
  },
};

const previewVocabularyUnits = [
  { id: 1, unit_id: 1, unit_name: 'Unit 1' },
  { id: 2, unit_id: 2, unit_name: 'Unit 2' },
  { id: 3, unit_id: 3, unit_name: 'Unit 3' },
];

const previewVocabularyWords = [
  { id: 1001, book_id: 10168, unit_id: 1, word: 'name', phonetic: '[neɪm]', meaning: '名字；名称', audio_url: '', example_en: 'What is your name?', example_cn: '你叫什么名字？', image_url: '', sort: 1 },
  { id: 1002, book_id: 10168, unit_id: 1, word: 'nice', phonetic: '[naɪs]', meaning: '友好的', audio_url: '', example_en: 'Nice to meet you.', example_cn: '很高兴见到你。', image_url: '', sort: 2 },
  { id: 1003, book_id: 10168, unit_id: 1, word: 'family', phonetic: '[ˈfæməli]', meaning: '家庭', audio_url: '', example_en: 'I love my family.', example_cn: '我爱我的家人。', image_url: '', sort: 3 },
  { id: 1004, book_id: 10168, unit_id: 1, word: 'friend', phonetic: '[frend]', meaning: '朋友', audio_url: '', example_en: 'She is my friend.', example_cn: '她是我的朋友。', image_url: '', sort: 4 },
  { id: 1005, book_id: 10168, unit_id: 2, word: 'share', phonetic: '[ʃeə]', meaning: '分享', audio_url: '', example_en: 'We share books.', example_cn: '我们分享书。', image_url: '', sort: 1 },
  { id: 1006, book_id: 10168, unit_id: 2, word: 'apple', phonetic: '[ˈæpl]', meaning: '苹果', audio_url: '', example_en: 'This is an apple.', example_cn: '这是一个苹果。', image_url: '', sort: 2 },
];

const previewPages = [
  {
    id: 1016814,
    book_id: 10168,
    c_page: 14,
    bg_img: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/bg/8/mymgw/mymgw_14_0_a5a8c56b012544d8226673ce84d1a666.png?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075878204&Signature=mTO5JH%2Bc9n8diELWBa1zu4Riigk%3D',
    word_mp3: {
      a1371275: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/14_1371275.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=3L%2F6pORCpqHl5xs8Zpc%2Fljwp2bQ%3D',
      a1371276: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/14_1371276.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=2HpmMm7q3f0UD3BbyemxljnHrZ0%3D',
    },
    other_info: {
      pieces: [
        { pieceId: 1371275, original: 'Unit 2 Different families', coordinate: { x: 0.07149, y: 0.0613, width: 0.79771, height: 0.1667 } },
        { pieceId: 1371276, original: 'What makes a family?', coordinate: { x: 0.16587, y: 0.25728, width: 0.5489, height: 0.05714 } },
      ],
    },
  },
  {
    id: 1016819,
    book_id: 10168,
    c_page: 19,
    bg_img: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/bg/8/mymgw/mymgw_19_0_d5fff40cca2acc1b28c47b4f41272484.png?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075878204&Signature=MVDa%2BbEC1FfxLkwLHGIUYWa5nF0%3D',
    word_mp3: {
      a1371491: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/19_1371491.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=kNGvOTDtSSvT8gykZynNRWvuNYo%3D',
      a1371492: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/19_1371492.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=tcplwHVTjL2MbA5GQmKatXCn1wI%3D',
      a1371493: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/19_1371493.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=9yWjULgpPLuOrrPvPiMcx%2BZoshM%3D',
      a1371494: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/19_1371494.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=McwxFTxpc7n7CO0xK7vEj%2ByzfAg%3D',
    },
    other_info: {
      pieces: [
        { pieceId: 1371491, original: 'B How are families different?', coordinate: { x: 0.10309, y: 0.05175, width: 0.71763, height: 0.04969 } },
        { pieceId: 1371492, original: "Let's talk", coordinate: { x: 0.1092, y: 0.13749, width: 0.32851, height: 0.04517 } },
        { pieceId: 1371493, original: 'Sarah, you have a big family. Is this your sister?', coordinate: { x: 0.11775, y: 0.19038, width: 0.32194, height: 0.10795 } },
        { pieceId: 1371494, original: "No, it's my cousin.", coordinate: { x: 0.58973, y: 0.34265, width: 0.30236, height: 0.05387 } },
      ],
    },
  },
  {
    id: 1016820,
    book_id: 10168,
    c_page: 20,
    bg_img: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/bg/8/mymgw/mymgw_20_0_e2a6365b1f2e78d9acc3cced63f5c204.png?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075878204&Signature=iYPXZ5XcEIr7M7Lr85%2FS%2BBbcv9g%3D',
    word_mp3: {
      a1371500: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/20_1371500.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=UbCv5mZ1TxGdUHZ3ZsFzq4cmmxE%3D',
      a1371506: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/20_1371506.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=V0VmUc%2By0jWf0m6f2Bq5pcEnD98%3D',
      a1371501: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/20_1371501.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=9jkObzw9IdqxWpBy%2Bplw9GrvUhM%3D',
      a1371502: 'https://diandu-oss.oss-cn-beijing.aliyuncs.com/audio/mymgw/20_1371502.mp3?OSSAccessKeyId=LTAI5tE224VMNNzWPVzH7vSx&Expires=2075964265&Signature=2oPQIlg%2F%2BhQ4HeCrgxaaqC7Y2lo%3D',
    },
    other_info: {
      pieces: [
        { pieceId: 1371500, original: "Let's learn", coordinate: { x: 0.08634, y: 0.0794, width: 0.30816, height: 0.04785 } },
        { pieceId: 1371506, original: 'My family is big. I have a brother, a baby sister, a cousin ...', coordinate: { x: 0.16006, y: 0.50178, width: 0.52472, height: 0.07999 } },
        { pieceId: 1371501, original: 'baby sister', coordinate: { x: 0.1248, y: 0.34246, width: 0.2284, height: 0.04186 } },
        { pieceId: 1371502, original: 'brother', coordinate: { x: 0.19693, y: 0.40396, width: 0.15632, height: 0.04054 } },
      ],
    },
  },
];

function previewResponse(path, params = {}) {
  if (path === endpoints.index) return { info: previewBook, view_page: 14, banner: [] };
  if (path === endpoints.booklist) {
    return {
      cates: [{ id: 7, name: '人教版（PEP）' }, { id: 8, name: '北京版' }, { id: 9, name: '沪教英语' }],
      books: [previewBook],
      banner: [],
    };
  }
  if (path === endpoints.bookchapter) return { chapers: previewChapters, banner: [] };
  if (path === endpoints.bookpage) {
    return {
      pg: previewBook,
      pages: previewPages.filter((page) => Number(page.c_page) >= Number(params.start_page || 14)),
      banner: [],
    };
  }
  if (path === endpoints.updateuserbook) return { info: previewBook, view_page: 14 };
  if (path === endpoints.updatebookpage) return 1;
  if (path === endpoints.getfayin) return previewAlphabet;
  if (path === endpoints.getfayinlist) return previewPhonetics;
  if (path === endpoints.getfayindetail) {
    const source = previewPhonetics.list.find((item) => Number(item.id) === Number(params.id)) || previewPhonetics.list[1];
    return {
      basic: { content: source.content, combination: source.combination, voice_url: '', img_url: '' },
      explain: { content: `发音 ${source.content}，组合 ${source.combination}。`, voice_url: '' },
      combination: [{ com_name: source.combination, sample: 'cat/hat/sit/fit' }],
    };
  }
  if (path === endpoints.getpindu) return previewPhonics;
  if (path === endpoints.getpindudetail) return previewPhonicsDetail;
  if (path === endpoints.vocabularyUnits) return previewVocabularyUnits;
  if (path === endpoints.vocabularyWords) {
    return previewVocabularyWords.filter((item) => Number(item.unit_id) === Number(params.unit_id || 1));
  }
  if (path === endpoints.vocabularyProgress) return [];
  if (path === endpoints.saveVocabularyProgress) return 1;
  throw new Error('预览数据暂不支持该接口');
}

export const endpoints = {
  index: '/api/learn_eg/index',
  booklist: '/api/learn_eg/booklist',
  bookchapter: '/api/learn_eg/bookchaper',
  bookpage: '/api/learn_eg/bookpage',
  updateuserbook: '/api/learn_eg/updateuserbook',
  updatebookpage: '/api/learn_eg/updatebookpage',
  getfayin: '/api/learn_eg/getfayin',
  getfayinlist: '/api/learn_eg/getfayinlist',
  getfayindetail: '/api/learn_eg/getfayindetail',
  getpindu: '/api/learn_eg/getpindu',
  getpindudetail: '/api/learn_eg/getpindudetail',
  getpindufy: '/api/learn_eg/getpindufy',
  vocabularyUnits: '/api/vocabulary/units',
  vocabularyWords: '/api/vocabulary/words',
  vocabularyProgress: '/api/vocabulary/progress',
  saveVocabularyProgress: '/api/vocabulary/save-progress',
};

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

function unwrapPayload(payload) {
  if (payload && (payload.code === 0 || payload.code === 500)) {
    throw new Error(payload.msg || '请求失败');
  }
  return payload?.data ?? payload;
}

export function createH5Api() {
  async function request(path, params) {
    const isVocabularyPath = path.startsWith('/api/vocabulary/');
    if (import.meta.env.PROD && globalThis.location?.hostname.endsWith('github.io')) {
      return previewResponse(path, params);
    }
    let response;
    try {
      response = await fetch(`${H5_BASE}${path}${buildQuery(params)}`, {
        credentials: 'include',
      });
    } catch (error) {
      if (import.meta.env.PROD || isVocabularyPath) return previewResponse(path, params);
      throw error;
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (import.meta.env.PROD || isVocabularyPath) return previewResponse(path, params);
      throw new Error(`接口返回异常：${response.status}`);
    }
    const payload = await response.json();
    if (!response.ok) {
      if (isVocabularyPath) return previewResponse(path, params);
      throw new Error(payload?.msg || '请求失败');
    }
    return unwrapPayload(payload);
  }

  return {
    index: () => request(endpoints.index),
    booklist: (params = {}) => request(endpoints.booklist, params),
    bookchapter: (book_id) => request(endpoints.bookchapter, { book_id }),
    bookpage: (book_id, start_page) => request(endpoints.bookpage, { book_id, start_page }),
    updateuserbook: (book_id) => request(endpoints.updateuserbook, { book_id }),
    updatebookpage: (book_id, page) => request(endpoints.updatebookpage, { book_id, page }),
    getfayin: () => request(endpoints.getfayin),
    getfayinlist: () => request(endpoints.getfayinlist),
    getfayindetail: (id) => request(endpoints.getfayindetail, { id }),
    getpindu: () => request(endpoints.getpindu),
    getpindudetail: (id) => request(endpoints.getpindudetail, { id }),
    getpindufy: (id) => request(endpoints.getpindufy, { id }),
    getVocabularyUnits: (book_id) => request(endpoints.vocabularyUnits, { book_id }),
    getVocabularyWords: (unit_id) => request(endpoints.vocabularyWords, { unit_id }),
    getVocabularyProgress: (book_id) => request(endpoints.vocabularyProgress, { book_id }),
    saveVocabularyProgress: (payload) => request(endpoints.saveVocabularyProgress, payload),
  };
}

export function createMiniProgramApi(wxRef) {
  function request(path, data) {
    return new Promise((resolve, reject) => {
      wxRef.request({
        url: `${MINI_BASE}${path}`,
        method: 'GET',
        data: data || {},
        success(res) {
          try {
            if (res.statusCode >= 400) {
              reject(new Error(res.data?.msg || '请求失败'));
              return;
            }
            resolve(unwrapPayload(res.data || {}));
          } catch (error) {
            reject(error);
          }
        },
        fail(err) {
          reject(new Error(err.errMsg || '网络请求失败'));
        },
      });
    });
  }

  return {
    index: () => request(endpoints.index),
    booklist: (params = {}) => request(endpoints.booklist, params),
    bookchapter: (book_id) => request(endpoints.bookchapter, { book_id }),
    bookpage: (book_id, start_page) => request(endpoints.bookpage, { book_id, start_page }),
    updateuserbook: (book_id) => request(endpoints.updateuserbook, { book_id }),
    updatebookpage: (book_id, page) => request(endpoints.updatebookpage, { book_id, page }),
    getfayin: () => request(endpoints.getfayin),
    getfayinlist: () => request(endpoints.getfayinlist),
    getfayindetail: (id) => request(endpoints.getfayindetail, { id }),
    getpindu: () => request(endpoints.getpindu),
    getpindudetail: (id) => request(endpoints.getpindudetail, { id }),
    getpindufy: (id) => request(endpoints.getpindufy, { id }),
    getVocabularyUnits: (book_id) => request(endpoints.vocabularyUnits, { book_id }),
    getVocabularyWords: (unit_id) => request(endpoints.vocabularyWords, { unit_id }),
    getVocabularyProgress: (book_id) => request(endpoints.vocabularyProgress, { book_id }),
    saveVocabularyProgress: (payload) => request(endpoints.saveVocabularyProgress, payload),
  };
}
