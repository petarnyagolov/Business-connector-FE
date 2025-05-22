import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CompanyRequestService } from '../../service/company-request.service'
import { CompanyRequest } from '../../model/companyRequest';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-company-requests',
  imports: [MatCardModule,
    MatButtonModule,
    MatPaginator,
    MatTableModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule],
  templateUrl: './company-requests.component.html',
  styleUrl: './company-requests.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyRequestsComponent implements OnInit {
  companyRequests: MatTableDataSource<CompanyRequest> = new MatTableDataSource<CompanyRequest>();
  displayedColumns: string[] = ['title', 'description', 'requesterName'];
  totalRequests: number = 0;
  pageSize: number = 20;
  currentPage: number = 0;
  searchQuery: string = '';
  searchSubject: Subject<string> = new Subject<string>();

  constructor(private companyRequestService: CompanyRequestService, private router: Router) {
    this.searchSubject.pipe(debounceTime(1000)).subscribe((searchQuery) => {
      this.searchQuery = searchQuery;
      this.currentPage = 0; // Рестартиране на страницата при ново търсене
      this.loadRequests();
    });
  }
  ngOnInit(): void {
    this.loadRequests();
  }
  loadRequests() {
    this.companyRequestService
    .searchRequests(this.searchQuery, this.currentPage, this.pageSize)
    .subscribe((response: any) => {
      this.companyRequests.data = response.content; 
      this.totalRequests = response.totalElements; 
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value); 
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadRequests();
  }

  viewRequestDetails(id: string): void {
    this.router.navigate(['/requests', id]);
  }


}
