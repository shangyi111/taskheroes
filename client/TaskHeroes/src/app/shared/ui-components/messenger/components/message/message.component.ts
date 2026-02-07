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

  isSystemMessage = computed(() => this.message.text?.startsWith('[System]'));

  isSentMessage = computed(() => this.currentUserId === this.message.senderId);

  senderAvatarUrl = computed(() => {
    if (this.isSentMessage() || this.isSystemMessage()) return null;
    return this.chatPartnerAvatarUrl || 'assets/img/default-avatar.png';
  });

  displayText = computed(() => {
    return this.isSystemMessage() 
      ? this.message.text.replace('[System] ', '') 
      : this.message.text;
  });

  ngOnInit(): void {
    if (!this.message) {
      console.warn('Message component initialized without message data.');
    }
  }
}