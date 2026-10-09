export type AalLevels = {
  nextLevel?: string | null;
  currentLevel?: string | null;
};

/** True when the user must complete MFA to reach AAL2. */
export function needsMfaFromAal(aal: AalLevels | null | undefined): boolean {
  return aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2';
}

/** When AAL lookup fails, treat as needing MFA (fail closed). */
export const NEEDS_MFA_ON_AAL_ERROR = true;
