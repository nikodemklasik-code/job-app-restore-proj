export type ThemeMode = 'light' | 'dark' | 'system';
export type AssistantTone = 'concise' | 'balanced' | 'detailed';

export type UserProductSettings = {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  autoSaveDocuments: boolean;
  darkMode: boolean;
  themeMode: ThemeMode;
  assistantTone: AssistantTone;
  timezone: string;
  language: string;
  privacyMode: boolean;
  shareProfileAnalytics: boolean;
  blockedCompanyDomains: string[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserProductSettingsInput = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  autoSaveDocuments: boolean;
  darkMode: boolean;
  themeMode: ThemeMode;
  assistantTone: AssistantTone;
  timezone: string;
  language: string;
  privacyMode: boolean;
  shareProfileAnalytics: boolean;
  blockedCompanyDomains: string[];
};
