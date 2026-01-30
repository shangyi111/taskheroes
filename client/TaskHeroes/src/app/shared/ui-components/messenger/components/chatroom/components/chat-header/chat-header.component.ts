import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chatroom } from 'src/app/shared/models/chatroom';
import { User } from 'src/app/shared/models/user';
import { JobStatus } from 'src/app/shared/models/job-status.enum';
import { ReviewEligibility } from 'src/app/shared/models/chatroom';

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
  chatPartnerName = input.required<string>();

  // Outputs (Emitters)
  statusUpdated = output<string>();
  backClicked = output<void>();
  detailsOpened = output<void>();
  reviewOpened = output<void>();

  reviewEligibility = computed(() => {
    const room = this.chatroom();
    if (!room) return { allowed: false, daysRemaining: null };
    
    // Grab the data we packed into the backend response
    return room.reviewEligibility || { allowed: false, daysRemaining: null };
  });

  headerState = computed(() => {
    const room = this.chatroom();
    const user = this.currentUser();
    const eligibility = room?.reviewEligibility as ReviewEligibility;

    if (!room || !user || !eligibility) {
      return { showReviewAction: false, showStatusActions: false };
    }

    let label = 'Leave Review';
    if (eligibility.hasReviewed) {
        // If they've reviewed but it's not expired, they can still Edit
        label = eligibility.isExpired ? 'View Review' : 'Edit My Review';
    }

    const isProvider = user.id === room.providerId;
    const isCustomer = user.id === room.customerId;
    const status = room.jobStatus as JobStatus;


    return {
      isProvider,
      isCustomer,
      // Provider triggers
      showAccept: isProvider && status === JobStatus.Pending,
      showConfirmDeposit: isProvider && (status === JobStatus.Accepted || status === JobStatus.DepositSent),
      showBook: isProvider && status === JobStatus.DepositReceived,
      // Seeker triggers
      showDepositSent: isCustomer && status === JobStatus.Accepted,
    //   showVerify: isCustomer && status === JobStatus.Completed,
      // Cancellation
      showCancel: isCustomer && ![
        JobStatus.InProgress, 
        JobStatus.Completed, 
        JobStatus.Verified, 
        JobStatus.Cancelled
      ].includes(status),

      showReviewAction: eligibility.allowed,
      reviewActionLabel: label,
      daysRemaining: eligibility.daysRemaining,
      isReviewExpired: eligibility.isExpired,
      isReadOnly: !eligibility.allowed
    };
  });

  updateStatus(status: string) {
    this.statusUpdated.emit(status);
  }

  openReview() {
    this.reviewOpened.emit();
  }
}