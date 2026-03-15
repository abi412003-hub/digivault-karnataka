import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useFormDraft — persists form state to localStorage with debounced auto-save.
 *
 * Returns [form, setField, clearDraft, setMultiple, lastSaved]
 */
export function useFormDraft<T extends Record<string, any>>(
  draftKey: string,
  defaultValues: T
): [T, (field: keyof T, value: any) => void, () => void, (values: Partial<T>) => void, Date | null] {
  const storageKey = `edv_draft_${draftKey}`;

  const [form, setForm] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultValues, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return defaultValues;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(form));
        setLastSaved(new Date());
      } catch {
        /* quota exceeded */
      }
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, storageKey]);

  const setField = useCallback((field: keyof T, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setMultiple = useCallback((values: Partial<T>) => {
    setForm((prev) => ({ ...prev, ...values }));
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return [form, setField, clearDraft, setMultiple, lastSaved];
}

/** Check if a draft exists for a given key */
export function hasDraft(draftKey: string): boolean {
  return !!localStorage.getItem(`edv_draft_${draftKey}`);
}
