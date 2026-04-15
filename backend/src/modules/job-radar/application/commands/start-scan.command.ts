import type { StartScanDto } from '../../api/job-radar.dto.js';

export type StartScanCommand = {
  userId: string;
  idempotencyKey?: string | null;
  payload: StartScanDto;
};
