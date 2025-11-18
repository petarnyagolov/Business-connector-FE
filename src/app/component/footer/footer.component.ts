import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../../service/pwa-install.service';
import { Observable, combineLatest, map, startWith } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  canShowInstallButton$: Observable<boolean>;

  private isStandalone(): boolean {
    const isStandaloneDisplayMode = !!window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    const isAndroidTwa = typeof document.referrer === 'string' && document.referrer.startsWith('android-app://');

    return !!(isStandaloneDisplayMode || isIOSStandalone || isAndroidTwa);
  }

  constructor(private pwaInstallService: PwaInstallService) {
    const installed$ = new Observable<boolean>((observer) => {
      observer.next(this.isStandalone());
      const handler = () => observer.next(this.isStandalone());
      window.addEventListener('appinstalled', handler);
      return () => window.removeEventListener('appinstalled', handler);
    }).pipe(startWith(this.isStandalone()));

    this.canShowInstallButton$ = combineLatest([
      this.pwaInstallService.canInstall$,
      installed$
    ]).pipe(
      map(([canInstall, installed]) => canInstall && !installed)
    );
  }

  onInstallClick(): void {
    this.pwaInstallService.promptInstall();
  }
}
