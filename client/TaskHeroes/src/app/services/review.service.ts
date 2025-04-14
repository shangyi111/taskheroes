import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AUTH_TOKEN_KEY } from 'src/app/shared/constants';
import {Review} from "src/app/shared/models/review";
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})

export class ReviewService {
  private readonly API_URL = 'http://localhost:3000/api/review';
  private readonly AUTH_TOKEN_KEY = AUTH_TOKEN_KEY;

  constructor(private http: HttpClient) {}

  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.API_URL);
  }

  getReviewById(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.API_URL}/${id}`);
  }

  getAllReviewsByServiceId(serviceId:string):Observable<Review[]>{
    return this.getAllReviews().pipe(
      map((reviews: Review[]) => {
        return reviews.filter((service: Review) => service.id === serviceId);
      })
    );
  }

  createReview(serviceData: Review): Observable<Review> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(this.API_URL, serviceData, { headers });
  }

  updateReview(id: string, serviceData: Review): Observable<Review> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`${this.API_URL}/${id}`, serviceData, { headers });
  }

  deleteReview(id: string): Observable<Review> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(`${this.API_URL}/${id}`, { headers });
  }
}