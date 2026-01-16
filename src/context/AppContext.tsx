import * as SQLite from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Tag = {
  id: string;
  label: string;
  usageCount: number;
  successCount: number;
};

export type NumberMapping = {
  id: string;
  number: string;
  tags: Tag[];
};

export type Difficulty = 'Easy' | 'Moderate' | 'Hard' | 'Expert';

export type TestResult = {
  id: string;
  date: string;
  difficulty: Difficulty;
  successRate: number;
};

export type AppState = {
  mappings: Record<string, NumberMapping>;
  tests: TestResult[];
};

type AppContextValue = {
  state: AppState;
  addTag: (numberValue: string, label: string) => string;
  updateTag: (numberValue: string, tagId: string, label: string) => void;
  recordTest: (result: TestResult, usedTags: Array<{ numberValue: string; tagId: string; correct: boolean }>) => void;
};

const INITIAL_STATE: AppState = {
  mappings: {},
  tests: [],
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const database = SQLite.openDatabase('renumber.db');

const generateNumbers = () => {
  const numbers: string[] = [];
  for (let length = 1; length <= 3; length += 1) {
    const limit = Math.pow(10, length);
    for (let i = 0; i < limit; i += 1) {
      numbers.push(i.toString().padStart(length, '0'));
    }
  }
  return numbers;
};

const hydrateMappings = (): Record<string, NumberMapping> => {
  const mappings: Record<string, NumberMapping> = {};
  generateNumbers().forEach((value) => {
    mappings[value] = { id: value, number: value, tags: [] };
  });
  return mappings;
};

const migrateDatabase = () => {
  database.transaction((tx) => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);'
    );
  });
};

const loadState = (): Promise<AppState | null> => {
  return new Promise((resolve) => {
    database.transaction((tx) => {
      tx.executeSql(
        'SELECT value FROM kv WHERE key = ?;',
        ['appState'],
        (_, result) => {
          if (result.rows.length === 0) {
            resolve(null);
            return;
          }
          const stored = result.rows.item(0).value as string;
          resolve(JSON.parse(stored));
        },
        () => {
          resolve(null);
          return true;
        }
      );
    });
  });
};

const saveState = (state: AppState) => {
  database.transaction((tx) => {
    tx.executeSql(
      'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?);',
      ['appState', JSON.stringify(state)]
    );
  });
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    migrateDatabase();
    loadState().then((stored) => {
      if (stored) {
        setState(stored);
      } else {
        setState({ ...INITIAL_STATE, mappings: hydrateMappings() });
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveState(state);
  }, [hydrated, state]);

  const addTag = useCallback((numberValue: string, label: string) => {
    const nextId = `${numberValue}-${Date.now()}`;
    setState((prev) => {
      const mapping = prev.mappings[numberValue];
      if (!mapping) {
        return prev;
      }
      const nextTag: Tag = {
        id: nextId,
        label,
        usageCount: 0,
        successCount: 0,
      };
      return {
        ...prev,
        mappings: {
          ...prev.mappings,
          [numberValue]: {
            ...mapping,
            tags: [...mapping.tags, nextTag],
          },
        },
      };
    });
    return nextId;
  }, []);

  const updateTag = useCallback((numberValue: string, tagId: string, label: string) => {
    setState((prev) => {
      const mapping = prev.mappings[numberValue];
      if (!mapping) {
        return prev;
      }
      return {
        ...prev,
        mappings: {
          ...prev.mappings,
          [numberValue]: {
            ...mapping,
            tags: mapping.tags.map((tag) =>
              tag.id === tagId
                ? {
                    ...tag,
                    label,
                  }
                : tag
            ),
          },
        },
      };
    });
  }, []);

  const recordTest = useCallback(
    (result: TestResult, usedTags: Array<{ numberValue: string; tagId: string; correct: boolean }>) => {
      setState((prev) => {
        const updatedMappings = { ...prev.mappings };
        usedTags.forEach(({ numberValue, tagId, correct }) => {
          const mapping = updatedMappings[numberValue];
          if (!mapping) {
            return;
          }
          updatedMappings[numberValue] = {
            ...mapping,
            tags: mapping.tags.map((tag) =>
              tag.id === tagId
                ? {
                    ...tag,
                    usageCount: tag.usageCount + 1,
                    successCount: tag.successCount + (correct ? 1 : 0),
                  }
                : tag
            ),
          };
        });

        return {
          ...prev,
          tests: [result, ...prev.tests],
          mappings: updatedMappings,
        };
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      state,
      addTag,
      updateTag,
      recordTest,
    }),
    [state, addTag, updateTag, recordTest]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const getTagRates = (tag: Tag, maxUsage: number) => {
  const usageRate = maxUsage === 0 ? 0 : Math.round((tag.usageCount / maxUsage) * 100);
  const successRate = tag.usageCount === 0 ? 0 : Math.round((tag.successCount / tag.usageCount) * 100);
  return { usageRate, successRate };
};

export const getMappingSuccess = (mapping: NumberMapping) => {
  if (mapping.tags.length === 0) {
    return 0;
  }
  const maxUsage = Math.max(0, ...mapping.tags.map((tag) => tag.usageCount));
  const scores = mapping.tags.map((tag) => getTagRates(tag, maxUsage).successRate);
  const total = scores.reduce((sum, value) => sum + value, 0);
  return Math.round(total / scores.length);
};

export const getMappedPercentage = (numbers: NumberMapping[]) => {
  if (numbers.length === 0) {
    return 0;
  }
  const mapped = numbers.filter((mapping) => mapping.tags.length > 0).length;
  return Math.round((mapped / numbers.length) * 100);
};
