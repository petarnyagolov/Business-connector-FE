import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-proforma-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="proforma-container">
      <div class="header">
        <h2 mat-dialog-title>Преглед на Проформа Фактура</h2>
        <button mat-icon-button (click)="onCancel()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="content">
        <div *ngIf="pdfUrl; else noPdf" class="pdf-wrapper">
          <iframe [src]="pdfUrl" width="100%" height="500px" frameborder="0"></iframe>
        </div>
        <ng-template #noPdf>
          <div class="error-message">
            <p>Няма наличен преглед на PDF файла.</p>
          </div>
        </ng-template>
        
        <div class="info-note">
           <mat-icon class="info-icon">info</mat-icon>
           <span>Това е преглед. Реалната фактура ще бъде издадена след успешно плащане.</span>
        </div>
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Отказ</button>
        <button mat-raised-button color="primary" (click)="onConfirm()">
          <mat-icon>payment</mat-icon>
          Към плащане
        </button>
      </div>
    </div>
  `,
  styles: [`
    .proforma-container {
      max-width: 900px;
      width: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 400px;
    }
    .pdf-wrapper {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    .info-note {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #e3f2fd;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      color: #0d47a1;
    }
    .info-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class ProformaInvoiceDialogComponent {
  pdfUrl: SafeResourceUrl | null = null;

  constructor(
    public dialogRef: MatDialogRef<ProformaInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pdfBlob: Blob },
    private sanitizer: DomSanitizer
  ) {
    if (data.pdfBlob) {
      // Ensure the blob is treated as a PDF
      const file = new Blob([data.pdfBlob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(file);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
