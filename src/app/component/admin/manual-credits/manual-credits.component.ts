import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { AdminCreditService } from '../../../service/admin-credit.service';
import { BonusCreditsRequest, UserDto, FindUserRequest, UserCreditsSummary } from '../../../model/credit-package';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-manual-credits',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatListModule,
    MatTableModule
  ],
  templateUrl: './manual-credits.component.html',
  styleUrls: ['./manual-credits.component.scss']
})
export class ManualCreditsComponent implements OnInit {
  bonusForm: FormGroup;
  searchControl = new FormControl('');
  submitting = false;
  searchResults: UserDto[] = [];
  selectedUser: UserDto | null = null;
  userHistory: UserCreditsSummary | null = null;
  loadingHistory = false;
  displayedColumns: string[] = ['type', 'creditsDelta', 'description', 'createdAt'];

  constructor(
    private fb: FormBuilder,
    private adminCreditService: AdminCreditService,
    private snackBar: MatSnackBar
  ) {
    this.bonusForm = this.fb.group({
      userId: ['', [Validators.required, Validators.min(1)]],
      credits: ['', [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(emailPart => {
          if (!emailPart || emailPart.length < 2) {
            this.searchResults = [];
            return of([]);
          }
          const request: FindUserRequest = { emailPart: emailPart };
          return this.adminCreditService.searchUsers(request);
        })
      )
      .subscribe({
        next: (users) => {
          this.searchResults = users;
        },
        error: (error) => {
          console.error('Error searching users:', error);
          this.searchResults = [];
        }
      });
  }

  selectUser(user: UserDto): void {
    this.selectedUser = user;
    this.searchControl.setValue(user.email);
    this.bonusForm.patchValue({ userId: user.id });
    this.searchResults = [];
    this.loadUserHistory(user.email);
  }

  loadUserHistory(email: string): void {
    this.loadingHistory = true;
    this.adminCreditService.getUserCreditsHistory(email).subscribe({
      next: (history) => {
        this.userHistory = history;
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading user history:', error);
        this.snackBar.open('Грешка при зареждане на историята', 'Затвори', { duration: 3000 });
        this.loadingHistory = false;
      }
    });
  }

  clearSelection(): void {
    this.selectedUser = null;
    this.searchControl.setValue('');
    this.bonusForm.patchValue({ userId: '' });
    this.searchResults = [];
    this.userHistory = null;
  }

  onSubmit(): void {
    if (!this.bonusForm.valid || !this.selectedUser) return;

    this.submitting = true;
    const email = this.selectedUser.email;
    const request: BonusCreditsRequest = {
      credits: this.bonusForm.value.credits,
      reason: this.bonusForm.value.reason
    };

    this.adminCreditService.giveBonusCredits(email, request).subscribe({
      next: () => {
        this.snackBar.open('Бонус кредитите са добавени успешно', 'Затвори', { duration: 3000 });
        this.bonusForm.patchValue({ credits: '', reason: '' });
        this.submitting = false;
        // Reload history after successful bonus
        if (this.selectedUser) {
          this.loadUserHistory(this.selectedUser.email);
        }
      },
      error: (error) => {
        console.error('Error giving bonus credits:', error);
        this.snackBar.open('Грешка при добавяне на кредити', 'Затвори', { duration: 3000 });
        this.submitting = false;
      }
    });
  }
}
