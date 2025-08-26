import { Component, Input, OnInit } from '@angular/core';
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
  ]
})
export class MessageComponent implements OnInit {
  @Input({ required: true }) message!: Message;
  @Input() currentUserId: string | null = null;
  @Input() currentUsername : string | null = null;

  isSentMessage: boolean = false;

  ngOnInit(): void {
    if (!this.message) {
      return;
    }
    this.isSentMessage = (this.currentUserId === this.message.senderId);
  }
}