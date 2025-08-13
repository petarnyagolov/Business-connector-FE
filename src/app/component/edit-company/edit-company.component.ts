import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CompanyService } from '../../service/company.service';
import { IndustryService } from '../../service/industry.service';
import { Company } from '../../model/company';
import { Industry } from '../../model/industry';
import { CompanyFormComponent } from '../company-form/company-form.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-company',
  standalone: true,
  imports: [
    CommonModule,
    CompanyFormComponent,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './edit-company.component.html',
  styleUrls: ['./edit-company.component.scss']
})
export class EditCompanyComponent implements OnInit, OnChanges {
  @Input() showModal: boolean = false;
  @Input() company: Company | null = null;
  @Output() companyUpdated = new EventEmitter<Company>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild(CompanyFormComponent) companyForm!: CompanyFormComponent;

  countries: string[] = [];
  industries: Industry[] = [];
  processedCompany: Company | null = null; 

  constructor(
    private companyService: CompanyService, 
    private industryService: IndustryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('EditCompanyComponent initialized with company:', this.company);
    this.loadCountries();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['company'] && this.company) {
      console.log('Company data changed:', this.company);
      console.log('Current company industry:', this.company.industry);
      this.loadIndustries(); 
    }
  }

  onUpdate(formData?: any) {
    if (!formData) {
      console.warn('onUpdate called without form data');
      return;
    }
    
    if (this.company) {
      const updatedCompany = {
        ...this.company,
        ...formData
      };
      
      console.log('Updating company with merged data:', updatedCompany);
      console.log('Company ID:', updatedCompany.id);
      
      this.companyService.updateCompany(updatedCompany).subscribe({
        next: (result: Company) => {
          console.log('Company updated successfully:', result);
          this.companyUpdated.emit(result);
        },
        error: (error: any) => {
          console.error('Error updating company:', error);
        }
      });
    }
  }

  onCancel() {
    this.cancelled.emit();
  }

  onSave() {
    if (this.companyForm && this.companyForm.companyForm.valid) {
      const formData = this.companyForm.companyForm.getRawValue();
      this.onUpdate(formData);
    } else {
      console.warn('Form is invalid or not available');
    }
  }

  private loadCountries() {
    this.companyService.getCountryNames().subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }

  private loadIndustries() {
    if (this.company?.country) {
      this.industryService.getAllIndustries(this.company.country).subscribe({
        next: (industries) => {
          this.industries = industries;
          if (this.company?.industry) {
            this.convertIndustryAndUpdateForm();
          }
        },
        error: (error) => {
          console.error('Error loading industries:', error);
        }
      });
    }
  }

  private convertIndustryAndUpdateForm() {
    if (this.company && this.company.industry && this.industries.length > 0) {
      this.processedCompany = { ...this.company };
      
      console.log('Converting industry. Current value:', this.processedCompany.industry);
      console.log('Available industries:', this.industries.map(i => ({ value: i.value, viewValue: i.viewValue })));
      
      const directMatch = this.industries.find(ind => 
        ind.value === this.processedCompany!.industry
      );
      
      if (directMatch) {
        console.log(`Industry is already in value format: ${this.processedCompany.industry}`);
      } else {
        const viewValueMatch = this.industries.find(ind => 
          ind.viewValue === this.processedCompany!.industry
        );
        
        if (viewValueMatch) {
          console.log(`Converting industry from viewValue "${this.processedCompany.industry}" to value "${viewValueMatch.value}"`);
          this.processedCompany.industry = viewValueMatch.value;
        } else {
          console.warn(`No matching industry found for: ${this.processedCompany.industry}`);
          console.warn('Available values:', this.industries.map(i => i.value));
          console.warn('Available viewValues:', this.industries.map(i => i.viewValue));
        }
      }
      
      this.cdr.detectChanges();
    } else {
      console.warn('convertIndustryAndUpdateForm: Missing data', {
        hasCompany: !!this.company,
        companyIndustry: this.company?.industry,
        industriesLength: this.industries.length
      });
    }
  }
}
