import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatroomService } from '../../../services/chatroom.service';
import { Chatroom } from '../../../shared/models/chatroom';
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
  userId: string | undefined;

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
        this.userId = user?.id;
        if (this.userId) {
          this.loadChatrooms();
        } else {
          console.warn('User not logged in');
        }
      })
    );
  }


  loadChatrooms(): void {
    this.subscriptions.push(
      this.chatRoomservice.getChatroomsByProviderId(this.userId!)
        .subscribe(chatrooms => {
          this.chatrooms.set(chatrooms);
        })
    );
  }

  goToChatroom(chatroomId: string): void {
    this.router.navigate(['/messenger', this.userId, chatroomId]);
  }
}
