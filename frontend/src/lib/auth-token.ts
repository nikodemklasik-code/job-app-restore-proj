type AuthTokenGetter = () => Promise<string | null>;

let authTokenGetter: AuthTokenGetter | null = null;

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  authTokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (!authTokenGetter) return null;
  try {
    return await authTokenGetter();
  } catch {
    return null;
  }
}
