# Cryptographic Hash Explorer

> Production-grade cryptographic hash exploration, integrity verification, digest comparison, and AI-powered cryptographic education with 100% private in-browser local storage.

---

## 🔒 Overview

**Cryptographic Hash Explorer** is a high-assurance cybersecurity and developer utility built for students, software engineers, security analysts, and researchers. It allows users to compute deterministic cryptographic digests client-side, verify file integrity against published checksums, compare hashes with bit-level validation, and consult Google Gemini for mathematical insights and architectural recommendations.

### Core Capabilities

- **Zero-Remote-Upload Hashing:** Computes cryptographic digests directly in the browser using the Web Crypto API (`crypto.subtle.digest()`) and in-memory ArrayBuffer processing. Binary files never touch a remote server for hashing.
- **Supported Cryptographic Algorithms:**
  - `SHA-256` (NIST FIPS 180-4 standard, 256 bits, 64 hex characters)
  - `SHA-384` (NIST FIPS 180-4 standard, 384 bits, 96 hex characters)
  - `SHA-512` (NIST FIPS 180-4 standard, 512 bits, 128 hex characters)
  - `SHA-1` (Explicitly labeled legacy algorithm with collision warning)
  - `MD5` (Explicitly labeled broken checksum for compatibility only)
- **Hash Comparison Workspace:** Case-insensitive comparison with character normalization and differential length checking.
- **Integrity Verification:** Dual-workflow verification against expected vendor checksums or previously saved history records.
- **100% Private Local Storage Vault:**
  - All operations, labels, and records are persisted directly to the user's browser `localStorage`.
  - Zero external database dependencies, zero tracking, zero remote accounts required.
  - In-app JSON Backup export and Restore / Import capability.
  - Quota and byte usage monitoring with one-click wipe.
- **Google Gemini 3.8 AI Assistant:** Server-side integration using `@google/genai` providing algorithm deep dives, digest inspection, use-case recommendations, password security warnings, interactive Q&A, and audit report generation.
- **Audit & Export Tools:** Formula-injection-sanitized CSV export, structured JSON, standard checksum manifests (`sha256sum` style), and printable audit sheets.
- **Automated Self-Test Suite:** Validates against official NIST & RFC test vectors in-app and via CLI.

---

## 🛠️ Architecture

```
cryptographic-hash-explorer/
├── server.ts                       # Express backend + Gemini SDK server routes + Vite middleware
├── index.html                      # HTML entry with metadata and developer typography
├── metadata.json                   # Applet metadata with server capability declaration
├── src/
│   ├── App.tsx                     # Main application layout and view router
│   ├── main.tsx                    # React DOM root entry
│   ├── index.css                   # Tailwind CSS styling with developer dark theme
│   ├── context/
│   │   └── AppContext.tsx          # Global state, local persistence, toasts, preferences
│   ├── lib/
│   │   ├── crypto/
│   │   │   ├── hasher.ts           # Web Crypto hashing engine, registry, test vectors
│   │   │   └── md5.ts              # RFC 1321 pure-JS MD5 implementation for client-side hashing
│   │   ├── storage/
│   │   │   └── recordRepository.ts # Pure local storage repository with backup/restore
│   │   ├── ai/
│   │   │   └── geminiClient.ts     # Client API wrapper for server-side Gemini routes
│   │   └── utils/
│   │       └── exportUtils.ts      # CSV, JSON, Text export with formula injection sanitization
│   └── components/
│       ├── layout/                 # Header, Sidebar, ToastContainer
│       ├── dashboard/              # Mission Control dashboard & real analytics
│       ├── hash/                   # Text & file hash generation workspace
│       ├── compare/                # Hash comparison workspace
│       ├── verify/                 # Expected & reference integrity verification
│       ├── history/                # History registry with search, filter, bulk delete
│       ├── ai/                     # Google Gemini AI assistant & tutor
│       ├── reports/                # Export workspace & printable audit sheet
│       └── settings/               # Preferences, local vault backup/restore, NIST tests
└── tests/
    └── hasher.test.ts              # Automated test suite (NIST vectors, Unicode, avalanche)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or pnpm

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your configuration variables:
- `GEMINI_API_KEY`: Required for AI tutor features.

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 4. Run Automated Tests

```bash
npm test
```

### 5. Production Build

```bash
npm run build
```

---

## 🤖 Google Gemini AI Integration

All Gemini API calls are securely proxied through the server (`server.ts`) using the official `@google/genai` TypeScript SDK and the `gemini-3.8-flash` model (with automatic retry and `gemini-3.1-flash-lite` fallback). The API key is kept strictly on the backend and is never exposed to the client.

Core AI endpoints:
- `POST /api/gemini/explain-algorithm`
- `POST /api/gemini/explain-hash`
- `POST /api/gemini/recommend`
- `POST /api/gemini/qa`
- `POST /api/gemini/report`

If `GEMINI_API_KEY` is not provided or unavailable, all core cryptographic operations (hashing, comparison, verification, history, exports) remain 100% operational.

---

## 🛡️ Security Guarantees & Cryptographic Notes

1. **Hashing is NOT Encryption:** Cryptographic hashes are one-way irreversible functions. They cannot be decrypted to reveal the original input.
2. **Password Storage Warning:** General-purpose fast hashes (such as SHA-256 and SHA-512) are **not safe** for password storage without slow, memory-hard key derivation functions. The application strictly recommends **Argon2id**, **scrypt**, or **bcrypt**.
3. **Integrity vs Authenticity:** A matching checksum proves that data has not changed compared to the reference hash. It does **not** prove authenticity or identity without a public-key asymmetric digital signature (e.g., Ed25519, GPG, RSA-PSS).
4. **Formula Injection Sanitization:** CSV exports sanitize strings beginning with `=`, `+`, `-`, `@`, `\t`, and `\r` to prevent remote formula execution attacks in spreadsheet applications.

---

## 📜 License

Apache-2.0
