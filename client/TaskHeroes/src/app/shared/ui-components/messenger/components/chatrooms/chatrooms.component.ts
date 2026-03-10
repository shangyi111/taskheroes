import { Component, OnInit, OnDestroy, inject, signal, computed} from '@angular/core';
import { Router,ActivatedRoute,NavigationEnd } from '@angular/router';
import { Subscription, filter, map, distinctUntilChanged, combineLatest } from 'rxjs';
import { ChatroomService } from '../../../../../services/chatroom.service';
import { Chatroom } from '../../../../models/chatroom';
import { User} from '../../../../models/user';
import { UserDataService } from 'src/app/services/user_data.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScrollSensorDirective } from 'src/app/shared/directives/scroll-sensor.directive';
import { EmptyStateComponent } from '../../../th-empty-state/empty-state.component';
import { ThLoadingComponent } from '../../../th-loading/loading.component';

@Component({
  selector: 'app-chatrooms',
  templateUrl: './chatrooms.component.html',
  styleUrls: ['./chatrooms.component.scss'],
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, ScrollSensorDirective, EmptyStateComponent,
    ThLoadingComponent
  ],
})
export class ChatroomsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chatRoomservice = inject(ChatroomService);
  private userDataService = inject(UserDataService);
  private activeUserId: string | null = null;
  private activeRole: string | null = null;

  chatrooms = this.chatRoomservice.chatrooms;
  user = this.userDataService.userSignal;
  currentUserRole = this.userDataService.userRoleSignal;
  activeChatId = signal<string | null>(null);

  //pagination
  currentPage = 1;
  pageSize = 5;
  hasMore = signal(true);
  isLoading = signal(false);

  private subscriptions: Subscription[] = [];

  

  ngOnInit(): void {
    this.captureInitialRouteId();
    this.trackActiveChatFromUrl();
    this.initDataFlow();
    // this.initUserAndChatrooms(); 
  }

  onBottomReached(): void {
    const role = this.currentUserRole();
    const userId = this.user()?.id;
    if (role && userId && !this.isLoading() && this.hasMore()) {
      console.log('Sensor triggered: loading page', this.currentPage);
      this.loadChatrooms(role, userId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * CAPTURE INITIAL STATE: 
   * Sets the active ID immediately upon component load
   */
  private captureInitialRouteId(): void {
    let child = this.route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }
    const initialId = child?.snapshot.paramMap.get('chatroomId');
    if (initialId) {
      this.activeChatId.set(initialId);
    }
  }

  /**
   * Listens to router events to highlight the correct chatroom in the sidebar
   */
  private trackActiveChatFromUrl(): void {
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          // Traverse to the child route where :chatroomId is defined
          let child = this.route.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          return child?.snapshot.paramMap.get('chatroomId');
        })
      ).subscribe(id => {
        console.log('Active chatroom ID from URL:', id);
        this.activeChatId.set(id!);
      })
    );
  }
  // private initUserAndChatrooms(): void {
  //   this.subscriptions.push(
  //     this.userDataService.userData$.subscribe(user => {
  //       if (!user) return;

  //       // RESET PAGINATION if user/role changes to avoid data pollution
  //       if (this.user()?.id !== user.id || this.currentUserRole() !== user.role) {
  //         this.chatRoomservice.updateChatroomsList([]);
  //         this.currentPage = 1;
  //         this.hasMore.set(true);
  //       }

  //       this.user.set(user); 
  //       this.currentUserRole.set(user?.role || null); 
  //       const userId = user?.id;
  //       const role = user?.role;
  //       if (userId && role) {
  //         this.loadChatrooms(role);
  //       } else {
  //         console.warn('User not logged in');
  //       }
  //     })
  //   );
  // }

  private initDataFlow(): void {
    this.subscriptions.push(
      combineLatest([
        this.userDataService.userData$,
        this.userDataService.userRole$
      ]).subscribe(([user, role]) => {
        
        // Wait for a real user ID from the backend hydration
        if (!user || !user.id || user.id === 'guest') {
          return; 
        }

        const normalizedRole = role.toLowerCase();

        // Stop if we already loaded this exact User + Role combo.
        // (Prevents infinite loops on refresh)
        if (this.activeUserId === user.id && this.activeRole === normalizedRole) {
          return; 
        }

        console.log(`✅ Ready! Fetching chatrooms for User: ${user.id} as Role: ${normalizedRole}`);

        // Lock in the current state
        this.activeUserId = user.id;
        this.activeRole = normalizedRole;
        
        // Reset the slate
        this.chatRoomservice.updateChatroomsList([]);
        this.currentPage = 1;
        this.hasMore.set(true);
        this.isLoading.set(false);

        // Fetch the data!
        this.loadChatrooms(normalizedRole, user.id);
      })
    );
  }

  loadChatrooms(role: string, userId:string): void {
    if (!userId || this.isLoading() || !this.hasMore()) {
      return; 
    }

    this.isLoading.set(true); // Start loading

    const request$ = role === "provider" 
      ? this.chatRoomservice.getChatroomsByProviderId(userId, this.currentPage, this.pageSize)
      : this.chatRoomservice.getChatroomsBySeekerId(userId, this.currentPage, this.pageSize);

    this.subscriptions.push(
      request$.subscribe({
        next: (response) => {
          const updatedList = [...this.chatrooms(), ...response.items];
          this.chatRoomservice.updateChatroomsList(updatedList);
          
          // Logic for next page
          if (this.currentPage >= response.totalPages) {
            this.hasMore.set(false);
          } else {
            this.currentPage++;
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading chatrooms:', err);
          this.isLoading.set(false);
        }
      })
    );
  }

  goToChatroom(chatroom: Chatroom): void {
    const currentUserId = this.user()?.id; // Get the current user's ID from the signal
    if (currentUserId) {
      this.router.navigate(['/messenger',chatroom.id]);
    } else {
      console.warn('Cannot navigate to chatroom: User ID or role not available.');
    }
  }

  getChatPartnerName(chatroomData:Chatroom, currentUserId?:String) {
        
        if (!chatroomData || !currentUserId) { return 'Loading Chat...'; }
  
        if (chatroomData.customerId === currentUserId) {
            return chatroomData.providerUsername ||'Provider';
        } else if (chatroomData.providerId === currentUserId) {
            return chatroomData.customerUsername || 'Seeker';
        }
        return 'Unknown Chat';
  };
}
