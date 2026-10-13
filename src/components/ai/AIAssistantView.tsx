import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  explainAlgorithmWithAI,
  explainHashWithAI,
  recommendAlgorithmWithAI,
  askEducationalAI,
  generateCryptographicReportWithAI,
} from '../../lib/ai/geminiClient';
import {
  Sparkles,
  Bot,
  Key,
  ShieldCheck,
  HelpCircle,
  FileText,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { HashAlgorithm } from '../../lib/crypto/hasher';

export const AIAssistantView: React.FC = () => {
  const { aiExplainPrefill, setAiExplainPrefill, records, addToast } = useApp();

  type TabType = 'explain-algo' | 'explain-digest' | 'recommend' | 'tutor' | 'report';
  const [activeTab, setActiveTab] = useState<TabType>('explain-algo');

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab 1: Explain Algorithm State
  const [selectedAlgo, setSelectedAlgo] = useState<HashAlgorithm>('SHA-256');
  const [algoExplanation, setAlgoExplanation] = useState<string>('');

  // Tab 2: Explain Digest State
  const [digestInput, setDigestInput] = useState<string>('');
  const [digestAlgo, setDigestAlgo] = useState<string>('SHA-256');
  const [digestExplanation, setDigestExplanation] = useState<string>('');

  // Tab 3: Recommend Algorithm State
  const [useCaseText, setUseCaseText] = useState<string>('User Authentication & Password Storage');
  const [constraintsText, setConstraintsText] = useState<string>('Prevent GPU brute-force attacks');
  const [performanceImportance, setPerformanceImportance] = useState<string>('Maximum Security');
  const [recommendationResult, setRecommendationResult] = useState<string>('');

  // Tab 4: Interactive Tutor State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: `Hello! I am your Cryptographic AI Assistant powered by Google Gemini. I can explain hashing mathematics, the avalanche effect, collision resistance, why SHA-256 is unsafe for passwords, or how digital signatures differ from checksums. How can I help you today?`,
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Tab 5: AI Report State
  const [reportType, setReportType] = useState<string>('Cryptographic Integrity & Posture Review');
  const [focusNotes, setFocusNotes] = useState<string>('Analysis of recent operations and legacy algorithm risks');
  const [reportResult, setReportResult] = useState<string>('');

  // Apply prefill if provided
  useEffect(() => {
    if (aiExplainPrefill) {
      if (aiExplainPrefill.digest) {
        setActiveTab('explain-digest');
        setDigestInput(aiExplainPrefill.digest);
        if (aiExplainPrefill.algorithm) setDigestAlgo(aiExplainPrefill.algorithm);
      } else if (aiExplainPrefill.algorithm) {
        setActiveTab('explain-algo');
        setSelectedAlgo(aiExplainPrefill.algorithm as HashAlgorithm);
      }
      setAiExplainPrefill(null);
    }
  }, [aiExplainPrefill, setAiExplainPrefill]);

  // Handler for Tab 1: Explain Algorithm
  const handleExplainAlgorithm = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await explainAlgorithmWithAI(selectedAlgo);
      setAlgoExplanation(res.explanation);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve explanation.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for Tab 2: Explain Digest
  const handleExplainDigest = async () => {
    if (!digestInput.trim()) {
      addToast({ type: 'warning', title: 'Digest Required', message: 'Enter a hexadecimal digest to analyze.' });
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await explainHashWithAI({
        algorithm: digestAlgo,
        digest: digestInput.trim(),
      });
      setDigestExplanation(res.explanation);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to analyze digest.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for Tab 3: Recommend Algorithm
  const handleRecommendAlgorithm = async () => {
    if (!useCaseText.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await recommendAlgorithmWithAI({
        useCase: useCaseText.trim(),
        constraints: constraintsText.trim(),
        performanceImportance,
      });
      setRecommendationResult(res.recommendation);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate recommendation.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for Tab 4: Interactive Tutor
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setErrorMessage(null);

    const updatedHistory = [...chatMessages, { role: 'user' as const, text: userMsg }];
    setChatMessages(updatedHistory);
    setLoading(true);

    try {
      const res = await askEducationalAI(userMsg, chatMessages);
      setChatMessages([...updatedHistory, { role: 'model' as const, text: res.answer }]);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to query assistant.');
      setChatMessages([
        ...updatedHistory,
        {
          role: 'model' as const,
          text: `⚠️ I encountered an issue contacting the Gemini model: ${err instanceof Error ? err.message : 'Network error'}. Please verify your server's GEMINI_API_KEY.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for Tab 5: Generate Report
  const handleGenerateReport = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const summaryPayload = records.slice(0, 15).map((r) => ({
        algorithm: r.algorithm,
        inputType: r.input_type,
        operationType: r.operation_type,
        verificationStatus: r.verification_status,
        timestamp: r.created_at,
      }));

      const res = await generateCryptographicReportWithAI({
        reportType,
        recordsSummary: summaryPayload,
        focusNotes,
      });
      setReportResult(res.report);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate AI report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-violet-600/20 p-1.5 text-violet-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              AI Cryptographic Tutor & Advisor
            </h2>
            <p className="text-xs text-slate-400">
              Powered by Google Gemini 3.8. Mathematical insights, security guidance, and algorithm selection.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
        {[
          { id: 'explain-algo', label: 'Algorithm Deep Dive', icon: Key },
          { id: 'explain-digest', label: 'Digest Inspector', icon: ShieldCheck },
          { id: 'recommend', label: 'Algorithm Advisor', icon: Bot },
          { id: 'tutor', label: 'Interactive Q&A Tutor', icon: BookOpen },
          { id: 'report', label: 'AI Cryptographic Report', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'border border-slate-800 bg-[#0f1422] text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-[#190910] p-4 text-xs text-rose-300">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-200">Gemini Service Notification</div>
            <div className="mt-0.5">{errorMessage}</div>
            <div className="mt-1 text-[11px] text-slate-400">
              Note: Core hash calculation and verification continue working client-side even if the AI endpoint is offline.
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Algorithm Deep Dive */}
      {activeTab === 'explain-algo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-5 space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Choose Algorithm
              </label>
              <div className="space-y-2">
                {(['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1', 'MD5'] as HashAlgorithm[]).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => setSelectedAlgo(algo)}
                    className={`flex w-full items-center justify-between rounded-lg p-3 text-xs font-mono font-medium border transition-colors ${
                      selectedAlgo === algo
                        ? 'border-violet-500 bg-violet-950/30 text-violet-200 ring-1 ring-violet-500'
                        : 'border-slate-800 bg-[#0a0d16] text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{algo}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleExplainAlgorithm}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-all shadow-md shadow-violet-600/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Explain {selectedAlgo}
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-6 min-h-[360px]">
              {algoExplanation ? (
                <div className="prose prose-invert prose-xs max-w-none space-y-3 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {algoExplanation}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                  <Key className="h-8 w-8 mb-2 text-slate-600" />
                  <div className="text-xs font-medium text-slate-400">
                    Select an algorithm and click "Explain" for architectural analysis.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Digest Inspector */}
      {activeTab === 'explain-digest' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Hexadecimal Digest to Inspect
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Algorithm:</span>
                <select
                  value={digestAlgo}
                  onChange={(e) => setDigestAlgo(e.target.value)}
                  className="rounded border border-slate-800 bg-[#0a0d16] px-2 py-1 text-xs font-mono text-slate-200"
                >
                  <option value="SHA-256">SHA-256</option>
                  <option value="SHA-512">SHA-512</option>
                  <option value="SHA-384">SHA-384</option>
                  <option value="SHA-1">SHA-1</option>
                  <option value="MD5">MD5</option>
                </select>
              </div>
            </div>

            <textarea
              value={digestInput}
              onChange={(e) => setDigestInput(e.target.value)}
              placeholder="Paste hexadecimal hash string..."
              rows={3}
              className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
            />

            <button
              onClick={handleExplainDigest}
              disabled={loading || !digestInput.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-all shadow-md shadow-violet-600/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Inspect Digest Characteristics
            </button>
          </div>

          {digestExplanation && (
            <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-6 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {digestExplanation}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Algorithm Recommendation Engine */}
      {activeTab === 'recommend' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Use Case Questionnaire
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Intended Application / Use Case:</label>
                <input
                  type="text"
                  value={useCaseText}
                  onChange={(e) => setUseCaseText(e.target.value)}
                  placeholder="e.g. Password storage, file download verify, digital signature"
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2.5 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  onClick={() => setUseCaseText('User Authentication & Password Storage')}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Password Storage
                </button>
                <button
                  onClick={() => setUseCaseText('Large File Download Integrity')}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  File Integrity
                </button>
                <button
                  onClick={() => setUseCaseText('API Payload Tamper Detection & HMAC')}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  API Tamper Detection
                </button>
                <button
                  onClick={() => setUseCaseText('Legacy System Compatibility (Older Git/Systems)')}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Legacy System
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Security Priorities / Constraints:</label>
                <input
                  type="text"
                  value={constraintsText}
                  onChange={(e) => setConstraintsText(e.target.value)}
                  placeholder="e.g. Resistance against GPU cluster attacks, NIST FIPS compliance"
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2.5 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Performance vs Security Balance:</label>
                <select
                  value={performanceImportance}
                  onChange={(e) => setPerformanceImportance(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  <option value="Maximum Security (Zero Compromises)">Maximum Security</option>
                  <option value="Balanced Throughput & Cryptographic Rigor">Balanced</option>
                  <option value="High Throughput / Micro-second Processing">High Throughput</option>
                </select>
              </div>

              <button
                onClick={handleRecommendAlgorithm}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-all shadow-md shadow-violet-600/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Generate Tailored Recommendation
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-6 min-h-[380px]">
              {recommendationResult ? (
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {recommendationResult}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                  <Bot className="h-8 w-8 mb-2 text-slate-600" />
                  <div className="text-xs font-medium text-slate-400">
                    Complete the questionnaire to receive cryptographic recommendations.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Interactive Tutor Chat */}
      {activeTab === 'tutor' && (
        <div className="rounded-xl border border-slate-800 bg-[#0f1422] flex flex-col h-[520px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="h-7 w-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-2xl p-4 whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-[#0a0d16] border border-slate-800 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 text-xs text-slate-400 items-center">
                <div className="h-7 w-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <span>Gemini is formulating cryptographic response...</span>
              </div>
            )}
          </div>

          {/* Quick Questions Suggestions */}
          <div className="px-4 py-2 bg-[#0a0d16] border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 shrink-0">Prompts:</span>
            <button
              onClick={() => setChatInput('What is the avalanche effect and how do SHA-256 rounds ensure it?')}
              className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 shrink-0"
            >
              Avalanche Effect
            </button>
            <button
              onClick={() => setChatInput('Explain the difference between collision resistance and preimage resistance.')}
              className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 shrink-0"
            >
              Collisions vs Preimages
            </button>
            <button
              onClick={() => setChatInput('Why is SHA-256 completely unsuitable for hashing passwords?')}
              className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 shrink-0"
            >
              Password Hashing Pitfalls
            </button>
            <button
              onClick={() => setChatInput('How do digital signatures differ mathematically from hash checksums?')}
              className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 shrink-0"
            >
              Signatures vs Checksums
            </button>
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-[#0c101a] border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Ask any cryptographic question..."
              className="flex-1 rounded-xl border border-slate-800 bg-[#0a0d16] px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={loading || !chatInput.trim()}
              className="rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: AI Cryptographic Report */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Automated Security Audit Report
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generates an executive assessment based on {records.length} persisted records in your registry.
                </p>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-all shadow-md shadow-violet-600/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Generate Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Report Heading / Title:</label>
                <input
                  type="text"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Focus Notes:</label>
                <input
                  type="text"
                  value={focusNotes}
                  onChange={(e) => setFocusNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          {reportResult && (
            <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-6 text-xs text-slate-300 leading-relaxed whitespace-pre-line shadow-xl">
              {reportResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
