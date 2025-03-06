import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private authStatusSubject = new BehaviorSubject<boolean>(false); 
  authStatus$ = this.authStatusSubject.asObservable(); 


  constructor(private http: HttpClient, private router: Router) {
    const authToken = localStorage.getItem('authToken');
    this.authStatusSubject.next(!!authToken);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'json' }).pipe(
      tap((response: any) => {
        if (response && response.accessToken && response.refreshToken) {
          this.setTokens(response.accessToken, response.refreshToken);
          this.authStatusSubject.next(true);
          this.router.navigate(['/cards']);
        }
      })
    );
  }
  
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getProtectedResource(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/protected`, { headers });
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {
      refreshToken: this.getRefreshToken()
    }).pipe(
      tap(tokens => {
        this.setAccessToken(tokens.accessToken);
        this.authStatusSubject.next(true);
      })
    );
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
  
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }
  
  setAccessToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  isAuthenticated(): Observable<boolean> {
    return this.authStatusSubject.asObservable();
  }
  
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.authStatusSubject.next(false);
    this.router.navigate(['/login']);
  }
  
}