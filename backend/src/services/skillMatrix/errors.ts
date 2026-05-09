/**
 * Skills & Employer Verification Matrix — Error types.
 *
 * Structured errors for service-level failures with graceful degradation support.
 */

export type SkillMatrixErrorCode =
    | 'TAXONOMY_RESOLUTION_FAILED'
    | 'EVIDENCE_EXTRACTION_FAILED'
    | 'SCORING_FAILED'
    | 'EMPLOYER_LOOKUP_FAILED'
    | 'INSUFFICIENT_DATA'
    | 'AUDIT_LOG_FAILED';

export class SkillMatrixError extends Error {
    public readonly code: SkillMatrixErrorCode;
    public readonly metadata?: Record<string, unknown>;

    constructor(code: SkillMatrixErrorCode, message: string, metadata?: Record<string, unknown>) {
        super(message);
        this.name = 'SkillMatrixError';
        this.code = code;
        this.metadata = metadata;
    }
}

/**
 * Check if an error is a SkillMatrixError with a specific code.
 */
export function isSkillMatrixError(
    error: unknown,
    code?: SkillMatrixErrorCode,
): error is SkillMatrixError {
    if (!(error instanceof SkillMatrixError)) return false;
    if (code && error.code !== code) return false;
    return true;
}
