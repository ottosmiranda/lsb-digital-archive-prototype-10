
export interface PDFViewerCapabilities {
  supportsNativePDF: boolean;
  supportsPDFJS: boolean;
  browserName: string;
  isMobile: boolean;
  recommendedStrategy: 'iframe' | 'pdfjs' | 'download';
}

export const detectPDFCapabilities = (): PDFViewerCapabilities => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Browser detection
  const isChrome = userAgent.includes('chrome');
  const isFirefox = userAgent.includes('firefox');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  const isEdge = userAgent.includes('edge');
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  let browserName = 'unknown';
  if (isChrome) browserName = 'chrome';
  else if (isFirefox) browserName = 'firefox';
  else if (isSafari) browserName = 'safari';
  else if (isEdge) browserName = 'edge';

  // PDF support detection
  const supportsNativePDF = isChrome || isFirefox || isSafari || isEdge;
  const supportsPDFJS = true; // PDF.js works in all modern browsers
  
  // Recommended strategy based on browser and device
  let recommendedStrategy: 'iframe' | 'pdfjs' | 'download' = 'iframe';
  
  if (isMobile && isSafari) {
    // Safari mobile has issues with PDF iframes
    recommendedStrategy = 'pdfjs';
  } else if (!supportsNativePDF) {
    recommendedStrategy = 'pdfjs';
  }

  return {
    supportsNativePDF,
    supportsPDFJS,
    browserName,
    isMobile,
    recommendedStrategy
  };
};

export const buildPDFViewerUrl = (pdfUrl: string, strategy: 'iframe' | 'pdfjs'): string => {
  switch (strategy) {
    case 'iframe':
      // Enhanced PDF URL with viewer parameters
      const params = new URLSearchParams();
      params.set('toolbar', '1');
      params.set('navpanes', '1');
      params.set('scrollbar', '1');
      params.set('view', 'FitH');
      return `${pdfUrl}#${params.toString()}`;
      
    case 'pdfjs':
      // PDF.js viewer with the PDF URL
      return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
      
    default:
      return pdfUrl;
  }
};

export const logPDFEvent = (event: string, details?: any) => {
  console.log(`📄 PDF Event: ${event}`, details || '');
};
