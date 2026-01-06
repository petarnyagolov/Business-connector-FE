import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminCreditService } from '../../../service/admin-credit.service';
import { CreditPackage } from '../../../model/credit-package';
import { CreditPackageFormComponent } from './credit-package-form.component';

@Component({
  selector: 'app-credit-packages',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './credit-packages.component.html',
  styleUrls: ['./credit-packages.component.scss']
})
export class CreditPackagesComponent implements OnInit {
  packages: CreditPackage[] = [];
  displayedColumns: string[] = ['nameBg', 'credits', 'price', 'code', 'active', 'actions'];
  loading = false;

  constructor(
    private adminCreditService: AdminCreditService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loading = true;
    this.adminCreditService.getAllCreditPackages().subscribe({
      next: (packages) => {
        this.packages = packages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading packages:', error);
        this.snackBar.open('Грешка при зареждане на пакетите', 'Затвори', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreditPackageFormComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPackages();
      }
    });
  }

  openEditDialog(pkg: CreditPackage): void {
    const dialogRef = this.dialog.open(CreditPackageFormComponent, {
      width: '600px',
      data: { mode: 'edit', package: pkg }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPackages();
      }
    });
  }

  deletePackage(pkg: CreditPackage): void {
    if (!confirm(`Сигурен ли си, че искаш да изтриеш пакет "${pkg.nameBg}"?`)) {
      return;
    }

    this.adminCreditService.deleteCreditPackage(pkg.id!.toString()).subscribe({
      next: () => {
        this.snackBar.open('Пакетът е изтрит успешно', 'Затвори', { duration: 3000 });
        this.loadPackages();
      },
      error: (error) => {
        console.error('Error deleting package:', error);
        this.snackBar.open('Грешка при изтриване на пакета', 'Затвори', { duration: 3000 });
      }
    });
  }

  formatPrice(price: number): string {
    return price ? price.toFixed(2) + ' €' : 'N/A';
  }

  getName(pkg: CreditPackage): string {
    return pkg.nameBg || pkg.nameEn || '-';
  }
}
