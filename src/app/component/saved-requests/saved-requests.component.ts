import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

import { SavedRequestsService, SavedRequest } from '../../service/saved-requests.service';
import { FormatDateArrayPipe } from '../user-responses/format-date-array.pipe';

@Component({
  selector: 'app-saved-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    RouterModule,
    FormatDateArrayPipe
  ],
  templateUrl: './saved-requests.component.html',
  styleUrls: ['./saved-requests.component.scss']
})
export class SavedRequestsComponent implements OnInit, OnDestroy {
  savedRequests: SavedRequest[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private savedRequestsService: SavedRequestsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSavedRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSavedRequests(): void {
    this.loading = true;
    this.savedRequestsService.getAllSavedRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedRequests) => {
          // Мапваме savedAt полето от Unix timestamp към Date
          this.savedRequests = savedRequests.map(savedRequest => ({
            ...savedRequest,
            savedAt: savedRequest.savedAt && typeof savedRequest.savedAt === 'number' 
              ? new Date(savedRequest.savedAt * 1000) 
              : savedRequest.savedAt instanceof Date 
              ? savedRequest.savedAt 
              : new Date()
          }));
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading saved requests:', error);
          this.snackBar.open('Грешка при зареждане на запазените публикации', 'Затвори', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
  }

  removeSavedRequest(requestId: string, requestTitle: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Премахване от запазени',
        message: `Сигурни ли сте, че искате да премахнете "${requestTitle}" от запазените публикации?`,
        confirmText: 'Премахни',
        cancelText: 'Отказ'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.savedRequestsService.removeSavedRequest(requestId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open('Публикацията е премахната от запазените', 'Затвори', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.savedRequests = this.savedRequests.filter(
                saved => saved.requestCompany.id !== requestId
              );
            },
            error: (error) => {
              console.error('Error removing saved request:', error);
              this.snackBar.open('Грешка при премахване на публикацията', 'Затвори', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          });
      }
    });
  }

  viewRequestDetails(requestId: string): void {
    this.router.navigate(['/requests', requestId]);
  }

  getRequestTypeLabel(requestType: string): string {
    const typeLabels: { [key: string]: string } = {
      'LOOKING_FOR_SERVICE': 'Търся услуга',
      'SHARE_SERVICE': 'Предлагам услуга',
      'BUY': 'Купувам',
      'SELL': 'Продавам',
      'OTHER': 'Друго'
    };
    return typeLabels[requestType] || requestType;
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'ACTIVE': 'Активна',
      'INACTIVE': 'Неактивна',
      'IN_PROGRESS': 'В процес',
      'COMPLETED': 'Завършена'
    };
    return statusLabels[status] || status;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'ACTIVE': 'status-active',
      'INACTIVE': 'status-inactive',
      'IN_PROGRESS': 'status-in-progress',
      'COMPLETED': 'status-completed'
    };
    return statusClasses[status] || 'status-default';
  }

  getUnitLabel(unit: string): string {
    switch (unit) {
      case 'count': return 'Бр.';
      case 'box': return 'Кашон/и';
      case 'pallet': return 'Пале/та';
      default: return unit || '';
    }
  }

  trackByRequestId(index: number, savedRequest: SavedRequest): string {
    return savedRequest.requestCompany.id;
  }
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText || 'Отказ' }}</button>
      <button mat-button color="warn" [mat-dialog-close]="true">{{ data.confirmText || 'Потвърди' }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
    }
  ) {}
}