import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from 'src/app/services/review.service';
import { CommonModule, DatePipe } from '@angular/common'; 
import { ThLoadingComponent } from 'src/app/shared/ui-components/th-loading/loading.component';

@Component({
  selector: 'th-seeker-portfolio',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe,
    ThLoadingComponent
  ],
  templateUrl: './seeker-portfolio.component.html',
  styleUrls: ['./seeker-portfolio.component.scss']
})
export class SeekerPortfolioComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reviewService = inject(ReviewService);

  // Signals for your minimalistic UI
  isLoading = signal(true);
  reputationData = signal<any>(null);

  ngOnInit() {
    // We get these from the "View details" link in your Chat Header
    const seekerId = this.route.snapshot.paramMap.get('userId');
    const chatroomId = this.route.snapshot.queryParamMap.get('chatroomId');

    if (seekerId && chatroomId) {
      this.loadReputation(seekerId, chatroomId);
    }
  }

  private loadReputation(id: string, roomId: string) {
    this.reviewService.getReviewsByRevieweeId(id, roomId).subscribe({
      next: (data) => {
        this.reputationData.set(data);
        this.isLoading.set(false);
      }
    });
  }
}