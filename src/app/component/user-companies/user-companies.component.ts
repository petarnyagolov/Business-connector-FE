import { Component } from '@angular/core';
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


  
constructor(private router: Router, private companyService: CompanyService) {
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
  for (const company of this.companies) {
    const logoPath = company.logo;
    if (logoPath && !this.logoUrls[logoPath]) {
      const cleanPath = logoPath.replace(/\\/g, '/');
      this.companyService.getLogoByPath(cleanPath).subscribe({
        next: (blob: Blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.logoUrls[logoPath] = objectUrl;
        },
        error: (error: unknown) => {
          console.error('Error loading logo:', error);
          this.logoUrls[logoPath] = '';
        }
      });
    }
  }
}

getLogoUrl(logoPath?: string): string {
  if (!logoPath) return '';
  return this.logoUrls[logoPath] || '';
}

  createCompany() {
    console.log('createCompany() called'); // Debugging
    // this.showCancelButton = true;
    console.log('showCancelButton:', this.showCancelButton); // Debugging
    this.router.navigate(['/user/companies/create']);
  }
  
  onCancel() {
    console.log('onCancel() called'); // Debugging
    // this.showCancelButton = false;
    console.log('showCancelButton:', this.showCancelButton); // Debugging
    this.router.navigate(['/user/companies']);
    
  }
  editCompany(company: Company) {
    this.router.navigate(['/user/companies/update', company.vatNumber]);
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
}
