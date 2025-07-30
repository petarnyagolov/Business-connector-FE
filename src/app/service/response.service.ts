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

  createResponse(requestId: string, dto: any, files: File[] = []): Observable<any> {
    const formData = new FormData();
    formData.append('responseRequestCompanyDto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    
    console.log('Creating response with files:', files);
    
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        console.log(`Adding file ${i}:`, files[i].name, files[i].type, files[i].size);
        formData.append('files', files[i], files[i].name);
      }
    }
    
    console.log('FormData entries:');
    for (const pair of (formData as any).entries()) {
      console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
    }
    
    return this.http.post(`${this.api}/${requestId}/responses`, formData);
  }

  getResponsesByUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/responses/user`);
  }

  updateResponse(requestCompanyId: string, dto: any, files: File[] = []): Observable<any> {
    const formData = new FormData();
    formData.append('responseRequestCompanyDto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return this.http.post(`${this.api}/${requestCompanyId}/responses/update`, formData);
  }

  updateResponseText(responseId: number, additionalText: string): Observable<any> {
    const messageResponse = { message: additionalText };
    
    return this.http.post(`${environment.apiUrl}/responses/${responseId}/update-text`, messageResponse);
  }
}
