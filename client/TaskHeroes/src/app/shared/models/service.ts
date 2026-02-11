import {Review} from 'src/app/shared/models/review';
import {Job} from 'src/app/shared/models/job';

export interface ServiceSlot {
  content: string;
  isPublic: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
  isPublic: boolean;
}

export interface CustomSections {
  general?: ServiceSlot;
  faq?: ServiceSlot;
  payment?: ServiceSlot;
  links?: SocialLink[];
  deposit?: {
    required: boolean;
    value: number;
    type: 'percentage' | 'fixed';
    refundable: boolean;
  };
  additional?: (ServiceSlot & { title: string })[];
}

export interface Image{
    url: string;
    public_id: string;
}
export interface Service {
    id?:string;//service id
    userId: string;
    businessName?: string;
    businessAddress?: string; 
    zipCode?:number;
    phoneNumber?: string;
    description?: string; 
    profilePicture?: Image;
    portfolio?: Image[];
    rating?:number;
    reviews?:Review[];
    jobs?:Job[];
    category?:string,
    hourlyRate?:number,
    customSections?: CustomSections;
    isOwner?: boolean;

    // Add other provider-related fields as needed
  }