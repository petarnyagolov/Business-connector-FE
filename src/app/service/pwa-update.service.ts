import { Injectable, Optional } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  constructor(@Optional() private swUpdate: SwUpdate | null, private snackBar: MatSnackBar) {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.checkForUpdate();

    this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
      if (event.type === 'VERSION_READY') {
        // Critical: Force update with native confirm dialog to fix CSP issues immediately
        if (confirm('Налична е нова версия (v1.2.4). Натиснете ОК за да обновите и да оправите проблемите със зареждането.')) {
          window.location.reload();
        }
      }
    });

    // Check more frequently (every 1 minute) to recover faster
    setInterval(() => {
      this.swUpdate?.checkForUpdate();
    }, 60 * 1000);
  }
}
