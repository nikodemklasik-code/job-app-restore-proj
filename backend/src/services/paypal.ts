// PayPal Orders API v2 integration
// Env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE (sandbox|live)

const BASE_URL = () =>
  (process.env.PAYPAL_MODE ?? 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error('PayPal credentials not configured');

  const res = await fetch(`${BASE_URL()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error('Failed to get PayPal token');
  return data.access_token;
}

export async function createPayPalOrder(
  amount: string,
  currency: string = 'GBP',
  description: string = 'MultivoHub subscription',
): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount }, description }],
      application_context: {
        return_url: `${process.env.APP_URL ?? 'https://jobapp.multivohub.com'}/billing?paypal=success`,
        cancel_url: `${process.env.APP_URL ?? 'https://jobapp.multivohub.com'}/billing?paypal=cancel`,
      },
    }),
  });
  const order = await res.json() as { id?: string; links?: Array<{ rel: string; href: string }> };
  if (!order.id) throw new Error('Failed to create PayPal order');
  const approveUrl = order.links?.find((l) => l.rel === 'approve')?.href ?? '';
  return { id: order.id, approveUrl };
}

export async function capturePayPalOrder(orderId: string): Promise<{ success: boolean; captureId?: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json() as {
    status?: string;
    purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string }> } }>;
  };
  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  return { success: data.status === 'COMPLETED', captureId };
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}
