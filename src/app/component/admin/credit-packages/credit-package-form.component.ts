import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminCreditService } from '../../../service/admin-credit.service';
import { CreditPackage } from '../../../model/credit-package';

@Component({
  selector: 'app-credit-package-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Редактирай пакет' : 'Добави нов пакет' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="packageForm" class="package-form">
        <mat-form-field appearance="fill">
          <mat-label>Код на пакета</mat-label>
          <input matInput formControlName="code" required>
          @if (packageForm.get('code')?.hasError('required')) {
            <mat-error>Кодът е задължителен</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Име (BG)</mat-label>
          <input matInput formControlName="nameBg" required>
          @if (packageForm.get('nameBg')?.hasError('required')) {
            <mat-error>Името на български е задължително</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Име (EN)</mat-label>
          <input matInput formControlName="nameEn" required>
          @if (packageForm.get('nameEn')?.hasError('required')) {
            <mat-error>Името на английски е задължително</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Брой кредити</mat-label>
          <input matInput type="number" formControlName="credits" required>
          @if (packageForm.get('credits')?.hasError('required')) {
            <mat-error>Броят кредити е задължителен</mat-error>
          }
          @if (packageForm.get('credits')?.hasError('min')) {
            <mat-error>Минимум 1 кредит</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Цена с ДДС (евро)</mat-label>
          <input matInput type="number" step="0.01" formControlName="priceWithVat" required>
          @if (packageForm.get('priceWithVat')?.hasError('required')) {
            <mat-error>Цената е задължителна</mat-error>
          }
          @if (packageForm.get('priceWithVat')?.hasError('min')) {
            <mat-error>Минимална цена 0.01 лв</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>ДДС ставка (0.2 = 20%)</mat-label>
          <input matInput type="number" step="0.01" formControlName="vatRate" required>
          @if (packageForm.get('vatRate')?.hasError('required')) {
            <mat-error>ДДС ставката е задължителна</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Ред на сортиране</mat-label>
          <input matInput type="number" formControlName="sortOrder" required>
          @if (packageForm.get('sortOrder')?.hasError('required')) {
            <mat-error>Редът е задължителен</mat-error>
          }
        </mat-form-field>

        <div class="checkboxes">
          <mat-checkbox formControlName="active">Активен</mat-checkbox>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Отказ</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!packageForm.valid || submitting">
        {{ submitting ? 'Запазване...' : 'Запази' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .package-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;

      mat-form-field {
        width: 100%;
      }

      .checkboxes {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 8px;
      }
    }
  `]
})
export class CreditPackageFormComponent implements OnInit {
  packageForm: FormGroup;
  isEditMode = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private adminCreditService: AdminCreditService,
    private dialogRef: MatDialogRef<CreditPackageFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string; package?: CreditPackage }
  ) {
    this.packageForm = this.fb.group({
      code: ['', [Validators.required]],
      nameBg: ['', [Validators.required]],
      nameEn: ['', [Validators.required]],
      credits: [0, [Validators.required, Validators.min(1)]],
      priceWithVat: [0, [Validators.required, Validators.min(0.01)]],
      vatRate: [0.2, [Validators.required, Validators.min(0)]],
      sortOrder: [1, [Validators.required, Validators.min(1)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.package) {
      this.isEditMode = true;
      const pkg = this.data.package;
      this.packageForm.patchValue({
        code: pkg.code,
        nameBg: pkg.nameBg,
        nameEn: pkg.nameEn,
        credits: pkg.credits,
        priceWithVat: pkg.priceWithVat,
        vatRate: pkg.vatRate,
        sortOrder: pkg.sortOrder,
        active: pkg.active
      });
    }
  }

  onSubmit(): void {
    if (!this.packageForm.valid) return;

    this.submitting = true;
    const formValue = this.packageForm.value;
    
    const packageData: CreditPackage = {
      code: formValue.code,
      nameBg: formValue.nameBg,
      nameEn: formValue.nameEn,
      credits: formValue.credits,
      priceWithVat: parseFloat(formValue.priceWithVat.toFixed(2)),
      priceWithoutVat: parseFloat((formValue.priceWithVat / (1 + formValue.vatRate)).toFixed(2)),
      vatRate: parseFloat(formValue.vatRate.toFixed(2)),
      sortOrder: formValue.sortOrder,
      active: formValue.active
    };

    // При edit добавяме id в обекта
    if (this.isEditMode) {
      packageData.id = this.data.package!.id!;
    }

    const request = this.isEditMode
      ? this.adminCreditService.updateCreditPackage(this.data.package!.id!.toString(), packageData)
      : this.adminCreditService.createCreditPackage(packageData);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Пакетът е обновен успешно' : 'Пакетът е създаден успешно',
          'Затвори',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error saving package:', error);
        this.snackBar.open('Грешка при запазване на пакета', 'Затвори', { duration: 3000 });
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
