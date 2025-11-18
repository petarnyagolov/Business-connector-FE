import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
	private promptEvent?: any;

	// Става true, когато браузърът е пратил beforeinstallprompt и има смисъл да показваме бутона
	canInstall$ = new BehaviorSubject<boolean>(false);

	constructor() {
		// Слушаме за beforeinstallprompt (Chrome/Edge, когато PWA е installable)
		window.addEventListener('beforeinstallprompt', (event: any) => {
			event.preventDefault();
			this.promptEvent = event;
			this.canInstall$.next(true);
		});

		// Когато приложението бъде инсталирано, скриваме бутона занапред
		window.addEventListener('appinstalled', () => {
			this.promptEvent = undefined;
			this.canInstall$.next(false);
		});
	}

	async promptInstall(): Promise<void> {
		// В dev (http://LAN) често няма beforeinstallprompt → просто излизаме тихо.
		if (!this.promptEvent) {
			return;
		}

		this.promptEvent.prompt();
		await this.promptEvent.userChoice;
		this.promptEvent = undefined;
		this.canInstall$.next(false);
	}
}

