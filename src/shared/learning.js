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

export function normalizeUrl(value) {
  return value ? String(value).replace(/\\\//g, '/') : '';
}

export function normalizePhoneticList(data = {}) {
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

export function normalizePhoneticDetail(data = {}) {
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

export function normalizeAlphabetLetters(data = []) {
  return arrayFrom(data).map((item) => ({
    id: item.id,
    title: item.title || '',
    image: normalizeUrl(item.pic),
    audioUrl: normalizeUrl(item.mp3),
    raw: item,
  }));
}

export function flattenPhonicsGroups(groups = {}) {
  return Object.entries(groups).map(([key, items]) => ({
    key,
    title: PHONICS_TITLES[key] || '自然拼读',
    items: arrayFrom(items).map((item) => ({
      id: item.id,
      name: item.name || '',
      raw: item,
    })),
  }));
}

export function getFirstAudioUrl(item = {}) {
  return normalizeUrl(item.audioUrl || item.voice_url || item.mp3 || item.sound || item.audioUrls?.find(Boolean));
}
