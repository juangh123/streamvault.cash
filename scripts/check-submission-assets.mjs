import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const publicAssets = [
  { path: 'StreamVault-BCH-Blaze-2026.pdf', signature: '%PDF-', offset: 0 },
  { path: 'judge/streamvault-sandbox-demo.mp4', signature: 'ftyp', offset: 4 },
];

/** Offline packaging check only; does not establish Mainnet or wallet-test readiness. */
export function checkSubmissionAssets(root, assets = publicAssets) {
  const errors = [];
  for (const { path, signature, offset } of assets) {
    const copies = ['public', 'dist'].map((dir) => join(root, dir, path));
    for (const copy of copies) {
      if (!existsSync(copy)) errors.push(`${copy}: missing`);
      else if (readFileSync(copy).subarray(offset, offset + signature.length).toString('ascii') !== signature) {
        errors.push(`${copy}: invalid file signature`);
      }
    }
    if (copies.every(existsSync) && !readFileSync(copies[0]).equals(readFileSync(copies[1]))) {
      errors.push(`${path}: built copy differs from public source; rebuild`);
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = process.cwd();
  const errors = checkSubmissionAssets(root);
  const guidePath = join(root, 'docs/JUDGE_GUIDE.md');
  if (!existsSync(guidePath)) errors.push('docs/JUDGE_GUIDE.md: missing');
  else {
    const guide = readFileSync(guidePath, 'utf8');
    const images = [...guide.matchAll(/\]\((judge\/[^)]+\.jpg)\)/g)];
    if (images.length === 0) errors.push('Judge guide: no screenshot references');
    for (const [, path] of images) {
      const file = join(root, 'docs', path);
      if (!existsSync(file)) errors.push(`${path}: missing screenshot`);
      else if (readFileSync(file).subarray(0, 3).toString('hex') !== 'ffd8ff') {
        errors.push(`${path}: invalid JPEG signature`);
      }
    }
  }
  if (errors.length) {
    for (const error of errors) console.error(`[FAIL] ${error}`);
    process.exitCode = 1;
  } else {
    console.log('[PASS] Submission PDF, Sandbox video and judge screenshots are packaged.');
    console.log('Offline assets only: Mainnet evidence, phone wallets and submission remain separate gates.');
  }
}
