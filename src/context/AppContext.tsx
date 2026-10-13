import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  HashRecord,
  HashStatistics,
  fetchRecords,
  computeStatistics,
  insertRecord,
  deleteRecordById,
  bulkDeleteRecordsByIds,
  updateRecordLabel,
  clearAllRecords,
  importRecords as importRecordsToStorage,
  getStorageUsageBytes,
} from '../lib/storage/recordRepository';
import { HashAlgorithm } from '../lib/crypto/hasher';

export type AppView =
  | 'dashboard'
  | 'hash'
  | 'compare'
  | 'verify'
  | 'history'
  | 'ai-assistant'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface UserPreferences {
  defaultAlgorithm: HashAlgorithm;
  defaultInputMode: 'text' | 'file';
  autoSaveHistory: boolean;
}

interface AppContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  records: HashRecord[];
  isLoadingRecords: boolean;
  refreshRecords: () => Promise<void>;
  saveNewRecord: (record: Omit<HashRecord, 'id' | 'created_at'>) => Promise<HashRecord>;
  deleteRecord: (id: string) => Promise<void>;
  bulkDeleteRecords: (ids: string[]) => Promise<void>;
  updateLabel: (id: string, label: string) => Promise<void>;
  clearHistory: () => void;
  importHistoryRecords: (records: HashRecord[]) => Promise<number>;
  storageUsageBytes: number;
  stats: HashStatistics;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  preferences: UserPreferences;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  // Cross-workspace shortcuts
  comparePrefill: { hashA?: string; hashB?: string } | null;
  setComparePrefill: (prefill: { hashA?: string; hashB?: string } | null) => void;
  verifyPrefill: { record?: HashRecord; digest?: string; algorithm?: HashAlgorithm } | null;
  setVerifyPrefill: (prefill: { record?: HashRecord; digest?: string; algorithm?: HashAlgorithm } | null) => void;
  aiExplainPrefill: { algorithm?: string; digest?: string; inputType?: 'text' | 'file'; inputSizeBytes?: number } | null;
  setAiExplainPrefill: (prefill: { algorithm?: string; digest?: string; inputType?: 'text' | 'file'; inputSizeBytes?: number } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PREFS_STORAGE_KEY = 'cryptohash_user_preferences_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [records, setRecords] = useState<HashRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [comparePrefill, setComparePrefill] = useState<{ hashA?: string; hashB?: string } | null>(null);
  const [verifyPrefill, setVerifyPrefill] = useState<{ record?: HashRecord; digest?: string; algorithm?: HashAlgorithm } | null>(null);
  const [aiExplainPrefill, setAiExplainPrefill] = useState<{ algorithm?: string; digest?: string; inputType?: 'text' | 'file'; inputSizeBytes?: number } | null>(null);
  const [storageUsageBytes, setStorageUsageBytes] = useState<number>(0);

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PREFS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
    return {
      defaultAlgorithm: 'SHA-256',
      defaultInputMode: 'text',
      autoSaveHistory: true,
    };
  });

  const updatePreferences = useCallback((newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4500;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const data = await fetchRecords();
      setRecords(data);
      setStorageUsageBytes(getStorageUsageBytes());
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  const saveNewRecord = useCallback(
    async (recordData: Omit<HashRecord, 'id' | 'created_at'>) => {
      const saved = await insertRecord(recordData);
      setRecords((prev) => [saved, ...prev]);
      setStorageUsageBytes(getStorageUsageBytes());
      return saved;
    },
    []
  );

  const deleteRecord = useCallback(async (id: string) => {
    await deleteRecordById(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setStorageUsageBytes(getStorageUsageBytes());
  }, []);

  const bulkDeleteRecords = useCallback(async (ids: string[]) => {
    await bulkDeleteRecordsByIds(ids);
    const idSet = new Set(ids);
    setRecords((prev) => prev.filter((r) => !idSet.has(r.id)));
    setStorageUsageBytes(getStorageUsageBytes());
  }, []);

  const updateLabel = useCallback(async (id: string, label: string) => {
    await updateRecordLabel(id, label);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));
    setStorageUsageBytes(getStorageUsageBytes());
  }, []);

  const clearHistory = useCallback(() => {
    clearAllRecords();
    setRecords([]);
    setStorageUsageBytes(0);
    addToast({
      type: 'success',
      title: 'Local Vault Cleared',
      message: 'All records have been removed from local storage.',
    });
  }, [addToast]);

  const importHistoryRecords = useCallback(
    async (imported: HashRecord[]) => {
      const count = await importRecordsToStorage(imported);
      await refreshRecords();
      return count;
    },
    [refreshRecords]
  );

  const stats = computeStatistics(records);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        records,
        isLoadingRecords,
        refreshRecords,
        saveNewRecord,
        deleteRecord,
        bulkDeleteRecords,
        updateLabel,
        clearHistory,
        importHistoryRecords,
        storageUsageBytes,
        stats,
        toasts,
        addToast,
        removeToast,
        preferences,
        updatePreferences,
        comparePrefill,
        setComparePrefill,
        verifyPrefill,
        setVerifyPrefill,
        aiExplainPrefill,
        setAiExplainPrefill,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
