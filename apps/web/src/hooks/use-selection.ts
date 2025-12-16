import { useCallback, useState } from "react";

/**
 * Hook for managing row selection in tables
 * Provides selection state and helper functions for bulk actions
 */
export function useSelection<T extends { id: string }>(items: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
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

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length && items.length > 0) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isPartiallySelected =
    selectedIds.size > 0 && selectedIds.size < items.length;
  const selectedCount = selectedIds.size;
  const hasSelection = selectedIds.size > 0;

  // Get the selected items (useful for bulk operations)
  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  // Get array of selected IDs
  const selectedIdsArray = Array.from(selectedIds);

  return {
    selectedIds,
    selectedIdsArray,
    selectedItems,
    selectedCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    selectAll,
  };
}
