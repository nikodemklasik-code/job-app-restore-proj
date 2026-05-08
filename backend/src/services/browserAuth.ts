/**
 * Playwright-based browser automation for Indeed + Gumtree session capture.
 * Flow for Indeed:
 *   1. startIndeedLogin(userId, email) → opens headless browser, enters email,
 *      detects if code is needed → returns { requiresCode, codeSentTo }
 *   2. submitIndeedCode(userId, code) → enters the OTP, waits for login,
 *      saves the storageState (cookies + localStorage) to DB
 *
 * For Gumtree: session captured via Google/Apple OAuth interactive flow
 * (opens visible browser, user completes OAuth, session auto-saved)
 *
 * For headless servers: uses chromium with --no-sandbox
 */

interface BrowserLoginState {
  storageState: unknown;
  page: unknown;
  browser: unknown;
  context: unknown;
}

// In-memory pending logins (expires after 10 min)
const pendingLogins = new Map<string, { state: BrowserLoginState; expiresAt: number }>();

function expiringKey(userId: string): string {
  return `indeed:${userId}`;
}

function cleanup() {
  const now = Date.now();
  for (const [k, v] of pendingLogins) {
    if (v.expiresAt < now) {
      const s = v.state;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s.browser as any)?.close?.().catch(() => { });
      pendingLogins.delete(k);
    }
  }
}
setInterval(cleanup, 60_000);

// Rotate through realistic user agents to reduce bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
];

function pickUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function launchBrowser() {
  // Dynamic import so the module loads even if playwright isn't installed
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: pickUserAgent(),
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    // Mask automation signals
    extraHTTPHeaders: {
      'Accept-Language': 'en-GB,en;q=0.9',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
  });

  // Patch navigator.webdriver to undefined so Indeed doesn't detect headless
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  });

  return { browser, context };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fillFirst(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  selectors: string[],
  value: string,
): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if ((await el.count()) > 0) {
        await el.fill(value, { timeout: 3000 });
        return true;
      }
    } catch { }
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function clickFirst(page: any, selectors: string[]): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if ((await el.count()) > 0) {
        await el.click({ timeout: 3000 });
        return true;
      }
    } catch { }
  }
  return false;
}


export type BrowserAuthProvider = 'indeed' | 'gumtree' | 'glassdoor' | 'linkedin';

type BrowserLoginResult = {
  success: boolean;
  requiresCode?: boolean;
  codeSentTo?: string | null;
  storageState?: unknown;
  error?: string;
};

type BrowserAuthConfig = {
  provider: BrowserAuthProvider;
  label: string;
  loginUrl: string;
  successHost: string;
  blockedPathHints: string[];
  emailSelectors: string[];
  passwordSelectors: string[];
  submitSelectors: string[];
  postLoginUrl?: string;
  requiredCookieNames?: string[];
};

const BROWSER_AUTH_CONFIG: Record<BrowserAuthProvider, BrowserAuthConfig> = {
  indeed: {
    provider: 'indeed',
    label: 'Indeed',
    loginUrl: 'https://secure.indeed.com/auth?hl=en_GB&co=GB',
    successHost: 'indeed',
    blockedPathHints: ['/auth', 'secure.indeed.com/auth'],
    emailSelectors: ['input[type="email"]', 'input[name="__email"]', 'input[name="email"]', 'input[id*="email"]', '#ifl-InputFormField-3'],
    passwordSelectors: ['input[type="password"]', 'input[name="password"]', 'input[name="__password"]'],
    submitSelectors: ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Continue")', 'button:has-text("Sign in")', 'button:has-text("Next")'],
    postLoginUrl: 'https://secure.indeed.com/account/view?hl=en_GB&co=GB',
  },
  gumtree: {
    provider: 'gumtree',
    label: 'Gumtree',
    loginUrl: 'https://www.gumtree.com/login',
    successHost: 'gumtree.com',
    blockedPathHints: ['/login', '/register'],
    emailSelectors: ['input[type="email"]', 'input[name="email"]', 'input[id="email"]', '#email'],
    passwordSelectors: ['input[type="password"]', 'input[name="password"]', '#password'],
    submitSelectors: ['button[type="submit"]', 'button:has-text("Log in")', 'button:has-text("Sign in")', 'button:has-text("Continue")', 'input[type="submit"]'],
    postLoginUrl: 'https://www.gumtree.com/my-account',
  },
  glassdoor: {
    provider: 'glassdoor',
    label: 'Glassdoor',
    loginUrl: 'https://www.glassdoor.co.uk/profile/login_input.htm',
    successHost: 'glassdoor.co.uk',
    blockedPathHints: ['login', 'signin'],
    emailSelectors: ['input[type="email"]', 'input[name="username"]', 'input[name="email"]', '#inlineUserEmail', '#modalUserEmail'],
    passwordSelectors: ['input[type="password"]', 'input[name="password"]', '#inlineUserPassword', '#modalUserPassword'],
    submitSelectors: ['button[type="submit"]', 'button:has-text("Sign in")', 'button:has-text("Continue")', 'button:has-text("Next")'],
    postLoginUrl: 'https://www.glassdoor.co.uk/member/profile/accountSettings',
  },
  linkedin: {
    provider: 'linkedin',
    label: 'LinkedIn',
    loginUrl: 'https://www.linkedin.com/login',
    successHost: 'linkedin.com',
    blockedPathHints: ['/login', '/checkpoint', '/uas/login'],
    emailSelectors: ['input[name="session_key"]', 'input[type="email"]', '#username'],
    passwordSelectors: ['input[name="session_password"]', 'input[type="password"]', '#password'],
    submitSelectors: ['button[type="submit"]', 'button:has-text("Sign in")', 'button:has-text("Continue")'],
    postLoginUrl: 'https://www.linkedin.com/feed/',
    requiredCookieNames: ['li_at'],
  },
};

function providerKey(provider: BrowserAuthProvider, userId: string): string {
  return `${provider}:${userId}`;
}

function storageStateHasCookie(storageState: unknown, cookieNames: string[] | undefined): boolean {
  if (!cookieNames?.length) return true;
  const state = storageState as { cookies?: Array<{ name: string }> };
  const names = new Set((state.cookies ?? []).map((cookie) => cookie.name.toLowerCase()));
  return cookieNames.some((name) => names.has(name.toLowerCase()));
}

async function captureStorageIfLoggedIn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
  config: BrowserAuthConfig,
): Promise<unknown | null> {
  if (config.postLoginUrl) {
    await page.goto(config.postLoginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
    await humanDelay(900, 1600);
  }

  const url = String(page.url()).toLowerCase();
  const onProviderHost = url.includes(config.successHost);
  const blockedByAuthPath = config.blockedPathHints.some((hint) => url.includes(hint.toLowerCase()));
  const storageState = await context.storageState();

  if (onProviderHost && !blockedByAuthPath && storageStateHasCookie(storageState, config.requiredCookieNames)) {
    return storageState;
  }

  if (storageStateHasCookie(storageState, config.requiredCookieNames) && !blockedByAuthPath) {
    return storageState;
  }

  return null;
}

function detectCodeDestination(content: string, fallbackEmail: string): string | null {
  const phoneMatch = content.match(/(?:sent|text).{0,30}([\+\(\)\d\s\-]{6,})/i);
  const emailMatch = content.match(/(?:sent|email|code).{0,40}([a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,})/i);
  if (emailMatch?.[1]) return emailMatch[1].trim();
  if (phoneMatch?.[1]) return phoneMatch[1].trim();
  return fallbackEmail;
}

function pageRequiresCode(content: string): boolean {
  return (
    content.includes('check your email for a code') ||
    content.includes('we sent a code') ||
    content.includes('we sent an email') ||
    content.includes('we sent a text') ||
    content.includes('enter code') ||
    content.includes('one-time code') ||
    content.includes('verification code') ||
    content.includes('security verification') ||
    content.includes('two-step verification')
  );
}

function pageHasBotChallenge(content: string): boolean {
  return (
    content.includes('captcha') ||
    content.includes('robot') ||
    content.includes('verify you are human') ||
    content.includes('unusual activity') ||
    content.includes('security check') ||
    content.includes('cloudflare')
  );
}

export async function startProviderLogin(
  provider: BrowserAuthProvider,
  userId: string,
  email: string,
  password?: string,
): Promise<BrowserLoginResult> {
  if (provider === 'indeed') {
    const result = await startIndeedLogin(userId, email, password);
    return { success: Boolean(result.storageState), ...result };
  }
  if (provider === 'gumtree') return loginGumtree(userId, email, password);
  if (provider === 'glassdoor') {
    const result = await loginGlassdoor(userId, email, password, false);
    if (result.requiresOAuth) {
      return { success: false, error: 'Glassdoor requires OAuth (Google/Apple). Please use manual Cookie fallback: sign in via your browser and paste cookies.' };
    }
    return { success: result.success, storageState: result.storageState, error: result.error };
  }
  if (provider === 'linkedin') {
    const result = await loginLinkedIn(userId, email, password, false);
    if (result.requiresOAuth) {
      return { success: false, error: 'LinkedIn has strong bot detection. Please use manual Cookie fallback: sign in via your browser and paste cookies.' };
    }
    return { success: result.success, storageState: result.storageState, error: result.error };
  }

  return { success: false, error: `Provider ${provider} is not supported` };
}

export async function submitProviderCode(
  provider: BrowserAuthProvider,
  userId: string,
  code: string,
): Promise<{ success: boolean; storageState?: unknown; error?: string }> {
  if (provider === 'indeed') return submitIndeedCode(userId, code);
  if (provider === 'gumtree') return submitGumtreeCode(userId, code);

  const config = BROWSER_AUTH_CONFIG[provider];
  const entry = pendingLogins.get(providerKey(provider, userId));
  if (!entry) return { success: false, error: 'Login session expired — please start again' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { page, browser, context } = entry.state as any;
  pendingLogins.delete(providerKey(provider, userId));

  try {
    await fillFirst(page, [
      'input[autocomplete="one-time-code"]',
      'input[inputmode="numeric"]',
      'input[name*="otp"]',
      'input[name*="code"]',
      'input[id*="code"]',
      'input[type="tel"]',
    ], code);
    await humanDelay(400, 800);
    await clickFirst(page, ['button[type="submit"]', 'button:has-text("Verify")', 'button:has-text("Continue")', 'button:has-text("Submit")']);
    await humanDelay(2500, 4500);

    const storageState = await captureStorageIfLoggedIn(page, context, config);
    await browser.close().catch(() => { });
    if (storageState) return { success: true, storageState };
    return { success: false, error: `${config.label} verification did not complete — try automatic login again or use manual Cookie fallback.` };
  } catch (err) {
    await browser.close().catch(() => { });
    return { success: false, error: String(err) };
  }
}


// ── Indeed ────────────────────────────────────────────────────────────────────

/** Human-like random delay between min and max ms */
function humanDelay(minMs = 600, maxMs = 1800): Promise<void> {
  return sleep(minMs + Math.floor(Math.random() * (maxMs - minMs)));
}

/** Type text character by character to mimic human typing */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function humanType(page: any, selector: string, text: string): Promise<void> {
  await page.locator(selector).first().click({ timeout: 5000 });
  for (const char of text) {
    await page.keyboard.type(char, { delay: 40 + Math.floor(Math.random() * 80) });
  }
}

export async function startIndeedLogin(
  userId: string,
  email: string,
  password?: string,
): Promise<{ requiresCode: boolean; codeSentTo?: string | null; storageState?: unknown; error?: string }> {
  try {
    const { browser, context } = await launchBrowser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page: any = await context.newPage();

    // Navigate to Indeed UK login — use the UK domain to avoid geo-redirects
    await page.goto('https://secure.indeed.com/auth?hl=en_GB&co=GB', {
      waitUntil: 'networkidle',
      timeout: 45000,
    });
    await humanDelay(1200, 2500);

    // Accept cookie banner if present
    await clickFirst(page, [
      'button[id*="onetrust-accept"]',
      'button:has-text("Accept all")',
      'button:has-text("Accept cookies")',
    ]).catch(() => { });
    await humanDelay(400, 800);

    // Find email field — Indeed sometimes renders it inside an iframe
    let emailFilled = false;
    const emailSelectors = [
      'input[type="email"]',
      'input[name="__email"]',
      'input[name="email"]',
      'input[id*="email"]',
      '#ifl-InputFormField-3',
    ];

    // Try direct fill first
    for (const sel of emailSelectors) {
      try {
        const el = page.locator(sel).first();
        if ((await el.count()) > 0) {
          await el.click({ timeout: 3000 });
          await humanDelay(200, 500);
          await humanType(page, sel, email);
          emailFilled = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!emailFilled) {
      await browser.close().catch(() => { });
      return { requiresCode: false, error: 'Could not find email field on Indeed login page' };
    }

    await humanDelay(500, 1000);
    await clickFirst(page, [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Continue")',
      'button:has-text("Sign in")',
      'button:has-text("Next")',
    ]);
    await humanDelay(2000, 3500);

    // Enter password if provided and visible
    if (password) {
      const pwSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[name="__password"]',
      ];
      let pwFilled = false;
      for (const sel of pwSelectors) {
        try {
          const el = page.locator(sel).first();
          if ((await el.count()) > 0) {
            await el.click({ timeout: 3000 });
            await humanDelay(200, 400);
            await humanType(page, sel, password);
            pwFilled = true;
            break;
          }
        } catch { /* try next */ }
      }

      if (pwFilled) {
        await humanDelay(400, 800);
        await clickFirst(page, [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("Sign in")',
          'button:has-text("Continue")',
        ]);
        await humanDelay(2500, 4000);
      }
    }

    // Detect state
    const content = (await page.content()).toLowerCase();
    const url = page.url() as string;

    // Check for CAPTCHA / bot detection
    const hasCaptcha =
      content.includes('captcha') ||
      content.includes('robot') ||
      content.includes('verify you are human') ||
      content.includes('unusual activity');
    if (hasCaptcha) {
      await browser.close().catch(() => { });
      return { requiresCode: false, error: 'Indeed is showing a CAPTCHA — try again later or use a different network' };
    }

    // Already logged in?
    const isLoggedIn =
      (url.includes('indeed.co.uk') || url.includes('indeed.com')) &&
      !url.includes('/auth') &&
      !url.includes('secure.indeed.com/auth');
    if (isLoggedIn) {
      const storageState = await context.storageState();
      await browser.close().catch(() => { });
      return { requiresCode: false, storageState };
    }

    // Code required?
    const requiresCode =
      content.includes('check your email for a code') ||
      content.includes('we sent a code to') ||
      content.includes('we sent an email to') ||
      content.includes('we sent a text to') ||
      content.includes('enter code') ||
      content.includes('one-time code') ||
      content.includes('verification code') ||
      (await page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]').count()) > 0;

    // Parse where code was sent
    let codeSentTo: string | null = null;
    const phoneMatch = content.match(/we sent a text to\s+([\+\(\)\d\s\-]{6,})/i);
    const emailMatch = content.match(/we sent (?:an email|a code) to\s+([a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,})/i);
    if (phoneMatch?.[1]) codeSentTo = phoneMatch[1].trim();
    else if (emailMatch?.[1]) codeSentTo = emailMatch[1].trim();

    if (requiresCode) {
      // Keep browser open for OTP submission
      pendingLogins.set(expiringKey(userId), {
        state: { storageState: null, page, browser, context },
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      return { requiresCode: true, codeSentTo };
    }

    // Not logged in, not asking for code — something went wrong
    await browser.close().catch(() => { });
    return { requiresCode: false, error: 'Login did not progress — check credentials or try again' };
  } catch (err) {
    return { requiresCode: false, error: String(err) };
  }
}

export async function submitIndeedCode(
  userId: string,
  code: string,
): Promise<{ success: boolean; storageState?: unknown; error?: string }> {
  const entry = pendingLogins.get(expiringKey(userId));
  if (!entry) {
    return { success: false, error: 'Login session expired — please start again' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { page, browser, context } = entry.state as any;
  pendingLogins.delete(expiringKey(userId));

  try {
    const codeSelectors = [
      'input[autocomplete="one-time-code"]',
      'input[inputmode="numeric"]',
      'input[name*="otp"]',
      'input[name*="code"]',
      'input[id*="code"]',
      'input[type="tel"]',
    ];

    let codeFilled = false;
    for (const sel of codeSelectors) {
      try {
        const el = page.locator(sel).first();
        if ((await el.count()) > 0) {
          await el.click({ timeout: 3000 });
          await humanDelay(200, 400);
          // Type code digit by digit
          for (const char of code.trim()) {
            await page.keyboard.type(char, { delay: 60 + Math.floor(Math.random() * 60) });
          }
          codeFilled = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!codeFilled) {
      await browser.close().catch(() => { });
      return { success: false, error: 'Could not find code input field' };
    }

    await humanDelay(500, 900);
    await clickFirst(page, [
      'button[type="submit"]',
      'button:has-text("Continue")',
      'button:has-text("Verify")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
    ]);

    // Wait for redirect away from auth pages
    await Promise.race([
      page.waitForURL((url: string) => !url.includes('/auth') && !url.includes('secure.indeed.com/auth'), { timeout: 20000 }).catch(() => { }),
      sleep(12000),
    ]);

    const url = page.url() as string;
    const isLoggedIn =
      !url.includes('/auth') &&
      !url.includes('secure.indeed.com/auth') &&
      (url.includes('indeed.co.uk') || url.includes('indeed.com'));

    if (isLoggedIn) {
      const storageState = await context.storageState();
      await browser.close().catch(() => { });
      return { success: true, storageState };
    }

    // Check if code was wrong
    const content = (await page.content()).toLowerCase();
    if (content.includes('incorrect') || content.includes('invalid') || content.includes('expired')) {
      await browser.close().catch(() => { });
      return { success: false, error: 'Verification code was incorrect or expired' };
    }

    await browser.close().catch(() => { });
    return { success: false, error: 'Code accepted but login did not complete — try again' };
  } catch (err) {
    await browser.close().catch(() => { });
    return { success: false, error: String(err) };
  }
}

// ── Gumtree ───────────────────────────────────────────────────────────────────

export async function loginGumtree(
  userId: string,
  email: string,
  password?: string,
): Promise<{ success: boolean; storageState?: unknown; requiresCode?: boolean; codeSentTo?: string | null; error?: string }> {
  try {
    const { browser, context } = await launchBrowser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page: any = await context.newPage();

    await page.goto('https://www.gumtree.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await sleep(1500);

    // Accept cookie banner
    await clickFirst(page, [
      '#onetrust-accept-btn-handler',
      'button:has-text("Accept all")',
      'button:has-text("Accept cookies")',
      'button:has-text("Agree")',
    ]).catch(() => { });
    await sleep(500);

    // Fill email
    await fillFirst(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      '#email',
    ], email);
    await sleep(300);

    // Fill password if provided
    if (password) {
      await fillFirst(page, [
        'input[type="password"]',
        'input[name="password"]',
        '#password',
      ], password);
      await sleep(300);
    }

    // Submit
    await clickFirst(page, [
      'button[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'button:has-text("Continue")',
      'input[type="submit"]',
    ]);
    await sleep(3000);

    const url = page.url() as string;

    // If on gumtree.com and not on login page → success
    if (url.includes('gumtree.com') && !url.includes('/login') && !url.includes('/register')) {
      const storageState = await context.storageState();
      await browser.close().catch(() => { });
      return { success: true, storageState };
    }

    // Check for email verification step
    const content = (await page.content()).toLowerCase();
    if (content.includes('enter the code') || content.includes('verify your email') || content.includes('check your email')) {
      pendingLogins.set(`gumtree:${userId}`, {
        state: { storageState: null, page, browser, context },
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      return { success: false, requiresCode: true, codeSentTo: email };
    }

    await browser.close().catch(() => { });
    return { success: false, error: 'Login did not complete — check credentials' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function submitGumtreeCode(
  userId: string,
  code: string,
): Promise<{ success: boolean; storageState?: unknown; error?: string }> {
  const entry = pendingLogins.get(`gumtree:${userId}`);
  if (!entry) return { success: false, error: 'Session expired — start again' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { page, browser, context } = entry.state as any;
  pendingLogins.delete(`gumtree:${userId}`);

  try {
    await fillFirst(page, [
      'input[autocomplete="one-time-code"]',
      'input[name*="code"]',
      'input[name*="otp"]',
      'input[type="tel"]',
      'input[inputmode="numeric"]',
    ], code);
    await sleep(300);
    await clickFirst(page, ['button[type="submit"]', 'button:has-text("Verify")', 'button:has-text("Continue")']);
    await sleep(3000);

    const url = page.url() as string;
    if (url.includes('gumtree.com') && !url.includes('/login')) {
      const storageState = await context.storageState();
      await browser.close().catch(() => { });
      return { success: true, storageState };
    }
    await browser.close().catch(() => { });
    return { success: false, error: 'Verification did not complete' };
  } catch (err) {
    await browser.close().catch(() => { });
    return { success: false, error: String(err) };
  }
}

// ── Glassdoor ─────────────────────────────────────────────────────────────────

/**
 * Glassdoor login with hybrid approach:
 * 1. Try headless with email/password
 * 2. If OAuth detected or headless fails → open visible browser for user to complete OAuth
 * 3. Auto-capture session after successful login
 */
export async function loginGlassdoor(
  userId: string,
  email?: string,
  password?: string,
  useVisibleBrowser = false,
): Promise<{ success: boolean; storageState?: unknown; requiresOAuth?: boolean; error?: string }> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: !useVisibleBrowser,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: pickUserAgent(),
      locale: 'en-GB',
      timezoneId: 'Europe/London',
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page: any = await context.newPage();

    await page.goto('https://www.glassdoor.co.uk/profile/login_input.htm', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await humanDelay(1500, 2500);

    // Accept cookies
    await clickFirst(page, [
      '#onetrust-accept-btn-handler',
      'button:has-text("Accept")',
      'button:has-text("I Accept")',
    ]).catch(() => { });
    await humanDelay(500, 1000);

    const content = (await page.content()).toLowerCase();

    // Check if OAuth buttons are present (Google, Apple, Facebook)
    const hasOAuthButtons =
      content.includes('sign in with google') ||
      content.includes('continue with google') ||
      content.includes('sign in with apple') ||
      content.includes('continue with apple');

    // If visible browser mode OR OAuth detected → let user complete login
    if (useVisibleBrowser || hasOAuthButtons) {
      console.log('Glassdoor: Waiting for user to complete OAuth login...');

      // Wait for successful login (redirect away from login page)
      try {
        await page.waitForURL(
          (url: string) => !url.includes('/login') && !url.includes('/profile/login'),
          { timeout: 180000 } // 3 minutes for user to complete OAuth
        );

        // Verify login by checking account settings page
        await page.goto('https://www.glassdoor.co.uk/member/profile/accountSettings', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await sleep(2000);

        const finalContent = (await page.content()).toLowerCase();
        const isLoggedIn =
          finalContent.includes('account settings') ||
          finalContent.includes('accountsettings') ||
          finalContent.includes('member/profile');

        if (isLoggedIn) {
          const storageState = await context.storageState();
          await browser.close().catch(() => { });
          return { success: true, storageState };
        }
      } catch (err) {
        await browser.close().catch(() => { });
        return { success: false, requiresOAuth: true, error: 'Login timeout - user did not complete OAuth' };
      }
    }

    // Try headless login with email/password
    if (email && password) {
      const emailFilled = await fillFirst(page, [
        'input[type="email"]',
        'input[name="username"]',
        'input[id="inlineUserEmail"]',
      ], email);

      if (!emailFilled) {
        await browser.close().catch(() => { });
        return { success: false, requiresOAuth: true, error: 'Email field not found - OAuth may be required' };
      }

      await humanDelay(500, 1000);
      await clickFirst(page, [
        'button[type="submit"]',
        'button:has-text("Continue")',
        'button:has-text("Sign In")',
      ]);
      await humanDelay(2000, 3000);

      const pwFilled = await fillFirst(page, [
        'input[type="password"]',
        'input[name="password"]',
      ], password);

      if (pwFilled) {
        await humanDelay(500, 1000);
        await clickFirst(page, [
          'button[type="submit"]',
          'button:has-text("Sign In")',
          'button:has-text("Continue")',
        ]);
        await humanDelay(3000, 5000);

        const url = page.url() as string;
        if (!url.includes('/login')) {
          const storageState = await context.storageState();
          await browser.close().catch(() => { });
          return { success: true, storageState };
        }
      }
    }

    await browser.close().catch(() => { });
    return { success: false, requiresOAuth: true, error: 'Headless login failed - OAuth required' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── LinkedIn ──────────────────────────────────────────────────────────────────

/**
 * LinkedIn login with hybrid approach:
 * LinkedIn has strong bot detection, so visible browser with OAuth is preferred
 */
export async function loginLinkedIn(
  userId: string,
  email?: string,
  password?: string,
  useVisibleBrowser = false,
): Promise<{ success: boolean; storageState?: unknown; requiresOAuth?: boolean; error?: string }> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: !useVisibleBrowser,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: pickUserAgent(),
      locale: 'en-GB',
      timezoneId: 'Europe/London',
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page: any = await context.newPage();

    await page.goto('https://www.linkedin.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await humanDelay(1500, 2500);

    // If visible browser mode → let user complete login
    if (useVisibleBrowser) {
      console.log('LinkedIn: Waiting for user to complete login...');

      try {
        // Wait for successful login (redirect to feed)
        await page.waitForURL(
          (url: string) => url.includes('/feed') || url.includes('/in/'),
          { timeout: 180000 } // 3 minutes
        );

        // Verify by checking feed
        await page.goto('https://www.linkedin.com/feed/', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await sleep(2000);

        const finalContent = (await page.content()).toLowerCase();
        const isLoggedIn =
          finalContent.includes('feed-identity-module') ||
          finalContent.includes('global-nav') ||
          finalContent.includes('voyager');

        if (isLoggedIn) {
          const storageState = await context.storageState();
          await browser.close().catch(() => { });
          return { success: true, storageState };
        }
      } catch (err) {
        await browser.close().catch(() => { });
        return { success: false, requiresOAuth: true, error: 'Login timeout - user did not complete login' };
      }
    }

    // Try headless login with email/password (often triggers CAPTCHA)
    if (email && password) {
      const emailFilled = await fillFirst(page, [
        'input[id="username"]',
        'input[name="session_key"]',
        'input[type="email"]',
      ], email);

      if (!emailFilled) {
        await browser.close().catch(() => { });
        return { success: false, requiresOAuth: true, error: 'Email field not found' };
      }

      await humanDelay(500, 1000);

      const pwFilled = await fillFirst(page, [
        'input[id="password"]',
        'input[name="session_password"]',
        'input[type="password"]',
      ], password);

      if (pwFilled) {
        await humanDelay(500, 1000);
        await clickFirst(page, [
          'button[type="submit"]',
          'button[data-litms-control-urn*="login-submit"]',
          'button:has-text("Sign in")',
        ]);
        await humanDelay(3000, 5000);

        const content = (await page.content()).toLowerCase();

        // Check for CAPTCHA
        if (content.includes('captcha') || content.includes('security verification')) {
          await browser.close().catch(() => { });
          return { success: false, requiresOAuth: true, error: 'CAPTCHA detected - visible browser required' };
        }

        const url = page.url() as string;
        if (url.includes('/feed') || url.includes('/in/')) {
          const storageState = await context.storageState();
          await browser.close().catch(() => { });
          return { success: true, storageState };
        }
      }
    }

    await browser.close().catch(() => { });
    return { success: false, requiresOAuth: true, error: 'Headless login failed - visible browser recommended' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Session to cookie string ──────────────────────────────────────────────────

export function storageStateToCookieString(storageState: unknown): string {
  try {
    const state = storageState as { cookies?: Array<{ name: string; value: string }> };
    return (state.cookies ?? [])
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
  } catch {
    return '';
  }
}

export function storageStateToJson(storageState: unknown): string {
  return JSON.stringify(storageState);
}
