import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Hash,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Copy,
  CheckCircle2,
  FileText,
  FileCode,
  Sparkles,
  GitCompare,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { HashAlgorithm } from '../../lib/crypto/hasher';

export const DashboardView: React.FC = () => {
  const { records, stats, setCurrentView, setComparePrefill, setVerifyPrefill, setAiExplainPrefill, addToast } = useApp();

  const handleCopyDigest = (digest: string) => {
    navigator.clipboard.writeText(digest);
    addToast({
      type: 'success',
      title: 'Digest Copied',
      message: 'Hexadecimal hash copied to clipboard.',
    });
  };

  const recentRecords = records.slice(0, 7);

  // Compute percentage breakdown of algorithms
  const totalAlgos = Object.values(stats.algorithmDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-[#101426] via-[#13172e] to-[#0c1020] p-6 shadow-xl">
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cryptographic Engine Active (Web Crypto + Local Verification)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Cryptographic Mission Control
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Generate collision-resistant cryptographic digests, verify file integrity, compare hashes, and consult Google Gemini 3.8 for mathematical cryptography insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentView('hash')}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all hover:scale-[1.02]"
            >
              <Hash className="h-4 w-4" />
              Generate Hash
            </button>
            <button
              onClick={() => setCurrentView('verify')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Verify File Integrity
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Hashes */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Hashes Generated</span>
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {stats.totalGenerated}
            </span>
            <span className="text-xs text-slate-400">operations</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{stats.inputTypeDistribution.text} text</span>
            <span>•</span>
            <span>{stats.inputTypeDistribution.file} binary files</span>
          </div>
        </div>

        {/* Card 2: Hashes Today */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Generated Today</span>
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {stats.generatedToday}
            </span>
            <span className="text-xs text-slate-400">active today</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Real-time daily session activity
          </div>
        </div>

        {/* Card 3: Files Verified */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Integrity Checks</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {stats.filesVerified}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              {stats.verifiedCount} passed
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {stats.mismatchCount > 0 ? (
              <span className="text-rose-400 font-medium">{stats.mismatchCount} checksum mismatches</span>
            ) : (
              <span>0 checksum mismatches</span>
            )}
          </div>
        </div>

        {/* Card 4: Saved Records */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saved Registry Records</span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {stats.savedRecords}
            </span>
            <span className="text-xs text-slate-400">persisted</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Available for export & comparison
          </div>
        </div>
      </div>

      {/* Main Content Grid: Algorithm Usage & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Recent Cryptographic Operations
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                  {records.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Latest deterministic hashes and integrity checks</p>
            </div>
            {records.length > 0 && (
              <button
                onClick={() => setCurrentView('history')}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
              >
                View Registry <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c101a] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/10 text-violet-400 mb-3">
                <Hash className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-medium text-slate-200">No cryptographic operations yet</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Generate your first SHA-256 or SHA-512 hash from text or binary file to populate your mission control history.
              </p>
              <button
                onClick={() => setCurrentView('hash')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                <Hash className="h-3.5 w-3.5" />
                Launch Generator
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0f1422]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-[#0a0d16] text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Algorithm</th>
                      <th className="px-4 py-3">Digest (Shortened)</th>
                      <th className="px-4 py-3">Input Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentRecords.map((r) => {
                      const isLegacy = r.algorithm === 'SHA-1' || r.algorithm === 'MD5';
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono font-medium ${
                                isLegacy
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  : 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                              }`}
                            >
                              {r.algorithm}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                            <span className="text-violet-400">{r.digest.slice(0, 10)}</span>
                            <span className="text-slate-500">…</span>
                            <span className="text-slate-400">{r.digest.slice(-8)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                            <span className="capitalize">{r.input_type}</span>
                            {r.input_size_bytes != null && (
                              <span className="text-slate-500 ml-1">({r.input_size_bytes} B)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.verification_status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Verified
                              </span>
                            ) : r.verification_status === 'mismatch' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                                <ShieldAlert className="h-3 w-3" /> Mismatch
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Calculated</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                            {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                            <button
                              onClick={() => handleCopyDigest(r.digest)}
                              title="Copy Digest"
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setComparePrefill({ hashA: r.digest });
                                setCurrentView('compare');
                              }}
                              title="Send to Compare"
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-violet-300 transition-colors"
                            >
                              <GitCompare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAiExplainPrefill({
                                  algorithm: r.algorithm,
                                  digest: r.digest,
                                  inputType: r.input_type,
                                  inputSizeBytes: r.input_size_bytes || undefined,
                                });
                                setCurrentView('ai-assistant');
                              }}
                              title="Ask AI to Explain"
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-violet-400 transition-colors"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Algorithm Distribution & Quick Actions */}
        <div className="space-y-6">
          {/* Algorithm Distribution Breakdown */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5">
            <h3 className="text-sm font-semibold text-white">Algorithm Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real distribution across persisted records</p>

            {totalAlgos === 0 ? (
              <div className="mt-4 rounded-lg bg-[#0a0d16] p-4 text-center text-xs text-slate-500">
                No algorithm data yet. Hashes generated will populate this chart.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {(['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1', 'MD5'] as HashAlgorithm[]).map((algo) => {
                  const count = stats.algorithmDistribution[algo] || 0;
                  const pct = totalAlgos > 0 ? Math.round((count / totalAlgos) * 100) : 0;
                  const isLegacy = algo === 'SHA-1' || algo === 'MD5';

                  return (
                    <div key={algo} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-300 flex items-center gap-1.5">
                          {algo}
                          {isLegacy && (
                            <span className="text-[10px] text-amber-400">(legacy)</span>
                          )}
                        </span>
                        <span className="font-mono text-slate-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLegacy ? 'bg-amber-500' : algo === 'SHA-256' ? 'bg-violet-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5">
            <h3 className="text-sm font-semibold text-white">Quick Workflows</h3>
            <p className="text-xs text-slate-400 mt-0.5">Immediate cryptographic tasks</p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => setCurrentView('hash')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-[#0c101a] p-3 text-left text-xs font-medium text-slate-200 hover:border-violet-500/40 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Hash className="h-4 w-4 text-violet-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Text & File Hasher</div>
                    <div className="text-[11px] text-slate-400">SHA-256/384/512, SHA-1, MD5</div>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => setCurrentView('compare')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-[#0c101a] p-3 text-left text-xs font-medium text-slate-200 hover:border-violet-500/40 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <GitCompare className="h-4 w-4 text-sky-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Hash Comparison</div>
                    <div className="text-[11px] text-slate-400">Compare two digests for equality</div>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => setCurrentView('verify')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-[#0c101a] p-3 text-left text-xs font-medium text-slate-200 hover:border-violet-500/40 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Verify Checksum</div>
                    <div className="text-[11px] text-slate-400">Check file against expected hash</div>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => setCurrentView('ai-assistant')}
                className="flex w-full items-center justify-between rounded-lg border border-violet-500/30 bg-violet-950/20 p-3 text-left text-xs font-medium text-violet-200 hover:border-violet-400 hover:bg-violet-900/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <div>
                    <div className="font-semibold text-violet-200">Consult AI Tutor</div>
                    <div className="text-[11px] text-violet-300/70">Algorithm guidance & password warnings</div>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-violet-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
