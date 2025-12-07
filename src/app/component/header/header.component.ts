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
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CreditsService } from '../../service/credits.service';
import { CompanyService } from '../../service/company.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
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
    NotificationBellComponent,
  ],
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


  isProcessingPurchase = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private savedRequestsService: SavedRequestsService,
    private cdr: ChangeDetectorRef,
    private creditsService: CreditsService,
    private http: HttpClient,
    private companyService: CompanyService
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
        // ВАЖНО: Показваме ясно съобщение преди redirect към ePay
        // За да избегнем фишинг detection от Google Safe Browsing
        console.log('🔐 Redirecting to ePay payment gateway:', res.url);
        
        // Създаваме форма с видимо потвърждение
        const pkg = this.selectedPackage!;
        const confirmMessage = `Ще бъдете пренасочени към сигурната страница за плащане на ePay.bg.\n\nСума: ${pkg.priceWithVat} ${pkg.currency}\nКредити: ${pkg.credits}\n\nПродължавате?`;
        
        if (!confirm(confirmMessage)) {
          this.isProcessingPurchase = false;
          return;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = res.url;
        // Правим формата видима за по-добра прозрачност
        form.style.display = 'none';

        const pageInput = document.createElement('input');
        pageInput.type = 'hidden';
        pageInput.name = 'PAGE';
        pageInput.value = 'paylogin';
        form.appendChild(pageInput);

        const encodedInput = document.createElement('input');
        encodedInput.type = 'hidden';
        encodedInput.name = 'ENCODED';
        encodedInput.value = res.encoded;
        form.appendChild(encodedInput);

        const checksumInput = document.createElement('input');
        checksumInput.type = 'hidden';
        checksumInput.name = 'CHECKSUM';
        checksumInput.value = res.checksum;
        form.appendChild(checksumInput);

        document.body.appendChild(form);
        
        // Добавяме видим индикатор за redirect
        console.log('💳 Submitting payment form to ePay...');
        form.submit();
      },
      error: (err) => {
        console.error('Error initializing ePay payment', err);
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
  encoded: string;
  checksum: string;
}
