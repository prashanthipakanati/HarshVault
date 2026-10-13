export interface ExplainAlgorithmResponse {
  algorithm: string;
  explanation: string;
  error?: string;
}

export interface ExplainHashResponse {
  explanation: string;
  error?: string;
}

export interface RecommendAlgorithmResponse {
  recommendation: string;
  error?: string;
}

export interface QAResponse {
  answer: string;
  error?: string;
}

export interface ReportResponse {
  report: string;
  error?: string;
}

export async function explainAlgorithmWithAI(algorithm: string): Promise<ExplainAlgorithmResponse> {
  const res = await fetch('/api/gemini/explain-algorithm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ algorithm }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to explain algorithm with AI');
  }
  return data;
}

export async function explainHashWithAI(params: {
  algorithm: string;
  digest: string;
  inputType?: 'text' | 'file';
  inputSizeBytes?: number;
}): Promise<ExplainHashResponse> {
  const res = await fetch('/api/gemini/explain-hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to explain hash digest with AI');
  }
  return data;
}

export async function recommendAlgorithmWithAI(params: {
  useCase: string;
  constraints?: string;
  performanceImportance?: string;
}): Promise<RecommendAlgorithmResponse> {
  const res = await fetch('/api/gemini/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate algorithm recommendation');
  }
  return data;
}

export async function askEducationalAI(
  question: string,
  history?: Array<{ role: 'user' | 'model'; text: string }>
): Promise<QAResponse> {
  const res = await fetch('/api/gemini/qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to ask educational assistant');
  }
  return data;
}

export async function generateCryptographicReportWithAI(params: {
  reportType: string;
  recordsSummary: unknown[];
  focusNotes?: string;
}): Promise<ReportResponse> {
  const res = await fetch('/api/gemini/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate cryptographic report');
  }
  return data;
}
