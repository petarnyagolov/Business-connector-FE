import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  private api = 'http://localhost:8080/api/request-company';

  constructor(private http: HttpClient) {}

  createResponse(requestId: string, responseData: any): Observable<any> {
    // responseData може да съдържа: { companyVatNumber, message }
    return this.http.post(`${this.api}/${requestId}/responses`, responseData);
  }

  getResponsesByUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/responses/user`);
  }

  updateResponse(requestCompanyId: string, dto: any): Observable<any> {
    // dto трябва да съдържа: { id, responseText, responserCompanyId }
    return this.http.put(`${this.api}/${requestCompanyId}/responses/update`, dto);
  }
}
