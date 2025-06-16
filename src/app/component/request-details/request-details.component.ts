import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CompanyRequestService } from '../../service/company-request.service';
import { CompanyRequest } from '../../model/companyRequest';
import { CompanyService } from '../../service/company.service';
import { Company } from '../../model/company';
import { ResponseService } from '../../service/response.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatError } from '@angular/material/form-field';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatOptionModule],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.scss'
})
export class RequestDetailsComponent implements OnInit {
  request: CompanyRequest | null = null;
  companies: Company[] = [];
  responseForm: FormGroup;
  responseSuccess: boolean = false;
  showResponseForm: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private responseService: ResponseService,
    private fb: FormBuilder
  ) {
    this.responseForm = this.fb.group({
      responserCompanyId: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyRequestService.searchRequests('', 0, 1).subscribe(res => {
        const found = res.content.find((r: CompanyRequest) => r.id === id);
        this.request = found || null;
      });
    }
    this.companyService.getAllCompaniesByUser().subscribe(companies => this.companies = companies);
  }

  onSubmit(): void {
    if (!this.request || this.responseForm.invalid) return;
    this.responseService.createResponse(this.request.id, this.responseForm.value).subscribe({
      next: () => {
        this.responseSuccess = true;
        this.showResponseForm = false;
      },
      error: () => this.responseSuccess = false
    });
  }
}
