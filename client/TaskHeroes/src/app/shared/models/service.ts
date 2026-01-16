import {Review} from 'src/app/shared/models/review';
import {Job} from 'src/app/shared/models/job';

export interface Service {
    id?:string;//service id
    userId: string;
    businessName?: string;
    businessAddress?: string; 
    zipCode?:number;
    phoneNumber?: string;
    description?: string; 
    profilePicture?: string; 
    portfolio?: string[];
    rating?:number;
    reviews?:Review[];
    jobs?:Job[];
    category?:string,
    hourlyRate?:number,

    // Add other provider-related fields as needed
  }