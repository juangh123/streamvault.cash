import artifactJson from '../../contracts/artifacts/StreamVault.json';
import type { Artifact } from 'cashscript';

/**
 * The compiled StreamVault covenant, produced by `npm run compile`
 * (cashc contracts/StreamVault.cash -o contracts/artifacts/StreamVault.json).
 * Committed to the repo so the demo runs without a build step.
 */
export const STREAMVAULT_ARTIFACT = artifactJson as unknown as Artifact;

/** Hex-encoded covenant bytecode, shown in the UI as the recursive-change fingerprint. */
export const CONTRACT_BYTECODE_HEX = STREAMVAULT_ARTIFACT.bytecode;

// Re-export the pure constants so existing `from '../lib/covenant'` imports keep working.
export * from './constants';