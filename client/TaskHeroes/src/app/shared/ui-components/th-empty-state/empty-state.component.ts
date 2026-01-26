import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'th-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  // The Material Icon name (e.g., 'chat_bubble_outline', 'search', 'cloud_off')
  @Input() icon?: string;
  
  // The main bold heading
  @Input() title?: string;
  
  // The smaller supporting text
  @Input() message?: string = '';
  
  // Optional button text; if provided, the button will show
  @Input() actionLabel?: string;

  // Emits an event when the action button is clicked
  @Output() actionClicked = new EventEmitter<void>();

  onBtnClick(): void {
    this.actionClicked.emit();
  }
}