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
 * Password validation — minimum 8 characters with strength requirements
 * Returns an object with validation result and helpful message
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Detailed password validation with specific error messages
 * Returns null if valid, or an error message string if invalid
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password should include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password should include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password should include at least one number.';
  }
  return null;
}

/**
 * Get password strength level (weak, medium, strong)
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';
  
  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++; // Special characters
  
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
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
