/**
 * Maps Firebase Auth error codes to user-facing copy (no raw exception strings).
 */
const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/user-disabled': 'This account is no longer active. Contact support if you need help.',
  'auth/user-not-found': 'No account found for this email. Check the spelling or create an account.',
  'auth/wrong-password': 'That password is not correct. Try again or reset your password.',
  'auth/invalid-credential': 'Email or password is incorrect. Please try again.',
  'auth/invalid-login-credentials': 'Email or password is incorrect. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Use a stronger password (at least six characters).',
  'auth/operation-not-allowed': 'Email sign-in is not enabled for this app. Please contact support.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'We could not reach the server. Check your connection and try again.',
  'auth/internal-error': 'Something went wrong. Please try again in a moment.',
  'auth/requires-recent-login': 'For your security, please sign in again to continue.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Try again when you are ready.',
  'auth/cancelled-popup-request': 'Another sign-in window is already open.',
  'auth/account-exists-with-different-credential': 'This email is linked to a different sign-in method.',
};

function getErrorCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return (err as { code: string }).code;
  }
  return null;
}

export function getAuthErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const code = getErrorCode(err);
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
  return fallback;
}

export const AUTH_CONFIG_MISSING =
  'Sign-in is not fully configured. Add your Firebase keys in the environment file, or contact the team.';
