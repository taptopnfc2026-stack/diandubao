const BASE_URL = 'https://diandu.xiongmaoxiazai.com';

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

function unwrapPayload(payload) {
  if (payload && (payload.code === 0 || payload.code === 500)) {
    throw new Error(payload.msg || '请求失败');
  }
  return payload && payload.data !== undefined ? payload.data : payload;
}

function request(path, data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: 'GET',
      data,
      success(res) {
        try {
          if (res.statusCode >= 400) {
            reject(new Error((res.data && res.data.msg) || '请求失败'));
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

module.exports = {
  index: () => request('/api/learn_eg/index'),
  booklist: (params = {}) => request('/api/learn_eg/booklist', params),
  bookchapter: (book_id) => request('/api/learn_eg/bookchaper', { book_id }),
  bookpage: (book_id, start_page) => request('/api/learn_eg/bookpage', { book_id, start_page }),
  updateuserbook: (book_id) => request('/api/learn_eg/updateuserbook', { book_id }),
  updatebookpage: (book_id, page) => request('/api/learn_eg/updatebookpage', { book_id, page }),
  getfayin: () => request('/api/learn_eg/getfayin'),
  getfayinlist: () => request('/api/learn_eg/getfayinlist'),
  getfayindetail: (id) => request('/api/learn_eg/getfayindetail', { id }),
  getpindu: () => request('/api/learn_eg/getpindu'),
  getpindudetail: (id) => request('/api/learn_eg/getpindudetail', { id }),
  getpindufy: (id) => request('/api/learn_eg/getpindufy', { id }),
  getVocabularyUnits: (book_id) => request('/api/vocabulary/units', { book_id }).catch(() => previewVocabularyUnits),
  getVocabularyWords: (unit_id) => request('/api/vocabulary/words', { unit_id }).catch(() => (
    previewVocabularyWords.filter((item) => Number(item.unit_id) === Number(unit_id || 1))
  )),
  getVocabularyProgress: (book_id) => request('/api/vocabulary/progress', { book_id }).catch(() => []),
  saveVocabularyProgress: (payload) => request('/api/vocabulary/save-progress', payload).catch(() => 1),
};
