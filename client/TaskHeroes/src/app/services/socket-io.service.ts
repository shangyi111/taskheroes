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
        if (user?.id) {
          this.socket.auth = { userId: user.id }; // optional: include userId as auth
          this.connect(user.id);
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
   * Listen for specific user event types (e.g. provider_created, provider_updated)
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
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit(eventName, data);
    } else {
      console.warn(`Socket not connected, cannot emit event: ${eventName}`);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
