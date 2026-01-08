import { Injectable, Optional } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  constructor(@Optional() private swUpdate: SwUpdate | null, private snackBar: MatSnackBar) {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      return;
    }

    // Проверка за update при старт
    this.swUpdate.checkForUpdate();

    this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
      if (event.type === 'VERSION_READY') {
        const ref = this.snackBar.open(
          'Има нова версия на приложението.',
          'Обнови',
          { duration: 0 } // Безкраен timeout - потребителят ТРЯБВА да кликне
        );

        ref.onAction().subscribe(() => {
          document.location.reload();
        });
      }
    });

    // Периодична проверка на всеки 5 минути (за критични update-и)
    setInterval(() => {
      this.swUpdate?.checkForUpdate();
    }, 5 * 60 * 1000);
  }
}
