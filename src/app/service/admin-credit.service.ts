import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreditPackage, UserCreditsSummary, BonusCreditsRequest, UserDto, FindUserRequest } from '../model/credit-package';

@Injectable({
  providedIn: 'root'
})
export class AdminCreditService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Credit Packages Management
  getAllCreditPackages(): Observable<CreditPackage[]> {
    return this.http.get<CreditPackage[]>(`${this.apiUrl}/admin/credit-packages`);
  }

  getCreditPackageById(id: string): Observable<CreditPackage> {
    return this.http.get<CreditPackage>(`${this.apiUrl}/admin/credit-packages/${id}`);
  }

  createCreditPackage(packageData: CreditPackage): Observable<CreditPackage> {
    return this.http.post<CreditPackage>(`${this.apiUrl}/admin/credit-packages`, packageData);
  }

  updateCreditPackage(id: string, packageData: CreditPackage): Observable<CreditPackage> {
    return this.http.put<CreditPackage>(`${this.apiUrl}/admin/credit-packages/${id}`, packageData);
  }

  deleteCreditPackage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/credit-packages/${id}`);
  }

  // Manual Credits Management
  giveBonusCredits(email: string, request: BonusCreditsRequest): Observable<void> {
    const params = new HttpParams()
      .set('email', email)
      .set('credits', request.credits.toString())
      .set('reason', request.reason || '');
    
    return this.http.post<void>(`${this.apiUrl}/admin/credits/users/bonus`, null, { params });
  }

  getUserCreditsHistory(email: string): Observable<UserCreditsSummary> {
    const params = new HttpParams().set('email', email);
    return this.http.get<UserCreditsSummary>(`${this.apiUrl}/admin/credits/users/history`, { params });
  }

  searchUsers(request: FindUserRequest): Observable<UserDto[]> {
    return this.http.post<UserDto[]>(`${this.apiUrl}/admin/users/search`, request);
  }
}
