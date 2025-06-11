import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import {MatGridListModule} from '@angular/material/grid-list';
import { MatCardModule, MatCardContent} from '@angular/material/card';
import {  MatButtonModule } from '@angular/material/button';
import { Company } from '../../model/company';
import { CompanyService } from '../../service/company.service';
import { filter } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-user-companies',
  imports: [RouterOutlet, RouterLink, CommonModule, MatGridListModule, MatCardModule, MatButtonModule, MatCardContent, MatIcon],
  templateUrl: './user-companies.component.html',
  styleUrl: './user-companies.component.scss',
  standalone: true
})
export class UserCompaniesComponent {
  companies: Company[] = [];
  showCancelButton: boolean = false; 
  logoUrls: { [key: string]: string } = {};
  private logoObjectUrls: string[] = []; // За освобождаване на blob-ове


  
constructor(private router: Router, private companyService: CompanyService, private cdr: ChangeDetectorRef) {
  this.loadCompanies();

}


ngOnInit(): void {
  this.loadCompanies();

  // Listen to route changes and toggle the button visibility
  this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      this.loadCompanies();
      this.showCancelButton = this.router.url.includes('/create');
    });
}

loadCompanies(): void {
  this.companyService.getAllCompaniesByUser().subscribe({
    next: (data: Company[]) => {
      // Сортирай така, че компаниите с лого да са най-отгоре
      this.companies = data.sort((a, b) => {
        const aHasLogo = !!(a.logo && this.logoUrls[a.logo]);
        const bHasLogo = !!(b.logo && this.logoUrls[b.logo]);
        if (aHasLogo === bHasLogo) return 0;
        return bHasLogo ? 1 : -1;
      });
      this.loadAllLogos();
      console.log('Loaded companies:', this.companies);
    },
    error: (error) => {
      console.error('Error fetching companies:', error);
    }
  });
}

loadAllLogos(): void {
  const currentIds = this.companies.map(c => c.id?.toString()).filter(Boolean);
  Object.keys(this.logoUrls).forEach(id => {
    if (!currentIds.includes(id)) {
      URL.revokeObjectURL(this.logoUrls[id]);
      delete this.logoUrls[id];
    }
  });

  const logoObservables = this.companies.map(company => {
    const id = company.id?.toString();
    const logoPath = company.logo || company.logoPath;
    if (!id) return of(null);
    if (!logoPath) {
      this.logoUrls[id] = '';
      return of(null);
    }
    if (this.logoUrls[id]) {
      return of(null);
    }
    const cleanPath = logoPath.replace(/\\/g, '/');
    return this.companyService.getLogoByPath(cleanPath).pipe(
      // Ако има грешка, върни null
      // catchError(() => of(null))
    );
  });

  forkJoin(logoObservables).subscribe((blobs) => {
    this.companies.forEach((company, idx) => {
      const id = company.id?.toString();
      const blob = blobs[idx];
      if (!id) return;
      if (blob instanceof Blob) {
        const objectUrl = URL.createObjectURL(blob);
        this.logoUrls[id] = objectUrl;
      } else if (!this.logoUrls[id]) {
        this.logoUrls[id] = '';
      }
    });
    // Принудително създай нов обект, за да тригърнеш Angular change detection
    this.logoUrls = { ...this.logoUrls };
    this.cdr.detectChanges();
  });
}

getLogoUrl(company: Company): string {
  const logoPath = company.logo || company.logoPath;
  if (!logoPath) return '';
  if (logoPath.startsWith('http')) return logoPath;
  // Връща абсолютния URL към бекенда
  return `http://localhost:8080/files/${logoPath.replace(/^\\+|\\+$/g, '').replace(/\\/g, '/')}`;
}

  createCompany() {
    this.router.navigate(['/user/companies/create']);
    setTimeout(() => {
      const formEl = document.querySelector('.company-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }
  
  onCancel() {
    console.log('onCancel() called'); // Debugging
    // this.showCancelButton = false;
    console.log('showCancelButton:', this.showCancelButton); // Debugging
    this.router.navigate(['/user/companies']);
    
  }
  editCompany(company: Company) {
    this.router.navigate(['/user/companies/update', company.id]);
  }
  getGridColumns(): number {
    if (this.companies.length === 1) {
      return 1; // One big card
    } else if (this.companies.length === 2) {
      return 2; // Two middle-sized cards
    } else {
      return 3; // Three smaller cards
    }
  }

  getRowHeight(): string {
    if (this.companies.length === 1) {
      return '4:3'; // Taller card for a single company
    } else if (this.companies.length === 2) {
      return '3:2'; // Medium height for two companies
    } else {
      return '2:1'; // Shorter cards for three or more companies
    }
  }

  getColSpan(): number {
    if (this.companies.length === 1) {
      return 1; // Single card spans the full width
    } else {
      return 1; // Each card spans one column
    }
  }

  getRowSpan(): number {
    if (this.companies.length === 1) {
      return 2;
    } else if (this.companies.length === 2) {
      return 2;
    } else {
      return 2; // беше 1, но това ще даде повече височина
    }
  }

  logoLoadError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  getEmployeesSize(company: any): string {
    return company && company.employeesSize ? company.employeesSize : '-';
  }
}
