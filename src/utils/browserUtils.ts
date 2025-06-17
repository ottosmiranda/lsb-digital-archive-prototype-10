
export interface BrowserCapabilities {
  supportsIframe: boolean;
  supportsAutoplay: boolean;
  supportsLocalStorage: boolean;
  isMobile: boolean;
  browserName: string;
  supportsCORS: boolean;
}

export const detectBrowserCapabilities = (): BrowserCapabilities => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Browser detection
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  let browserName = 'unknown';
  if (userAgent.includes('chrome')) browserName = 'chrome';
  else if (userAgent.includes('firefox')) browserName = 'firefox';
  else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browserName = 'safari';
  else if (userAgent.includes('edge')) browserName = 'edge';
  else if (userAgent.includes('opera')) browserName = 'opera';

  // Feature detection
  const supportsLocalStorage = (() => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  })();

  const supportsAutoplay = !isMobile; // Conservative assumption
  const supportsCORS = true; // Most modern browsers support CORS
  const supportsIframe = true; // Most browsers support iframes

  return {
    supportsIframe,
    supportsAutoplay,
    supportsLocalStorage,
    isMobile,
    browserName,
    supportsCORS
  };
};

export const getBrowserSpecificEmbedUrl = (baseUrl: string, capabilities: BrowserCapabilities): string => {
  let url = baseUrl;
  
  // Add browser-specific parameters
  if (capabilities.isMobile) {
    url += url.includes('?') ? '&' : '?';
    url += 'utm_source=mobile';
  }
  
  if (!capabilities.supportsAutoplay) {
    url = url.replace('autoplay=1', 'autoplay=0');
  }
  
  return url;
};
