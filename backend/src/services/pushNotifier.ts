/**
 * Push Notifier
 *
 * Sends Web Push notifications (VAPID) to all subscribed devices for a user.
 * VAPID keys must be set in environment variables:
 *   VAPID_PUBLIC_KEY  — base64url
 *   VAPID_PRIVATE_KEY — base64url
 *   VAPID_SUBJECT     — mailto:admin@example.com
 *
 * Generate keys once with:
 *   node -e "const wp=require('web-push'); console.log(wp.generateVAPIDKeys())"
 */

import webPush from 'web-push';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { pushSubscriptions } from '../db/schema.js';

let _configured = false;

function ensureConfigured(): void {
  if (_configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT ?? 'mailto:admin@multivohub.com';
  if (!pub || !priv) {
    console.warn('[pushNotifier] VAPID keys not set — push notifications disabled');
    return;
  }
  webPush.setVapidDetails(sub, pub, priv);
  _configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;    // where to navigate on click
  tag?: string;    // deduplication key
}

/**
 * Send a push notification to all registered devices for the given internal userId.
 * Silently removes stale/expired subscriptions.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  ensureConfigured();
  if (!_configured) return;

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  if (!subs.length) return;

  const message = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription expired / unregistered on client
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }),
  );
}
