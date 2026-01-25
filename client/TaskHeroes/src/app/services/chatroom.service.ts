import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Chatroom } from '../../app/shared/models/chatroom';
import { Message } from '../shared/models/message';
import { catchError, throwError } from 'rxjs';
import { SocketIoService } from './socket-io.service';
import { filter, take, tap} from 'rxjs/operators';
import { PaginatedMessages, PaginatedResponse } from 'src/app/shared/models/pagination';
import { BehaviorSubject } from 'rxjs';
import { Subscription } from 'rxjs';
import { combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatroomService {
  private readonly API_BASE_URL = 'http://localhost:3000/api';
  private readonly CHATROOMS_API_URL = `${this.API_BASE_URL}/chatroom`;
  private readonly MESSAGES_API_URL = `${this.API_BASE_URL}/message/chatroom`; 
  private readonly AUTH_TOKEN_KEY = 'authToken'; 
  private activeRoomId = new BehaviorSubject<string | null>(null);

  // This is the "Single Source of Truth" for the socket room state
  private roomSubscription: Subscription | undefined; 

  constructor(private http: HttpClient,private socketIoService: SocketIoService) {}

  watchActiveRoom(roomId: string): void {
    // Update the current active room
    this.activeRoomId.next(roomId);

    // If we already have a sync loop running, clean it up first
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }

    // Combine connection status and active room ID
    this.roomSubscription = combineLatest([
      this.socketIoService.isConnected$.pipe(filter(connected => connected === true)),
      this.activeRoomId.pipe(filter(id => !!id))
    ]).pipe(
      tap(([_, id]) => {
        // This runs EVERY time the socket connects OR the room changes
        this.socketIoService.emit('joinChatroom', { chatroomId: id });
        console.log(`ChatroomService: Auto-joined room ${id}`);
      })
    ).subscribe();
  }

  stopWatchingRoom(): void {
    this.activeRoomId.next(null);
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '', // Include token if available
    });
  }

  getChatroomsByProviderId(providerId: string, page: number, size: number): Observable<PaginatedResponse<Chatroom>> {
    const headers = this.getAuthHeaders();
    return this.http.get<PaginatedResponse<Chatroom>>(`${this.CHATROOMS_API_URL}/chatrooms/provider/${providerId}?page=${page}&size=${size}`, { headers });
  }

  getChatroomsBySeekerId(seekerId: string, page: number, size: number): Observable<PaginatedResponse<Chatroom>> {
    const headers = this.getAuthHeaders();
    return this.http.get<PaginatedResponse<Chatroom>>(`${this.CHATROOMS_API_URL}/chatrooms/seeker/${seekerId}?page=${page}&size=${size}`, { headers });
  }

  getChatroomByJobId(jobId:string):Observable<Chatroom[]>{
    const headers = this.getAuthHeaders();
    return this.http.get<Chatroom[]>(`${this.CHATROOMS_API_URL}/job/${jobId}`, { headers });
  }

  getChatroomById(roomId:string):Observable<Chatroom>{
    const headers = this.getAuthHeaders();
    return this.http.get<Chatroom>(`${this.CHATROOMS_API_URL}/${roomId}`, { headers });
  }

  createChatroom(chatroomData: Omit<Chatroom, 'id' | 'createdAt' | 'updatedAt'>): Observable<Chatroom> {
    const headers = this.getAuthHeaders();
    return this.http.post<Chatroom>(`${this.CHATROOMS_API_URL}`, chatroomData, { headers });
  }

  /**
   * Fetches all messages for a specific chatroom.
   * @param chatroomId The ID of the chatroom whose messages are to be retrieved.
   * @param size Number of messages to fetch.
   * @param lastId The ID of the oldest message currently displayed (the cursor).
   * @returns An Observable of an array of Message objects.
  */
  getMessagesForChatroom(chatroomId: string,size: number = 20, lastId: string | null = null): Observable<PaginatedMessages> {
    const headers = this.getAuthHeaders();
    let params: any = { size: size.toString() };
    if (lastId) {
      params.lastId = lastId;
    }

    return this.http.get<PaginatedMessages>(`${this.MESSAGES_API_URL}/${chatroomId}`, { 
      headers, 
      params 
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Sends a new message to a chatroom.
   * @param messageData Data for the message to be sent (excluding auto-generated fields).
   * @returns An Observable of the newly created Message object as returned by the backend.
   */
  sendMessage(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'readBy'>): Observable<Message> {
    const headers = this.getAuthHeaders();
    // Assuming backend endpoint for sending messages is /api/messages/chatroom/:chatroomId
    return this.http.post<Message>(`${this.MESSAGES_API_URL}/${messageData.chatroomId}`, messageData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }
// --- Real-time (Socket.IO) Methods ---

  /**
   * Emits an event to the server to join a specific chatroom's real-time updates.
   * Server should handle this by adding the socket to a room.
   * @param chatroomId The ID of the chatroom to join.
   */
  joinChatroomSocket(chatroomId: string): void {
    // Ensure socket is connected before emitting
    this.socketIoService.isConnected$.pipe(
      filter(connected => connected === true), // Wait until connected is true
      take(1) // Only do this once
    ).subscribe(connected => {
      if (connected) {
        this.socketIoService.emit('joinChatroom', { chatroomId });
        console.log(`Emitting joinChatroom for ${chatroomId}`);
      } else {
        console.warn(`Socket not connected, delaying joinChatroom for ${chatroomId}`);
        // You might want to queue this or retry when connected
      }
    });
  }

  /**
   * Emits an event to the server to leave a specific chatroom's real-time updates.
   * @param chatroomId The ID of the chatroom to leave.
   */
  leaveChatroomSocket(chatroomId: string): void {
    this.socketIoService.emit('leaveChatroom', { chatroomId });
    console.log(`Emitting leaveChatroom for ${chatroomId}`);
  }

  /**
   * Listens for new messages coming in real-time from the server.
   * Server should emit 'newMessage' event to clients in the relevant chatroom.
   * @returns An Observable that emits new Message objects.
   */
  onNewMessage(): Observable<Message> {
    // Assuming your server emits 'newMessage' directly
    return this.socketIoService.on<Message>('newMessage');
    // If your server uses 'user_event' for everything, you'd use:
    // return this.socketIoService.onUserEvent<Message>('new_chat_message_type');
  }

  // --- Centralized Error Handling ---
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error - Code: ${error.status}, Message: ${error.message}`;
      if (error.error && error.error.error) {
        errorMessage = `${errorMessage}\nDetails: ${JSON.stringify(error.error.error)}`;
      }
    }
    console.error(`Error in ChatroomService: ${errorMessage}`);
    return throwError(() => new Error(errorMessage));
  }

  markAsRead(chatroomId: string, userId: string): Observable<any> {
    // We pass the userId in the body so the backend knows which 'lastRead' column to update
    return this.http.patch(`${this.CHATROOMS_API_URL}/${chatroomId}/read`, { userId });
  }
}