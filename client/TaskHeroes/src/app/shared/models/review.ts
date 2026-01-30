export interface Review {
    id?: string;
    revieweeId?: string;
    reviewerId?: string;
    jobId?: string;
    serviceId?: string;
    rating?: number; // Overall 1-5
    comment?: string; // Text feedback
    communication?: number;

    // Seeker Metrics
    professionalism?: number;
    wasOnTime?: boolean;
    
    // Provider Metrics
    isFullAmountPaid?: boolean;
    isPaidWithin24h?: boolean;
    wouldRecommend?: boolean;
    
    reviewerRole: 'seeker' | 'provider';
    addedDate?: string;
}