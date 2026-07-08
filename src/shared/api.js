const MINI_BASE = 'https://diandu.xiongmaoxiazai.com';

export const endpoints = {
  index: '/api/learn_eg/index',
  booklist: '/api/learn_eg/booklist',
  bookchapter: '/api/learn_eg/bookchapter',
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
    const response = await fetch(`${path}${buildQuery(params)}`, {
      credentials: 'include',
    });
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
