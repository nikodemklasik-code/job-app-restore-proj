export const AI_PROFILE_CRITICAL_FIELDS = [
    'targetRole',
    'targetSalary',
    'skills',
    'experience',
];
function hasText(value) {
    return Boolean(value?.trim());
}
function hasTargetSalary(snapshot) {
    const goals = snapshot.careerGoals;
    if (!goals)
        return false;
    if (typeof goals.targetSalary === 'number' && goals.targetSalary > 0)
        return true;
    return (typeof goals.targetSalaryMin === 'number' &&
        goals.targetSalaryMin > 0 &&
        typeof goals.targetSalaryMax === 'number' &&
        goals.targetSalaryMax >= goals.targetSalaryMin);
}
export function evaluateProfileCompletion(snapshot) {
    const missingCriticalFields = [];
    const targetRole = snapshot.careerGoals?.targetJobTitle ?? snapshot.careerGoals?.strategy?.dreamJob?.targetRole ?? null;
    if (!hasText(targetRole))
        missingCriticalFields.push('targetRole');
    if (!hasTargetSalary(snapshot))
        missingCriticalFields.push('targetSalary');
    if (!Array.isArray(snapshot.skills) || snapshot.skills.filter((skill) => hasText(skill)).length === 0) {
        missingCriticalFields.push('skills');
    }
    if (!Array.isArray(snapshot.experiences) || snapshot.experiences.length === 0) {
        missingCriticalFields.push('experience');
    }
    const present = AI_PROFILE_CRITICAL_FIELDS.length - missingCriticalFields.length;
    const completeness = Math.round((present / AI_PROFILE_CRITICAL_FIELDS.length) * 100);
    return {
        isComplete: missingCriticalFields.length === 0,
        completeness,
        missingCriticalFields,
    };
}
export function buildIncompleteProfileResponse(profileCompletion, safeFallbackAllowed = false) {
    return {
        status: 'incomplete_profile',
        reason: 'profile_incomplete',
        message: profileCompletion.missingCriticalFields.length === 0
            ? 'Your profile needs to be reviewed before this personalised AI flow can run.'
            : `Complete your profile before this personalised AI flow can run. Missing: ${profileCompletion.missingCriticalFields.join(', ')}.`,
        missingCriticalFields: profileCompletion.missingCriticalFields,
        profileCompletion,
        safeFallbackAllowed,
    };
}
