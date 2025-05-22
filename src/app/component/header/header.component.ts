import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav'; // Import MatSidenavModule
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatNavList } from '@angular/material/list';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    RouterModule, 
    NgIf,  
    MatMenuModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSidenavModule, 
    MatToolbarModule,
    // MatNavList
  ],
})

export class HeaderComponent {
  @Input() pageTitle!:string;
  @Input() logoSrc!:string;
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
