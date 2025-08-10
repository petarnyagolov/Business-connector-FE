import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SavedRequest {
  id: number;
  userEmail: string;
  requestCompany: any;
  savedAt: string | Date; // Може да бъде string (от API) или Date (след обработка)
  isSaved: boolean;
}

export interface SavedRequestCount {
  count: number;
}

export interface SavedRequestStatus {
  isSaved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SavedRequestsService {
  private apiUrl = environment.apiUrl + '/saved-requests';
  
  private savedRequestsSubject = new BehaviorSubject<SavedRequest[]>([]);
  public savedRequests$ = this.savedRequestsSubject.asObservable();
  
  private savedRequestsCountSubject = new BehaviorSubject<number>(0);
  public savedRequestsCount$ = this.savedRequestsCountSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    // Зареждаме броя само ако потребителят е автентикиран
    if (this.authService.isAuthenticated()) {
      this.loadSavedRequestsCount();
    }
  }

  getAllSavedRequests(): Observable<SavedRequest[]> {
    return this.http.get<SavedRequest[]>(this.apiUrl).pipe(
      tap(savedRequests => {
        this.savedRequestsSubject.next(savedRequests);
        this.savedRequestsCountSubject.next(savedRequests.length);
      })
    );
  }


  saveRequest(requestId: string): Observable<SavedRequest> {
    return this.http.post<SavedRequest>(`${this.apiUrl}/${requestId}`, {}).pipe(
      tap(() => {
        this.loadSavedRequestsCount();
        if (this.savedRequestsSubject.value.length > 0) {
          this.getAllSavedRequests().subscribe();
        }
      })
    );
  }

  removeSavedRequest(requestId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${requestId}`).pipe(
      tap(() => {
        const currentSaved = this.savedRequestsSubject.value;
        const updatedSaved = currentSaved.filter(
          saved => saved.requestCompany.id !== requestId
        );
        this.savedRequestsSubject.next(updatedSaved);
        this.savedRequestsCountSubject.next(updatedSaved.length);
      })
    );
  }

  isRequestSaved(requestId: string): Observable<SavedRequestStatus> {
    return this.http.get<SavedRequestStatus>(`${this.apiUrl}/${requestId}/is-saved`);
  }

  getSavedRequestsCount(): Observable<SavedRequestCount> {
    return this.http.get<SavedRequestCount>(`${this.apiUrl}/count`).pipe(
      tap(result => {
        this.savedRequestsCountSubject.next(result.count);
      })
    );
  }

  private loadSavedRequestsCount(): void {
    this.getSavedRequestsCount().subscribe({
      error: (error) => {
        console.error('Error loading saved requests count:', error);
      }
    });
  }

  isRequestSavedLocally(requestId: string): boolean {
    return this.savedRequestsSubject.value.some(
      saved => saved.requestCompany.id === requestId
    );
  }

  toggleSavedRequest(requestId: string): Observable<any> {
    return new Observable(observer => {
      this.isRequestSaved(requestId).subscribe({
        next: (status) => {
          if (status.isSaved) {
            this.removeSavedRequest(requestId).subscribe({
              next: (result) => {
                observer.next({ action: 'removed', result });
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          } else {
            this.saveRequest(requestId).subscribe({
              next: (result) => {
                observer.next({ action: 'saved', result });
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  clearCache(): void {
    this.savedRequestsSubject.next([]);
    this.savedRequestsCountSubject.next(0);
  }

  initializeForAuthenticatedUser(): void {
    this.loadSavedRequestsCount();
  }
}
