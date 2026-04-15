export const SCAN_TRIGGER = {
  SAVED_JOB: 'saved_job',
  MANUAL_SEARCH: 'manual_search',
  URL_INPUT: 'url_input',
} as const;

export type ScanTrigger = (typeof SCAN_TRIGGER)[keyof typeof SCAN_TRIGGER];
