import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProviderCalendar } from 'src/app/shared/models/calendar';

@Injectable({
  providedIn: 'root'
})
export class CalendarDataService {
  private apiUrl = 'http://localhost:3000/api/calendar/providers'; 

  constructor(private http: HttpClient) { }

  getCalendarData(providerId: string, month: string): Observable<ProviderCalendar> {
    const url = `${this.apiUrl}/${providerId}?month=${month}`;
    return this.http.get<ProviderCalendar>(url);
  }

  saveCalendarChanges(providerId: string, changes: any): Observable<any> {
    const url = `${this.apiUrl}/${providerId}`;
    return this.http.post(url, changes);
  }
}