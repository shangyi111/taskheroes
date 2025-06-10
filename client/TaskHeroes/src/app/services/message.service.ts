import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Chatroom } from '../models/chatroom.model';
import { Message } from '../models/message.model';
import { environment } from 'src/environments/environment';
@Injectable({
    providedIn: 'root',
  })
  export class MessageService {
    private apiUrl = environment.apiUrl;
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
      return this.http.get<Message[]>(`${this.apiUrl}/messages/${chatroomId}`, { headers });
    }
  
    sendMessage(message: Message): Observable<Message> {
      const headers = this.getAuthHeaders();
      return this.http.post<Message>(`${this.apiUrl}/messages`, message, { headers });
    }
  
    // No real-time updates here. Remove onNewMessage
    //   onNewMessage(chatroomId: string): Observable<Message> {
    //   return new Observable((observer) => {
    //     const newMessage$ = this.socketService.onUserEvent<Message>(`new_message_${chatroomId}`); // Listen on user event
    //
    //     this.subscriptions.push(
    //       newMessage$.pipe(takeUntil(this.destroy$)).subscribe((message) => {
    //         observer.next(message);
    //       })
    //     );
    //   });
    // }
  }
  