import { describe, expect, it } from 'vitest';
import { resolveActiveSettingsTab, SETTINGS_TABS } from './settingsTabFromUrl';

describe('resolveActiveSettingsTab', () => {
  it('defaults to overview for null, empty, or unknown tab', () => {
    expect(resolveActiveSettingsTab(null)).toBe('overview');
    expect(resolveActiveSettingsTab('')).toBe('overview');
    expect(resolveActiveSettingsTab('nope')).toBe('overview');
    expect(resolveActiveSettingsTab('community')).toBe('overview');
  });

  it('accepts every SETTINGS_TABS value except overview as pass-through', () => {
    for (const id of SETTINGS_TABS) {
      expect(resolveActiveSettingsTab(id)).toBe(id);
    }
  });
});
