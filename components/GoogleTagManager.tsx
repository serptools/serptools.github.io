'use client';

import { GoogleTagManager } from '@next/third-parties/google';

export function GTM() {
  // Replace with your actual GTM ID
  const gtmId = 'GTM-XXXXXX';
  
  // Return null in development or when GTM ID is placeholder
  if (process.env.NODE_ENV === 'development' || gtmId === 'GTM-XXXXXX') {
    return null;
  }
  
  return <GoogleTagManager gtmId={gtmId} />;
}