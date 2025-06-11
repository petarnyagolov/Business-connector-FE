import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Company } from '../model/company';
import { ActivatedRoute } from '@angular/router';
import { CompanyService } from '../service/company.service';
import { environment } from '../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.scss'
})
export class CompanyDetailComponent implements OnInit {
  company: (Company & { employeesSize?: string }) | null = null;
  backendUrl = environment.apiUrl;
  logoUrl: string = '';

  constructor(private route: ActivatedRoute, private companyService: CompanyService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyService.getCompanyByVatNumber(id).subscribe({
        next: (data: Company) => {
          this.company = data;
          this.loadLogo();
        },
        error: (error: any) => {
          console.error('Error fetching company details:', error);
        }
      });
    }
  }

  loadLogo(): void {
    if (!this.company) return;
    const logoPath = this.company.logo || this.company.logoPath;
    if (!logoPath) {
      this.logoUrl = '';
      return;
    }
    const cleanPath = logoPath.replace(/\\/g, '/');
    this.companyService.getLogoByPath(cleanPath).subscribe({
      next: (blob: Blob) => {
        this.logoUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      error: () => {
        this.logoUrl = '';
        this.cdr.detectChanges();
      }
    });
  }

  getLogoUrl(): string {
    return this.logoUrl;
  }
}
