import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize Google Gemini SDK securely on the server
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    if (process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      return aiClient;
    }
    throw new Error('GEMINI_API_KEY is not configured on the server. Please verify your environment secrets.');
  }
  return aiClient;
}

// Resilient content generation helper with retry and model fallback
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}): Promise<string> {
  const ai = getGeminiClient();
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  let lastError: any = null;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response.text) return response.text;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isUnavailable = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
        if (isUnavailable && attempt === 0) {
          // Brief pause before retry
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        break; // try fallback model
      }
    }
  }

  // Parse error nicely if it's a nested JSON string
  let cleanMsg = lastError?.message || 'Gemini model is temporarily busy. Please retry in a few moments.';
  try {
    const parsed = JSON.parse(cleanMsg);
    if (parsed.error?.message) {
      cleanMsg = parsed.error.message;
    }
  } catch {}

  throw new Error(cleanMsg);
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Gemini Endpoint: Explain algorithm
app.post('/api/gemini/explain-algorithm', async (req: Request, res: Response) => {
  try {
    const { algorithm } = req.body;
    if (!algorithm || typeof algorithm !== 'string') {
      res.status(400).json({ error: 'Valid algorithm name is required.' });
      return;
    }

    const systemPrompt = `You are a distinguished cryptographic security educator.
Explain the cryptographic hash algorithm "${algorithm}" concisely, accurately, and professionally.
Cover:
1. Architectural background & design (e.g. Merkle–Damgård, internal block/word size).
2. Exact output digest length (bits & hex characters).
3. Primary real-world use cases.
4. Security profile, collision resistance, known vulnerabilities or cryptanalytic attacks (especially if deprecated like SHA-1 or MD5).
5. Safe modern alternatives if applicable.
Always emphasize that cryptographic hashes are one-way functions, not encryption, and that general hashes (like SHA-256) are inappropriate for password storage without slow key derivation functions (Argon2id, bcrypt, scrypt, PBKDF2).`;

    const explanation = await generateContentWithRetry({
      contents: `Provide an in-depth yet accessible technical breakdown of ${algorithm}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    res.json({
      algorithm,
      explanation,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query Gemini API';
    console.error('Gemini explain-algorithm error:', err);
    res.status(500).json({ error: errorMsg });
  }
});

// Gemini Endpoint: Explain hash result / output digest
app.post('/api/gemini/explain-hash', async (req: Request, res: Response) => {
  try {
    const { algorithm, digest, inputType, inputSizeBytes } = req.body;
    if (!algorithm || !digest) {
      res.status(400).json({ error: 'Algorithm and digest are required.' });
      return;
    }

    const prompt = `Analyze this cryptographic digest result:
- Algorithm: ${algorithm}
- Digest: ${digest}
- Digest character length: ${digest.length} hex characters (${digest.length * 4} bits)
- Input type: ${inputType || 'unknown'}
- Input size: ${inputSizeBytes != null ? inputSizeBytes + ' bytes' : 'unspecified'}

Explain to the user:
1. What this digest represents mathematically (a deterministic fixed-length fingerprint).
2. The format (hexadecimal base-16 notation).
3. Why this output cannot be reversed to uncover the original input (preimage resistance & entropy loss).
4. How even a 1-bit difference in the source creates an unrecognizable digest (avalanche effect).
5. Practical verification considerations for this specific algorithm.`;

    const explanation = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert cryptographic engineering educator. Keep explanations clear, rigorous, and visually readable with clean headings and bullets.',
        temperature: 0.2,
      },
    });

    res.json({
      explanation,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query Gemini API';
    console.error('Gemini explain-hash error:', err);
    res.status(500).json({ error: errorMsg });
  }
});

// Gemini Endpoint: Recommend algorithm for specific use case
app.post('/api/gemini/recommend', async (req: Request, res: Response) => {
  try {
    const { useCase, constraints, performanceImportance } = req.body;
    if (!useCase || typeof useCase !== 'string') {
      res.status(400).json({ error: 'Valid useCase description is required.' });
      return;
    }

    const prompt = `The user is designing an application or workflow and needs an algorithm recommendation.
Use Case: "${useCase}"
Constraints / Notes: "${constraints || 'None specified'}"
Performance Importance: "${performanceImportance || 'Balanced'}"

Provide a structured recommendation:
1. Recommended Algorithm(s) with reasoning.
2. Acceptable Alternatives.
3. Explicitly Forbidden or Dangerous Choices for this use case.
4. Security Pitfalls & Best Practices (CRITICAL: if password storage is mentioned, explicitly warn against SHA-256/SHA-512 and mandate Argon2id, scrypt, or bcrypt with salts).`;

    const recommendation = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction: 'You are an authoritative cybersecurity architect providing actionable cryptography recommendations.',
        temperature: 0.2,
      },
    });

    res.json({
      recommendation,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query Gemini API';
    console.error('Gemini recommend error:', err);
    res.status(500).json({ error: errorMsg });
  }
});

// Gemini Endpoint: Educational Q&A
app.post('/api/gemini/qa', async (req: Request, res: Response) => {
  try {
    const { question, history } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question text is required.' });
      return;
    }

    const systemPrompt = `You are the Cryptographic Hash Explorer Educational Assistant.
Your mission is to teach developers, students, and security professionals about:
- Hash functions & deterministic mappings
- Avalanche effect (diffusion)
- Preimage resistance (first and second preimage)
- Collision resistance & birthday paradox
- Checksums vs Cryptographic Hashes vs HMAC vs Digital Signatures (Asymmetric Public Key)
- Safe password hashing (Argon2id, scrypt, bcrypt, PBKDF2) vs fast general-purpose hashes
- Merkle trees, Git commit hashes, blockchain blocks, and data integrity verification.

Guidelines:
- Never disclose private keys or generate malicious exploitation scripts.
- Treat inputs neutrally and focus on cryptographic mechanics and defensive engineering.
- Provide crisp formatting with markdown headings, bullet points, and code/math blocks where helpful.`;

    const chatContents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        if (turn.role && turn.text) {
          chatContents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }],
          });
        }
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: question }],
    });

    const answer = await generateContentWithRetry({
      contents: chatContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    res.json({
      answer,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query Gemini API';
    console.error('Gemini QA error:', err);
    res.status(500).json({ error: errorMsg });
  }
});

// Gemini Endpoint: Generate Cryptographic Report
app.post('/api/gemini/report', async (req: Request, res: Response) => {
  try {
    const { reportType, recordsSummary, focusNotes } = req.body;

    const prompt = `Generate a formal, professional Cryptographic Assessment and Integrity Report:
Report Type: ${reportType || 'General Cryptographic Integrity Report'}
Total Operations Summarized: ${recordsSummary?.length || 0}
Focus Areas: ${focusNotes || 'Standard security review of observed hashing operations'}

Record Sample Data (Aggregated Non-Sensitive Metadata):
${JSON.stringify(recordsSummary?.slice(0, 15) || [], null, 2)}

Structure the report into:
1. Executive Summary & Purpose
2. Cryptographic Algorithm Distribution & Risk Evaluation (highlighting any legacy algorithms like SHA-1/MD5 vs secure modern standards)
3. Data Integrity & Verification Findings
4. Security Recommendations & Defensive Guidelines
5. Cryptographic Disclaimer (clarifying that digest matching confirms matching bytes but does not prove identity/provenance without a digital signature).`;

    const report = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction: 'You are a Senior Cyber Defense Auditor producing an audit-ready Cryptographic Report.',
        temperature: 0.2,
      },
    });

    res.json({
      report,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query Gemini API';
    console.error('Gemini report error:', err);
    res.status(500).json({ error: errorMsg });
  }
});

// Vite Middleware for Development / Static serving for Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cryptographic Hash Explorer server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
