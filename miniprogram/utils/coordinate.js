function normalizeAudioItems(wordMp3) {
  if (Array.isArray(wordMp3)) return wordMp3;
  if (wordMp3 && typeof wordMp3 === 'object') return Object.values(wordMp3);
  if (!wordMp3 || typeof wordMp3 !== 'string') return [];
  try {
    const parsed = JSON.parse(wordMp3);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return Object.values(parsed);
    return [];
  } catch (error) {
    return [];
  }
}

function normalizeAudioMap(wordMp3) {
  if (!wordMp3) return {};
  if (Array.isArray(wordMp3)) return {};
  if (typeof wordMp3 === 'object') return wordMp3;
  try {
    const parsed = JSON.parse(wordMp3);
    return parsed && !Array.isArray(parsed) && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function normalizeOtherInfo(otherInfo) {
  if (!otherInfo) return {};
  if (typeof otherInfo === 'object') return otherInfo;
  try {
    const parsed = JSON.parse(otherInfo);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function pickAudioUrl(item) {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return '';
  return item.url
    || item.originSoundUrl
    || item.encryptSoundUrl
    || item.originSound
    || item.encryptSound
    || item.sound
    || item.soundUrl
    || item.audio_url
    || item.audioUrl
    || item.audio
    || item.mp3
    || '';
}

function toOverlayRect(coordinate, imageBox) {
  if (!coordinate || !imageBox) return null;
  const x = Number(coordinate.x);
  const y = Number(coordinate.y);
  const width = Number(coordinate.width);
  const height = Number(coordinate.height);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0) return null;
  return {
    left: (imageBox.left || 0) + imageBox.width * x,
    top: (imageBox.top || 0) + imageBox.height * y,
    width: imageBox.width * width,
    height: imageBox.height * height,
  };
}

function buildTapRegions(page, imageBox) {
  const otherInfo = normalizeOtherInfo(page && page.other_info);
  const audioMap = normalizeAudioMap(page && page.word_mp3);
  const items = Array.isArray(otherInfo.pieces) ? otherInfo.pieces : normalizeAudioItems(page && page.word_mp3);
  return items
    .map((item, index) => {
      const mappedAudio = audioMap[`a${item.pieceId}`] || audioMap[item.pieceId] || audioMap[item.id];
      return {
        id: item.pieceId || item.id || `${page && page.id ? page.id : 'page'}-${index}`,
        text: item.original || item.richOriginal || item.translation || '',
        audioUrl: pickAudioUrl(mappedAudio) || pickAudioUrl(item),
        rect: toOverlayRect(item.coordinate, imageBox),
      };
    })
    .filter((item) => item.audioUrl && item.rect);
}

module.exports = {
  normalizeAudioItems,
  normalizeAudioMap,
  normalizeOtherInfo,
  pickAudioUrl,
  toOverlayRect,
  buildTapRegions,
};
