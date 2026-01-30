export interface ReviewEligibility {
  allowed: boolean;
  isExpired: boolean;
  hasReviewed: boolean;
  daysRemaining: number | null;
}

export interface Chatroom {
  id: string;
  name: string; // Backend provides "displayName" (Partner name or Business name)
  jobId: string;
  customerId: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;

  customerUsername?: string;
  providerUsername?: string;
  customerProfilePicture?: string;
  serviceProfilePicture?: string; 

  // Flattened Job Attributes
  jobTitle?: string;
  jobDate?: Date | string;
  jobStatus?: string;
  jobLocation?: string;
  fee?: string;
  description?: string;
  hasUnread?: boolean;

  reviewEligibility?: ReviewEligibility;
  existingReview?: string;
}