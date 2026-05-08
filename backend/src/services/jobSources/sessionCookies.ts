export const EXTERNAL_SESSION_PROVIDERS = ['indeed', 'gumtree', 'glassdoor', 'linkedin'] as const;
export type ExternalSessionProvider = typeof EXTERNAL_SESSION_PROVIDERS[number];

type ProviderSessionConfig = {
  label: string;
  testUrl: string;
  providerCookieSignals: string[];
  requiredCookieSignals?: string[];
  loggedInSignals: string[];
  loggedOutSignals: string[];
};

const GOOGLE_ACCOUNT_COOKIE_NAMES = new Set([
  'sid',
  'hsid',
  'ssid',
  'apisid',
  'sapisid',
  '__secure-1psid',
  '__secure-3psid',
  '__secure-1psidcc',
  '__secure-3psidcc',
  'nid',
]);

export const PROVIDER_SESSION_CONFIG: Record<ExternalSessionProvider, ProviderSessionConfig> = {
  indeed: {
    label: 'Indeed',
    testUrl: 'https://secure.indeed.com/account/view?hl=en_GB&co=GB',
    providerCookieSignals: ['ctk', 'indeed_csrf_token', 'shared_indeed_csrf_token', 'indeed_rcc', 'lv', 'rjk'],
    loggedInSignals: ['account settings', 'sign out', 'logout', 'gnav-accountmenu', 'data-gnav-element-name="account menu"'],
    loggedOutSignals: ['secure.indeed.com/auth', 'id="signin-form"', 'name="__email"', 'sign in to indeed', 'create an account'],
  },
  gumtree: {
    label: 'Gumtree',
    testUrl: 'https://www.gumtree.com/my-account',
    providerCookieSignals: ['g_state', 'gt_cookie', 'gumtree', 'optanonconsent', 'g_enabled_idps'],
    loggedInSignals: ['my gumtree', 'manage my ads', 'my ads', 'sign out', 'logout', 'account settings'],
    loggedOutSignals: ['gumtree.com/login', 'sign in to gumtree', 'log in to gumtree', 'create an account'],
  },
  glassdoor: {
    label: 'Glassdoor',
    testUrl: 'https://www.glassdoor.co.uk/member/profile/accountSettings',
    providerCookieSignals: ['gdid', 'gdsid', 'gsessionid', 'glassdoor', 'cass', 'cssession'],
    loggedInSignals: ['account settings', 'memberprofile', 'profile/accountsettings', 'sign out', 'logout'],
    loggedOutSignals: ['signin.htm', 'login.htm', 'sign in to glassdoor', 'continue with google', 'member/home/login'],
  },
  linkedin: {
    label: 'LinkedIn',
    testUrl: 'https://www.linkedin.com/feed/',
    providerCookieSignals: ['li_at', 'jsessionid', 'bcookie', 'bscookie', 'liap'],
    requiredCookieSignals: ['li_at'],
    loggedInSignals: ['feed-identity-module', 'global-nav', 'voyager', 'data-view-name="nav.settings_signout"', 'linkedin.com/feed'],
    loggedOutSignals: ['session_key', 'login-submit', 'join now', 'authwall', 'sign in to linkedin', 'login_redirect'],
  },
};

export function normalizeCookieHeader(raw: string): string {
  const trimmed = raw.trim();
  const cookieHeaderLine = trimmed.match(/^cookie\s*:\s*(.+)$/im)?.[1];
  const candidate = cookieHeaderLine ?? trimmed;

  return candidate
    .replace(/^cookie\s*:\s*/i, '')
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('; ')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => /^[^=;\s]+\s*=/.test(part) && !/^(host|origin|referer|user-agent|accept|authorization)\s*:/i.test(part))
    .join('; ');
}

export function parseCookieNames(cookieHeader: string): Set<string> {
  return new Set(
    normalizeCookieHeader(cookieHeader)
      .split(';')
      .map((part) => part.trim().split('=')[0]?.toLowerCase())
      .filter(Boolean),
  );
}

export function validateProviderCookieHeader(
  provider: ExternalSessionProvider,
  rawCookieHeader: string,
): { ok: boolean; cookies: string; reason?: string } {
  const cookies = normalizeCookieHeader(rawCookieHeader);
  if (cookies.length < 10) {
    return { ok: false, cookies, reason: 'Paste the full provider Cookie header, not an empty or partial value.' };
  }

  const names = parseCookieNames(cookies);
  const config = PROVIDER_SESSION_CONFIG[provider];
  const hasProviderSignal = config.providerCookieSignals.some((name) => names.has(name.toLowerCase()));
  const hasGoogleAccountCookie = [...names].some((name) => GOOGLE_ACCOUNT_COOKIE_NAMES.has(name));

  if (!hasProviderSignal && hasGoogleAccountCookie) {
    return {
      ok: false,
      cookies,
      reason: `This looks like Google account cookies, not ${config.label} cookies. Log in with Google if needed, then copy the resulting ${config.label} Cookie header from the ${new URL(config.testUrl).hostname} request.`,
    };
  }

  if (config.requiredCookieSignals?.length) {
    const hasRequired = config.requiredCookieSignals.some((name) => names.has(name.toLowerCase()));
    if (!hasRequired) {
      return {
        ok: false,
        cookies,
        reason: `${config.label} cookies are missing ${config.requiredCookieSignals.join(' or ')}. Copy the Cookie header from an authenticated ${config.label} page after login.`,
      };
    }
  }

  return { ok: true, cookies };
}

export function buildProviderRequestHeaders(provider: ExternalSessionProvider, cookies: string): Record<string, string> {
  const origin = new URL(PROVIDER_SESSION_CONFIG[provider].testUrl).origin;
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': `${origin}/`,
    'Cookie': normalizeCookieHeader(cookies),
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'upgrade-insecure-requests': '1',
  };
}

export function isProviderLoggedOutHtml(provider: ExternalSessionProvider, html: string): boolean {
  const lower = html.toLowerCase();
  return PROVIDER_SESSION_CONFIG[provider].loggedOutSignals.some((signal) => lower.includes(signal.toLowerCase()));
}

export function isProviderLoggedInHtml(provider: ExternalSessionProvider, html: string): boolean {
  const lower = html.toLowerCase();
  return PROVIDER_SESSION_CONFIG[provider].loggedInSignals.some((signal) => lower.includes(signal.toLowerCase()));
}

export function isProviderBlockedHtml(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes('captcha') ||
    lower.includes('cf-chl') ||
    lower.includes('cloudflare') ||
    lower.includes('access denied') ||
    lower.includes('unusual traffic') ||
    lower.includes('verify you are human') ||
    lower.includes('security check')
  );
}

export function isRemoteVerificationBlockedStatus(status: number): boolean {
  return status === 403 || status === 429 || status === 999 || status === 503;
}
