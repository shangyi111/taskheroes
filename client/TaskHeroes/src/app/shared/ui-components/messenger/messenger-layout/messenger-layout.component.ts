import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatroomsComponent } from '../components/chatrooms/chatrooms.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-messenger-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatroomsComponent, MatIconModule],
  templateUrl: './messenger-layout.component.html',
  styleUrls: ['./messenger-layout.component.scss'],
})
export class MessengerLayoutComponent {
  private route = inject(ActivatedRoute);

  isChatSelected(): boolean {
    // Returns true if there is a child route (e.g., /messenger/123)
    return !!this.route.firstChild;
  }

  goBack(): void {
    window.history.back();
  }
}