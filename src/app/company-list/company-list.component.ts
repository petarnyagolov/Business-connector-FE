import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Company } from '../model/company';
import { CompanyService } from '../service/company.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-company-list',
  imports: [MatCardModule, 
    MatButtonModule, 
    MatPaginator, 
    MatTableModule, 
    CommonModule,
    MatFormFieldModule,
    MatInputModule],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListComponent implements OnInit {
  companies: MatTableDataSource<Company> = new MatTableDataSource<Company>();
  displayedColumns: string[] = ['name', 'description',  'industry', 'country'];
  totalCompanies: number = 0;
  pageSize: number = 20;
  currentPage: number = 0;
  searchQuery: string = '';
  searchSubject: Subject<string> = new Subject<string>();

  constructor(private companyService: CompanyService, private router: Router) { 
    this.searchSubject.pipe(debounceTime(1000)).subscribe((searchQuery) => {
      this.searchQuery = searchQuery;
      this.currentPage = 0; // Рестартиране на страницата при ново търсене
      this.loadCompanies();
    });
  }


  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.companyService
      .searchCompanies(this.searchQuery, this.currentPage, this.pageSize)
      .subscribe((response: any) => {
        this.companies.data = response.content; 
        this.totalCompanies = response.totalElements; 
      });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value); 
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCompanies();
  }

  viewCompanyDetails(id: string): void {
    this.router.navigate(['/companies', id]);
  }
}