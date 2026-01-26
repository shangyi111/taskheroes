import { Component, OnInit, OnDestroy, inject, signal, computed} from '@angular/core';
import { Router,ActivatedRoute,NavigationEnd } from '@angular/router';
import { Subscription, filter, map } from 'rxjs';
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

  chatrooms = signal<Chatroom[]>([]);
  user = signal<User | null>(null);
  currentUserRole = signal<string | null>(null);
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
    this.initUserAndChatrooms(); 
  }

  onBottomReached(): void {
    const role = this.currentUserRole();
    if (role && !this.isLoading() && this.hasMore()) {
      console.log('Sensor triggered: loading page', this.currentPage);
      this.loadChatrooms(role);
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
  private initUserAndChatrooms(): void {
    this.subscriptions.push(
      this.userDataService.userData$.subscribe(user => {
        if (!user) return;

        // RESET PAGINATION if user/role changes to avoid data pollution
        if (this.user()?.id !== user.id || this.currentUserRole() !== user.role) {
          this.chatrooms.set([]);
          this.currentPage = 1;
          this.hasMore.set(true);
        }

        this.user.set(user); 
        this.currentUserRole.set(user?.role || null); 
        const userId = user?.id;
        const role = user?.role;
        if (userId && role) {
          this.loadChatrooms(role);
        } else {
          console.warn('User not logged in');
        }
      })
    );
  }


  loadChatrooms(role: string): void {
    const userId = this.user()?.id;
    if (!userId) return;

    this.isLoading.set(true); // Start loading

    const request$ = role === "provider" 
      ? this.chatRoomservice.getChatroomsByProviderId(userId, this.currentPage, this.pageSize)
      : this.chatRoomservice.getChatroomsBySeekerId(userId, this.currentPage, this.pageSize);

    this.subscriptions.push(
      request$.subscribe({
        next: (response) => {
          // Append data
          this.chatrooms.update(prev => [...prev, ...response.items]);
          
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
}
