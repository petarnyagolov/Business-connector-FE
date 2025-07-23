import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { SavedRequestsService } from '../../service/saved-requests.service';
import { NgFor, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav'; // Import MatSidenavModule
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    RouterModule, 
    NgIf,  
    NgFor,
    MatMenuModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSidenavModule, 
    MatToolbarModule,
    MatDividerModule,
    MatBadgeModule,
    // MatNavList
  ],
})

export class HeaderComponent implements OnInit, OnDestroy {
  @Input() pageTitle!:string;
  @Input() logoSrc!:string;
  isAuthenticated: boolean = false;
  savedRequestsCount: number = 0;
  private destroy$ = new Subject<void>();

  // Dummy notifications
  notifications = [
    { id: 1, text: 'Нова оферта за вашата фирма.' },
    { id: 2, text: 'Вашата публикация беше одобрена.' },
    { id: 3, text: 'Получихте ново съобщение.' },
    { id: 4, text: 'Профилът ви беше обновен.' },
    { id: 5, text: 'Имате нова покана за сътрудничество.' }
  ];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private savedRequestsService: SavedRequestsService
  ) { }

  ngOnInit() {
    this.authService.authStatus$.subscribe(status => {
      this.isAuthenticated = status;
      if (status) {
        // Зареждаме броя на запазените публикации когато потребителят е автентикиран
        this.savedRequestsService.savedRequestsCount$
          .pipe(takeUntil(this.destroy$))
          .subscribe(count => {
            this.savedRequestsCount = count;
          });
      } else {
        this.savedRequestsCount = 0;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']); 
  }

  onSettings() {
    this.router.navigate(['/settings']);
  }

  onSeeAllNotifications() {
    // Навигирай към страница с всички нотификации (dummy)
    this.router.navigate(['/notifications']);
  }

  onInvoices() {
    this.router.navigate(['/invoices']);
  }
}
