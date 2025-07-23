import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CompanyRequest } from '../model/companyRequest';
import { Observable, shareReplay, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyRequestService {
  private api = environment.apiUrl + '/request-company';
  private userRequestsCache$: Observable<CompanyRequest[]> | null = null;

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
      if (this.userRequestsCache$) {
        return this.userRequestsCache$;
      }

      console.log('Making request to:', `${this.apiUrl}/user`);
      this.userRequestsCache$ = this.http.get<CompanyRequest[]>(`${this.apiUrl}/user`).pipe(
        map((response: any) => {
          console.log('Raw API response for user requests:', response);
          
          let data = response;
          
          if (response && response.content && Array.isArray(response.content)) {
            console.log('Found paginated response, extracting content:', response.content);
            data = response.content;
          }
          
          if (!Array.isArray(data)) {
            console.warn('Expected array but got:', typeof data, data);
            return [];
          }
                    const processedData = data.map((item: any) => {
            if (item && item.request) {
              console.log('Found request wrapper, extracting request:', item.request);
              return item.request;
            } else if (item && item.id) {
              console.log('Found direct request format:', item);
              return item;
            } else {
              console.warn('Unexpected item format:', item);
              return null;
            }
          }).filter(item => item !== null); 
          
          console.log('Processed user requests:', processedData);
          return processedData;
        }),
        shareReplay(1) 
      );

      return this.userRequestsCache$;
    }

    createRequest(formData: FormData): Observable<any> {
      return this.http.post(`${this.apiUrl}`, formData);
    }

    getRequestById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
        map((res: any) => {
          const req = res.request;
          let pictures: string[] = [];
          if (Array.isArray(req.pictureUrls)) {
            pictures = req.pictureUrls.map((pic: string) =>
              pic.startsWith('http') ? pic : `${environment.apiUrl}/files/${pic.replace(/\\/g, '/')}`
            );
          } else if (Array.isArray(req.pictures)) {
            pictures = req.pictures.map((pic: string) =>
              pic.startsWith('http') ? pic : `${environment.apiUrl}/files/${pic.replace(/\\/g, '/')}`
            );
          }
          return {
            ...res,
            request: { ...req, pictures }
          };
        })
      );
    }

  confirmResponse(confirmData: any): Observable<any> {
    return this.http.put(`${this.api}/confirm`, confirmData);
  }

  cacheUserRequests(requests: CompanyRequest[]): void {
    this.userRequestsCache$ = of(requests).pipe(shareReplay(1));
  }

  clearUserRequestsCache(): void {
    this.userRequestsCache$ = null;
  }

  isUserRequest(requestId: string): boolean {
    if (!this.userRequestsCache$) {
      console.log('No user requests cache available for requestId:', requestId);
      return false;
    }

    let isUserRequest = false;
    try {
      this.userRequestsCache$.subscribe({
        next: (requests) => {
          console.log('Raw user requests data:', requests);
          
          const validRequests = requests.filter(req => req && req.id);
          const requestIds = validRequests.map(r => String(r.id));
          
          console.log('Valid request IDs:', requestIds);
          console.log('Looking for requestId:', String(requestId));
          
          isUserRequest = requestIds.includes(String(requestId));
          console.log('Is user request result:', isUserRequest);
        },
        error: (error) => {
          console.error('Error checking user request:', error);
          isUserRequest = false;
        }
      }).unsubscribe(); 
    } catch (error) {
      console.error('Error in isUserRequest:', error);
      return false;
    }

    return isUserRequest;
  }
}
