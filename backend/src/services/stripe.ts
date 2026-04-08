import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.APP_URL ?? 'http://localhost:5173';

let _client: Stripe | null = null;

const getStripeClient = (): Stripe => {
  if (!_client) {
    if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');
    _client = new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' });
  }
  return _client;
};

export const createCheckoutSession = async (priceId: string, customerId: string | null, customerEmail: string): Promise<string> => {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId ?? undefined,
    customer_email: customerId ? undefined : customerEmail,
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing`,
  });
  if (!session.url) throw new Error('No checkout URL');
  return session.url;
};

export const createCustomerPortal = async (customerId: string): Promise<string> => {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
  });
  return session.url;
};
