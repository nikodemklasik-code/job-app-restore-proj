export const SETTINGS_TABS = [
  'overview',
  'server',
  'privacy',
  'accessibility',
  'email',
  'telegram',
  'sources',
  'auto-apply',
  'readiness',
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number];

/** Resolves `?tab=` from the settings URL to an active tab id; invalid or missing → `overview`. */
export function resolveActiveSettingsTab(tabFromUrl: string | null): SettingsTabId {
  if (tabFromUrl && SETTINGS_TABS.includes(tabFromUrl as SettingsTabId)) {
    return tabFromUrl as SettingsTabId;
  }
  return 'overview';
}
