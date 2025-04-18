import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import {MatGridListModule} from '@angular/material/grid-list';
import { MatCardModule, MatCardTitle, MatCardContent } from '@angular/material/card';
import {  MatButtonModule } from '@angular/material/button';
import { Company } from '../model/company';
import { CompanyService } from '../service/company.service';


@Component({
  selector: 'app-user-companies',
  imports: [RouterOutlet, RouterLink, CommonModule, MatGridListModule, MatCardModule, MatButtonModule,MatCardTitle, MatCardContent],
  templateUrl: './user-companies.component.html',
  styleUrl: './user-companies.component.scss',
  standalone: true
})
export class UserCompaniesComponent {
  companies = [] as Company[];

  
constructor(private router: Router, private companyService: CompanyService) {
  this.companies=[
    {name: 'Company 1', description: 'Description 1', vatNumber: '12345678', country: 'Bulgaria', city: ' Sofia', address:'Al. Stamboliski 1',industry:'Sort',phone:'123', email:'email'},
    {name: 'Company 1', description: 'Description 1', vatNumber: '12345678', country: 'Bulgaria', city: ' Sofia', address:'Al. Stamboliski 1',industry:'Sort',phone:'123', email:'email'},
    {name: 'Company 1', description: 'Description 1', vatNumber: '12345678', country: 'Bulgaria', city: ' Sofia', address:'Al. Stamboliski 1',industry:'Sort',phone:'123', email:'email'},
    {name: 'Company 1', description: 'Description 1', vatNumber: '12345678', country: 'Bulgaria', city: ' Sofia', address:'Al. Stamboliski 1',industry:'Sort',phone:'123', email:'email'}

  ]

  // this.companyService.getAllCompaniesByUser().subscribe((data: Company[]) => {
  //   this.companies = data;
  // });
}


  createCompany() {
    this.router.navigate(['/user/companies/create']);
  }
  
  onCancel() {
    this.router.navigate(['/user/companies']);
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
      return 2; // Single card spans two rows
    } else {
      return 1; // Each card spans one row
    }
  }
}
