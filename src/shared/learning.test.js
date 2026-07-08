import { describe, expect, it } from 'vitest';
import {
  flattenPhonicsGroups,
  getFirstAudioUrl,
  normalizeAlphabetLetters,
  normalizePhoneticDetail,
  normalizePhoneticList,
  normalizePhonicsDetail,
} from './learning.js';

describe('learning data helpers', () => {
  it('normalizes phonetic tabs and items from backend data', () => {
    const result = normalizePhoneticList({
      cate: [{ id: 0, name: '元音' }, { id: 1, name: '辅音' }],
      list: [
        { id: 1, content: 'æ', combination: 'a', type: 0 },
        { id: 25, content: 'p', combination: 'p/pp', type: 1 },
      ],
    });

    expect(result.tabs).toEqual([{ id: 0, name: '元音' }, { id: 1, name: '辅音' }]);
    expect(result.itemsByType[0][0]).toMatchObject({ id: 1, symbol: 'æ', subtitle: 'a' });
    expect(result.itemsByType[1][0]).toMatchObject({ id: 25, symbol: 'p', subtitle: 'p/pp' });
  });

  it('normalizes phonetic detail fields for display and audio', () => {
    const detail = normalizePhoneticDetail({
      basic: { content: 'i', combination: 'i/y', voice_url: 'basic.m4a', img_url: 'mouth.gif' },
      explain: { content: 'short i', voice_url: 'explain.m4a' },
      combination: [{ com_name: 'i', sample: 'sit/fit' }],
    });

    expect(detail.symbol).toBe('i');
    expect(detail.subtitle).toBe('i/y');
    expect(detail.image).toBe('mouth.gif');
    expect(detail.audioUrls).toEqual(['basic.m4a', 'explain.m4a']);
    expect(detail.explain).toBe('short i');
  });

  it('normalizes alphabet and phonics groups', () => {
    expect(normalizeAlphabetLetters([{ id: 1, title: 'Aa', pic: 'a.png', mp3: 'a.mp3' }])[0])
      .toMatchObject({ id: 1, title: 'Aa', image: 'a.png', audioUrl: 'a.mp3' });

    const groups = flattenPhonicsGroups({ 1: [{ id: 1, name: 'a' }], 3: [{ id: 28, name: 'ai' }] });
    expect(groups[0]).toMatchObject({ key: '1', title: '元音字母', items: [{ id: 1, name: 'a' }] });
    expect(groups[1]).toMatchObject({ key: '3', title: '元音字母组合', items: [{ id: 28, name: 'ai' }] });
  });

  it('picks the first playable audio URL', () => {
    expect(getFirstAudioUrl({ audioUrl: 'a.mp3' })).toBe('a.mp3');
    expect(getFirstAudioUrl({ audioUrls: ['b.mp3'] })).toBe('b.mp3');
    expect(getFirstAudioUrl({ voice_url: 'c.mp3' })).toBe('c.mp3');
  });

  it('normalizes natural phonics detail from backend data', () => {
    const detail = normalizePhonicsDetail({
      details: {
        id: 9,
        zimu: 'f',
        c_type: 2,
        bg_img: 'letter-f.jpg',
        video_url: 'mouth-f.mp4',
        yinbiao: {
          id: 27,
          fy: '[f]',
          other_info: {
            image: 'mouth-f.gif',
            sound: 'sound-f.mp3',
            mouth: [{ id: 758, step_content: '上齿放在下唇的偏内侧，但不要咬唇。' }],
            word: [{ id: 173, word: 'fat   [fæt]   adj.肥胖的', sound: 'fat.mp3', image: 'fat.jpg' }],
            sentence: [{ id: 10751, sentence: 'That fat boy is my friend.', sound_man: 'man.mp3', sound_woman: 'woman.mp3', translation: '那个胖胖的小男孩是我的朋友。' }],
          },
        },
      },
    });

    expect(detail).toMatchObject({
      id: 9,
      name: 'f',
      type: 2,
      phoneticId: 27,
      selectedPhonetic: '[f]',
      image: 'mouth-f.gif',
      audioUrl: 'sound-f.mp3',
      videoUrl: 'mouth-f.mp4',
    });
    expect(detail.mouthSteps[0]).toEqual({ id: 758, text: '上齿放在下唇的偏内侧，但不要咬唇。' });
    expect(detail.words[0]).toMatchObject({ id: 173, text: 'fat   [fæt]   adj.肥胖的', audioUrl: 'fat.mp3', image: 'fat.jpg' });
    expect(detail.sentences[0]).toMatchObject({ id: 10751, text: 'That fat boy is my friend.', audioUrls: ['man.mp3', 'woman.mp3'] });
  });
});
