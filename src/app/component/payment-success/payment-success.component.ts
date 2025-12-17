import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../service/auth.service';
import { CreditsService } from '../../service/credits.service';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

interface PaymentStatusResponse {
  transactionId: string;
  status: string; // PENDING, SUCCESS, DENIED, EXPIRED
  amount?: number;
  currency?: string;
  creditsPurchased?: number;
  paymentDate?: string;
  message: string;
}

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  isProcessing = true;
  paymentStatus: PaymentStatusResponse | null = null;
  initialCredits = 0;
  newCredits = 0;
  private pollingSubscription?: Subscription;
  private transactionId: string | null = null;
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private creditsService: CreditsService
  ) {}

  ngOnInit(): void {
    console.log('💳 Payment success page loaded');
    
    // Get transaction ID from sessionStorage
    this.transactionId = sessionStorage.getItem('epay_transaction_id');
    
    if (!this.transactionId) {
      console.warn('⚠️ No transaction ID found in sessionStorage');
      this.isProcessing = false;
      return;
    }
    
    console.log('📋 Transaction ID:', this.transactionId);
    
    // Get initial credits
    this.initialCredits = this.creditsService.getCurrentCredits();
    console.log('💰 Initial credits:', this.initialCredits);
    
    // Start polling for payment status (every 3 seconds, max 20 times = 1 minute)
    this.pollingSubscription = interval(3000).pipe(take(20)).subscribe(() => {
      this.checkPaymentStatus();
    });
    
    // Also do immediate check
    this.checkPaymentStatus();
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private checkPaymentStatus(): void {
    if (!this.transactionId) return;
    
    console.log('🔄 Checking payment status for transaction:', this.transactionId);
    
    this.http.get<PaymentStatusResponse>(
      `${environment.apiUrl}/payments/epay/status/${this.transactionId}`
    ).subscribe({
      next: (status) => {
        console.log('📊 Payment status:', status);
        this.paymentStatus = status;
        
        if (status.status !== 'PENDING') {
          console.log(`✅ Payment finalized with status: ${status.status}`);
          this.isProcessing = false;
          
          // Stop polling
          if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
          }
          
          // Refresh credits if successful
          if (status.status === 'SUCCESS') {
            this.refreshUserCredits();
          }
          
          // Clear transaction ID from storage
          sessionStorage.removeItem('epay_transaction_id');
        }
      },
      error: (err) => {
        console.error('❌ Error checking payment status:', err);
        this.isProcessing = false;
      }
    });
  }

  private refreshUserCredits(): void {
    console.log('🔄 Refreshing user credits from /auth/me...');
    
    // Fetch updated user profile with new credits directly
    this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (userProfile) => {
        console.log('👤 User profile fetched:', userProfile);
        
        if (userProfile && userProfile.freeCredits !== undefined) {
          this.newCredits = userProfile.freeCredits;
          console.log(`💰 Credits updated from server: ${this.initialCredits} → ${this.newCredits}`);
          
          // Update the credits service by refreshing from token
          // (the token should already have the updated credits from the backend)
          this.authService.refreshToken().subscribe({
            next: () => {
              this.creditsService.refreshFromToken();
              console.log('✅ Credits service updated');
            },
            error: (err) => console.error('❌ Error refreshing token:', err)
          });
        }
      },
      error: (err) => {
        console.error('❌ Error fetching user profile:', err);
        // Fallback to token refresh method
        this.authService.refreshToken().subscribe({
          next: () => {
            this.creditsService.refreshFromToken();
            this.newCredits = this.creditsService.getCurrentCredits();
          }
        });
      }
    });
  }

  // Public method for manual check button
  checkManually(): void {
    this.isProcessing = true;
    this.checkPaymentStatus();
  }

  get creditsUpdated(): boolean {
    return this.paymentStatus?.status === 'SUCCESS';
  }

  get isSuccess(): boolean {
    return this.paymentStatus?.status === 'SUCCESS';
  }

  get isDenied(): boolean {
    return this.paymentStatus?.status === 'DENIED';
  }

  get isExpired(): boolean {
    return this.paymentStatus?.status === 'EXPIRED';
  }
}
