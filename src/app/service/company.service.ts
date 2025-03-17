import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';
import { Company } from '../model/company';
import { map } from 'rxjs';
import { CompanyData } from '../model/companyData';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private api = 'http://localhost:8080';

  private apiUrl = 'api/companies'; 
  private apiCountryUrl = `${this.api}/api/utils/countries`;
  private apiGetCompanyInfo = `${this.api}/api/utils/company`;
  private externalApi = '';
  private countryNames$: Observable<string[]> | null = null;



    constructor(private http: HttpClient) {
      
     }
 
  getCountryNames(): Observable<string[]> {
    if (!this.countryNames$) {
      this.countryNames$ = this.http.get<any[]>(this.apiCountryUrl).pipe(
        // map(data => data.map(country => country)), // Extract country names
        shareReplay(1) // Cache the response to prevent multiple API calls
      );
    }
    console.log(this.countryNames$.forEach(country => console.log(country)));
    return this.countryNames$;
  }
  
  getCompanyInfoFromOutside(vatNumber: string, country: string): Observable<any> {
    const params = { country };
    return this.http.get<any>(`${this.apiGetCompanyInfo}/${vatNumber}`, { params }).pipe(
      tap(response => console.log('Received data:', response)),
      catchError(error => {
        console.error('Error fetching company data:', error);
        return throwError(() => new Error('Failed to fetch company data'));
      })
    );
  }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl);
  }

  getCompany(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  createCompany(company: Company): Observable<Company> {
    return this.http.post<Company>(this.apiUrl, company);
  }

  updateCompany(company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/${company.id}`, company);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}