/**
 * Browser Detection Utility
 *
 * Detects browser type and version for feature compatibility checks
 */

export interface BrowserInfo {
  name: string;
  version: string;
  supportsWebSpeech: boolean;
  supportsMediaRecorder: boolean;
}

/**
 * Check if browser is Brave (async)
 */
export async function isBraveBrowser(): Promise<boolean> {
  if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
    try {
      return await (navigator as any).brave.isBrave();
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Detect current browser (sync - may not detect Brave accurately)
 * Use detectBrowserAsync() for accurate Brave detection
 */
export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  // Brave detection (check if brave API exists - actual check is async)
  // This is a best-effort sync detection
  if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
    name = 'Brave';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Chrome detection
  else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Edge detection
  else if (ua.indexOf('Edg') > -1) {
    name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Firefox detection
  else if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Safari detection
  else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }

  // Check feature support
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supportsWebSpeech = !!SpeechRecognition;
  const supportsMediaRecorder = typeof MediaRecorder !== 'undefined';

  return {
    name,
    version,
    supportsWebSpeech,
    supportsMediaRecorder,
  };
}

/**
 * Detect current browser (async - accurate Brave detection)
 */
export async function detectBrowserAsync(): Promise<BrowserInfo> {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  // Accurate Brave detection using async API
  const isBrave = await isBraveBrowser();
  if (isBrave) {
    name = 'Brave';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Chrome detection
  else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Edge detection
  else if (ua.indexOf('Edg') > -1) {
    name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Firefox detection
  else if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Safari detection
  else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }

  // Check feature support
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supportsWebSpeech = !!SpeechRecognition;
  const supportsMediaRecorder = typeof MediaRecorder !== 'undefined';

  return {
    name,
    version,
    supportsWebSpeech,
    supportsMediaRecorder,
  };
}

/**
 * Get browser-specific guidance message
 */
export function getBrowserGuidance(feature: 'microphone' | 'webspeech'): string {
  const browser = detectBrowser();

  if (feature === 'microphone') {
    switch (browser.name) {
      case 'Brave':
        return 'In Brave, click the shield icon in the address bar, then allow microphone access. You may need to enable "Use Google services for push messaging" in brave://settings/privacy';
      case 'Chrome':
        return 'Click the microphone icon in the address bar to allow microphone access';
      case 'Edge':
        return 'Click the padlock icon in the address bar, then allow microphone access';
      case 'Firefox':
        return 'Click the microphone icon in the address bar to allow microphone access';
      case 'Safari':
        return 'Go to Safari > Preferences > Websites > Microphone to allow access';
      default:
        return 'Please allow microphone access in your browser settings';
    }
  }

  if (feature === 'webspeech') {
    if (!browser.supportsWebSpeech) {
      return `${browser.name} does not support Web Speech API. Please use Chrome, Edge, or Safari for voice transcription.`;
    }
    return `${browser.name} supports Web Speech API for live transcription!`;
  }

  return '';
}

/**
 * Check if current browser is supported for voice features
 */
export function isVoiceSupported(): {
  supported: boolean;
  message: string;
  browser: BrowserInfo;
} {
  const browser = detectBrowser();

  if (!browser.supportsMediaRecorder) {
    return {
      supported: false,
      message: `${browser.name} does not support audio recording. Please use a modern browser like Chrome, Edge, Brave, Firefox, or Safari.`,
      browser,
    };
  }

  if (!browser.supportsWebSpeech) {
    return {
      supported: true,
      message: `${browser.name} supports audio recording, but Web Speech API is not available. Please use Chrome, Edge, or Safari for voice transcription.`,
      browser,
    };
  }

  return {
    supported: true,
    message: `${browser.name} fully supports voice recording with live transcription!`,
    browser,
  };
}
