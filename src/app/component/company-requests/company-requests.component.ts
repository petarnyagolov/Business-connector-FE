import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CompanyRequestService } from '../../service/company-request.service'
import { CompanyRequest } from '../../model/companyRequest';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../service/company.service';
import { ResponseService } from '../../service/response.service';
import { Company } from '../../model/company';
import { FormsModule } from '@angular/forms';
import { RequestTypeTranslatePipe } from './request-type-translate.pipe';

@Component({
  selector: 'app-company-requests',
  imports: [MatCardModule,
    MatButtonModule,
    MatPaginator,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
    MatIconModule,
    RequestTypeTranslatePipe],
  templateUrl: './company-requests.component.html',
  styleUrl: './company-requests.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyRequestsComponent implements OnInit {
  companyRequests: CompanyRequest[] = [];
  displayedColumns: string[] = ['title', 'description', 'requesterName'];
  totalRequests: number = 0;
  pageSize: number = 20;
  currentPage: number = 0;
  searchQuery: string = '';
  searchSubject: Subject<string> = new Subject<string>();
  showReplyFormId: string | null = null;
  replyFormData: { [key: string]: { responserCompanyId: string; responseText: string } } = {};
  userCompanies: Company[] = [];

  constructor(private companyRequestService: CompanyRequestService, private router: Router, private cdr: ChangeDetectorRef, private companyService: CompanyService, private responseService: ResponseService) {
    this.searchSubject.pipe(debounceTime(1000)).subscribe((searchQuery) => {
      this.searchQuery = searchQuery;
      this.currentPage = 0; // Рестартиране на страницата при ново търсене
      this.loadRequests();
    });
  }
  ngOnInit(): void {
    this.loadRequests();
    // Зареждаме компаниите на потребителя за селекта във формата за отговор
    this.companyService.getAllCompaniesByUser().subscribe(companies => this.userCompanies = companies);
  }
  loadRequests() {
    this.companyRequestService
    .searchRequests(this.searchQuery, this.currentPage, this.pageSize)
    .subscribe((response: any) => {
      this.companyRequests = response.content;
      this.totalRequests = response.totalElements;
      this.cdr.markForCheck();
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

  onReply(request: CompanyRequest): void {
    this.showReplyFormId = request.id;
    if (!this.replyFormData[request.id]) {
      this.replyFormData[request.id] = { responserCompanyId: '', responseText: '' };
    }
  }

  onCancelReply(): void {
    this.showReplyFormId = null;
  }

  onSubmitReply(request: CompanyRequest): void {
    const data = this.replyFormData[request.id];
    if (!data.responserCompanyId || !data.responseText) return;
    this.responseService.createResponse(request.id, data).subscribe({
      next: () => {
        alert('Отговорът е изпратен успешно!');
        this.showReplyFormId = null;
        this.replyFormData[request.id] = { responserCompanyId: '', responseText: '' };
      },
      error: () => alert('Грешка при изпращане на отговор!')
    });
  }

  onSave(request: CompanyRequest): void {
    // Placeholder: тук може да се имплементира логика за запазване на обявата (например в любими)
    alert('Заявлението е запазено успешно!');
  }


}
