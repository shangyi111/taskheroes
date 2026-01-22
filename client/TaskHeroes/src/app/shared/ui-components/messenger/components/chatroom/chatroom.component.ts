import { Component, OnInit, OnDestroy, inject, signal, WritableSignal, ViewChild, ElementRef, computed } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import { Subscription, of, Observable, throwError, combineLatest } from 'rxjs';
import { switchMap, filter, tap, catchError, map, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from '../message/message.component';
import { ChatroomService } from 'src/app/services/chatroom.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { JobService } from 'src/app/services/job.service';
import { Chatroom } from 'src/app/shared/models/chatroom';
import { User } from 'src/app/shared/models/user';
import { Job } from 'src/app/shared/models/job';
import { Message } from 'src/app/shared/models/message';

// Interface reflecting the data structure returned by the enriched backend controller
interface ExtendedChatroom extends Chatroom {
    jobTitle?: string;
    jobDate?: string | Date;
    jobStatus?: string;
    customerUsername?: string;
    providerUsername?: string;
    // Fields expected from backend JOINs for avatar simplification
    customerProfilePicture?: string; 
    providerProfilePicture?: string;
}

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessageComponent
  ]
})
export class ChatroomComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private router = inject(Router);
  private chatroomService = inject(ChatroomService);
  private userDataService = inject(UserDataService);
  private jobService = inject(JobService);
  private route = inject(ActivatedRoute);

  currentUser: WritableSignal<User | null> = signal(null);
  chatroomId: WritableSignal<string | null> = signal(null);
  chatroom: WritableSignal<ExtendedChatroom | null> = signal(null); 
  job: WritableSignal<Job | null> = signal(null);
  messages: WritableSignal<Message[]> = signal([]);
  newMessageContent: WritableSignal<string> = signal('');

  isLoading: WritableSignal<boolean> = signal(true);
  error: WritableSignal<string | null> = signal(null);
  
  showDetailsModal: WritableSignal<boolean> = signal(false);

  private subscriptions: Subscription = new Subscription();
  private chatroomMessageSubscription: Subscription | undefined;

  // --- Computed Signals (Contextual Data) ---

  chatPartnerName = computed(() => {
      const chatroomData = this.chatroom();
      const currentUserId = this.currentUser()?.id;
      
      if (!chatroomData || !currentUserId) { return 'Loading Chat...'; }

      if (chatroomData.customerId === currentUserId) {
          return chatroomData.providerUsername || 'Provider';
      } else if (chatroomData.providerId === currentUserId) {
          return chatroomData.customerUsername || 'Seeker';
      }
      return 'Unknown Chat';
  });

  jobDetails = computed(() => {
      const jobData = this.job();
    
      if (jobData) {
        return {
            jobDate: jobData.jobDate ? new Date(jobData.jobDate) : null,
            serviceName: jobData.jobTitle || 'Service Job',
            location: jobData.location,
            fee: jobData.fee,
            description: jobData.description,
            // status: jobData.jobStatus || 'Confirmed', 
        };
      }
    
    // Fallback logic from chatroom data
    const chatroomData = this.chatroom();
    return {
        jobDate: chatroomData?.jobDate ? new Date(chatroomData.jobDate) : null,
        serviceName: chatroomData?.jobTitle || 'General Inquiry',
        location: 'Not available',
        fee: 'N/A',
        description: 'N/A',
        // status: chatroomData?.jobStatus || 'Unknown',
    };
  });
  
  // 🟢 Fetches the partner's avatar URL from the enriched chatroom object
  chatPartnerAvatarUrl = computed(() => {
    const chatroomData = this.chatroom();
    const currentUserId = this.currentUser()?.id;

    if (!chatroomData || !currentUserId) {
        return 'assets/img/default-avatar.png';
    }

    if (chatroomData.customerId === currentUserId) {
        // Current user is customer, partner is provider
        return chatroomData.providerProfilePicture || 'assets/img/default-avatar.png';
    } else {
        // Current user is provider, partner is customer
        return chatroomData.customerProfilePicture || 'assets/img/default-avatar.png';
    }
  });


 ngOnInit(): void {
  console.log('ChatroomComponent initialized.');

  this.subscriptions.add(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      tap(()=>{console.log(">>> Checking for chatroomId in route params...", this.route.snapshot);}),
      map(() => this.route.snapshot.params['chatroomId']),
      filter(Boolean),
      tap(id => {
        console.log('>>> DETECTED NEW CHATROOM ID:', id);
        this.prepareForNewChat(id);
      }),
      switchMap(id =>
        this.userDataService.userData$.pipe(
          filter(Boolean),
          take(1),
          switchMap(user => this.loadChatroomAndMessages(id, user.id!).pipe(
              catchError(err => {
                console.error('Error in loadChatroomAndMessages pipe:', err);
                this.error.set('Failed to load chatroom details.');
                this.isLoading.set(false);
                // Return of(null) to satisfy the type but prevent main stream from breaking
                return of(null);
              })
            ))
          )
        )
    ).subscribe({
      next: () => {
        const currentChatroomId = this.chatroomId();
        if (currentChatroomId) {
          this.setupRealtimeMessaging(currentChatroomId);
        }
        setTimeout(() => this.scrollToBottom(), 0);
      }
    })
  );
}
  /**
   * Reset signals so the UI doesn't show old data while loading
  */
  private prepareForNewChat(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.messages.set([]); // Clear the message list immediately
    this.chatroom.set(null); // Clear the header
    this.chatroomId.set(id);
    
    this.cleanupSocket(); // Leave the previous room's socket
  }
  private loadChatroomAndMessages(chatroomId: string, userId: string): Observable<ExtendedChatroom> {
    console.log(`Fetching chatroom ${chatroomId} for user ${userId} via ChatroomService.`);

    return this.chatroomService.getChatroomById(chatroomId).pipe(
      tap(chatroomData => {
        if (!chatroomData) {
          throw new Error('Chatroom not found.');
        }
        if (chatroomData.customerId !== userId && chatroomData.providerId !== userId) {
          this.error.set('You do not have access to this chatroom.');
          this.isLoading.set(false);
          throw new Error('Unauthorized access to chatroom');
        }
        this.chatroom.set(chatroomData as ExtendedChatroom); 
      }),
      
      switchMap(chatroomData => {
        const jobId = chatroomData.jobId; 
        if (jobId) {
          const jobIdNumber = typeof jobId === 'string' ? Number(jobId) : jobId;
          
          return this.jobService.getJobById(jobIdNumber).pipe(
            tap(jobData => this.job.set(jobData)),
            switchMap(() => of(chatroomData as ExtendedChatroom))
          );
        } else {
          this.job.set(null); 
          return of(chatroomData as ExtendedChatroom);
        }
      }),
      
      switchMap(chatroomData => 
          this.chatroomService.getMessagesForChatroom(chatroomId).pipe(
            tap(messagesData => {
              this.messages.set(messagesData);
              this.isLoading.set(false);
            }),
            map(() => chatroomData as ExtendedChatroom) 
          )
      ),
      catchError(err => {
        console.error('Error fetching chatroom or messages:', err);
        this.error.set('Failed to retrieve chatroom details or messages.');
        this.isLoading.set(false);
        return throwError(()=>err);
      })
    );
  }

  private setupRealtimeMessaging(chatroomId: string): void {
    console.log(`Setting up real-time messaging for chatroom ${chatroomId}.`);

    this.chatroomService.joinChatroomSocket(chatroomId);

    if (this.chatroomMessageSubscription) {
      this.chatroomMessageSubscription.unsubscribe();
    }

    this.chatroomMessageSubscription = this.chatroomService.onNewMessage().pipe(
      filter(message => message.chatroomId === chatroomId),
      tap(message => {
        console.log('Received new real-time message:', message);
        const userId = this.currentUser()?.id;
        if (userId) {
            this.chatroomService.markAsRead(chatroomId, userId).subscribe();
        }
        
        this.messages.update(msgs => {
          if (message.senderId === userId) return msgs;
          if (!msgs.some(m => m.id === message.id)) {
            return [...msgs, message];
          }
          return msgs;
        });
        setTimeout(() => this.scrollToBottom(), 0);
      }),
      catchError(err => {
        console.error('Error receiving real-time message:', err);
        return of(null);
      })
    ).subscribe();

    this.subscriptions.add(this.chatroomMessageSubscription);
  }

  sendMessage(): void {
    if (!this.currentUser()) {
      this.error.set('User not logged in. Please sign in to send messages.');
      return;
    }
    
    const messageText = this.newMessageContent().trim();
    const userId = this.currentUser()!.id;
    const chatroomId = this.chatroomId();

    if (messageText && userId && chatroomId) {
      console.log('Attempting to send message:', messageText);

      const messageToSend = {
        chatroomId: chatroomId,
        senderId: userId,
        text: messageText,
        senderUsername: this.currentUser()!.username!,
      };

      const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const optimisticMessage: Message = {
        ...messageToSend,
        id: tempMessageId,
        createdAt: new Date(),
        updatedAt: new Date(),
        readBy: [userId],
      };
      this.messages.update(msgs => [...msgs, optimisticMessage]);
      this.newMessageContent.set('');
      setTimeout(() => this.scrollToBottom(), 0);

      this.subscriptions.add(
        this.chatroomService.sendMessage(messageToSend).subscribe({
          next: (responseMessage) => {
            this.messages.update(msgs =>
               msgs.map(msg => (msg.id === tempMessageId) ? responseMessage : msg)
            );
          },
          error: (err) => {
            console.error('Failed to send message:', err);
            this.error.set('Failed to send message. Please try again.');
            this.messages.update(msgs => msgs.filter(msg => msg.id !== tempMessageId));
          }
        })
      );
    }
  }

  openDetailsModal(): void {
      this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
      this.showDetailsModal.set(false);
  }

  backToChatList(): void {
  const user = this.currentUser();
  if (user?.id && user?.role) {
    // Navigates to /seeker/:id/chatrooms or /provider/:id/chatrooms
    this.router.navigate([`/${user.role}`, user.id, 'chatrooms']);
  } else {
    this.router.navigate(['/search']); // Safe fallback
  }
}

  isMyMessage(senderId: string): boolean {
    return senderId === this.currentUser()!.id;
  }

  messageTrackBy(index: number, message: Message): string {
    return message.id;
  }

  scrollToBottom(): void {
    if (this.messageContainer && this.messageContainer.nativeElement) {
      try {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Failed to scroll to bottom:', err);
      }
    }
  }

  ngOnDestroy(): void {
    console.log('ChatroomComponent destroyed.');
    this.subscriptions.unsubscribe();
    const currentChatroomId = this.chatroomId();
    if (currentChatroomId) {
      this.chatroomService.leaveChatroomSocket(currentChatroomId);
      console.log(`Left chatroom socket channel: ${currentChatroomId}`);
    }
  }

  private cleanupSocket(): void {
    const oldId = this.chatroomId();
    if (oldId) {
      this.chatroomService.leaveChatroomSocket(oldId);
      if (this.chatroomMessageSubscription) {
        this.chatroomMessageSubscription.unsubscribe();
      }
      console.log(`Cleaned up socket for room: ${oldId}`);
    }
  }
}