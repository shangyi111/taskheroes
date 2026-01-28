import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chatroom } from 'src/app/shared/models/chatroom';
import { User } from 'src/app/shared/models/user';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.scss']
})
export class ChatHeaderComponent {
  // Inputs (Signals)
  chatroom = input.required<Chatroom | null>();
  currentUser = input.required<User | null>();
  jobDetails = input.required<any>();
  canUpdateStatus = input.required<any>();
  chatPartnerName = input.required<string>();

  // Outputs (Emitters)
  statusUpdated = output<string>();
  backClicked = output<void>();
  detailsOpened = output<void>();

  updateStatus(status: string) {
    this.statusUpdated.emit(status);
  }
}