import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'decline-reason-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './decline-reason-dialog.component.html',
  styleUrls: ['./decline-reason-dialog.component.scss']
})
export class DeclineReasonDialogComponent {
  // Outputs for parent communication
  confirm = output<string>();
  cancel = output<void>();

  // State management
  selectedReason = signal<string | null>(null);
  customMessage = signal('');

  readonly PRESET_REASONS = [
    'Schedule conflict',
    'Too far away',
    'Fully booked',
    'Outside my scope'
  ];

  setReason(reason: string) {
    this.selectedReason.set(reason);
  }

  submit() {
    const reasonText = this.selectedReason();
    const additionalInfo = this.customMessage().trim();
    
    // Combine the preset and the custom message
    const finalReason = [reasonText, additionalInfo]
      .filter(Boolean)
      .join(': ');

    this.confirm.emit(finalReason);
  }
}