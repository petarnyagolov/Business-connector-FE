import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CompanyService } from './company.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatusSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private companyService: CompanyService) {
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
          // Fetch and cache user companies after login
          this.companyService.getAllCompaniesByUser().subscribe({
            next: (companies) => this.companyService.cacheUserCompanies(companies),
            error: () => this.companyService.clearUserCompaniesCache()
          });
          this.router.navigate(['/companies']);
        }
      })
    );
  }

  setRefreshToken(refreshToken: string) {
    window.localStorage.setItem('refreshToken', refreshToken);
  }

  setAccessToken(accessToken: string | null) : void {
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
    this.authStatusSubject.next(false);
    // Clear cached companies on logout
    this.companyService.clearUserCompaniesCache();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return window.localStorage.getItem('accessToken');
  }

  verifyEmailWithToken(token: string) {
    // Хардкоднат бекенд URL за тест
    return this.http.get(`http://localhost:8080/api/verify/email/verify?t=${token}`, { observe: 'response', responseType: 'text' });
  }

  resendVerificationLink(email: string) {
    // Изпраща POST заявка към бекенда за повторно изпращане на верификационен линк
    return this.http.post('/api/verify/email/resend-verification', null, { params: { email } });
  }
}
