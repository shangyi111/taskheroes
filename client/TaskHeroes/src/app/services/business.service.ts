import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AUTH_TOKEN_KEY } from 'src/app/shared/constants';
import {Service} from "src/app/shared/models/service";
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})

export class BusinessService {
  private readonly API_URL = 'http://localhost:3000/api/service';
  private readonly AUTH_TOKEN_KEY = AUTH_TOKEN_KEY;

  constructor(private http: HttpClient) {}

  getAllServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.API_URL);
  }

  getServiceById(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.API_URL}/${id}`);
  }

  getAllServicesByUserId(userId:string):Observable<Service[]>{
    return this.getAllServices().pipe(
      map((services: Service[]) => {
        return services.filter((service: Service) => service.userId === userId);
      })
    );
  }

  getAllServicesExceptUserId(userId:string):Observable<Service[]>{
    return this.getAllServices().pipe(
      map((services: Service[]) => {
        return services.filter((service: Service) => service.userId != userId);
      })
    );
  }

  createService(serviceData: Service): Observable<Service> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(this.API_URL, serviceData, { headers });
  }

  updateService(id: string, serviceData: Service): Observable<Service> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`${this.API_URL}/${id}`, serviceData, { headers });
  }

  deleteService(id: string): Observable<Service> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(`${this.API_URL}/${id}`, { headers });
  }
}