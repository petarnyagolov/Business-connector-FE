import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../service/auth.service';
import { CreditsService } from '../../service/credits.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit {
  
  constructor(
    private authService: AuthService,
    private creditsService: CreditsService
  ) {}

  ngOnInit(): void {
    console.log('💳 Payment success page loaded - refreshing user credits...');
    
    this.authService.refreshToken().subscribe({
      next: () => {
        console.log('✅ Token refreshed successfully');
        this.creditsService.refreshFromToken();
      },
      error: (err) => {
        console.error('❌ Error refreshing token after payment:', err);
      }
    });
  }
}
