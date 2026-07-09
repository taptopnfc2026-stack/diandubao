import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('launch visibility', () => {
  it('does not expose vocabulary study in launch entry points', () => {
    const h5Main = readFileSync('src/h5/main.js', 'utf8');
    const miniHomeWxml = readFileSync('miniprogram/pages/home/home.wxml', 'utf8');
    const miniHomeJs = readFileSync('miniprogram/pages/home/home.js', 'utf8');
    const miniApp = JSON.parse(readFileSync('miniprogram/app.json', 'utf8'));

    expect(h5Main).not.toContain('<button class="secondary" onclick="diandu.loadVocabulary()">同步背单词</button>');
    expect(miniHomeWxml).not.toContain('同步背单词');
    expect(miniHomeJs).not.toContain('openVocabulary');
    expect(miniApp.pages).not.toContain('pages/vocabulary/vocabulary');
    expect(miniApp.pages).not.toContain('pages/word-study/word-study');
  });
});
