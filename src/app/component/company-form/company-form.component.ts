import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../service/notification.service';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule, // Add MatIconModule to imports
    MatProgressSpinnerModule // Add spinner module
  ],
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.scss']
})
export class CompanyFormComponent implements OnInit, OnChanges {
  @Input() initialValues: any = {};
  @Input() mode: 'create' | 'update' = 'create';
  @Input() disabledFields: string[] = [];
  @Input() countries: string[] = [];
  @Input() industries: { value: string, viewValue: string }[] = [];
  @Output() formSubmit = new EventEmitter<any>();
  @Output() validateCompany = new EventEmitter<{ vatNumber: string, country: string }>();
  @Output() countryChange = new EventEmitter<any>();
  @Output() logoChange = new EventEmitter<File | null>(); // EventEmitter for logo changes
  @Output() cancel = new EventEmitter<void>(); // EventEmitter for cancel action
  @Output() register = new EventEmitter<any>(); // EventEmitter for register action

  @ViewChild('logoInput') logoInputRef!: ElementRef; // Reference to the logo input element

  companyForm: FormGroup;
  selectedLogo: File | null = null; // Property to hold the selected logo file
  employeesSizes = [
    { value: '1-10', viewValue: '1-10' },
    { value: '10-20', viewValue: '10-20' },
    { value: '20-50', viewValue: '20-50' },
    { value: '50-100', viewValue: '50-100' },
    { value: '100+', viewValue: '100+' }
  ];

  showCompanyDetails = false;
  isValidVatNumber = false;

  @Input() showSaveButton: boolean = true; // New input property to control save button visibility
  @Input() showRegisterButton: boolean = false; // New input property to control register button visibility
  @Input() isLoading: boolean = false; // New input property to control loading spinner visibility

  constructor(private fb: FormBuilder, private notificationService: NotificationService) {
    // Use disabled state at creation time for controls
    const controlsConfig: any = {
      country: [{ value: '', disabled: this.disabledFields.includes('country') }, [Validators.required , Validators.maxLength(50)]],
      vatNumber: [{ value: '', disabled: this.disabledFields.includes('vatNumber') }, [Validators.required, Validators.maxLength(50)]],
      name: [{ value: '', disabled: this.disabledFields.includes('name') }, [Validators.required, Validators.maxLength(255)]],
      industry: [{ value: '', disabled: this.disabledFields.includes('industry') }, [Validators.required, Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.maxLength(255)]],
      mol: ['', [Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.maxLength(350)]],
      employeesSize: ['', [Validators.required, Validators.maxLength(10)]],
      creatorPosition: [{ value: '', disabled: this.disabledFields.includes('creatorPosition') }, [Validators.required, Validators.maxLength(50)]],
      logo: ['', [Validators.maxLength(255)]],
    };

    this.companyForm = this.fb.group(controlsConfig);
  }

  ngOnInit() {
    if (this.initialValues) {
      this.companyForm.patchValue(this.initialValues);
    }
    
    if (this.mode === 'update') {
      this.showCompanyDetails = true;
      this.isValidVatNumber = true;
    }
    
    if (this.disabledFields && this.disabledFields.length > 0) {
      this.disabledFields.forEach(field => {
        if (this.companyForm.get(field)) {
          this.companyForm.get(field)?.disable({ emitEvent: false });
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValues'] && changes['initialValues'].currentValue) {
      console.log('CompanyForm получи нови initialValues:', changes['initialValues'].currentValue);
      this.companyForm?.patchValue(changes['initialValues'].currentValue);
      
      if (this.mode === 'update') {
        this.showCompanyDetails = true;
        this.isValidVatNumber = true;
      }
    }
  }

  onValidate() {
    const rawVat = this.companyForm.get('vatNumber')?.value;
    const trimmedVat = typeof rawVat === 'string' ? rawVat.trim() : rawVat;
    this.companyForm.get('vatNumber')?.setValue(trimmedVat, { emitEvent: false });
    this.validateCompany.emit({
      vatNumber: trimmedVat,
      country: this.companyForm.get('country')?.value
    });
  }

  onLogoSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const allowedTypes = ['image/png', 'image/jpeg'];
      if (allowedTypes.includes(file.type)) {
        this.selectedLogo = file;
        this.logoChange.emit(this.selectedLogo);
        console.log('CompanyFormComponent: Logo selected and emitted:', this.selectedLogo); // DEBUG
      } else {
        this.notificationService.warning('Invalid file type. Please select a PNG, JPG, or JPEG file.');
        this.selectedLogo = null;
        this.logoChange.emit(null);
        if (this.logoInputRef) {
          this.logoInputRef.nativeElement.value = ''; // Clear the file input
        }
        console.log('CompanyFormComponent: Invalid logo type, emitted null'); // DEBUG
      }
    } else {
      this.selectedLogo = null;
      this.logoChange.emit(null);
      if (this.logoInputRef) { // Also clear input if no file is selected (e.g., user cancels dialog)
        this.logoInputRef.nativeElement.value = '';
      }
      console.log('CompanyFormComponent: No file selected or input.files is null, emitted null'); // DEBUG
    }
  }

  clearLogo(): void {
    this.selectedLogo = null;
    this.logoChange.emit(null);
    if (this.logoInputRef) {
      this.logoInputRef.nativeElement.value = ''; // Clear the file input
    }
    console.log('CompanyFormComponent: Logo cleared, emitted null'); // DEBUG
  }

  onSubmit() {
    if (this.companyForm.valid) {
      this.formSubmit.emit(this.companyForm.getRawValue());
    }
  }

  onRegister() {
    const rawVat = this.companyForm.get('vatNumber')?.value;
    const trimmedVat = typeof rawVat === 'string' ? rawVat.trim() : rawVat;
    this.companyForm.get('vatNumber')?.setValue(trimmedVat, { emitEvent: false });
    if (this.companyForm.valid) {
      this.register.emit(this.companyForm.getRawValue());
    }
  }

  onCancel() {
    this.cancel.emit(); 
  }

  setCompanyDetailsVisible(visible: boolean) {
    this.showCompanyDetails = visible;
  }
  
  setVatValid(valid: boolean) {
    this.isValidVatNumber = valid;
  }
  
  /**
   * Sets company data from external validation (VIES)
   * Temporarily enables disabled fields to allow value setting
   */
  setCompanyDataFromVies(data: { name?: string; address?: string }) {
    console.log('🔧 setCompanyDataFromVies called with:', data);
    
    if (data.name) {
      const nameControl = this.companyForm.get('name');
      if (nameControl) {
        nameControl.setValue(data.name, { emitEvent: false });
        nameControl.disable({ emitEvent: false });
        console.log('✅ Name set to:', data.name, 'and disabled');
      }
    }
    
    if (data.address) {
      const addressControl = this.companyForm.get('address');
      if (addressControl) {
        addressControl.setValue(data.address, { emitEvent: false });
        addressControl.disable({ emitEvent: false });
        console.log('✅ Address set to:', data.address, 'and disabled');
      }
    }
  }
}
