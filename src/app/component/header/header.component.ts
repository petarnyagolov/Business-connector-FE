import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav'; // Import MatSidenavModule
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

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
    // MatNavList
  ],
})

export class HeaderComponent {
  @Input() pageTitle!:string;
  @Input() logoSrc!:string;
  isAuthenticated: boolean = false;

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
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.authStatus$.subscribe(status => {
      this.isAuthenticated = status;
    });
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
}
