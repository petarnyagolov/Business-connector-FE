import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { Company } from '../../model/company';
import { CompanyService } from '../../service/company.service';

export interface ResponseDialogData {
  requestId: string;
  requiredFields: string[];
  availableCompanies?: Company[]; // добавяме опционален параметър за наличните фирми
}

@Component({
  selector: 'app-response-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <div style="display: flex; align-items: center; gap: 8px;">
        <mat-icon color="primary">reply</mat-icon>
        Изпрати предложение
      </div>
    </h2>
    <mat-dialog-content>
      <form [formGroup]="responseForm" style="display: flex; flex-direction: column; gap: 16px; min-width: 400px;">
        <mat-form-field appearance="fill" style="width: 100%;">
          <mat-label>Фирма</mat-label>
          <mat-select formControlName="responserCompanyId" required>
            <mat-option [value]="''">-- Избери Фирма --</mat-option>
            <mat-option *ngFor="let company of userCompanies" [value]="company.id">
              {{ company.name }} ({{ company.vatNumber }})
            </mat-option>
          </mat-select>
          <mat-error *ngIf="responseForm.get('responserCompanyId')?.hasError('required')">Фирмата е задължителна</mat-error>
          <mat-hint *ngIf="userCompanies.length === 0">Няма налични фирми</mat-hint>
          <mat-hint *ngIf="userCompanies.length > 0">Налични фирми: {{ userCompanies.length }}</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;">
          <mat-label>Съобщение</mat-label>
          <textarea matInput formControlName="message" rows="4" placeholder="Опишете вашето предложение..."></textarea>
          <mat-error *ngIf="responseForm.get('message')?.hasError('required')">Съобщението е задължително</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('fixedPrice')">
          <mat-label>Фиксирана цена</mat-label>
          <input matInput type="number" formControlName="fixedPrice" required>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('priceFrom')">
          <mat-label>Цена от</mat-label>
          <input matInput type="number" formControlName="priceFrom" required>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('priceTo')">
          <mat-label>Цена до</mat-label>
          <input matInput type="number" formControlName="priceTo" required>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('availableFrom')">
          <mat-label>Налично от</mat-label>
          <input matInput [matDatepicker]="pickerFrom" formControlName="availableFrom" required placeholder="дд.мм.гггг">
          <mat-datepicker-toggle matSuffix [for]="pickerFrom"></mat-datepicker-toggle>
          <mat-datepicker #pickerFrom></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('availableTo')">
          <mat-label>Налично до</mat-label>
          <input matInput [matDatepicker]="pickerTo" formControlName="availableTo" required placeholder="дд.мм.гггг">
          <mat-datepicker-toggle matSuffix [for]="pickerTo"></mat-datepicker-toggle>
          <mat-datepicker #pickerTo></mat-datepicker>
        </mat-form-field>

        <div style="margin: 16px 0; border: 2px solid #1976d2; padding: 15px; border-radius: 8px; background-color: #f5f9ff;">
          <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #1976d2; font-size: 16px;">
            <mat-icon style="vertical-align: middle; margin-right: 8px;">attach_file</mat-icon>
            Прикачете файлове (снимки, PDF)
            <span *ngIf="isFieldRequired('files')" style="color: #f44336; margin-left: 4px;">*</span>
          </label>
          <input type="file" (change)="onFileChange($event)" accept="image/*,.pdf" style="margin-bottom: 12px; width: 100%; padding: 8px 0;" multiple>
          <div class="file-hint" style="font-size: 0.85rem; margin-top: 8px; color: #666;">
            Можете да качите няколко файла (изображения: jpg, png, gif и документи: pdf)
          </div>
          
          <div *ngIf="selectedFiles.length > 0" style="margin: 10px 0; color: green; font-weight: 500; display: flex; align-items: center;">
            <mat-icon style="margin-right: 8px;">check_circle</mat-icon>
            Успешно избрани {{ selectedFiles.length }} файла
          </div>

          <div *ngIf="selectedFiles.length > 0" style="margin: 10px 0; border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px; max-height: 160px; overflow-y: auto;">
            <div *ngFor="let file of selectedFiles; let i = index" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0;">
              <div style="display: flex; align-items: center; overflow: hidden; flex: 1;">
                <mat-icon [style.color]="file.type.startsWith('image/') ? '#1976d2' : '#f44336'" style="font-size: 18px; margin-right: 8px;">
                  {{ file.type.startsWith('image/') ? 'image' : 'picture_as_pdf' }}
                </mat-icon>
                <span style="font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ file.name }}</span>
              </div>
              <button mat-icon-button color="warn" (click)="removeFile(i)" type="button" style="width: 24px; height: 24px; line-height: 24px;">
                <mat-icon style="font-size: 18px;">delete</mat-icon>
              </button>
            </div>
          </div>
          
          <div *ngIf="filePreview">
            <img *ngIf="previewType === 'image'" [src]="filePreview" alt="Преглед" style="max-width: 120px; max-height: 120px; display: block; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); margin-top: 10px;">
            <div *ngIf="previewType === 'pdf'" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <mat-icon color="primary">picture_as_pdf</mat-icon>
              <span>PDF файл е качен успешно</span>
            </div>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Отказ</button>
      <button mat-raised-button color="primary" [disabled]="responseForm.invalid" (click)="onSubmit()">
        <mat-icon style="margin-right: 4px;">send</mat-icon>
        Изпрати предложение
      </button>
    </mat-dialog-actions>
  `,
})
export class ResponseDialogComponent implements OnInit, OnDestroy {
  responseForm: FormGroup;
  userCompanies: Company[] = [];
  filePreview: string | null = null;
  previewType: 'image' | 'pdf' | null = null;
  selectedFiles: File[] = [];
  private destroy$ = new Subject<void>();

  removeFile(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
      console.log('File removed. Remaining files:', this.selectedFiles);
      
      if (this.selectedFiles.length === 0) {
        this.filePreview = null;
        this.previewType = null;
      } else if (index === 0) {
        this.updateFilePreview(this.selectedFiles[0]);
      }
      
      this.responseForm.get('files')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
    }
  }
  
  updateFilePreview(file: File): void {
    if (file.type.startsWith('image/')) {
      this.previewType = 'image';
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      this.previewType = 'pdf';
      this.filePreview = 'pdf'; 
    } else {
      this.previewType = null;
      this.filePreview = null;
    }
  }

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    public dialogRef: MatDialogRef<ResponseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResponseDialogData
  ) {
    this.responseForm = this.fb.group({
      responserCompanyId: ['', Validators.required],
      message: ['', Validators.required],
      fixedPrice: [''],
      priceFrom: [''],
      priceTo: [''],
      availableFrom: [null],
      availableTo: [null],
      files: [[]] // инициализираме с празен масив вместо null
    });
    
    // Използваме подадените налични фирми или зареждаме всички
    if (data.availableCompanies) {
      this.userCompanies = data.availableCompanies;
      console.log(`Using ${this.userCompanies.length} available companies:`, this.userCompanies);
    } else {
      this.loadUserCompanies();
    }
    
    // Add required validators based on required fields
    if (data.requiredFields) {
      if (this.isFieldRequired('availableFrom')) {
        this.responseForm.get('availableFrom')?.addValidators(Validators.required);
        this.responseForm.get('availableFrom')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('availableTo')) {
        this.responseForm.get('availableTo')?.addValidators(Validators.required);
        this.responseForm.get('availableTo')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('fixedPrice')) {
        this.responseForm.get('fixedPrice')?.addValidators(Validators.required);
        this.responseForm.get('fixedPrice')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('priceFrom')) {
        this.responseForm.get('priceFrom')?.addValidators(Validators.required);
        this.responseForm.get('priceFrom')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('priceTo')) {
        this.responseForm.get('priceTo')?.addValidators(Validators.required);
        this.responseForm.get('priceTo')?.updateValueAndValidity();
      }
      // Check if files are required
      if (this.isFieldRequired('files')) {
        this.responseForm.get('files')?.addValidators(Validators.required);
        this.responseForm.get('files')?.updateValueAndValidity();
      }
    }
  }

  ngOnInit(): void {
    console.log('Response form initial state:', this.responseForm.value);
    console.log('Required fields:', this.data.requiredFields);
    console.log('Files field validation:', this.responseForm.get('files')?.validator);
  }

  loadUserCompanies(): void {
    console.log('Loading user companies...');
    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.userCompanies = companies;
          console.log(`Loaded ${this.userCompanies.length} companies:`, this.userCompanies);
        },
        error: (error) => {
          console.error('Error loading user companies:', error);
          this.userCompanies = [];
        }
      });
  }
  
  isFieldRequired(field: string): boolean {
    if (field === 'files' && 
        (this.data.requiredFields?.includes('files') || 
         this.data.requiredFields?.includes('file') || 
         this.data.requiredFields?.includes('picture'))) {
      return true;
    }
    
    return this.data.requiredFields?.includes(field) || false;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('Files selected:', input.files);
      
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          const isDuplicate = this.selectedFiles.some(f => f.name === file.name && f.size === file.size);
          if (!isDuplicate) {
            this.selectedFiles.push(file);
          } else {
            console.warn('File already selected, skipping:', file.name);
          }
        } else {
          console.warn('Unsupported file type ignored:', file.type);
          alert('Неподдържан тип файл: ' + file.name + '. Моля, използвайте само изображения или PDF файлове.');
        }
      }
      
      console.log('Selected files:', this.selectedFiles);
      this.responseForm.get('files')?.setValue(this.selectedFiles);
      
      if (this.selectedFiles.length > 0) {
        this.updateFilePreview(this.selectedFiles[0]);
      } else {
        this.previewType = null;
        this.filePreview = null;
      }
    } else {
      // No files selected
      this.selectedFiles = [];
      this.responseForm.get('files')?.setValue(null);
      this.filePreview = null;
      this.previewType = null;
    }
  }

  onSubmit(): void {
    if (this.responseForm.valid) {
      console.log('Form submitted with values:', this.responseForm.value);
      console.log('Selected files at submission:', this.selectedFiles.length, 'files');
      
      const result = {
        ...this.responseForm.value,
        responseText: this.responseForm.get('message')?.value,
        files: this.selectedFiles.length > 0 ? [...this.selectedFiles] : []
      };
      
      console.log('File details:', this.selectedFiles.map(f => `${f.name} (${f.type}, ${f.size} bytes)`).join(', '));
      console.log('Sending result to parent component:', result);
      this.dialogRef.close(result);
    } else {
      console.warn('Form is invalid:', this.responseForm.errors);
      
      const controls = this.responseForm.controls;
      Object.keys(controls).forEach(key => {
        const control = controls[key];
        if (control.errors) {
          console.warn(`Field ${key} has errors:`, control.errors);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
