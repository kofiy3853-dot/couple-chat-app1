"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false);
      return;
    }

    setSupported(true);

    navigator.serviceWorker.ready.then((reg) => {
      registrationRef.current = reg;
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
        setPermission(Notification.permission);
        setLoading(false);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!registrationRef.current) return false;

    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") return false;

      const res = await fetch("/api/push/vapid-public-key");
      const data = await res.json();
      const publicKey = data.data?.publicKey;

      if (!publicKey) return false;

      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!registrationRef.current) return;

    try {
      const sub = await registrationRef.current.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/unsubscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
    }
  }, []);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
