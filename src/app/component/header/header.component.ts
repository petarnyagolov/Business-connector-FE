import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';



@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [RouterModule, NgIf,  MatMenuModule, MatButtonModule, MatIconModule]
})

export class HeaderComponent {
  isAuthenticated: boolean = false;

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

}
