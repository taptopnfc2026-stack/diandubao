const BASE_URL = 'https://diandu.xiongmaoxiazai.com';

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
};
