import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectStaticReferences, verifyLocalPackage } from './verify-static-package.mjs';

const temporaryDirectories = [];

function createPackage(indexHtml, assets = {}) {
  const directory = mkdtempSync(join(tmpdir(), '1976-static-package-'));
  temporaryDirectories.push(directory);
  writeFileSync(join(directory, 'index.html'), indexHtml);

  for (const [assetPath, contents] of Object.entries(assets)) {
    const fullPath = join(directory, assetPath);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, contents);
  }

  return join(directory, 'index.html');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('static HTML5 package verification', () => {
  it('collects local scripts and stylesheets without external resources', () => {
    const references = collectStaticReferences(`
      <link rel="stylesheet" href="./assets/game.css">
      <script src="https://example.com/analytics.js"></script>
      <script type="module" src="./assets/game.js"></script>
    `);

    expect(references).toEqual(['./assets/game.css', './assets/game.js']);
  });

  it('accepts a complete portable package', () => {
    const indexPath = createPackage(
      '<link href="./assets/game.css" rel="stylesheet"><script src="./assets/game.js"></script>',
      { 'assets/game.css': 'body {}', 'assets/game.js': 'console.log("1976")' },
    );

    expect(verifyLocalPackage(indexPath).references).toHaveLength(2);
  });

  it('rejects a missing hashed asset', () => {
    const indexPath = createPackage('<script src="./assets/index-missing.js"></script>');

    expect(() => verifyLocalPackage(indexPath)).toThrow('missing or empty');
  });

  it('rejects root-relative assets that would break in an embedded upload', () => {
    const indexPath = createPackage('<script src="/assets/game.js"></script>');

    expect(() => verifyLocalPackage(indexPath)).toThrow('Root-relative asset path');
  });
});
