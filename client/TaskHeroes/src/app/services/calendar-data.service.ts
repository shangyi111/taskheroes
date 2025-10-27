import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProviderCalendar } from 'src/app/shared/models/calendar';

@Injectable({
  providedIn: 'root'
})
export class CalendarDataService {
  private apiUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) { }

  getCalendarData(providerId: string, serviceId:string, month: string): Observable<ProviderCalendar> {
    const url = `${this.apiUrl}/calendar/provider/${providerId}/service/${serviceId}?month=${month}`;
    return this.http.get<ProviderCalendar>(url);
  }

  saveCalendarChanges(providerId: string, serviceId: string, changes: any): Observable<any> {
    const url = `${this.apiUrl}/calendar/provider/${providerId}/service/${serviceId}`;
    return this.http.post(url, changes);
  }

  updateAvailabilityWindow(serviceId: string, days: number): Observable<any> {
    const url = `${this.apiUrl}/service/${serviceId}/availabilityWindow`;
    return this.http.put(url, { availabilityWindowDays: days });
  }
}