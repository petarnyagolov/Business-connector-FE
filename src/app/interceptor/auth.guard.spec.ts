import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../service/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      
      const result = guard.canActivate();
      
      expect(result).toBeTruthy();
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should return false and navigate to login when user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      
      const result = guard.canActivate();
      
      expect(result).toBeFalsy();
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should log authentication check', () => {
      spyOn(console, 'log');
      authServiceSpy.isAuthenticated.and.returnValue(true);
      
      guard.canActivate();
      
      expect(console.log).toHaveBeenCalledWith('AuthGuard#canActivate called');
      expect(console.log).toHaveBeenCalledWith('AuthGuard#canActivate returned true');
    });

    it('should log failed authentication', () => {
      spyOn(console, 'log');
      authServiceSpy.isAuthenticated.and.returnValue(false);
      
      guard.canActivate();
      
      expect(console.log).toHaveBeenCalledWith('AuthGuard#canActivate called');
      expect(console.log).toHaveBeenCalledWith('AuthGuard#canActivate returned false');
    });
  });
});

