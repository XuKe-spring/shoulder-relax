import { useEffect, useRef, useCallback, useState } from "react";

export function useReminder(interval: number, enabled: boolean) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const regRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  // Register SW
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        regRef.current = reg;
      })
      .catch((err) => {
        console.warn("Service Worker 注册失败:", err);
      });
  }, []);

  // Sync settings to SW whenever interval or enabled changes
  useEffect(() => {
    const sw = regRef.current;
    if (!sw?.active) return;

    if (enabled && permission === "granted") {
      sw.active.postMessage({ type: "SCHEDULE", interval });
    } else {
      sw.active.postMessage({ type: "STOP" });
    }
  }, [interval, enabled, permission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch {
      return false;
    }
  }, []);

  return { permission, requestPermission };
}
