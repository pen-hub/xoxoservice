'use client';

import { ColumnSetting } from '@/types';
import { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';

interface UseColumnOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultColumns: TableColumnsType<any>;
  storageKey?: string;
}

const useColumn = ({ defaultColumns, storageKey }: UseColumnOptions) => {
  // Initialize default columns

  const getDefaultColumns = () =>
    defaultColumns.map((col) => ({
      key: col.key?.toString() || '',
      title: typeof col.title === 'string' ? col.title : '',
      visible: true,
    }));

  // Load from localStorage if storageKey is provided
  const [columnsCheck, setColumnsCheck] = useState<ColumnSetting[]>(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as ColumnSetting[];
          // Validate and merge with default columns
          const defaultCols = getDefaultColumns();
          return defaultCols.map((defaultCol) => {
            const savedCol = parsed.find((c) => c.key === defaultCol.key);
            return savedCol
              ? { ...defaultCol, visible: savedCol.visible }
              : defaultCol;
          });
        }
      } catch (error) {
        console.error('Error loading column settings from localStorage:', error);
      }
    }
    return getDefaultColumns();
  });

  // Save to localStorage whenever columnsCheck changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(columnsCheck));
      } catch (error) {
        console.error('Error saving column settings to localStorage:', error);
      }
    }
  }, [columnsCheck, storageKey]);

  const updateColumns = (newColumns: ColumnSetting[]) => {
    setColumnsCheck(newColumns);
  };

  const toggleColumn = (key: string) => {
    setColumnsCheck((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };


  const resetColumns = () => {
    const defaultCols = getDefaultColumns();
    setColumnsCheck(defaultCols);
    // Clear localStorage when resetting
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Error clearing column settings from localStorage:', error);
      }
    }
  };

  const getVisibleColumns = () => {
    return defaultColumns.filter((col) => {
      const setting = columnsCheck.find((c) => c.key === col.key);
      return setting?.visible ?? true;
    });
  };

  return {
    columnsCheck,
    updateColumns,
    toggleColumn,
    resetColumns,
    getVisibleColumns,
  };
};

export default useColumn;
