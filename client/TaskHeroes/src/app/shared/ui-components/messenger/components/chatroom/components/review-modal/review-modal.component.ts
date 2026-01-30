import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.scss']
})
export class ReviewModalComponent {
  job = input.required<any>();
  currentUser = input.required<any>();
  existingReview = input<any | null>(null);
  daysRemaining = input<number | null>(null);

  close = output<void>();
  submit = output<any>();

  // Form State
  rating = signal(0);
  comment = signal('');
  communication = signal(0);
  
  // Seeker Specific
  professionalism = signal(0);
  wasOnTime = signal(true);

  // Provider Specific
  isFullAmountPaid = signal(true);
  isPaidWithin24h = signal(false);
  wouldRecommend = signal(true);

  constructor() {
    // Reactively fill the form when existingReview changes
    effect(() => {
      const review = this.existingReview();
      if (review) {
        this.rating.set(review.rating ?? 0);
        this.comment.set(review.comment ?? '');
        this.communication.set(review.communication ?? 0);
        
        // Conditional pre-fill based on role
        if (this.isSeeker()) {
          this.professionalism.set(review.professionalism ?? 0);
          this.wasOnTime.set(review.wasOnTime);
        } else {
          this.isFullAmountPaid.set(review.isFullAmountPaid);
          this.isPaidWithin24h.set(review.isPaidWithin24h);
          this.wouldRecommend.set(review.wouldRecommend);
        }
      }
    });
  }
  
  isSeeker = computed(() => this.currentUser()?.id === this.job()?.customerId);
  isFormValid = computed(() => {
    const commonValid = this.rating() > 0 && this.communication() > 0 && this.comment().trim().length > 5;
    
    if (this.isSeeker()) {
        return commonValid && this.professionalism() > 0 && this.wasOnTime() !== null;
    } else {
        return commonValid && 
            this.isFullAmountPaid() !== null && 
            this.isPaidWithin24h() !== null && 
            this.wouldRecommend() !== null;
    }
    });

  setRating(val: number) { this.rating.set(val); }
  setComm(val: number) { this.communication.set(val); }
  setProf(val: number) { this.professionalism.set(val); }

  onSubmit() {
    const payload = {
      jobId: this.job().jobId,
      rating: this.rating(),
      comment: this.comment(),
      communication: this.communication(),
      reviewerRole: this.isSeeker() ? 'seeker' : 'provider',
      // Seeker fields
      professionalism: this.isSeeker() ? this.professionalism() : null,
      wasOnTime: this.isSeeker() ? this.wasOnTime() : null,
      // Provider fields
      isFullAmountPaid: !this.isSeeker() ? this.isFullAmountPaid() : null,
      isPaidWithin24h: !this.isSeeker() ? this.isPaidWithin24h() : null,
      wouldRecommend: !this.isSeeker() ? this.wouldRecommend() : null,
    };
    this.submit.emit(payload);
  }
}