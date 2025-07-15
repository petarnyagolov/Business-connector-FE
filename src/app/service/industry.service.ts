import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Industry } from '../model/industry'
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IndustryService {
  private api = environment.apiUrl;
  private apiGetIndustries = `${this.api}/utils/industries`;
  private industries$: Observable<any[]> | null = null;

  constructor(private http: HttpClient) { }

  getAllIndustries(country: string): Observable<Industry[]> {
    if (!this.industries$) {
      this.industries$ = this.http.get<any[]>(`${this.apiGetIndustries}/${country}`).pipe(
        shareReplay(1) 
      );
    }
    console.log(this.industries$.forEach(industry => console.log(industry)));
    return this.industries$;

  }
}
