import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private promptEvent?: any;
  canInstall$ = new BehaviorSubject<boolean>(false);

  constructor() {
    console.log('[PWA] PwaInstallService initialized');

    window.addEventListener('beforeinstallprompt', (event: any) => {
      console.log('[PWA] beforeinstallprompt fired', event);
      event.preventDefault();
      this.promptEvent = event;
      this.canInstall$.next(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
    });
  }

  async promptInstall(): Promise<void> {
    console.log('[PWA] promptInstall called', this.promptEvent);

    if (!this.promptEvent) {
      alert('Инсталацията е налична само когато приложението е отворено през HTTPS и отговаря на PWA изискванията. В dev режим бутонът е само за тест.');
      return;
    }

    this.promptEvent.prompt();
    const choice = await this.promptEvent.userChoice;
    console.log('[PWA] userChoice', choice);
    this.promptEvent = undefined;
    this.canInstall$.next(false);
  }
}
