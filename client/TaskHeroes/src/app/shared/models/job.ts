import { JobStatus } from './job-status.enum'; // Assuming you created this enum file

export interface PriceItem {
  type: 'base' | 'travel' | 'custom' | 'discount';
  label: string;
  amount: number;
}

// Added to handle the external links/documents specifically
export interface JobDocument {
  name: string;
  url: string;
  public_id?: string; // Optional: Only if using Cloudinary
  uploadedBy?: string; 
  uploadedAt?: Date;
}

export interface Job {
    id?: string;               // Job ID
    performerId?: string;      // User ID of the Provider
    customerId?: string;       // User ID of the Seeker
    serviceId?: string;        // ID of the original Service offering
    
    jobTitle?: string;
    category?: string;
    jobDescription?: string;
    location?: string;
    zipCode?: number;
    customerPhone?: string;

    // Financials
    priceBreakdown: PriceItem[];
    hourlyRate?: number;       // Rate at the time of booking
    paymentMethod?: string;

    // Time & Scheduling
    jobDate?: Date;            // The Full Timestamp (Hybrid: Date + Time)
    startTime?: string;        // Human-readable start (e.g., "14:00")
    duration?: number;         // Duration in MINUTES (crucial for automation)

    // State Machine
    jobStatus?: JobStatus;     // Strictly typed to our 9-step Enum
    lastActionBy?: number;

    providerTerms?: string;    // Custom text for the "Job Terms" section
    documents?: JobDocument[];

    confirmedByProviderAt?: Date;
    confirmedBySeekerAt?: Date;
    cancellationReason?: string;  
    cancelledAt?: Date;
}