import { HashAlgorithm } from '../crypto/hasher';

export interface HashRecord {
  id: string;
  label: string | null;
  algorithm: HashAlgorithm;
  digest: string;
  input_type: 'text' | 'file';
  input_size_bytes: number | null;
  operation_type: 'generate' | 'verify' | 'compare';
  verification_status?: 'verified' | 'mismatch' | 'none' | null;
  file_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface HashStatistics {
  totalGenerated: number;
  generatedToday: number;
  filesVerified: number;
  savedRecords: number;
  verifiedCount: number;
  mismatchCount: number;
  algorithmDistribution: Record<HashAlgorithm, number>;
  inputTypeDistribution: { text: number; file: number };
}

const STORAGE_KEY = 'cryptohash_records_vault_v1';

function getStoredRecords(): HashRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored records:', err);
    return [];
  }
}

function persistRecords(records: HashRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to persist records to localStorage:', err);
  }
}

export async function fetchRecords(): Promise<HashRecord[]> {
  return getStoredRecords();
}

export async function insertRecord(record: Omit<HashRecord, 'id' | 'created_at'>): Promise<HashRecord> {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const newRecord: HashRecord = {
    ...record,
    id,
    created_at: now,
  };

  const existing = getStoredRecords();
  persistRecords([newRecord, ...existing]);
  return newRecord;
}

export async function deleteRecordById(id: string): Promise<boolean> {
  const existing = getStoredRecords();
  const filtered = existing.filter((r) => r.id !== id);
  persistRecords(filtered);
  return true;
}

export async function bulkDeleteRecordsByIds(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const existing = getStoredRecords();
  const idSet = new Set(ids);
  const filtered = existing.filter((r) => !idSet.has(r.id));
  persistRecords(filtered);
  return true;
}

export async function updateRecordLabel(id: string, label: string): Promise<boolean> {
  const existing = getStoredRecords();
  const updated = existing.map((r) => (r.id === id ? { ...r, label } : r));
  persistRecords(updated);
  return true;
}

export function clearAllRecords(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function importRecords(imported: HashRecord[]): Promise<number> {
  if (!Array.isArray(imported)) return 0;
  const existing = getStoredRecords();
  const existingIds = new Set(existing.map((r) => r.id));
  const newRecords: HashRecord[] = [];

  for (const item of imported) {
    if (item.digest && item.algorithm) {
      const id = item.id && !existingIds.has(item.id)
        ? item.id
        : 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      newRecords.push({
        ...item,
        id,
        created_at: item.created_at || new Date().toISOString(),
      });
      existingIds.add(id);
    }
  }

  persistRecords([...newRecords, ...existing]);
  return newRecords.length;
}

export function getStorageUsageBytes(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Blob([raw]).size : 0;
  } catch {
    return 0;
  }
}

export function computeStatistics(records: HashRecord[]): HashStatistics {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const stats: HashStatistics = {
    totalGenerated: records.length,
    generatedToday: 0,
    filesVerified: 0,
    savedRecords: records.length,
    verifiedCount: 0,
    mismatchCount: 0,
    algorithmDistribution: {
      'SHA-256': 0,
      'SHA-384': 0,
      'SHA-512': 0,
      'SHA-1': 0,
      'MD5': 0,
    },
    inputTypeDistribution: {
      text: 0,
      file: 0,
    },
  };

  for (const r of records) {
    const recordDate = new Date(r.created_at);
    if (recordDate >= todayStart) {
      stats.generatedToday++;
    }

    if (r.input_type === 'file') {
      stats.inputTypeDistribution.file++;
    } else {
      stats.inputTypeDistribution.text++;
    }

    if (r.algorithm in stats.algorithmDistribution) {
      stats.algorithmDistribution[r.algorithm]++;
    }

    if (r.operation_type === 'verify') {
      stats.filesVerified++;
      if (r.verification_status === 'verified') {
        stats.verifiedCount++;
      } else if (r.verification_status === 'mismatch') {
        stats.mismatchCount++;
      }
    }
  }

  return stats;
}
