import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { compareDigests, HashAlgorithm, ALGORITHM_REGISTRY } from '../../lib/crypto/hasher';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  Copy,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Info,
  ClipboardPaste,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const CompareView: React.FC = () => {
  const { comparePrefill, setComparePrefill, setCurrentView, setAiExplainPrefill, addToast } = useApp();

  const [hashA, setHashA] = useState<string>('');
  const [hashB, setHashB] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<{
    performed: boolean;
    matches: boolean;
    cleanA: string;
    cleanB: string;
    error?: string;
  } | null>(null);

  // Apply prefill if provided
  useEffect(() => {
    if (comparePrefill) {
      if (comparePrefill.hashA) setHashA(comparePrefill.hashA);
      if (comparePrefill.hashB) setHashB(comparePrefill.hashB);
      // Clear prefill so user can modify freely
      setComparePrefill(null);
    }
  }, [comparePrefill, setComparePrefill]);

  const handleCompare = () => {
    if (!hashA.trim() || !hashB.trim()) {
      setComparisonResult({
        performed: true,
        matches: false,
        cleanA: hashA.trim().toLowerCase(),
        cleanB: hashB.trim().toLowerCase(),
        error: 'Please enter both Hash A and Hash B to perform comparison.',
      });
      return;
    }

    const res = compareDigests(hashA, hashB);
    setComparisonResult({
      performed: true,
      matches: res.matches,
      cleanA: res.cleanA,
      cleanB: res.cleanB,
      error: res.error,
    });

    if (res.matches) {
      addToast({
        type: 'success',
        title: 'Digests Match',
        message: 'The two cryptographic hash digests are identical.',
      });
    } else if (!res.error) {
      addToast({
        type: 'warning',
        title: 'Digest Mismatch',
        message: 'The two hashes do not match.',
      });
    }
  };

  const handlePasteA = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setHashA(text.trim());
    } catch {
      addToast({ type: 'error', title: 'Clipboard Access', message: 'Unable to read from clipboard.' });
    }
  };

  const handlePasteB = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setHashB(text.trim());
    } catch {
      addToast({ type: 'error', title: 'Clipboard Access', message: 'Unable to read from clipboard.' });
    }
  };

  const handleClear = () => {
    setHashA('');
    setHashB('');
    setComparisonResult(null);
  };

  // Detect likely algorithm based on hexadecimal string length
  const detectAlgorithmFromLength = (hexStr: string): string => {
    const len = hexStr.trim().length;
    if (len === 64) return 'Likely SHA-256 (256 bits)';
    if (len === 128) return 'Likely SHA-512 (512 bits)';
    if (len === 96) return 'Likely SHA-384 (384 bits)';
    if (len === 40) return 'Likely SHA-1 (160 bits, legacy)';
    if (len === 32) return 'Likely MD5 (128 bits, legacy)';
    return `${len} hex characters (${len * 4} bits)`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-sky-400" />
          Cryptographic Hash Comparison
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Case-insensitive hexadecimal digest equality check with bit-level validation and differential analysis.
        </p>
      </div>

      {/* Inputs Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hash A Card */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="rounded bg-sky-500/10 px-2 py-0.5 text-sky-400 border border-sky-500/30 font-mono">
                Hash A
              </span>
              Reference Digest
            </span>
            <button
              onClick={handlePasteA}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300 transition-colors"
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </button>
          </div>

          <textarea
            value={hashA}
            onChange={(e) => {
              setHashA(e.target.value);
              setComparisonResult(null);
            }}
            placeholder="Paste expected or reference hash (e.g. e3b0c44298fc1c149afbf4c8...)"
            rows={4}
            className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Length: {hashA.trim().length} chars</span>
            <span>{hashA.trim() ? detectAlgorithmFromLength(hashA) : 'No digest'}</span>
          </div>
        </div>

        {/* Hash B Card */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="rounded bg-violet-500/10 px-2 py-0.5 text-violet-400 border border-violet-500/30 font-mono">
                Hash B
              </span>
              Target Digest
            </span>
            <button
              onClick={handlePasteB}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-violet-300 transition-colors"
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </button>
          </div>

          <textarea
            value={hashB}
            onChange={(e) => {
              setHashB(e.target.value);
              setComparisonResult(null);
            }}
            placeholder="Paste computed or target hash to compare against..."
            rows={4}
            className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Length: {hashB.trim().length} chars</span>
            <span>{hashB.trim() ? detectAlgorithmFromLength(hashB) : 'No digest'}</span>
          </div>
        </div>
      </div>

      {/* Compare Button & Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0f1422] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear Both
        </button>

        <button
          onClick={handleCompare}
          disabled={!hashA.trim() || !hashB.trim()}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <GitCompare className="h-4 w-4" /> Compare Digests
        </button>
      </div>

      {/* Comparison Results Card */}
      {comparisonResult && comparisonResult.performed && (
        <div
          className={`rounded-xl border p-5 transition-all ${
            comparisonResult.error
              ? 'border-amber-500/40 bg-amber-950/20'
              : comparisonResult.matches
              ? 'border-emerald-500/50 bg-[#091914]'
              : 'border-rose-500/50 bg-[#190a10]'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {comparisonResult.error ? (
                <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              ) : comparisonResult.matches ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              )}

              <div>
                <h3
                  className={`text-base font-bold ${
                    comparisonResult.error
                      ? 'text-amber-300'
                      : comparisonResult.matches
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                >
                  {comparisonResult.error
                    ? 'Comparison Incomplete'
                    : comparisonResult.matches
                    ? 'MATCH: Cryptographic Digests Are Identical'
                    : 'MISMATCH: Cryptographic Digests Do Not Match'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {comparisonResult.error
                    ? comparisonResult.error
                    : comparisonResult.matches
                    ? 'Both hexadecimal outputs match byte-for-byte across all positions under case-insensitive evaluation.'
                    : 'The two outputs differ. Even a single modified bit in the input produces a completely dissimilar hash due to the avalanche effect.'}
                </p>
              </div>
            </div>

            {comparisonResult.matches && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-300 border border-emerald-500/30">
                100% IDENTICAL
              </span>
            )}
          </div>

          {/* Detailed Side-by-Side Normalized Breakdown */}
          {!comparisonResult.error && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Normalized A:
                </span>
                <div className="rounded bg-[#080b11] p-2.5 font-mono text-xs text-slate-300 break-all select-all">
                  {comparisonResult.cleanA}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Normalized B:
                </span>
                <div className="rounded bg-[#080b11] p-2.5 font-mono text-xs text-slate-300 break-all select-all">
                  {comparisonResult.cleanB}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational Notice (Requirement from spec) */}
      <div className="rounded-xl border border-slate-800 bg-[#0c101a] p-4 text-xs text-slate-400 space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info className="h-4 w-4 text-sky-400" />
          Cryptographic Principle: Digest Equality vs File Authenticity
        </div>
        <p>
          Equal cryptographic hashes confirm that the two evaluated byte sequences produce identical digest outputs under the selected algorithm.
        </p>
        <p className="text-slate-400">
          <strong>Important caveat:</strong> Checksum matching proves data integrity against accidental corruption or modifications, but <span className="text-slate-300">does not mathematically prove who created the file</span> or whether the publishing source is trustworthy. For authenticated authorship and origin verification, an asymmetric digital signature (e.g. Ed25519, RSA-PSS, PGP) is required.
        </p>
      </div>
    </div>
  );
};
