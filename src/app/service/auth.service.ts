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
    const refreshToken = localStorage.getItem('refreshToken'); // Използваме само refreshToken
    this.authStatusSubject.next(!!refreshToken);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'json' }).pipe(
      tap((response: any) => {
        if (response && response.refreshToken) { 
          this.setRefreshToken(response.refreshToken);
          this.authStatusSubject.next(true);
          this.router.navigate(['/cards']);
        }
      })
    );
  }
  
  setRefreshToken(refreshToken: string) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders(); // Няма да използваме `Authorization`
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
    return this.authStatusSubject.value; // Вече не проверяваме localStorage
  }
  
  logout() {
    localStorage.removeItem('refreshToken');
    this.authStatusSubject.next(false);
    this.router.navigate(['/login']);
  }
}
