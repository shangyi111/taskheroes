import { Component, OnInit, OnDestroy, inject, signal, WritableSignal, ViewChild,computed } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import { Subscription, of, Observable, throwError, combineLatest } from 'rxjs';
import { switchMap, filter, tap, catchError, map, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatroomService } from 'src/app/services/chatroom.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { JobService } from 'src/app/services/job.service';
import { ReviewService } from 'src/app/services/review.service';
import { Chatroom } from 'src/app/shared/models/chatroom';
import { User } from 'src/app/shared/models/user';
import { Job } from 'src/app/shared/models/job';
import { Message } from 'src/app/shared/models/message';
import { PaginatedMessages } from 'src/app/shared/models/pagination';
import { ChatHeaderComponent } from './components/chat-header/chat-header.component';
import { ChatDetailsDrawerComponent } from './components/chat-details-drawer/chat-details-drawer.component';
import { ChatMessageListComponent } from './components/chat-message-list/chat-message-list.component';
import { ReviewModalComponent } from './components/review-modal/review-modal.component';

type ChatStatus = 'loading' | 'fetching-history' | 'idle' | 'error';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChatHeaderComponent,
    ChatDetailsDrawerComponent,
    ChatMessageListComponent,
    ReviewModalComponent
  ]
})
export class ChatroomComponent implements OnInit, OnDestroy {
  @ViewChild(ChatMessageListComponent) messageList!: ChatMessageListComponent;

  private router = inject(Router);
  private chatroomService = inject(ChatroomService);
  private userDataService = inject(UserDataService);
  private jobService = inject(JobService);
  private reviewService = inject(ReviewService);
  private route = inject(ActivatedRoute);

  currentUser: WritableSignal<User | null> = signal(null);
  chatroomId: WritableSignal<string | null> = signal(null);
  chatroom: WritableSignal<Chatroom | null> = signal(null); 
  messages: WritableSignal<Message[]> = signal([]);
  newMessageContent: WritableSignal<string> = signal('');
  currentPage = signal(0);
  pageSize = 20;
  allMessagesLoaded = signal(false);

  chatStatus = signal<ChatStatus>('loading'); 
  error: WritableSignal<string | null> = signal(null);
  
  showDetailsModal: WritableSignal<boolean> = signal(false);
  showReviewModal = signal(false);
  showScrollToBottomBtn = signal(false);
  hasUnreadAtBottom = signal(false);
  markCurrentRoomAsRead = signal(false);

  private subscriptions: Subscription = new Subscription();
  private chatroomMessageSubscription: Subscription | undefined;

  // --- Computed Signals (Contextual Data) ---

  chatPartnerName = computed(() => {
      const chatroomData = this.chatroom();
      const currentUserId = this.currentUser()?.id;
      
      if (!chatroomData || !currentUserId) { return 'Loading Chat...'; }

      if (chatroomData.customerId === currentUserId) {
          return chatroomData.providerUsername ||'Provider';
      } else if (chatroomData.providerId === currentUserId) {
          return chatroomData.customerUsername || 'Seeker';
      }
      return 'Unknown Chat';
  });

  jobDetails = computed(() => {
      const room = this.chatroom();
      if (!room) return null;
      
      return {
        jobDate: room.jobDate ? new Date(room.jobDate) : null,
        serviceName: room.jobTitle || 'General Inquiry',
        location: room.jobLocation || 'Not provided',
        fee: room.fee,
        description: room.description || 'No description',
        jobStatus: room.jobStatus ? room.jobStatus 
          : (room.jobDate && new Date(room.jobDate) < new Date() ? 'Past' : 'Pending')}
  });
  
  // Fetches the partner's avatar URL from the enriched chatroom object
  chatPartnerAvatarUrl = computed(() => {
    const data = this.chatroom();
    const user = this.currentUser();
    
    if (!data || !user) return 'assets/img/default-avatar.png';

    // Seeker view: Backend already populated serviceProfilePicture with the Business pic
    // Provider view: Backend already populated customerProfilePicture
    return (user.id === data.customerId) 
      ? data.serviceProfilePicture || null
      : data.customerProfilePicture || null;
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
  private loadChatroomAndMessages(chatroomId: string, userId: string): Observable<Chatroom> {
    console.log(`Fetching chatroom ${chatroomId} for user ${userId} via ChatroomService.`);
    return this.chatroomService.getChatroomById(chatroomId).pipe(
      tap(chatroom => this.validateAccess(chatroom, userId)),
      // Fetch and Process Messages
      switchMap(chatroom => this.chatroomService.getMessagesForChatroom(chatroomId).pipe(
        tap(res => this.processInitialMessages(res)),
        map(() => chatroom)
      )),
      catchError(err => {
        console.error('Error fetching chatroom or messages:', err);
        this.error.set('Failed to retrieve chatroom details or messages.');
        this.chatStatus.set('error');
        return throwError(()=>err);
      })
    );
  }

  private validateAccess(chatroomData: Chatroom | null, userId: string): void {
    // 1. Check if chatroom actually exists
    if (!chatroomData) {
      throw new Error('Chatroom not found.');
    }

    // 2. Security Check: Is the current user part of this chat?
    const isParticipant = chatroomData.customerId === userId || chatroomData.providerId === userId;

    if (!isParticipant) {
      this.error.set('You do not have access to this chatroom.');
      this.chatStatus.set('error');
      throw new Error('Unauthorized access to chatroom');
    }
    // 3. If everything is fine, update the state
    this.chatroom.set(chatroomData);
  }

  private processInitialMessages(response: PaginatedMessages): void {
    // 1. Reverse the items for chronological display (Bottom-Up)
    const initialMessages = [...response.items].reverse();
    
    // 2. Update the main messages signal
    this.messages.set(initialMessages);
    
    // 3. Check if we've hit the end of history
    if (initialMessages.length < this.pageSize) {
      this.allMessagesLoaded.set(true);
    }
    
    // 4. Update status so the loading spinners disappear
    this.chatStatus.set('idle');
  }

  private setupRealtimeMessaging(chatroomId: string): void {
    this.chatroomService.watchActiveRoom(chatroomId);

    this.chatroomMessageSubscription = this.chatroomService.onNewMessage().pipe(
      filter(message => message.chatroomId === chatroomId),
      tap(message => this.handleIncomingMessage(message)),
      catchError(() => of(null))
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

  loadMoreMessages(): void {
    const id = this.chatroomId();
    const currentMessages = this.messages();
    if (!id || this.chatStatus() !== 'idle' || currentMessages.length === 0 || this.allMessagesLoaded()) return;

    this.chatStatus.set('fetching-history');
    const lastId = currentMessages[0].id;

    this.chatroomService.getMessagesForChatroom(id, this.pageSize, lastId).subscribe({
      next: (response) => {
        const olderMsgs = response.items;
        this.allMessagesLoaded.set(olderMsgs.length < this.pageSize);

        if (olderMsgs.length > 0) {
          this.messages.update(current => [...[...olderMsgs].reverse(), ...current]);
        } 
        this.chatStatus.set('idle');
      },
      error: () => this.chatStatus.set('idle')
    });
  }
  scrollToBottom(): void {
    if (this.messageList) {
      this.messageList.scrollToBottom();
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

  private handleIncomingMessage(message: Message): void {
    const isMine = message.senderId === this.currentUser()?.id;
    const isNearBottom = this.messageList?.isUserAtBottom() || false;

    // 1. Update UI: Notify user if they are looking at history
    if (!isMine && !isNearBottom) {
      this.hasUnreadAtBottom.set(true);
    }

    // 2. Mark as Read: If user is at the bottom, tell the server immediately
    if (!isMine && isNearBottom) {
      this.markCurrentRoomAsRead();
    }

    // 3. Update State: Add to list if not already there (prevents duplicates)
    this.messages.update(msgs => {
      if (isMine) return msgs; // Optimistic UI handled this
      return msgs.some(m => m.id === message.id) ? msgs : [...msgs, message];
    });

    // 4. Auto-Scroll: Only jump to bottom if user is already there or it's their own message
    if (isNearBottom || isMine) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  updateStatus(newStatus: string): void {
    const room = this.chatroom();
    if (!room || !room.jobId) return;

    // Set loading state if you have one for the button
    this.jobService.updateJobStatus(room.jobId, newStatus).subscribe({
      next: (updatedJob) => {
        // Update the chatroom signal with the new job status
        this.chatroom.update(current => current ? { ...current, jobStatus: updatedJob.jobStatus } : null);
        console.log(`Job status updated to: ${updatedJob.jobStatus}`);
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        this.error.set(err.error?.message || 'Action failed. Please try again.');
      }
    });
  }

  handleReviewSubmit(payload: any) {
    this.reviewService.createReview(payload).subscribe({
      next: (response) => {
        // 2. Hide the modal
        this.showReviewModal.set(false);
      },
      error: (err) => {
        console.error('Submission failed', err);
      }
    });
  }
}