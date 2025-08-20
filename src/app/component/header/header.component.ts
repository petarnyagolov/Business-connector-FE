import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { SavedRequestsService } from '../../service/saved-requests.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';

interface CreditPackage {
  credits: number;
  price: number;
  discount?: string;
  description?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    RouterModule, 
    NgIf,  
    NgFor,
    FormsModule,
    MatMenuModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSidenavModule, 
    MatToolbarModule,
    MatDividerModule,
    MatBadgeModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})

export class HeaderComponent implements OnInit, OnDestroy {
  @Input() pageTitle!:string;
  @Input() logoSrc!:string;
  isAuthenticated: boolean = false;
  savedRequestsCount: number = 0;
  userName: string | null = null;
  userEmail: string | null = null;
  freeCredits: number = 0;
  private destroy$ = new Subject<void>();

  showBuyCreditsModal: boolean = false;
  selectedPackage: CreditPackage | null = null;
  
  cardNumber: string = '';
  cardExpiry: string = '';
  cardCvv: string = '';
  cardHolderName: string = '';

  get creditPackages(): CreditPackage[] {
    return [
      { 
        credits: 10, 
        price: 100, 
        description: 'Стартов пакет за малки проекти' 
      },
      { 
        credits: 200, 
        price: 150, 
        discount: 'Икономия от 1850 лв!',
        description: 'Най-популярен избор за бизнес клиенти' 
      },
      { 
        credits: 300, 
        price: 300, 
        discount: 'Икономия от 2700 лв!',
        description: 'Професионален пакет за големи компании' 
      }
    ];
  }

  trackByCredits(index: number, item: CreditPackage): number {
    return item.credits;
  }

  onPackageChange(event: MatSelectChange) {
    console.log('Package changed:', event.value);
    this.selectedPackage = event.value;
    this.cdr.detectChanges(); 
  }

  notifications = [
    { id: 1, text: 'Нова оферта за вашата фирма.' },
    { id: 2, text: 'Вашата публикация беше одобрена.' },
    { id: 3, text: 'Получихте ново съобщение.' },
    { id: 4, text: 'Профилът ви беше обновен.' },
    { id: 5, text: 'Имате нова покана за сътрудничество.' }
  ];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private savedRequestsService: SavedRequestsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.authStatus$.subscribe(status => {
      this.isAuthenticated = status;
      if (status) {
        this.userName = this.authService.getUserName();
        this.userEmail = this.authService.getUserEmail();
        this.freeCredits = this.authService.getFreeCredits();
        
        this.savedRequestsService.initializeForAuthenticatedUser();
        
        this.savedRequestsService.savedRequestsCount$
          .pipe(takeUntil(this.destroy$))
          .subscribe(count => {
            this.savedRequestsCount = count;
          });
      } else {
        this.savedRequestsCount = 0;
        this.userName = null;
        this.userEmail = null;
        this.freeCredits = 0;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']); 
  }

  onSettings() {
    this.router.navigate(['/settings']);
  }

  onSeeAllNotifications() {
    this.router.navigate(['/notifications']);
  }

  onInvoices() {
    this.router.navigate(['/invoices']);
  }

  onBuyCredits() {
    console.log('🔍 Opening buy credits modal');
    console.log('🔍 Credit packages:', this.creditPackages);
    this.showBuyCreditsModal = true;
    this.resetPaymentForm();
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  trackByPackage(index: number, pkg: CreditPackage): number {
    return pkg.credits;
  }

  closeBuyCreditsModal() {
    this.showBuyCreditsModal = false;
    this.selectedPackage = null;
    this.resetPaymentForm();
  }

  resetPaymentForm() {
    this.cardNumber = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.cardHolderName = '';
  }

  isPaymentFormValid(): boolean {
    return !!(this.cardNumber && this.cardExpiry && this.cardCvv && this.cardHolderName);
  }

  processPurchase() {
    if (!this.selectedPackage || !this.isPaymentFormValid()) {
      return;
    }

    // TODO: Integrate with payment gateway
    console.log('Processing purchase:', {
      package: this.selectedPackage,
      cardNumber: this.cardNumber.substring(0, 4) + '****', // Security
      amount: this.selectedPackage.price
    });

    // For now, just show success message and close modal
    alert(`Успешно закупихте ${this.selectedPackage.credits} кредита за ${this.selectedPackage.price} лева!`);
    this.closeBuyCreditsModal();
    
    // Refresh user credits
    this.freeCredits = this.authService.getFreeCredits();
  }
}
