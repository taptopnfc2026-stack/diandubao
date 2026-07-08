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
  throw new Error('预览数据暂不支持该接口');
}

export const endpoints = {
  index: '/api/learn_eg/index',
  booklist: '/api/learn_eg/booklist',
  bookchapter: '/api/learn_eg/bookchaper',
  bookpage: '/api/learn_eg/bookpage',
  updateuserbook: '/api/learn_eg/updateuserbook',
  updatebookpage: '/api/learn_eg/updatebookpage',
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
    if (import.meta.env.PROD && globalThis.location?.hostname.endsWith('github.io')) {
      return previewResponse(path, params);
    }
    let response;
    try {
      response = await fetch(`${H5_BASE}${path}${buildQuery(params)}`, {
        credentials: 'include',
      });
    } catch (error) {
      if (import.meta.env.PROD) return previewResponse(path, params);
      throw error;
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (import.meta.env.PROD) return previewResponse(path, params);
      throw new Error(`接口返回异常：${response.status}`);
    }
    const payload = await response.json();
    if (!response.ok) {
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
  };
}
