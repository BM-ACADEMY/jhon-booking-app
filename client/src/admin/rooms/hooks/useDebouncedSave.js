import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Generic "debounce then persist" helper used for the config sheet autosave.
 * `schedule(fn)` restarts the idle timer; when it elapses `fn` runs once and
 * the reported status moves idle -> saving -> saved (or error).
 */
export const useDebouncedSave = (delay = 800) => {
  const [status, setStatus] = useState('idle'); // idle | pending | saving | saved | error
  const timerRef = useRef(null);
  const savedTimerRef = useRef(null);
  const runningRef = useRef(false);
  const pendingFnRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    timerRef.current = null;
    savedTimerRef.current = null;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const run = useCallback(async (fn) => {
    if (runningRef.current) {
      // Coalesce: remember the latest request and replay it once the current one finishes.
      pendingFnRef.current = fn;
      return;
    }
    runningRef.current = true;
    setStatus('saving');
    try {
      await fn();
      setStatus('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      toast.error(err?.response?.data?.message || 'Autosave failed');
    } finally {
      runningRef.current = false;
      const queued = pendingFnRef.current;
      pendingFnRef.current = null;
      if (queued) run(queued);
    }
  }, []);

  const schedule = useCallback((fn) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setStatus('pending');
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      run(fn);
    }, delay);
  }, [delay, run]);

  /** Fire immediately (used when the sheet closes with unsaved edits). */
  const flush = useCallback((fn) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    return run(fn);
  }, [run]);

  const cancel = useCallback(() => {
    clearTimers();
    setStatus('idle');
  }, [clearTimers]);

  return { status, schedule, flush, cancel, isPending: status === 'pending' || status === 'saving' };
};

export default useDebouncedSave;
