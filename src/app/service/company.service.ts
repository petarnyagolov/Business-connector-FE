import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, shareReplay, tap, throwError, of, map } from 'rxjs';
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

  private api = environment.apiUrl;

  private apiUrl = `${this.api}/companies`; 
  private apiUserUrl = `${this.api}/user/companies`; 
  private apiCountryUrl = `${this.api}/utils/countries`;
  private apiGetCompanyInfo = `${this.api}/utils/company`;
  private countryNames$: Observable<string[]> | null = null;
  private userCompaniesCache$: Observable<Company[]> | null = null;

    constructor(private http: HttpClient) {}
 
     getAllCompaniesByUser() : Observable<Company[]> {
      // Ако вече имаме кеширан observable, връщаме го
      if (this.userCompaniesCache$) {
        return this.userCompaniesCache$;
      }
      
      // Създаваме и кешираме observable-а
      this.userCompaniesCache$ = this.http.get<Company[]>(this.apiUserUrl).pipe(
        tap(companies => console.log('Fetched user companies:', companies.length)),
        shareReplay(1), // Кешираме резултата за споделяне между множество абонати
        catchError(error => {
          console.error('Error fetching user companies:', error);
          this.userCompaniesCache$ = null; // Нулираме кеша при грешка
          return throwError(() => error);
        })
      );
      
      return this.userCompaniesCache$;
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

  // Заменям getAllCompanies да използва apiUserUrl вместо apiUrl
  getAllCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUserUrl);
  }

  getCompany(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  createCompany(formData: FormData): Observable<Company> {
    return this.http.post<Company>(this.apiUserUrl, formData);
  }

  updateCompany(company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.apiUserUrl}/${company.id}`, company);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUserUrl}/${id}`);
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
    return this.http.get<Company>(`${this.apiUrl}/${vatNumber}`);
  }

    getCompanyByVatNumberAndUser(vatNumber: string) {
    return this.http.get<Company>(`${this.apiUserUrl}/${vatNumber}`);
  }

  cacheUserCompanies(companies: Company[]): void {
    // Метод за принудително кеширане - създаваме нов observable с данните
    this.userCompaniesCache$ = of(companies).pipe(shareReplay(1));
  }

  clearUserCompaniesCache(): void {
    this.userCompaniesCache$ = null;
  }

  mapCompanyToInvoice(company: Company | null | undefined): {
    id: string | undefined;
    name: string;
    eikBulstat: string;
    vatNumber: string;
    invoiceAddress: string;
    invoiceEmail: string;
  } {
    if (!company) {
      return {
        id: undefined,
        name: '',
        eikBulstat: '',
        vatNumber: '',
        invoiceAddress: '',
        invoiceEmail: ''
      };
    }

    return {
      id: company.id,
      name: company.name,
      eikBulstat: company.vatNumber,
      vatNumber: company.vatNumber,
      invoiceAddress: company.address,
      invoiceEmail: company.email
    };
  }
}