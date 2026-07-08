const PHONICS_TITLES = {
  1: '元音字母',
  2: '辅音字母',
  3: '元音字母组合',
  4: '辅音字母组合',
  5: '特殊字母组合',
};

function arrayFrom(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUrl(value) {
  return value ? String(value).replace(/\\\//g, '/') : '';
}

function normalizePhoneticList(data = {}) {
  const tabs = arrayFrom(data.cate).map((item) => ({ id: Number(item.id), name: item.name || '' }));
  const itemsByType = {};
  arrayFrom(data.list).forEach((item) => {
    const type = Number(item.type || 0);
    if (!itemsByType[type]) itemsByType[type] = [];
    itemsByType[type].push({
      id: item.id,
      type,
      symbol: item.content || '',
      subtitle: item.combination || '',
      raw: item,
    });
  });
  return { tabs, itemsByType };
}

function normalizePhoneticDetail(data = {}) {
  const basic = data.basic || {};
  const explain = data.explain || {};
  return {
    symbol: basic.content || '',
    subtitle: basic.combination || '',
    image: normalizeUrl(basic.img_url),
    explain: explain.content || '',
    combinations: arrayFrom(data.combination),
    audioUrls: [basic.voice_url, explain.voice_url].map(normalizeUrl).filter(Boolean),
    raw: data,
  };
}

function normalizeAlphabetLetters(data = []) {
  return arrayFrom(data).map((item) => ({
    id: item.id,
    title: item.title || '',
    image: normalizeUrl(item.pic),
    audioUrl: normalizeUrl(item.mp3),
    raw: item,
  }));
}

function flattenPhonicsGroups(groups = {}) {
  return Object.entries(groups).map(([key, items]) => ({
    key,
    title: PHONICS_TITLES[key] || '自然拼读',
    items: arrayFrom(items).map((item) => ({
      id: item.id,
      name: item.name || '',
      typeKey: key,
      raw: item,
    })),
  }));
}

function normalizePhonicsDetail(data = {}) {
  const details = data.details || data;
  const phonetic = details.yinbiao || {};
  const info = phonetic.other_info || {};
  const phonetics = Object.entries(details.other_info || {}).map(([id, label]) => ({
    id: Number(id),
    label: String(label || ''),
  }));
  return {
    id: details.id,
    name: details.zimu || '',
    type: Number(details.c_type || 0),
    letterImage: normalizeUrl(details.bg_img),
    videoUrl: normalizeUrl(details.video_url),
    phoneticId: phonetic.id,
    selectedPhonetic: phonetic.fy || info.yinbiao || (phonetics[0] || {}).label || '',
    image: normalizeUrl(info.image || details.bg_img),
    audioUrl: normalizeUrl(info.sound),
    phonetics,
    mouthSteps: arrayFrom(info.mouth).map((item, index) => ({
      id: item.id || index,
      text: item.step_content || '',
    })).filter((item) => item.text),
    words: arrayFrom(info.word).map((item) => ({
      id: item.id,
      text: item.word || '',
      audioUrl: normalizeUrl(item.sound),
      image: normalizeUrl(item.image),
      startIndex: item.start_index,
      endIndex: item.end_index,
    })),
    sentences: arrayFrom(info.sentence).map((item) => ({
      id: item.id,
      text: item.sentence || '',
      translation: item.translation || '',
      audioUrls: [item.sound_man, item.sound_woman].map(normalizeUrl).filter(Boolean),
      startIndex: item.start_index,
      endIndex: item.end_index,
    })),
    raw: data,
  };
}

function getFirstAudioUrl(item = {}) {
  return normalizeUrl(item.audioUrl || item.voice_url || item.mp3 || item.sound || (item.audioUrls || []).find(Boolean));
}

module.exports = {
  normalizeUrl,
  normalizePhoneticList,
  normalizePhoneticDetail,
  normalizeAlphabetLetters,
  flattenPhonicsGroups,
  normalizePhonicsDetail,
  getFirstAudioUrl,
};
