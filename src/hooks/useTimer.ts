import { useState, useRef, useCallback, useEffect } from "react";

export function useTimer(onTick?: (remaining: number) => void) {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clear();
      setRemaining(seconds);
      setRunning(true);

      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          onTickRef.current?.(next);
          if (next <= 0) {
            clear();
            setRunning(false);
          }
          return next;
        });
      }, 1000);
    },
    [clear]
  );

  const pause = useCallback(() => {
    clear();
    setRunning(false);
  }, [clear]);

  const resume = useCallback(() => {
    if (remaining > 0) {
      start(remaining);
    }
  }, [remaining, start]);

  const stop = useCallback(() => {
    clear();
    setRemaining(0);
    setRunning(false);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { remaining, running, start, pause, resume, stop };
}
