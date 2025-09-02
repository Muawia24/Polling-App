/**
 * Simple browser fingerprinting utility to help prevent multiple votes from the same device
 * This is a basic implementation and not foolproof, but provides a reasonable level of protection
 * for anonymous voting.
 */

export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return ''; // Server-side rendering, no fingerprint available
  }

  // Collect browser information
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const platform = navigator.platform;
  
  // Create a string from the collected data
  const components = [
    userAgent,
    language,
    screenWidth,
    screenHeight,
    colorDepth,
    timezone,
    platform
  ];
  
  // Create a simple hash
  const fingerprintString = components.join('|');
  
  // Use a more secure hashing method if available
  if (window.crypto && window.crypto.subtle && window.TextEncoder) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprintString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      
      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      console.error('Error generating secure fingerprint:', e);
    }
  }
  
  // Fallback to a simple hash if crypto API is not available
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(16);
}