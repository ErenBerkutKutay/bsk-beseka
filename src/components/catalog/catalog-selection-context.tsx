"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CatalogSelectionContextValue = {
  selectedIds: Set<string>;
  toggleProduct: (id: string) => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
};

const CatalogSelectionContext = createContext<CatalogSelectionContextValue | null>(null);

export function CatalogSelectionProvider({
  children,
  resetKey,
}: {
  children: ReactNode;
  resetKey: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [resetKey]);

  const toggleProduct = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const value = useMemo(
    () => ({
      selectedIds,
      toggleProduct,
      isSelected,
      selectedCount: selectedIds.size,
    }),
    [selectedIds, toggleProduct, isSelected],
  );

  return (
    <CatalogSelectionContext.Provider value={value}>{children}</CatalogSelectionContext.Provider>
  );
}

export function useCatalogSelection() {
  const ctx = useContext(CatalogSelectionContext);
  if (!ctx) {
    throw new Error("useCatalogSelection must be used within CatalogSelectionProvider");
  }
  return ctx;
}
