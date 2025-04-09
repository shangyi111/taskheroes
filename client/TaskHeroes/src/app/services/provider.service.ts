// provider.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LOCAL_STORAGE_USER_KEY, AUTH_TOKEN_KEY } from 'src/app/shared/constants';
import {Provider} from "src/app/shared/models/provider";
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})

export class ProviderService {
  private readonly API_URL = 'http://localhost:3000/api/providers';
  private readonly AUTH_TOKEN_KEY = AUTH_TOKEN_KEY;

  constructor(private http: HttpClient) {}

  getAllProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(this.API_URL);
  }

  getProviderById(id: number): Observable<Provider> {
    return this.http.get<Provider>(`${this.API_URL}/${id}`);
  }

  getAllProvidersByUserId(userId:string):Observable<Provider[]>{
    return this.getAllProviders().pipe(
      map((providers: Provider[]) => {
        return providers.filter((provider: Provider) => provider.userId === userId);
      })
    );
  }

  createProvider(providerData: Provider): Observable<Provider> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    console.log("FE provider.service.ts createProvider: testing api url",this.API_URL);
    return this.http.post<any>(this.API_URL, providerData, { headers });
  }

  updateProvider(id: string, providerData: Provider): Observable<Provider> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`${this.API_URL}/${id}`, providerData, { headers });
  }

  deleteProvider(id: string): Observable<Provider> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(`${this.API_URL}/${id}`, { headers });
  }
}