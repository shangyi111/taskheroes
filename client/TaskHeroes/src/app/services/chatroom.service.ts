import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Chatroom } from '../../app/shared/models/chatroom';

@Injectable({
  providedIn: 'root',
})
export class ChatroomService {
  private readonly API_URL = 'http://localhost:3000/api/message/chatroom';
  private readonly AUTH_TOKEN_KEY = 'authToken'; 

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '', // Include token if available
    });
  }

  getChatroomsByProviderId(providerId: string): Observable<Chatroom[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Chatroom[]>(`${this.API_URL}/chatrooms/provider/${providerId}`, { headers });
  }

  getChatroomsBySeekerId(seekerId: string): Observable<Chatroom[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Chatroom[]>(`${this.API_URL}/chatrooms/seeker/${seekerId}`, { headers });
  }

  getChatroomByJobId(jobId:string):Observable<Chatroom[]>{
    const headers = this.getAuthHeaders();
    return this.http.get<Chatroom[]>(`${this.API_URL}/job/${jobId}`, { headers });
  }

  createChatroom(chatroomData: Omit<Chatroom, 'id' | 'createdAt' | 'updatedAt'>): Observable<Chatroom> {
    const headers = this.getAuthHeaders();
    return this.http.post<Chatroom>(`${this.API_URL}`, chatroomData, { headers });
  }

}