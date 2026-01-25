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
import { PaginatedMessages } from 'src/app/shared/models/pagination';
import { ThLoadingComponent } from '../../../th-loading/loading.component';

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

type ChatStatus = 'loading' | 'fetching-history' | 'idle' | 'error';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessageComponent,
    ThLoadingComponent
  ]
})
export class ChatroomComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('scrollAnchor') set scrollAnchor(content: ElementRef) {
  if (content) {
    this.setupIntersectionObserver(content);
    }
  }
  private observer?: IntersectionObserver;

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
  currentPage = signal(0);
  pageSize = 20;
  allMessagesLoaded = signal(false);

  chatStatus = signal<ChatStatus>('loading'); 
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
  
  // Fetches the partner's avatar URL from the enriched chatroom object
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
  const initialId = this.route.snapshot.params['chatroomId'];
  if (initialId) {
    this.prepareForNewChat(initialId);
    this.loadInitialData(initialId);
  }

  this.subscriptions.add(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.route.snapshot.params['chatroomId']),
      filter(id => id && id !== this.chatroomId()), // Only switch if it's a new ID
      tap(id => this.prepareForNewChat(id))
    ).subscribe(id => {
      this.loadInitialData(id);
    })
  );
}

  private setupIntersectionObserver(anchor: ElementRef) {
    this.observer = new IntersectionObserver(([entry]) => {
      // Trigger if anchor is visible AND we have at least one full page already
      if (entry.isIntersecting && 
          this.chatStatus() === 'idle' && 
          !this.allMessagesLoaded()) {
        this.loadMoreMessages();
      }
    }, {
      root: this.messageContainer.nativeElement,
      threshold: 0.1,
      rootMargin: '50px 0px 0px 0px' // Start loading slightly before hitting the top
    });

    this.observer.observe(anchor.nativeElement);
  } 
 // 3. Extract the loading logic to a helper
  private loadInitialData(id: string): void {
    this.userDataService.userData$.pipe(
      filter(Boolean),
      take(1),
      tap(user => this.currentUser.set(user)),
      switchMap(user => this.loadChatroomAndMessages(id, user.id!))
    ).subscribe({
      next: () => {
        this.setupRealtimeMessaging(id);
        setTimeout(() => {this.scrollToBottom();this.chatStatus.set('idle');}, 50);
      }
    });
  }
  /**
   * Reset signals so the UI doesn't show old data while loading
  */
  private prepareForNewChat(id: string): void {
    this.chatStatus.set('loading');
    this.error.set(null);
    this.messages.set([]); // Clear the message list immediately
    this.chatroom.set(null); // Clear the header
    this.chatroomId.set(id);
    this.allMessagesLoaded.set(false);  
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
          this.chatStatus.set('error');
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
            // Catch the error here so the chatroom still loads
            catchError(err => {
              console.warn(`Job ${jobIdNumber} not found, continuing to load chat...`);
              this.job.set(null); // Fallback to null
              return of(null); // Return a successful observable to keep the pipe alive
            }),
            switchMap(() => of(chatroomData as ExtendedChatroom))
          );
        } else {
          this.job.set(null); 
          return of(chatroomData as ExtendedChatroom);
        }
      }),
      
      switchMap(chatroomData => 
          this.chatroomService.getMessagesForChatroom(chatroomId).pipe(
            tap((response: PaginatedMessages) => {
              const initialMessages = [...response.items].reverse();
              this.messages.set(initialMessages);
              if (initialMessages.length < this.pageSize) {
                  this.allMessagesLoaded.set(true);
              }
              this.chatStatus.set('idle');
            }),
            map(() => chatroomData as ExtendedChatroom) 
          )
      ),
      catchError(err => {
        console.error('Error fetching chatroom or messages:', err);
        this.error.set('Failed to retrieve chatroom details or messages.');
        this.chatStatus.set('error');
        return throwError(()=>err);
      })
    );
  }

  private setupRealtimeMessaging(chatroomId: string): void {
    console.log(`Setting up real-time messaging for chatroom ${chatroomId}.`);

    this.chatroomService.watchActiveRoom(chatroomId);

    if (this.chatroomMessageSubscription) {
      this.chatroomMessageSubscription.unsubscribe();
    }

    this.chatroomMessageSubscription = this.chatroomService.onNewMessage().pipe(
      filter(message => message.chatroomId === chatroomId),
      tap(message => {
        const element = this.messageContainer.nativeElement;
        // Check if user is near bottom (within 100px)
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        
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
        if (isNearBottom || message.senderId === this.currentUser()?.id) {
            setTimeout(() => this.scrollToBottom(), 0);
        }
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

  onScroll(event: any): void {
    if (this.chatStatus() !== 'idle') {
      return;
    }

    const threshold = 50; // Trigger when within 50px of the top
    if (event.target.scrollTop <= threshold && !this.allMessagesLoaded()) {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages(): void {
    const id = this.chatroomId();
    const currentMessages = this.messages();
    if (!id || this.chatStatus() !== 'idle' || currentMessages.length === 0 || this.allMessagesLoaded()) return;

    // SCROLL CORRECTION: Capture height before update
    const container = this.messageContainer.nativeElement;
    const previousHeight = container.scrollHeight;

    this.chatStatus.set('fetching-history');
    const lastId = currentMessages[0].id;

    this.chatroomService.getMessagesForChatroom(id, this.pageSize, lastId).subscribe({
      next: (response) => {
        const olderMsgs = response.items;
        this.allMessagesLoaded.set(olderMsgs.length < this.pageSize);

        if (olderMsgs.length > 0) {
          this.messages.update(current => [...[...olderMsgs].reverse(), ...current]);
          
          // SCROLL CORRECTION: Restore position
          setTimeout(() => {
            container.scrollTop = container.scrollHeight - previousHeight;
            this.chatStatus.set('idle');
          }, 0);
        } else {
          this.chatStatus.set('idle');
        }
      },
      error: () => this.chatStatus.set('idle')
    });
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
    this.chatroomService.stopWatchingRoom();
  }

  private cleanupSocket(): void {
    const oldId = this.chatroomId();
    if (oldId) {
      this.chatroomService.stopWatchingRoom();
      if (this.chatroomMessageSubscription) {
        this.chatroomMessageSubscription.unsubscribe();
      }
      console.log(`Stopped watching socket room: ${oldId}`);
    }
  }
}