import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    console.log('AuthGuard#canActivate called');
    if (this.authService.isAuthenticated()) {
      console.log('AuthGuard#canActivate returned true');
      return true;
    } else {
      console.log('AuthGuard#canActivate returned false');
      this.router.navigate(['/login']); 
      return false; 
    }
  }
}
