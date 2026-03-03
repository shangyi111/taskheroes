import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from 'src/app/services/review.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { CommonModule, DatePipe } from '@angular/common'; 
import { ThLoadingComponent } from 'src/app/shared/ui-components/th-loading/loading.component';
import { forkJoin } from 'rxjs';

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
  private userDataService = inject(UserDataService);

  // Signals for your minimalistic UI
  isLoading = signal(true);
  reputationData = signal<any>(null);
  userData = signal<any>(null);

  ngOnInit() {
    // We get these from the "View details" link in your Chat Header
    const seekerId = this.route.snapshot.paramMap.get('userId');
    const chatroomId = this.route.snapshot.queryParamMap.get('chatroomId');

    if (seekerId && chatroomId) {
      this.loadProfileAndReputation(seekerId, chatroomId);
    }
  }

  private loadProfileAndReputation(userId: string, roomId: string) {
    forkJoin({
      user: this.userDataService.getUserById(userId),
      reviews: this.reviewService.getReviewsByRevieweeId(userId, roomId)
    }).subscribe({
      next: (res) => {
        this.userData.set(res.user);
        
        // Just set the entire PaginatedResponse directly!
        this.reputationData.set(res.reviews);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading portfolio:', err);
        this.isLoading.set(false);
      }
    });
  }
}