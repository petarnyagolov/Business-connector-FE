import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../service/auth.service';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';
import { ChangeEmailDialogComponent } from './change-email-dialog.component';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  userInfo: any = null;
  loading = true;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.loading = true;
    this.authService.getUserInfo().subscribe({
      next: (data) => {
        this.userInfo = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user info:', error);
        this.loading = false;
      }
    });
  }

  openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Password changed successfully
      }
    });
  }

  openChangeEmailDialog(): void {
    const dialogRef = this.dialog.open(ChangeEmailDialogComponent, {
      width: '500px',
      data: { currentEmail: this.userInfo?.email }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUserInfo();
      }
    });
  }

  copyReferralCode(): void {
    if (this.userInfo?.referralCode) {
      navigator.clipboard.writeText(this.userInfo.referralCode).then(() => {
        this.snackBar.open('Кодът за препоръка е копиран!', 'Затвори', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      });
    }
  }
}
