import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Cache so we only load the FP agent once per session
let cachedVisitorId = null;

/**
 * Returns a stable device fingerprint (visitorId) for the current browser.
 * Result is cached in memory for the lifetime of the page.
 */
export async function getDeviceId() {
  if (cachedVisitorId) return cachedVisitorId;

  const fp     = await FingerprintJS.load();
  const result = await fp.get();
  cachedVisitorId = result.visitorId;

  return cachedVisitorId;
}
