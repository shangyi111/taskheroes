import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-details-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-details-drawer.component.html',
  styleUrls: ['./chat-details-drawer.component.scss']
})
export class ChatDetailsDrawerComponent {
  // Inputs
  isOpen = input.required<boolean>();
  jobDetails = input.required<any>();

  // Outputs
  close = output<void>();
}