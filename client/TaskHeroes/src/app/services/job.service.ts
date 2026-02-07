import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AUTH_TOKEN_KEY } from 'src/app/shared/constants';
import {Job} from "src/app/shared/models/job";
import { JobStatus } from "src/app/shared/models/job-status.enum";

@Injectable({
  providedIn: 'root',
})

export class JobService {
  private readonly API_URL_JOB = 'http://localhost:3000/api/job';
  private readonly API_URL_SEEKER = 'http://localhost:3000/api/order';
  private readonly AUTH_TOKEN_KEY = AUTH_TOKEN_KEY;

  constructor(private http: HttpClient) {}

  getAllJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.API_URL_JOB);
  }

  getJobById(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.API_URL_JOB}/${id}`);
  }

  // getAllJobsByPerformerId(performerId:string):Observable<Job[]>{
  //   return this.http.get<Job[]>(`${this.API_URL_JOB}/provider/${performerId}`);
  // }

  // getAllOrdersByCustomerId(customerId:string):Observable<Job[]>{
  //   return this.http.get<Job[]>(`${this.API_URL_SEEKER}/seeker/${customerId}`);
  // }

  getAllJobsByPerformerId(performerId: string, filter: any = {}): Observable<Job[]> {
    // Convert the filter object to a JSON string
    const params = new HttpParams().set('filter', JSON.stringify(filter));
    
    return this.http.get<Job[]>(`${this.API_URL_JOB}/provider/${performerId}`, { params });
  }

  getAllOrdersByCustomerId(customerId: string, filter: any = {}): Observable<Job[]> {
    // Use the same pattern for the seeker/orders endpoint
    const params = new HttpParams().set('filter', JSON.stringify(filter));
    
    return this.http.get<Job[]>(`${this.API_URL_SEEKER}/seeker/${customerId}`, { params });
  }

  createJob(jobData: Job): Observable<{job:Job, chatroomId:number}> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<{ job: Job, chatroomId: number }>(this.API_URL_JOB, jobData, { headers });
  }

  updateJob(id: string, jobData: Job): Observable<Job> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`${this.API_URL_JOB}/${id}`, jobData, { headers });
  }

  /**
   * Specialized method for the State Machine handshake
   * Hits the /api/job/:id/status endpoint
   */
  updateJobStatus(id: string, newStatus: string | JobStatus): Observable<Job> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // We send 'newStatus' in the body as expected by the backend controller
    return this.http.put<Job>(
      `${this.API_URL_JOB}/${id}/status`, 
      { newStatus }, 
      { headers }
    );
  }

  deleteJob(id: string): Observable<Job> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(`${this.API_URL_JOB}/${id}`, { headers });
  }

  deleteOrder(id: string): Observable<Job> {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(`${this.API_URL_SEEKER}/${id}`, { headers });
  }
}