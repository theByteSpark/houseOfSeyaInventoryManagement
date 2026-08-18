import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'houseOfSeya:selectedWarehouseId';

interface WarehouseContextValue {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (id: string | null) => void;
}

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

function loadInitialWarehouseId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [selectedWarehouseId, setSelectedWarehouseIdState] = useState<string | null>(loadInitialWarehouseId);

  useEffect(() => {
    try {
      if (selectedWarehouseId) {
        localStorage.setItem(STORAGE_KEY, selectedWarehouseId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, [selectedWarehouseId]);

  const setSelectedWarehouseId = (id: string | null) => setSelectedWarehouseIdState(id);

  return (
    <WarehouseContext.Provider value={{ selectedWarehouseId, setSelectedWarehouseId }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouseContext() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouseContext must be used within a WarehouseProvider');
  return ctx;
}
