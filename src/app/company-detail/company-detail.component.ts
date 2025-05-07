import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Company } from '../model/company';
import { ActivatedRoute } from '@angular/router';
import { CompanyService } from '../service/company.service';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.scss'
})
export class CompanyDetailComponent implements OnInit {
  company: Company | null = null;

  constructor(private route: ActivatedRoute, private companyService: CompanyService) {}
  ngOnInit(): void {
    const vatNumber = this.route.snapshot.paramMap.get('vatNumber');
    if (vatNumber) {
      this.companyService.getCompanyByVatNumber(vatNumber).subscribe({
        next: (data: Company) => {
          this.company = data;
        },
        error: (error: any) => {
          console.error('Error fetching company details:', error);
        }
      });
    }
  }
}
