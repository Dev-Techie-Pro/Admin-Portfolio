export {
  guardAuthenticated,
  guardStaff,
  guardAdmin,
  guardEditor,
  getAuthenticatedSessionMeta,
  type GuardFailure,
  type GuardStaffSuccess,
  type GuardAuthSuccess,
  type GuardAdminSuccess,
} from './request-cache';

/** Narrow guard results when `!result.ok` does not discriminate (legacy strict: false). */
export function isGuardFailure(result: { ok: boolean }): result is import('./request-cache').GuardFailure {
  return result.ok === false;
}
