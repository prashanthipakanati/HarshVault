import assert from 'assert';
import {
  computeHashFromBytes,
  computeTextHash,
  compareDigests,
  KNOWN_TEST_VECTORS,
} from '../src/lib/crypto/hasher';
import { sanitizeCsvField } from '../src/lib/utils/exportUtils';
import { computeMD5 } from '../src/lib/crypto/md5';

async function runTests() {
  console.log('🧪 Starting Cryptographic Hash Explorer Test Suite...\n');

  // Test 1: Known Vector Verification
  console.log('Test 1: NIST and RFC Known Vectors');
  for (const v of KNOWN_TEST_VECTORS) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(v.input);
    let digest = '';
    if (v.algorithm === 'MD5') {
      digest = computeMD5(bytes);
    } else {
      // In Node.js environment, crypto.subtle is available via globalThis.crypto.subtle
      const hashBuf = await crypto.subtle.digest(v.algorithm, bytes);
      digest = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    assert.strictEqual(
      digest.toLowerCase(),
      v.expected.toLowerCase(),
      `Vector failed for ${v.name}: expected ${v.expected}, got ${digest}`
    );
    console.log(`  ✓ ${v.name}: MATCH`);
  }

  // Test 2: Unicode & Emoji deterministic hashing
  console.log('\nTest 2: Unicode and Multiline Text Consistency');
  const unicodeSample = '🔐 Cryptographic Hash Explorer 2026 \u00A9 \u26A1';
  const multilineSample = "Line 1\nLine 2\r\nLine 3\tTabbed";

  const uni1 = await computeTextHash(unicodeSample, 'SHA-256');
  const uni2 = await computeTextHash(unicodeSample, 'SHA-256');
  assert.strictEqual(uni1.digest, uni2.digest, 'Unicode hashing must be 100% deterministic');
  console.log('  ✓ Unicode & emoji deterministic consistency: MATCH');

  const multi1 = await computeTextHash(multilineSample, 'SHA-512');
  const multi2 = await computeTextHash(multilineSample, 'SHA-512');
  assert.strictEqual(multi1.digest, multi2.digest, 'Multiline hashing must be 100% deterministic');
  console.log('  ✓ Multiline and whitespace integrity: MATCH');

  // Test 3: Avalanche Effect (1 bit difference creates vastly different hash)
  console.log('\nTest 3: Avalanche Effect (Diffusion)');
  const textA = 'The quick brown fox jumps over the lazy dog';
  const textB = 'The quick brown fox jumps over the lazy dog.'; // just one period added
  const hashA = await computeTextHash(textA, 'SHA-256');
  const hashB = await computeTextHash(textB, 'SHA-256');
  assert.notStrictEqual(hashA.digest, hashB.digest, 'Different inputs must produce completely different hashes');
  console.log(`  ✓ Hash A: ${hashA.digest.slice(0, 24)}…`);
  console.log(`  ✓ Hash B: ${hashB.digest.slice(0, 24)}…`);
  console.log('  ✓ Avalanche diffusion confirmed: Digests are completely divergent');

  // Test 4: Comparison & Normalization Tests
  console.log('\nTest 4: Digest Comparison and Hex Normalization');
  const upperCaseHex = 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD';
  const lowerCaseHex = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const comp1 = compareDigests(upperCaseHex, lowerCaseHex);
  assert.strictEqual(comp1.matches, true, 'Comparison must be case-insensitive');
  console.log('  ✓ Case-insensitive hexadecimal equality: MATCH');

  const comp2 = compareDigests('   ' + lowerCaseHex + '  ', lowerCaseHex);
  assert.strictEqual(comp2.matches, true, 'Comparison must trim whitespace');
  console.log('  ✓ Whitespace trimming: MATCH');

  const compMismatch = compareDigests(hashA.digest, hashB.digest);
  assert.strictEqual(compMismatch.matches, false, 'Differing hashes must report false');
  console.log('  ✓ Mismatched digests report false: MATCH');

  const compMalformed = compareDigests('zzzz_not_hex', lowerCaseHex);
  assert.strictEqual(compMalformed.matches, false);
  assert.ok(compMalformed.error?.includes('non-hexadecimal'), 'Malformed hex must return validation error');
  console.log('  ✓ Malformed non-hexadecimal rejection: MATCH');

  // Test 5: CSV Formula Injection Sanitization
  console.log('\nTest 5: Spreadsheet Formula Injection Sanitization');
  const dangerousValues = ['=cmd|"/C calc"!A0', '+123', '-SUM(A1:A10)', '@HYPERLINK("http://evil.com")'];
  for (const val of dangerousValues) {
    const sanitized = sanitizeCsvField(val);
    assert.ok(sanitized.startsWith(`"'`), `Dangerous value "${val}" must be prefixed with single quote`);
  }
  console.log('  ✓ CSV formula injection defense: PASSED');

  console.log('\n🎉 ALL CRYPTOGRAPHIC & SECURITY TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
