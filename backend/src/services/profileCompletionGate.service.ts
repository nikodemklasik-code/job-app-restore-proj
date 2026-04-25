import { buildIncompleteProfileResponse } from '../../../shared/profileCompletion.js';
import type { AuthenticatedAppUser } from '../lib/clerk.js';
import { fetchProfileSnapshotWithCompletion, type ProfileSnapshotWithCompletion } from './profileSnapshot.service.js';

export type AiProfileGateResult =
  | {
      allowed: true;
      profileSnapshot: ProfileSnapshotWithCompletion;
    }
  | {
      allowed: false;
      profileSnapshot: ProfileSnapshotWithCompletion;
      incompleteProfile: ReturnType<typeof buildIncompleteProfileResponse>;
    };

export async function checkAiProfileGate(
  user: AuthenticatedAppUser,
  options: { safeFallbackAllowed?: boolean } = {},
): Promise<AiProfileGateResult> {
  const profileSnapshot = await fetchProfileSnapshotWithCompletion({
    userId: user.id,
    email: user.email,
  });

  if (profileSnapshot.profileCompletion.isComplete) {
    return { allowed: true, profileSnapshot };
  }

  return {
    allowed: false,
    profileSnapshot,
    incompleteProfile: buildIncompleteProfileResponse(
      profileSnapshot.profileCompletion,
      Boolean(options.safeFallbackAllowed),
    ),
  };
}
