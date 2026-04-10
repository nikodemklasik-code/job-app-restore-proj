/**
 * usePushNotifications — React hook for Web Push subscription management.
 *
 * Usage:
 *   const { isSupported, isSubscribed, subscribe, unsubscribe, loading } = usePushNotifications(userId);
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

/** Convert a VAPID base64url public key to a Uint8Array for PushManager */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export interface UsePushNotificationsResult {
  isSupported: boolean;
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function usePushNotifications(userId: string): UsePushNotificationsResult {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  // Check server-side subscription status
  const { data: statusData } = api.push.isSubscribed.useQuery(
    { userId },
    { enabled: !!userId },
  );

  useEffect(() => {
    if (statusData) setIsSubscribed(statusData.subscribed);
  }, [statusData]);

  const subscribeMutation = api.push.subscribe.useMutation();
  const unsubscribeMutation = api.push.unsubscribe.useMutation();
  const { data: keyData } = api.push.getPublicKey.useQuery(undefined, { enabled: isSupported });

  const subscribe = useCallback(async () => {
    if (!isSupported || !keyData?.publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      const json = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        userId,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      setIsSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setLoading(false);
    }
  }, [isSupported, keyData, userId, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribeMutation.mutateAsync({ userId, endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unsubscribe failed');
    } finally {
      setLoading(false);
    }
  }, [isSupported, userId, unsubscribeMutation]);

  return { isSupported, isSubscribed, subscribe, unsubscribe, loading, error };
}
