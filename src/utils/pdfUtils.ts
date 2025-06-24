
export const buildProxyPDFUrl = (originalPdfUrl: string): string => {
  const supabaseUrl = 'https://acnympbxfptajtxvmkqn.supabase.co';
  const proxyUrl = `${supabaseUrl}/functions/v1/proxy-pdf`;
  return `${proxyUrl}?url=${encodeURIComponent(originalPdfUrl)}`;
};

export const logPDFEvent = (event: string, details?: any) => {
  console.log(`📄 PDF Event: ${event}`, details || '');
};
