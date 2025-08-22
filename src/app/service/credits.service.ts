import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CreditsService {
  private creditsSubject = new BehaviorSubject<number>(0);
  public credits$ = this.creditsSubject.asObservable();

  constructor(private authService: AuthService) {
    this.authService.authStatus$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        console.log('🔄 User authenticated, updating credits...');
        this.updateCredits();
      } else {
        console.log('🔄 User not authenticated, resetting credits...');
        this.creditsSubject.next(0);
      }
    });
  }

  updateCredits(): void {
    const currentCredits = this.authService.getFreeCredits();
    console.log('🔄 Updating credits:', currentCredits);
    this.creditsSubject.next(currentCredits);
  }

  getCurrentCredits(): number {
    return this.creditsSubject.value;
  }

  decrementCredits(): void {
    const currentCredits = this.getCurrentCredits();
    if (currentCredits > 0) {
      console.log('💰 Decrementing credits:', currentCredits - 1);
      this.creditsSubject.next(currentCredits - 1);
    }
  }

  refreshFromToken(): void {
    console.log('🔄 Refreshing credits from token...');
    this.updateCredits();
  }
}
