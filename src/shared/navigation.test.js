import { describe, expect, it } from 'vitest';
import { getNextPageNumber, getSwipePageDelta, selectReaderPage } from './navigation.js';

describe('reader navigation helpers', () => {
  it('ignores taps and mostly vertical drags', () => {
    expect(getSwipePageDelta({ x: 100, y: 100 }, { x: 126, y: 104 })).toBe(0);
    expect(getSwipePageDelta({ x: 100, y: 100 }, { x: 40, y: 160 })).toBe(0);
  });

  it('maps horizontal swipes to next and previous page deltas', () => {
    expect(getSwipePageDelta({ x: 280, y: 100 }, { x: 180, y: 112 })).toBe(1);
    expect(getSwipePageDelta({ x: 120, y: 100 }, { x: 210, y: 108 })).toBe(-1);
  });

  it('keeps page navigation inside configured bounds', () => {
    expect(getNextPageNumber(1, -1)).toBe(1);
    expect(getNextPageNumber(4, 1, { max: 4 })).toBe(4);
    expect(getNextPageNumber(4, -1, { min: 2, max: 9 })).toBe(3);
  });

  it('selects the requested textbook page from a full page list', () => {
    const pages = [{ c_page: 2 }, { c_page: 14 }, { c_page: 19 }];
    expect(selectReaderPage(pages, 19)).toEqual({ c_page: 19 });
    expect(selectReaderPage(pages, 18)).toEqual({ c_page: 19 });
    expect(selectReaderPage(pages, 99)).toEqual({ c_page: 19 });
  });
});
