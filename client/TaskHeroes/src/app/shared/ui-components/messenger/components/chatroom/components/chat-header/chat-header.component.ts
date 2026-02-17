import { Component, input, output, computed, signal, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chatroom } from 'src/app/shared/models/chatroom';
import { User } from 'src/app/shared/models/user';
import { JobStatus } from 'src/app/shared/models/job-status.enum';
import { ReviewEligibility } from 'src/app/shared/models/chatroom';
import { DeclineReasonDialogComponent } from '../decline-reason-dialog/decline-reason-dialog.component';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, DeclineReasonDialogComponent],
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.scss']
})
export class ChatHeaderComponent {
  readonly DEFAULT_AVATAR = 'assets/img/default-avatar.png';
  readonly JobStatus = JobStatus; // Expose enum to template
  // Inputs (Signals)
  chatroom = input.required<Chatroom | null>();
  currentUser = input.required<User | null>();
  jobDetails = input.required<any>();
  chatPartnerName = input.required<string>();
  chatPartnerAvatarUrl = input.required<string | null>();

  // Outputs (Emitters)
  statusUpdated = output<{ status: JobStatus; reason?: string }>();
  backClicked = output<void>();
  detailsOpened = output<void>();
  reviewOpened = output<void>();

  imgError = signal(false);
  showDeclineModal = signal(false);

  reviewEligibility = computed(() => {
    const room = this.chatroom();
    if (!room) return { allowed: false, daysRemaining: null };
    
    // Grab the data we packed into the backend response
    return room.reviewEligibility || { allowed: false, daysRemaining: null };
  });

  headerState = computed(() => {
    const room = this.chatroom();
    const user = this.currentUser();
    const job = this.jobDetails();
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
    const isMyTurn = job.lastActionBy !== user.id;
    const showSeekerConfirm = isCustomer && status === JobStatus.Pending && isMyTurn;


    return {
      isProvider,
      isCustomer,
      // Provider triggers
      showAccept: isProvider && status === JobStatus.Pending,
      showDecline: isProvider && status === JobStatus.Pending,
      // Seeker triggers: The "Confirm & Book" button
      showConfirmBook: showSeekerConfirm,

      // Waiting State: Show a "Waiting..." label if it's Pending but not my turn
      isWaiting: status === JobStatus.Pending && !isMyTurn,
    //   showVerify: isCustomer && status === JobStatus.Completed,
      // Cancellation
      showCancel: isCustomer && ![
        JobStatus.Pending, 
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

  constructor() {
    effect(() => {
      this.chatroom(); // track change
      this.imgError.set(false); // reset error state for new partner
    }, { allowSignalWrites: true });
  }

    updateStatus(status: JobStatus, reason?: string) {
      this.statusUpdated.emit({ status, reason });
    }

  openReview() {
    this.reviewOpened.emit();
  }

  handleImgError(event: any) {
    // If the error happened on the default avatar itself, stop trying!
    if (event.target.src.includes(this.DEFAULT_AVATAR)) {
        event.target.style.display = 'none'; // Or hide it
        return;
    }
    this.imgError.set(true);
 }

 handleDeclineClick() {
    this.showDeclineModal.set(true);
  }

  onDeclineConfirm(reason: string) {
    this.showDeclineModal.set(false);
    this.statusUpdated.emit({ status: JobStatus.Cancelled, reason });
  }
}