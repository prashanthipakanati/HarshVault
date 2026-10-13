import { computeMD5 } from './md5';

export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA-1' | 'MD5';

export interface AlgorithmMetadata {
  id: HashAlgorithm;
  name: string;
  bitLength: number;
  hexLength: number;
  securityStatus: 'secure' | 'legacy-warning' | 'insecure-checksum';
  statusLabel: string;
  description: string;
  recommendedUse: string;
  cautionNotice?: string;
  isLegacy: boolean;
}

export const ALGORITHM_REGISTRY: Record<HashAlgorithm, AlgorithmMetadata> = {
  'SHA-256': {
    id: 'SHA-256',
    name: 'SHA-256 (Secure Hash Algorithm 2)',
    bitLength: 256,
    hexLength: 64,
    securityStatus: 'secure',
    statusLabel: 'Modern Standard (Secure)',
    description: 'Part of the SHA-2 family defined in NIST FIPS 180-4. Currently collision-resistant and widely used in TLS, blockchain, and digital signatures.',
    recommendedUse: 'Default choice for file integrity, API signing, and cryptographic verification.',
    isLegacy: false,
  },
  'SHA-384': {
    id: 'SHA-384',
    name: 'SHA-384 (Secure Hash Algorithm 2)',
    bitLength: 384,
    hexLength: 96,
    securityStatus: 'secure',
    statusLabel: 'High Security (Truncated SHA-512)',
    description: 'Derived by truncating the SHA-512 internal state with distinct initial values. Provides 192-bit security against collision attacks.',
    recommendedUse: 'High-assurance government, financial, and enterprise security policies requiring Top Secret suite.',
    isLegacy: false,
  },
  'SHA-512': {
    id: 'SHA-512',
    name: 'SHA-512 (Secure Hash Algorithm 2)',
    bitLength: 512,
    hexLength: 128,
    securityStatus: 'secure',
    statusLabel: 'Maximum Strength (Secure)',
    description: '64-bit word architecture optimized for 64-bit microprocessors. Delivers maximum collision and preimage resistance.',
    recommendedUse: 'Ultra-secure integrity checking, digital signatures, and 64-bit high-throughput systems.',
    isLegacy: false,
  },
  'SHA-1': {
    id: 'SHA-1',
    name: 'SHA-1 (Secure Hash Algorithm 1)',
    bitLength: 160,
    hexLength: 40,
    securityStatus: 'legacy-warning',
    statusLabel: 'Legacy / Deprecated',
    description: 'Published in 1995. Formally deprecated by NIST in 2011 due to practical collision attacks (e.g. SHAttered attack, 2017).',
    recommendedUse: 'Compatibility with legacy Git protocols or older systems only. Unsuitable for security-critical contexts.',
    cautionNotice: 'Warning: SHA-1 is vulnerable to collision attacks and is forbidden in modern security-critical protocols.',
    isLegacy: true,
  },
  'MD5': {
    id: 'MD5',
    name: 'MD5 (Message Digest 5)',
    bitLength: 128,
    hexLength: 32,
    securityStatus: 'insecure-checksum',
    statusLabel: 'Broken / Legacy Checksum Only',
    description: 'Designed by Ronald Rivest in 1991. Fundamentally broken for cryptographic purposes since practical collision attacks were discovered in 2004.',
    recommendedUse: 'Non-adversarial error-checking / file corruption detection in legacy software only. Never use for passwords or signatures.',
    cautionNotice: 'Critical: MD5 has severe collision vulnerabilities and can be forged in seconds. Do not rely on MD5 for security or authenticity.',
    isLegacy: true,
  },
};

export interface HashResult {
  algorithm: HashAlgorithm;
  digest: string;
  bitLength: number;
  hexLength: number;
  inputType: 'text' | 'file';
  inputSizeBytes: number;
  timestamp: string;
  durationMs: number;
  fileName?: string;
  mimeType?: string;
  sourcePreview?: string;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Computes hash over Uint8Array or ArrayBuffer using Web Crypto API or MD5 fallback
 */
export async function computeHashFromBytes(
  data: Uint8Array | ArrayBuffer,
  algorithm: HashAlgorithm
): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  if (algorithm === 'MD5') {
    return computeMD5(bytes);
  }

  // Web Crypto API supports 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest(algorithm, bytes as unknown as BufferSource);
    return bufferToHex(hashBuffer);
  }

  throw new Error('Web Crypto API is not supported in this runtime environment.');
}

/**
 * Computes hash from string encoded as UTF-8
 */
export async function computeTextHash(
  text: string,
  algorithm: HashAlgorithm
): Promise<HashResult> {
  const start = performance.now();
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const digest = await computeHashFromBytes(bytes, algorithm);
  const durationMs = Math.max(1, Math.round(performance.now() - start));
  const meta = ALGORITHM_REGISTRY[algorithm];

  return {
    algorithm,
    digest,
    bitLength: meta.bitLength,
    hexLength: meta.hexLength,
    inputType: 'text',
    inputSizeBytes: bytes.byteLength,
    timestamp: new Date().toISOString(),
    durationMs,
    sourcePreview: text.length > 80 ? text.slice(0, 80) + '…' : text,
  };
}

/**
 * Computes hash from File or Blob
 */
export async function computeFileHash(
  file: File | Blob,
  algorithm: HashAlgorithm,
  onProgress?: (progressPercent: number) => void
): Promise<HashResult> {
  const start = performance.now();
  const meta = ALGORITHM_REGISTRY[algorithm];
  const inputSizeBytes = file.size;

  if (onProgress) onProgress(15);
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(65);

  const digest = await computeHashFromBytes(arrayBuffer, algorithm);
  if (onProgress) onProgress(100);

  const durationMs = Math.max(1, Math.round(performance.now() - start));

  return {
    algorithm,
    digest,
    bitLength: meta.bitLength,
    hexLength: meta.hexLength,
    inputType: 'file',
    inputSizeBytes,
    timestamp: new Date().toISOString(),
    durationMs,
    fileName: file instanceof File ? file.name : 'binary-blob',
    mimeType: file.type || 'application/octet-stream',
  };
}

/**
 * Normalizes and compares two hash strings (case-insensitive, trims whitespace)
 */
export function compareDigests(hashA: string, hashB: string): {
  matches: boolean;
  cleanA: string;
  cleanB: string;
  error?: string;
} {
  const cleanA = hashA.trim().toLowerCase();
  const cleanB = hashB.trim().toLowerCase();

  if (!cleanA || !cleanB) {
    return {
      matches: false,
      cleanA,
      cleanB,
      error: 'Both hash digests must be provided for comparison.',
    };
  }

  // Check valid hexadecimal characters
  const hexRegex = /^[0-9a-f]+$/;
  if (!hexRegex.test(cleanA) || !hexRegex.test(cleanB)) {
    return {
      matches: false,
      cleanA,
      cleanB,
      error: 'One or both inputs contain non-hexadecimal characters.',
    };
  }

  return {
    matches: cleanA === cleanB,
    cleanA,
    cleanB,
  };
}

/**
 * Standard known test vectors for unit tests and verification
 */
export const KNOWN_TEST_VECTORS = [
  {
    name: 'SHA-256 of empty string',
    algorithm: 'SHA-256' as HashAlgorithm,
    input: '',
    expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    name: 'SHA-256 of "abc"',
    algorithm: 'SHA-256' as HashAlgorithm,
    input: 'abc',
    expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
  {
    name: 'SHA-384 of "abc"',
    algorithm: 'SHA-384' as HashAlgorithm,
    input: 'abc',
    expected: 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
  },
  {
    name: 'SHA-512 of "abc"',
    algorithm: 'SHA-512' as HashAlgorithm,
    input: 'abc',
    expected: 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
  },
  {
    name: 'SHA-1 of "abc"',
    algorithm: 'SHA-1' as HashAlgorithm,
    input: 'abc',
    expected: 'a9993e364706816aba3e25717850c26c9cd0d89d',
  },
  {
    name: 'MD5 of "abc"',
    algorithm: 'MD5' as HashAlgorithm,
    input: 'abc',
    expected: '900150983cd24fb0d6963f7d28e17f72',
  },
  {
    name: 'MD5 of empty string',
    algorithm: 'MD5' as HashAlgorithm,
    input: '',
    expected: 'd41d8cd98f00b204e9800998ecf8427e',
  },
];
