import {Review} from 'src/app/shared/models/review';
import {Job} from 'src/app/shared/models/job';

export interface Service {
    id?:string;//service id
    userId: string;
    businessName?: string;
    businessAddress?: string; 
    phoneNumber?: string;
    description?: string; 
    profilePicture?: string; 
    rating?:number;
    reviews?:Review[];
    jobs?:Job[];
    category?:string,
    // Add other provider-related fields as needed
  }