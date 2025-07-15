import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  private api = environment.apiUrl + '/request-company';

  constructor(private http: HttpClient) {}

  createResponse(requestId: string, dto: any, pictures: File[] = []): Observable<any> {
    const formData = new FormData();
    formData.append('responseRequestCompanyDto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    pictures.forEach(file => formData.append('pictures', file));
    return this.http.post(`${this.api}/${requestId}/responses`, formData);
  }

  getResponsesByUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/responses/user`);
  }

  updateResponse(requestCompanyId: string, dto: any, pictures: File[] = []): Observable<any> {
    const formData = new FormData();
    formData.append('responseRequestCompanyDto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    pictures.forEach(file => formData.append('pictures', file));
    return this.http.post(`${this.api}/${requestCompanyId}/responses/update`, formData);
  }
}
