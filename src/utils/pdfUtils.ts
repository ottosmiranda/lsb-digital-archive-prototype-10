
export interface PDFViewerCapabilities {
  supportsNativePDF: boolean;
  supportsPDFJS: boolean;
  browserName: string;
  isMobile: boolean;
  recommendedStrategy: 'proxy' | 'pdfjs' | 'download';
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
  
  // Use proxy strategy as primary approach
  let recommendedStrategy: 'proxy' | 'pdfjs' | 'download' = 'proxy';
  
  if (isMobile && isSafari) {
    // Safari mobile sometimes has issues, but try proxy first
    recommendedStrategy = 'proxy';
  }

  return {
    supportsNativePDF,
    supportsPDFJS,
    browserName,
    isMobile,
    recommendedStrategy
  };
};

export const buildProxyPDFUrl = (originalPdfUrl: string): string => {
  const supabaseUrl = 'https://acnympbxfptajtxvmkqn.supabase.co';
  const proxyUrl = `${supabaseUrl}/functions/v1/proxy-pdf`;
  return `${proxyUrl}?url=${encodeURIComponent(originalPdfUrl)}`;
};

export const buildPDFJSUrl = (pdfUrl: string): string => {
  return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
};

export const logPDFEvent = (event: string, details?: any) => {
  console.log(`📄 PDF Event: ${event}`, details || '');
};
