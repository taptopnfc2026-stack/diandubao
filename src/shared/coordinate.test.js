import { describe, expect, it } from 'vitest';
import { buildTapRegions, normalizeAudioItems, normalizeOtherInfo, pickAudioUrl, toOverlayRect } from './coordinate.js';

describe('coordinate helpers', () => {
  it('normalizes arrays and JSON strings', () => {
    const item = { url: 'https://example.com/a.mp3' };
    expect(normalizeAudioItems([item])).toEqual([item]);
    expect(normalizeAudioItems(JSON.stringify([item]))).toEqual([item]);
    expect(normalizeAudioItems(JSON.stringify({ a1: item }))).toEqual([item]);
    expect(normalizeAudioItems('bad json')).toEqual([]);
  });

  it('normalizes already-decoded and JSON other_info', () => {
    const info = { pieces: [{ originSoundUrl: 'a.mp3' }] };
    expect(normalizeOtherInfo(info)).toBe(info);
    expect(normalizeOtherInfo(JSON.stringify(info))).toEqual(info);
    expect(normalizeOtherInfo('bad json')).toEqual({});
  });

  it('picks supported audio URL fields', () => {
    expect(pickAudioUrl({ originSoundUrl: 'a.mp3' })).toBe('a.mp3');
    expect(pickAudioUrl({ encryptSoundUrl: 'b.mp3' })).toBe('b.mp3');
    expect(pickAudioUrl({ mp3: 'c.mp3' })).toBe('c.mp3');
  });

  it('converts proportional coordinates to display rectangles', () => {
    const rect = toOverlayRect(
      { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
      { left: 10, top: 20, width: 200, height: 300 }
    );
    expect(rect).toEqual({ left: 30, top: 80, width: 60, height: 120 });
  });

  it('builds only playable tap regions', () => {
    const regions = buildTapRegions(
      {
        id: 8,
        other_info: {
          pieces: [
            { originSoundUrl: 'ok.mp3', coordinate: { x: 0, y: 0, width: 0.2, height: 0.1 } },
            { originSoundUrl: '', coordinate: { x: 0, y: 0, width: 0.2, height: 0.1 } },
          ],
        },
      },
      { left: 0, top: 0, width: 100, height: 100 }
    );
    expect(regions).toHaveLength(1);
    expect(regions[0].audioUrl).toBe('ok.mp3');
  });
});
