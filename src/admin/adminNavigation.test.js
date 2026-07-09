import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('admin navigation shell', () => {
  it('exposes clickable sections for each admin menu item', () => {
    const main = readFileSync('src/admin/main.js', 'utf8');

    expect(main).toContain('openSection(section)');
    expect(main).toContain("section === 'users'");
    expect(main).toContain("section === 'plans'");
    expect(main).toContain("section === 'settings'");
    expect(main).toContain("section === 'orders'");
    expect(main).toContain('onclick="adminApp.openSection');
  });
});
