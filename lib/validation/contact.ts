/** Reject characters unsafe in HTML attributes and markup from public contact fields. */
const UNSAFE_CONTACT_TEXT = /["'<>`\u0000-\u001F\u007F]/;

export function isSafePublicContactName(name: string): boolean {
  if (!name || name.length > 120) return false;
  if (UNSAFE_CONTACT_TEXT.test(name)) return false;
  return true;
}

export function isSafePublicContactSubject(subject: string): boolean {
  if (!subject || subject.length > 200) return false;
  if (UNSAFE_CONTACT_TEXT.test(subject)) return false;
  return true;
}
