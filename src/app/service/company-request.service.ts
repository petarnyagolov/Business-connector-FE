import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CompanyRequest } from '../model/companyRequest';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CompanyRequestService {
  private api = 'http://localhost:8080/api/request-company';

  constructor(private http: HttpClient) { }
  private apiUrl = `${this.api}`; // URL на API-то за заявки


  searchRequests(query: string, page: number, size: number) {
    const params = {
      query: query,
      page: page.toString(),
      size: size.toString()
    };
    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

     getAllRequestsByUser() : Observable<CompanyRequest[]> {
      return this.http.get<CompanyRequest[] > (`${this.apiUrl}/user`).pipe(
        // map(data => data.map(country => country)), // Extract country names
        shareReplay(1) // Cache the response to prevent multiple API calls
      );
    }

    createRequest(formData: FormData): Observable<any> {
      return this.http.post(`${this.apiUrl}`, formData);
    }

    getRequestById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
        map((res: any) => {
          // Винаги очакваме новия формат: { request, responses }
          const req = res.request;
          let pictures: string[] = [];
          if (Array.isArray(req.pictureUrls)) {
            pictures = req.pictureUrls.map((pic: string) =>
              pic.startsWith('http') ? pic : `http://localhost:8080/files/${pic.replace(/\\/g, '/')}`
            );
          } else if (Array.isArray(req.pictures)) {
            pictures = req.pictures.map((pic: string) =>
              pic.startsWith('http') ? pic : `http://localhost:8080/files/${pic.replace(/\\/g, '/')}`
            );
          }
          return {
            ...res,
            request: { ...req, pictures }
          };
        })
      );
    }

    /**
   * Confirm a response for a request (accept a response)
   * @param confirmData The data to send to the backend (should include requestId, responseId, etc.)
   */
  confirmResponse(confirmData: any): Observable<any> {
    return this.http.put(`${this.api}/confirm`, confirmData);
  }
}
