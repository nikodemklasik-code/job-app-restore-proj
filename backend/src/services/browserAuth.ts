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
): Promise<{ requiresCode: boolean; codeSentTo?: string | null; error?: string }> {
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
      return { requiresCode: false, storageState } as unknown as { requiresCode: boolean };
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
