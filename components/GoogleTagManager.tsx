'use client';

import { GoogleTagManager } from '@next/third-parties/google';

export function GTM() {
  // You'll need to replace this with your actual GTM ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXXXX';
  
  if (!gtmId || gtmId === 'GTM-XXXXXX') {
    console.warn('Google Tag Manager ID not configured');
    return null;
  }
  
  return <GoogleTagManager gtmId={gtmId} />;
}