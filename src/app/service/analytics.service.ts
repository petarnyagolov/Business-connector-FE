import { Injectable } from '@angular/core';

const GTM_STORAGE_KEY = 'xdealhub-gtm-loaded';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private gtmId = 'GTM-5FGBC3GD'; // Google Tag Manager container ID

  enableAnalyticsIfNeeded(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const alreadyLoaded = window.document.documentElement.getAttribute(GTM_STORAGE_KEY) === 'true';
    if (alreadyLoaded) {
      return;
    }

    if (!this.gtmId) {
      return;
    }

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${this.gtmId}`;
    document.head.appendChild(script);

    window.document.documentElement.setAttribute(GTM_STORAGE_KEY, 'true');
  }
}
