import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AUTH_TOKEN_KEY } from 'src/app/shared/constants';
import {Job} from "src/app/shared/models/job";
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})

export class JobService {
  private readonly API_URL = 'http://localhost:3000/api/job';
  private readonly AUTH_TOKEN_KEY = AUTH_TOKEN_KEY;

  constructor(private http: HttpClient) {}

  getAllJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.API_URL);
  }

  getJobById(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.API_URL}/${id}`);
  }

  getAllJobsByUserId(userId:string):Observable<Job[]>{
    return this.getAllJobs().pipe(
      map((services: Job[]) => {
        return services.filter((job: Job) => job.customerId === userId);
      })
    );
  }

  createJob(jobData: Job): Observable<Job> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(this.API_URL, jobData, { headers });
  }

  updateJob(id: string, jobData: Job): Observable<Job> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`${this.API_URL}/${id}`, jobData, { headers });
  }

  deleteJob(id: string): Observable<Job> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(`${this.API_URL}/${id}`, { headers });
  }
}