import { Component, Input, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Message } from 'src/app/shared/models/message';

@Component({
  selector: 'th-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe
  ],
  // Use OnPush for performance since state relies solely on inputs
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class MessageComponent implements OnInit {
  @Input({ required: true }) message!: Message;
  @Input() currentUserId: string | null = null;
  @Input() chatPartnerAvatarUrl: string | null = null; 

  isSentMessage = computed(() => this.currentUserId === this.message.senderId);

  senderAvatarUrl = computed(() => {
    // If the message is RECEIVED, use the URL provided by the parent.
    if (!this.isSentMessage()) {
        return this.chatPartnerAvatarUrl || 'assets/img/default-avatar.png';
    }
    // If sent, no avatar is needed in the message stream
    return null; 
  });

  ngOnInit(): void {
    if (!this.message) {
      console.warn('Message component initialized without message data.');
    }
  }
}