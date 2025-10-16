// Minimal auth helper for token storage compatibility
export function getAuthToken() {
  // Prefer sessionStorage (short-lived) then localStorage. Keep backward compatibility with old 'auth_token' key.
  try {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || localStorage.getItem('auth_token') || null;
  } catch (e) {
    return null;
  }
}

export function setAuthToken(token, remember = true) {
  try {
    if (remember) {
      localStorage.setItem('authToken', token);
      // also set legacy key for older components
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
  } catch (e) {
    // ignore storage errors
    console.warn('Failed to persist auth token', e);
  }
}

export function clearAuthToken() {
  try {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_token');
  } catch (e) {}
}
