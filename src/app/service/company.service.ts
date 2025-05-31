import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';
import { Company } from '../model/company';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
getLogoByPath(path: string): Observable<Blob> {
  // Replace with your actual HTTP call, for example:
  return this.http.get(`${environment.apiUrl}/files/${path}`, { responseType: 'blob' });
}

  private api = 'http://localhost:8080';

  private apiUrl = `${this.api}/api/companies`; 
  private apiUserUrl = `${this.api}/api/user/companies`; 
  private apiCountryUrl = `${this.api}/api/utils/countries`;
  private apiGetCompanyInfo = `${this.api}/api/utils/company`;
  private countryNames$: Observable<string[]> | null = null;
  private userCompaniesCache: Company[] | null = null;

    constructor(private http: HttpClient) {}
 
     getAllCompaniesByUser() : Observable<Company[]> {
      if (this.userCompaniesCache) {
        return new Observable(observer => {
          observer.next(this.userCompaniesCache!);
          observer.complete();
        });
      }
      return this.http.get<Company[]>(this.apiUserUrl).pipe(
        tap(companies => this.userCompaniesCache = companies),
        shareReplay(1) // Cache the response to prevent multiple API calls
      );
      throw new Error('Method not implemented.');
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
      return throwError(() => error); // Pass the error to the component
      })
    );
  }

  getAllCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl);
  }

  getCompany(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  createCompany(formData: FormData): Observable<Company> {
    return this.http.post<Company>(this.apiUserUrl, formData);
  }

  updateCompany(company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.apiUserUrl}/${company.vatNumber}`, company);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  searchCompanies(query: string, page: number, size: number): Observable<any> {
    const params = {
      query: query,
      page: page.toString(),
      size: size.toString()
    };
    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

  getCompanyByVatNumber(vatNumber: string) {
    return this.http.get<Company>(`${this.apiUserUrl}/${vatNumber}`);
  }

    getCompanyByVatNumberAndUser(vatNumber: string) {
    return this.http.get<Company>(`${this.apiUrl}/${vatNumber}`);
  }

  cacheUserCompanies(companies: Company[]): void {
    this.userCompaniesCache = companies;
  }

  clearUserCompaniesCache(): void {
    this.userCompaniesCache = null;
  }
}