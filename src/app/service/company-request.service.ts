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
  private apiUrl = `${this.api}`; 


  searchRequests(query: string, page: number, size: number) {
    const params = {
      query: query,
      page: page.toString(),
      size: size.toString()
    };
    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      map((res: any) => {
        if (res && res.content && Array.isArray(res.content)) {
          res.content = res.content.map((req: any) => {
            let pictures: string[] = [];
            let files: { url: string, isImage: boolean, name: string }[] = [];
            
            if (Array.isArray(req.pictureUrls)) {
              pictures = req.pictureUrls.map((pic: string) => {
                const cleanPic = pic.replace(/^[\/\\]+/, '');
                return pic.startsWith('http') ? pic : `${environment.apiUrl}/files/${cleanPic.replace(/\\/g, '/')}`;
              });
            } else if (Array.isArray(req.pictures)) {
              pictures = req.pictures.map((pic: string) => {
                const cleanPic = pic.replace(/^[\/\\]+/, '');
                return pic.startsWith('http') ? pic : `${environment.apiUrl}/files/${cleanPic.replace(/\\/g, '/')}`;
              });
            }
            
            if (Array.isArray(req.fileUrls)) {
              files = req.fileUrls.map((fileUrl: string) => {
                const cleanFileUrl = fileUrl.replace(/^[\/\\]+/, '');
                const url = fileUrl.startsWith('http') ? 
                          fileUrl : 
                          `${environment.apiUrl}/files/${cleanFileUrl.replace(/\\/g, '/')}`;
                const fileName = fileUrl.split('\\').pop()?.split('/').pop() || 'file';
                
                const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt);
                
                return {
                  url,
                  isImage,
                  name: fileName
                };
              });
            }
            
            return {
              ...req,
              pictures,
              files
            };
          });
        }
        return res;
      })
    );
  }

     getAllRequestsByUser() : Observable<CompanyRequest[]> {
      if (this.userRequestsCache$) {
        return this.userRequestsCache$;
      }

      this.userRequestsCache$ = this.http.get<CompanyRequest[]>(`${this.apiUrl}/user`).pipe(
        map((response: any) => {
          
          let data = response;
          if (response && response.content && Array.isArray(response.content)) {
            data = response.content;
          }
          
          if (!Array.isArray(data)) {
            return [];
          }
                    const processedData = data.map((item: any) => {
            if (item && item.request) {
              return item.request;
            } else if (item && item.id) {
              return item;
            } else {
              return null;
            }
          }).filter(item => item !== null); 
          
          return processedData;
        }),
        shareReplay(1) 
      );

      return this.userRequestsCache$;
    }

    createRequest(formData: FormData): Observable<any> {
      for (const pair of (formData as any).entries()) {
      }
      
      this.clearUserRequestsCache();
      
      return this.http.post(`${this.apiUrl}`, formData);
    }

    updateRequest(id: string, formData: FormData): Observable<any> {
      this.clearUserRequestsCache();
      return this.http.put(`${this.apiUrl}/${id}`, formData);
    }

    deleteRequest(id: string): Observable<any> {
      this.clearUserRequestsCache();
      return this.http.delete(`${this.apiUrl}/${id}`);
    }

    clearUserRequestsCache(): void {
      this.userRequestsCache$ = null;
    }

    getRequestById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
        map((res: any) => {
          const req = res.request;
          let pictures: string[] = [];
          let files: { url: string, isImage: boolean, name: string }[] = [];
          
          if (Array.isArray(req.pictureUrls)) {
            pictures = req.pictureUrls.map((pic: string) => {
              const cleanPic = pic.replace(/^[\/\\]+/, '');
              return pic.startsWith('http') ? pic : `${environment.apiUrl}/files/${cleanPic.replace(/\\/g, '/')}`;
            });
          } else if (Array.isArray(req.pictures)) {
            pictures = req.pictures.map((pic: string) => {
              const cleanPic = pic.replace(/^[\/\\]+/, '');
              return pic.startsWith('http') ? pic : `${environment.apiUrl}/files/${cleanPic.replace(/\\/g, '/')}`;
            });
          }
          
          if (Array.isArray(req.fileUrls)) {
            files = req.fileUrls.map((fileUrl: string) => {
              const cleanFileUrl = fileUrl.replace(/^[\/\\]+/, '');
              const url = fileUrl.startsWith('http') ? 
                        fileUrl : 
                        `${environment.apiUrl}/files/${cleanFileUrl.replace(/\\/g, '/')}`;
              const fileName = fileUrl.split('\\').pop()?.split('/').pop() || 'file';
              
              const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt);
              
              return {
                url,
                isImage,
                name: fileName
              };
            });
          }
          
          return {
            ...res,
            request: { 
              ...req, 
              pictures,
              files
            }
          };
        })
      );
    }

  choiceResponse(choiceData: any): Observable<any> {
    return this.http.put(`${this.api}/choice`, choiceData);
  }

  cacheUserRequests(requests: CompanyRequest[]): void {
    this.userRequestsCache$ = of(requests).pipe(shareReplay(1));
  }

  isUserRequest(requestId: string): boolean {
    if (!this.userRequestsCache$) {
      return false;
    }

    let isUserRequest = false;
    try {
      this.userRequestsCache$.subscribe({
        next: (requests) => {
          
          const validRequests = requests.filter(req => req && req.id);
          const requestIds = validRequests.map(r => String(r.id));
          isUserRequest = requestIds.includes(String(requestId));
        },
        error: (error) => {
          isUserRequest = false;
        }
      }).unsubscribe(); 
    } catch (error) {
      return false;
    }

    return isUserRequest;
  }
}
