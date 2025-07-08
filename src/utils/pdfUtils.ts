
export const logPDFEvent = (event: string, details?: any) => {
  console.log(`📄 PDF Event: ${event}`, details || '');
};
