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

  it('exposes my page as the last launch tab', () => {
    const h5Main = readFileSync('src/h5/main.js', 'utf8');
    const miniHomeWxml = readFileSync('miniprogram/pages/home/home.wxml', 'utf8');
    const miniHomeJs = readFileSync('miniprogram/pages/home/home.js', 'utf8');
    const miniApp = JSON.parse(readFileSync('miniprogram/app.json', 'utf8'));

    expect(h5Main).toContain('diandu.loadMy()');
    expect(miniHomeWxml).toContain('我的');
    expect(miniHomeJs).toContain('openMy');
    expect(miniApp.pages).toContain('pages/my/my');
  });

  it('routes expired-time actions into task flows before rewards are granted', () => {
    const h5Main = readFileSync('src/h5/main.js', 'utf8');
    const miniMyWxml = readFileSync('miniprogram/pages/my/my.wxml', 'utf8');
    const miniMyJs = readFileSync('miniprogram/pages/my/my.js', 'utf8');

    expect(h5Main).toContain('diandu.openInviteTask()');
    expect(h5Main).toContain('diandu.openAdTask()');
    expect(h5Main).toContain('diandu.openMemberTask()');
    expect(h5Main).not.toContain('<button onclick="diandu.claimInviteReward()">');
    expect(h5Main).not.toContain('<button onclick="diandu.claimAdReward()">');
    expect(h5Main).not.toContain('<button class="time-limit-member" onclick="diandu.exchangeMember()">');

    expect(miniMyWxml).toContain('bindtap="openInviteTask"');
    expect(miniMyWxml).toContain('bindtap="openAdTask"');
    expect(miniMyWxml).toContain('bindtap="openMemberTask"');
    expect(miniMyWxml).not.toContain('<button bindtap="claimInviteReward">');
    expect(miniMyWxml).not.toContain('<button bindtap="claimAdReward">');
    expect(miniMyWxml).not.toContain('<button class="time-limit-member" bindtap="openMember">');

    expect(miniMyJs).toContain('openInviteTask()');
    expect(miniMyJs).toContain('openAdTask()');
    expect(miniMyJs).toContain('openMemberTask()');
  });

  it('hides launch-only promo and watch-record entries', () => {
    const h5Main = readFileSync('src/h5/main.js', 'utf8');
    const miniReaderWxml = readFileSync('miniprogram/pages/reader/reader.wxml', 'utf8');
    const miniMyJs = readFileSync('miniprogram/pages/my/my.js', 'utf8');

    expect(h5Main).not.toContain('免费领英语资料');
    expect(miniReaderWxml).not.toContain('免费领英语资料');
    expect(h5Main).not.toContain('观看记录');
    expect(miniMyJs).not.toContain('观看记录');
  });
});
