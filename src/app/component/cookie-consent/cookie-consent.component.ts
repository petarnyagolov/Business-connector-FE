import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AnalyticsService } from '../../service/analytics.service';

const STORAGE_KEY = 'xdealhub-cookie-consent';

interface CookieConsentState {
  analytics: boolean;
  decided: boolean;
}

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent {
  showBanner = false;

  constructor(private analyticsService: AnalyticsService) {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      this.showBanner = true;
    } else {
      try {
        const parsed = JSON.parse(raw) as CookieConsentState;
        if (parsed.decided && parsed.analytics) {
          this.analyticsService.enableAnalyticsIfNeeded();
        }
      } catch {
        this.showBanner = true;
      }
    }
  }

  acceptAll(): void {
    this.saveState({ analytics: true, decided: true });
    this.analyticsService.enableAnalyticsIfNeeded();
  }

  rejectAnalytics(): void {
    this.saveState({ analytics: false, decided: true });
  }

  private saveState(state: CookieConsentState): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    this.showBanner = false;
  }
}
