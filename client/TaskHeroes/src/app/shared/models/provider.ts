export interface Provider {
    id?:string;//provider id
    userId: string;
    businessName?: string;
    businessAddress?: string; 
    phoneNumber?: string;
    description?: string; 
    profilePicture?: string; 
    // Add other provider-related fields as needed
  }