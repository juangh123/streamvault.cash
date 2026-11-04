import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { checkSubmissionAssets } from '../scripts/check-submission-assets.mjs';

test('submission assets reject missing files, HTML fallbacks and stale built copies', () => {
  const root = mkdtempSync(join(tmpdir(), 'streamvault-assets-'));
  const put = (path, content) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  };
  const assets = [{ path: 'deck.pdf', signature: '%PDF-', offset: 0 }];
  try {
    assert.match(checkSubmissionAssets(root, assets).join('\n'), /missing/);
    put('public/deck.pdf', '<html>SPA fallback</html>');
    put('dist/deck.pdf', '<html>SPA fallback</html>');
    assert.match(checkSubmissionAssets(root, assets).join('\n'), /signature/);
    put('public/deck.pdf', '%PDF-current');
    put('dist/deck.pdf', '%PDF-old');
    assert.match(checkSubmissionAssets(root, assets).join('\n'), /differs/);
    put('dist/deck.pdf', '%PDF-current');
    assert.deepEqual(checkSubmissionAssets(root, assets), []);
  } finally {
    assert.equal(dirname(root), tmpdir(), 'Cleanup must stay inside the temporary directory');
    rmSync(root, { recursive: true, force: true });
  }
});
