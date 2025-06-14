import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Message } from '../shared/models/message';

@Injectable({
    providedIn: 'root',
  })
  export class MessageService {
    private readonly API_URL = 'http://localhost:3000/api/messenger/chatroom';
    private readonly AUTH_TOKEN_KEY = 'authToken'; // Replace with your actual auth token key
  
    constructor(private http: HttpClient) {}
  
      private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
      return new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '', // Include token if available
      });
    }
  
    getMessagesByChatroom(chatroomId: string): Observable<Message[]> {
      const headers = this.getAuthHeaders();
      return this.http.get<Message[]>(`${this.API_URL}/messages/${chatroomId}`, { headers });
    }
  
    sendMessage(message: Message): Observable<Message> {
      const headers = this.getAuthHeaders();
      return this.http.post<Message>(`${this.API_URL}/messages`, message, { headers });
    }
  }
  