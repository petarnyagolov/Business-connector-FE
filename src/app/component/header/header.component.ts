import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { SavedRequestsService } from '../../service/saved-requests.service';
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
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CreditsService } from '../../service/credits.service';
import { CompanyService } from '../../service/company.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { EpayPaymentDialogComponent } from '../epay-payment-dialog/epay-payment-dialog.component';
import { environment } from '../../../environments/environment';

interface CreditPackage {
  id: number;
  code: string;
  name: string;
  credits: number;
  priceWithVat: number;
  currency: string;
  // по желание:
  description?: string;
  discount?: string;
}

interface UserCompany {
  id: string | number;
  name: string;
  eikBulstat: string;
  vatNumber?: string;
  invoiceAddress?: string;
  invoiceEmail?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    RouterModule,
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
    MatRadioModule,
    MatDialogModule,
    NotificationBellComponent
  ]
})

export class HeaderComponent implements OnInit, OnDestroy {
  @Input() pageTitle!: string;
  @Input() logoSrc!: string;
  isAuthenticated: boolean = false;
  savedRequestsCount: number = 0;
  userName: string | null = null;
  userEmail: string | null = null;
  freeCredits: number = 0;
  private destroy$ = new Subject<void>();

  isMobileMenuOpen: boolean = false;
  showBuyCreditsModal: boolean = false;
  selectedPackage: CreditPackage | null = null;
  creditPackages: CreditPackage[] = [];

  userCompanies: UserCompany[] = [];
  selectedCompanyId: number | null = null;
  private userCompaniesLoaded = false;

  private readonly EUR_TO_BGN_RATE = 1.95583;

  // Данни за фактура
  invoiceName: string = '';
  invoiceBulstat: string = '';
  invoiceVatNumber: string = '';
  invoiceAddress: string = '';
  invoiceEmail: string = '';

  // Payment method selection
  paymentMethod: 'profile' | 'card' = 'card'; // Default to direct card payment

  isProcessingPurchase = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private savedRequestsService: SavedRequestsService,
    private cdr: ChangeDetectorRef,
    private creditsService: CreditsService,
    private http: HttpClient,
    private companyService: CompanyService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.authService.authStatus$.subscribe(status => {
      this.isAuthenticated = status;
      if (status) {
        this.userName = this.authService.getUserName();
        this.userEmail = this.authService.getUserEmail();
        
        this.creditsService.credits$
          .pipe(takeUntil(this.destroy$))
          .subscribe(credits => {
            this.freeCredits = credits;
            console.log('🎯 Header credits updated:', credits);
          });

        this.savedRequestsService.initializeForAuthenticatedUser();

        this.savedRequestsService.savedRequestsCount$
          .pipe(takeUntil(this.destroy$))
          .subscribe(count => {
            this.savedRequestsCount = count;
          });

        this.loadUserCompanies();
        this.loadCreditPackages();
      } else {
        this.savedRequestsCount = 0;
        this.userName = null;
        this.userEmail = null;
        this.freeCredits = 0;
        this.creditPackages = [];
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout() {
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onSettings() {
    this.closeMobileMenu();
    this.router.navigate(['/settings']);
  }

  onInvoices() {
    this.closeMobileMenu();
    this.router.navigate(['/invoices']);
  }

  onBuyCredits() {
    this.closeMobileMenu();
    console.log('🔍 Opening buy credits modal');
    console.log('🔍 Credit packages:', this.creditPackages);
    this.showBuyCreditsModal = true;
    this.prefillInvoiceEmail();

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

    toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  trackByCredits(index: number, item: CreditPackage): number {
    return item.credits;
  }

  onPackageChange(event: MatSelectChange) {
    console.log('Package changed:', event.value);
    this.selectedPackage = event.value;
    this.cdr.detectChanges();
  }

  trackByPackage(index: number, pkg: CreditPackage): number {
    return pkg.credits;
  }

  closeBuyCreditsModal() {
    this.showBuyCreditsModal = false;
    this.selectedPackage = null;
  }

  processPurchase() {
    if (!this.selectedPackage || this.isProcessingPurchase) {
      return;
    }

    this.isProcessingPurchase = true;

    this.http.post<EpayInitResponse>(
      `${environment.apiUrl}/payments/epay/init/${this.selectedPackage.id}`,
      {
        invoiceName: this.invoiceName,
        invoiceBulstat: this.invoiceBulstat,
        invoiceVatNumber: this.invoiceVatNumber,
        invoiceAddress: this.invoiceAddress,
        invoiceEmail: this.invoiceEmail || this.userEmail
      }
    ).subscribe({
      next: (res) => {
        console.log('🔐 ePay payment initialized:', res);
        
        // Save transaction ID for status checking after redirect
        if (res.transactionId) {
          sessionStorage.setItem('epay_transaction_id', res.transactionId);
        }
        
        console.log(`📋 PAGE parameter: ${res.PAGE}`);
        
        // Create a hidden form and submit it to redirect to ePay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = res.url;
        form.style.display = 'none';
        
        // Add all form parameters from backend response
        const params: { [key: string]: string } = {
          'PAGE': res.PAGE,
          'ENCODED': res.ENCODED,
          'CHECKSUM': res.CHECKSUM,
          'LANG': 'bg'
        };
        
        // Add optional URL_OK and URL_CANCEL if provided by backend
        if (res.URL_OK) {
          params['URL_OK'] = res.URL_OK;
        }
        if (res.URL_CANCEL) {
          params['URL_CANCEL'] = res.URL_CANCEL;
        }
        
        console.log('📤 Submitting form with params:', {
          PAGE: params['PAGE'],
          url: res.url,
          URL_OK: params['URL_OK'],
          URL_CANCEL: params['URL_CANCEL']
        });
        
        // Create hidden input fields
        Object.keys(params).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = params[key];
          form.appendChild(input);
        });
        
        // Append form to body, submit, and remove
        document.body.appendChild(form);
        console.log('🚀 Redirecting to ePay.bg...');
        form.submit();
        
        // Clean up - the page will redirect, but just in case
        setTimeout(() => {
          try {
            document.body.removeChild(form);
          } catch (e) {
            // Form already removed by navigation
          }
          this.isProcessingPurchase = false;
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Error initializing ePay payment:', err);
        alert('Грешка при инициализиране на плащането. Моля опитайте отново.');
        this.isProcessingPurchase = false;
      }
    });
  }

  private loadCreditPackages(): void {
    this.http.get<CreditPackage[]>(`${environment.apiUrl}/credit-packages`)
      .subscribe({
        next: (pkgs) => {
          this.creditPackages = pkgs;
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err.status === 403) {
            console.warn('Credit packages forbidden (probably not authenticated).');
            return;
          }
          console.error('Error loading credit packages', err);
        }
      });
  }

  private prefillInvoiceEmail(): void {
    if (!this.invoiceEmail && this.userEmail) {
      this.invoiceEmail = this.userEmail;
    }
  }

  loadUserCompanies(): void {
    if (this.userCompaniesLoaded) {
      return;
    }

    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.userCompanies = (companies || []).map((c) => {
            const mapped = this.companyService.mapCompanyToInvoice(c as any);
            return {
              id: mapped.id ?? '',
              name: mapped.name,
              eikBulstat: mapped.eikBulstat,
              vatNumber: mapped.vatNumber,
              invoiceAddress: mapped.invoiceAddress,
              invoiceEmail: mapped.invoiceEmail,
            } as UserCompany;
          });
          this.userCompaniesLoaded = true;
        },
        error: () => {
          this.userCompanies = [];
          this.userCompaniesLoaded = true;
        }
      });
  }


  onCompanySelected(companyId: number | string): void {
    const idStr = String(companyId);
    this.selectedCompanyId = companyId as any;
    const company = this.userCompanies.find(c => String(c.id) === idStr);
    if (!company) {
      return;
    }

    this.invoiceName = company.name;
    this.invoiceBulstat = company.eikBulstat;
    this.invoiceVatNumber = company.vatNumber || '';
    this.invoiceAddress = company.invoiceAddress || '';
    this.invoiceEmail = company.invoiceEmail || this.userEmail || '';
  }
}

interface EpayInitResponse {
  url: string;
  ENCODED: string;
  CHECKSUM: string;
  PAGE: string;
  URL_OK?: string;
  URL_CANCEL?: string;
  transactionId?: string; // For tracking payment status
}
