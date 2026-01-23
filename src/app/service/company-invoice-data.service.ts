import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CompanyInvoiceData, CompanyInvoiceDataDto } from '../model/company-invoice-data';

/**
 * Service for managing company invoice data
 */
@Injectable({
  providedIn: 'root'
})
export class CompanyInvoiceDataService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get invoice data for a specific company
   * @param companyId UUID of the company
   * @returns Observable<CompanyInvoiceData>
   */
  getInvoiceData(companyId: string): Observable<CompanyInvoiceData> {
    return this.http.get<CompanyInvoiceData>(`${this.apiUrl}/api/companies/${companyId}/invoice-data`);
  }

  /**
   * Create or update invoice data for a company
   * @param companyId UUID of the company
   * @param data Invoice data to save
   * @returns Observable<CompanyInvoiceData>
   */
  createOrUpdateInvoiceData(companyId: string, data: CompanyInvoiceDataDto): Observable<CompanyInvoiceData> {
    return this.http.post<CompanyInvoiceData>(`${this.apiUrl}/api/companies/${companyId}/invoice-data`, data);
  }

  /**
   * Delete invoice data for a company
   * @param companyId UUID of the company
   * @returns Observable<void>
   */
  deleteInvoiceData(companyId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/companies/${companyId}/invoice-data`);
  }
}
