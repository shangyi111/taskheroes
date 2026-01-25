import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { UserDataService } from './user_data.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketIoService implements OnDestroy {
  private userDataService = inject(UserDataService);
  private socket: Socket;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  isConnected$ = this.isConnectedSubject.asObservable();
  private subscriptions: Subscription[] = [];

  constructor() {
    this.socket = io(environment.apiBaseUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.setupConnectionHandlers();

    // Connect socket when user data is available
    this.subscriptions.push(
      this.userDataService.userData$.subscribe((user) => {
        console.log("inside user for socketIo service",user);
        if (user?.id) {
          this.socket.auth = { userId: user.id }; 
          this.connect(user.id);
        }else {
          // 🟢 THIS IS THE PLACE: 
          // If the user data is cleared (logout/expired), disconnect.
          console.log("SocketIoService: No active user session. Disconnecting.");
          this.disconnect();
        }
      })
    );
  }

  connect(userId: string): void {
    if (!this.socket.connected) {
      this.socket.connect();

      // Tell server to join the user's room
      this.socket.emit('join_user_room', { userId });
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  private setupConnectionHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO');
      this.isConnectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO');
      this.isConnectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnectedSubject.next(false);
    });

    this.socket.on('connect_timeout', (timeout) => {
      console.warn('Socket.IO connection timeout:', timeout);
      this.isConnectedSubject.next(false);
    });
  }

  /**
   * Listens for a specific Socket.IO event by its direct name.
   * This is for events like 'newMessage', 'typing', 'userStatusUpdate', etc.
   *
   * @param eventName The name of the socket event to listen for.
   * @returns An Observable that emits the event's data.
  */
  on<T>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      const handler = (data: T) => {
        subscriber.next(data);
      };
      this.socket.on(eventName, handler);
      return () => {
        this.socket.off(eventName, handler); // Cleanup handler on unsubscribe
      };
    });
  }
  /**
   * Listen for specific user event types (e.g. service_created, service_updated)
   */
  onUserEvent<T>(type: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      const handler = (payload: { type: string; data: T }) => {
        if (payload.type === type) {
          subscriber.next(payload.data);
        }
      };

      this.socket.on('user_event', handler);

      return () => this.socket.off('user_event', handler);
    });
  }

  emit(eventName: string, data?: any): void {
    // Socket.io natively buffers emits until the connection is ready.
    this.socket.emit(eventName, data);
    
    // Optional: keep the log for debugging but don't block the emit
    if (!this.isConnectedSubject.value) {
      console.log(`Socket not yet connected. Event "${eventName}" is buffered and will send on connect.`);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
