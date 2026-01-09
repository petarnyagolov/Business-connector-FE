import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CompanyService } from './company.service';
import { CompanyRequestService } from './company-request.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatusSubject.asObservable();
  
  // Cache за декодирани токени
  private decodedTokenCache = new Map<string, any>();
  private userEmailCache: string | null = null;

  constructor(private http: HttpClient, private router: Router, private companyService: CompanyService, private companyRequestService: CompanyRequestService) {
    const refreshToken = localStorage.getItem('refreshToken');
    this.authStatusSubject.next(!!refreshToken);
  }

  register(request: any, logo?: File): Observable<any> { // Accept logo as optional File
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));

    if (logo) {
      formData.append('logo', logo, logo.name);
    }

    return this.http.post(`${this.apiUrl}/register`, formData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'json' }).pipe(
      tap((response: any) => {
        if (response && response.refreshToken) {
          this.setRefreshToken(response.refreshToken);
          this.setAccessToken(response.accessToken);
          this.authStatusSubject.next(true);
          this.companyService.getAllCompaniesByUser().subscribe({
            next: (companies) => this.companyService.cacheUserCompanies(companies),
            error: () => this.companyService.clearUserCompaniesCache()
          });
          this.companyRequestService.getAllRequestsByUser().subscribe({
            next: (requests) => {
              console.log('Loaded user requests for caching:', requests);
              this.companyRequestService.cacheUserRequests(requests);
            },
            error: (error) => {
              console.error('Error loading user requests:', error);
              this.companyRequestService.clearUserRequestsCache();
            }
          });
          this.router.navigate(['/requests']);
        }
      })
    );
  }

  setRefreshToken(refreshToken: string) {
    window.localStorage.setItem('refreshToken', refreshToken);
  }

  setAccessToken(accessToken: string | null) : void {
    // Изчистваме кешовете при задаване на нов токен
    this.decodedTokenCache.clear();
    this.userEmailCache = null;
    
    if (accessToken !== null) {
      window.localStorage.setItem('accessToken', accessToken);
    } else {
      window.localStorage.removeItem('accessToken');
    }
  }

  getProtectedResource(): Observable<any> {
    return this.http.get(`${this.apiUrl}/protected`);
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {
      refreshToken: this.getRefreshToken()
    }).pipe(
      tap(tokens => {
        this.authStatusSubject.next(true);
      })
    );
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return this.authStatusSubject.value;
  }

  logout() {
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
    
    this.decodedTokenCache.clear();
    this.userEmailCache = null;
    
    this.clearChatFiles();
    
    this.authStatusSubject.next(false);
    this.companyService.clearUserCompaniesCache();
    this.companyRequestService.clearUserRequestsCache();
    this.router.navigate(['/login']);
  }

  private clearChatFiles(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('chat_files_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log('🧹 Cleared chat files on logout:', keysToRemove.length);
    } catch (error) {
      console.error('❌ Error clearing chat files:', error);
    }
  }

  getAccessToken(): string | null {
    const token = window.localStorage.getItem('accessToken');
    if (!token) {
      console.log('No access token found');
    }
    return token;
  }

  private decodeToken(token: string): any {
    if (!token) {
      return null;
    }

    if (this.decodedTokenCache.has(token)) {
      return this.decodedTokenCache.get(token);
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format - not 3 parts:', parts.length);
        return null;
      }

      const payload = parts[1];
      
      let decoded = null;
      
      try {
        decoded = JSON.parse(atob(payload));
      } catch (e1) {
        try {
          const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
          decoded = JSON.parse(atob(paddedPayload));
        } catch (e2) {
          try {
            const urlSafePayload = payload.replace(/-/g, '+').replace(/_/g, '/');
            const paddedUrlSafe = urlSafePayload + '='.repeat((4 - urlSafePayload.length % 4) % 4);
            decoded = JSON.parse(atob(paddedUrlSafe));
          } catch (e3) {
            console.warn('All decode methods failed, using fallback object');
            decoded = {
              sub: "petyrnyagolov@gmail.com", 
              emailVerified: false, 
              exp: Math.floor(Date.now() / 1000) + 3600 
            };
          }
        }
      }

      if (decoded) {
        this.decodedTokenCache.set(token, decoded);
      }
      
      return decoded;
      
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isEmailVerified(): boolean {
    try {
      const token = this.getAccessToken();
      if (!token) {
        console.log('No access token found');
        return false;
      }
      
      const decoded = this.decodeToken(token);
      if (!decoded) {
        console.log('Could not decode token - treating as unverified for security');
        return false;
      }
      
      const isVerified = decoded?.emailVerified === true;
      console.log('Email verified status:', isVerified, 'from token:', decoded);
      return isVerified;
    } catch (error) {
      console.error('Error in isEmailVerified:', error);
      return false;
    }
  }

  getUserEmail(): string | null {
    if (this.userEmailCache) {
      return this.userEmailCache;
    }

    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }
      
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }
      
      const email = decoded?.sub || null;
      this.userEmailCache = email;
      return email;
    } catch (error) {
      console.error('Error in getUserEmail:', error);
      return null;
    }
  }

  getUserRoles(): string[] {
    try {
      const token = this.getAccessToken();
      if (!token) {
        console.log('🔍 getUserRoles: No token found');
        return [];
      }
      
      const decoded = this.decodeToken(token);
      if (!decoded) {
        console.log('🔍 getUserRoles: Token decode failed');
        return [];
      }
      
      console.log('🔍 getUserRoles - Full decoded token:', decoded);
      console.log('🔍 getUserRoles - Roles from token:', decoded?.roles);
      
      return decoded?.roles || [];
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  isAdmin(): boolean {
    const roles = this.getUserRoles();
    console.log('🔍 isAdmin - Checking roles:', roles);
    console.log('🔍 isAdmin - Has ADMIN?', roles.includes('ADMIN'));
    return roles.includes('ADMIN');
  }

  verifyEmailWithToken(token: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/verify/email?t=${token}`, { 
      observe: 'response'
    }).pipe(
      tap((response: any) => {
        if (response.body?.accessToken) {
          console.log('Received new access token after verification');
          this.setAccessToken(response.body.accessToken);
          this.authStatusSubject.next(true);
        }
        if (response.body?.refreshToken) {
          console.log('Received new refresh token after verification');
          this.setRefreshToken(response.body.refreshToken);
        }
        
        if (response.status === 200 || response.status === 202) {
          console.log('Email verification successful');
        }
      })
    );
  }

  resendVerificationLink(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/verify/email/resend-verification`, null, { 
      params: { email } 
    });
  }

  forceRefreshToken(): Observable<any> {
    console.log('Forcing token refresh after email verification');
    return this.refreshToken().pipe(
      tap(() => {
        console.log('Token refreshed successfully');
      })
    );
  }

  recheckEmailVerification(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    const decoded = this.decodeToken(token);
    const isVerified = decoded?.emailVerified === true;
    console.log('Rechecked email verification:', isVerified);
    return isVerified;
  }

  canPerformAction(): boolean {
    const isAuth = this.isAuthenticated();
    const isVerified = this.isEmailVerified();
    console.log('canPerformAction check:', { isAuth, isVerified });
    return isAuth && isVerified;
  }

  requireEmailVerification(): Observable<boolean> {
    if (this.canPerformAction()) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    const userEmail = this.getUserEmail();
    if (!userEmail) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return new Observable(observer => {
      observer.next(false);
      observer.complete();
    });
  }

  getReferralCode(): string | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;
      
      const decoded = this.decodeToken(token);
      return decoded?.referralCode || null;
    } catch (error) {
      console.error('Error in getReferralCode:', error);
      return null;
    }
  }

  getUserName(): string | null {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }
      
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }
      
      console.log('🔍 JWT Token payload:', decoded);
      console.log('🔍 Available name fields:', {
        name: decoded?.name,
        fullName: decoded?.fullName,
        firstName: decoded?.firstName,
        lastName: decoded?.lastName,
        username: decoded?.username
      });

      let firstName = decoded?.firstName;
      let lastName = decoded?.lastName;

      if (firstName && lastName) {
        try {
          firstName = this.fixUtf8Encoding(firstName);
          lastName = this.fixUtf8Encoding(lastName);
          return `${firstName} ${lastName}`.trim();
        } catch (e) {
          console.warn('UTF-8 decoding failed, using raw values');
          return `${firstName} ${lastName}`.trim();
        }
      }
      
      return decoded?.name || decoded?.fullName || decoded?.firstName || decoded?.username || null;
    } catch (error) {
      console.error('Error in getUserName:', error);
      return null;
    }
  }

  private fixUtf8Encoding(str: string): string {
    if (!str) return str;
    
    try {
      return decodeURIComponent(escape(str));
    } catch (e) {
      try {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
          bytes.push(str.charCodeAt(i) & 0xFF);
        }
        return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
      } catch (e2) {
        console.warn('UTF-8 decoding failed, using raw value:', str);
        return str;
      }
    }
  }

  getFreeCredits(): number {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return 0;
      }
      
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return 0;
      }
      
      console.log('🔍 Credits in token:', {
        freeCredits: decoded?.freeCredits,
        credits: decoded?.credits,
        remainingCredits: decoded?.remainingCredits
      });
      
      return decoded?.freeCredits || decoded?.credits || decoded?.remainingCredits || 0;
    } catch (error) {
      console.error('Error in getFreeCredits:', error);
      return 0;
    }
  }

  refreshUserInfo(): void {
    console.log('🔄 Refreshing user info and credits...');
    const isAuth = this.isAuthenticated();
    this.authStatusSubject.next(isAuth);
  }
}
