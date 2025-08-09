'use client';

import { GoogleTagManager } from '@next/third-parties/google';

export function GTM() {
  const gtmId = 'GTM-PP9W77LK';
  
  // Only disable in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  
  return <GoogleTagManager gtmId={gtmId} />;
}