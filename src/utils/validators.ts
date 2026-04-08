/**
 * Email validation — basic RFC 5322 check
 */
export function validateEmail(email: string): boolean {
  // Covers the vast majority of valid RFC 5322 addresses
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/** Alias for validateEmail */
export const validateEmailFormat = validateEmail;

/**
 * Password validation — minimum 8 characters
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * E.164 phone number validation
 * Format: +[country code][subscriber number], 2–15 digits total after +
 * Also accepts Indian format: +91 followed by 10 digits
 */
export function validateE164Phone(phone: string): boolean {
  // Standard E.164 format
  const e164Pattern = /^\+[1-9]\d{1,14}$/;
  // Indian format: +91 followed by 10 digits (with optional spaces)
  const indianPattern = /^\+91\s?\d{10}$/;
  
  return e164Pattern.test(phone) || indianPattern.test(phone.replace(/\s/g, ''));
}

/**
 * Check-in duration validation — must be an integer in [5, 1440] minutes.
 * Returns null if valid, or an error message string if invalid.
 * (Requirement 4.1, 4.5)
 */
export function validateCheckInDuration(value: number): string | null {
  if (!Number.isInteger(value)) return 'Duration must be a whole number of minutes.';
  if (value < 5) return 'Duration must be at least 5 minutes.';
  if (value > 1440) return 'Duration must be at most 24 hours (1440 minutes).';
  return null;
}

/**
 * Returns true iff the duration is a valid check-in duration.
 */
export function isValidCheckInDuration(value: number): boolean {
  return validateCheckInDuration(value) === null;
}
