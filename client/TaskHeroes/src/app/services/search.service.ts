import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Service } from 'src/app/shared/models/service';
import {map} from 'rxjs/operators';



interface SearchResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  services: Service[];
  searchCoordinates?: { latitude: number; longitude: number };
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private apiUrl = 'http://localhost:3000/api/service/search';

  constructor(private http: HttpClient) {}

  searchServices(filters: any): Observable<Service[]> {
    let params = new HttpParams();

    // Add filter parameters to the query string
    if (filters.category && filters.category.length > 0) {
      params = params.set('category', filters.category.join(',')); // Or handle as multiple parameters
    }
    if (filters.keyword) {
      params = params.set('keyword', filters.keyword);
    }
    if (filters.zipcode) {
      params = params.set('zipcode', filters.zipcode);
    }
    if (filters.radius) {
      params = params.set('radius', filters.radius.toString());
    }
    if (filters.minHourlyRate !== null && filters.minHourlyRate !== undefined) {
      params = params.set('minHourlyRate', filters.minHourlyRate.toString());
    }
    if (filters.maxHourlyRate !== null && filters.maxHourlyRate !== undefined) {
      params = params.set('maxHourlyRate', filters.maxHourlyRate.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }
    if (filters.excludeUserId) {
      params = params.set('excludeUserId', filters.excludeUserId);
    }

    return this.http.get<SearchResponse>(this.apiUrl, { params }).pipe(
      map(response=>response.services)
    );
  }
}