import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatroomService } from '../../../../services/chatroom.service';
import { Chatroom } from '../../../models/chatroom';
import { User} from '../../../models/user';
import { UserDataService } from 'src/app/services/user_data.service';

@Component({
  selector: 'app-chatrooms',
  templateUrl: './chatrooms.component.html',
  styleUrls: ['./chatrooms.component.scss'],
  standalone: true,
  imports: [],
})
export class ChatroomsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private chatRoomservice = inject(ChatroomService);
  private userDataService = inject(UserDataService);

  chatrooms = signal<Chatroom[]>([]);
  user = signal<User | null>(null);
  currentUserRole = signal<string | null>(null);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initUserAndChatrooms();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initUserAndChatrooms(): void {
    this.subscriptions.push(
      this.userDataService.userData$.subscribe(user => {
        this.user.set(user); // Set the public user signal
        this.currentUserRole.set(user?.role || null); // Set the public role signal
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


  loadChatrooms(role:string): void {
    const userId = this.user()?.id;
    if(role=="provider"){
    this.subscriptions.push(
      this.chatRoomservice.getChatroomsByProviderId(userId!)
        .subscribe(chatrooms => {
          this.chatrooms.set(chatrooms);
        })
    )}else if(role==="seeker"){
      this.subscriptions.push(
        this.chatRoomservice.getChatroomsBySeekerId(userId!)
          .subscribe(chatrooms => {
            this.chatrooms.set(chatrooms);
          })
      )
    }
  }

  goToChatroom(chatroom: Chatroom): void {
    const currentUserId = this.user()?.id; // Get the current user's ID from the signal
    if (currentUserId) {
      this.router.navigate(['user',currentUserId,'job',chatroom.jobId,'chatroom',chatroom.id]);
    } else {
      console.warn('Cannot navigate to chatroom: User ID or role not available.');
    }
  }
}
