export interface Chatroom {
    id: string;
    name: string;
    jobId: string; 
    customerId:string,
    providerId:string,
    createdAt: Date;
    updatedAt: Date;
    customerUsername?: string;
    providerUsername?: string;
    customerProfilePicture?: string;
    providerProfilePicture?: string;
    jobTitle?: string;
    jobDate?: Date | string; // Date of the scheduled job
    jobStatus?: string; // e.g., 'Pending', 'Confirmed', 'Completed'
    jobLocation?: string; // For display in the details modal
    fee?: string;
  }
  