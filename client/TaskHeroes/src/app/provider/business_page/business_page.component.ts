import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


export enum BUSINESS_STATUS {
  Listed = 'listed',
  InProgress = 'in-progress'
}

export interface BUSINESS_PROFILE {
  id?: number;//service id
  userId?:number;//provider's user id
  photo?: string;
  serviceName?: string;
  description?: string;
  status?: BUSINESS_STATUS;
  details?: string;
  phone?:string;
  email?:string;
  website?:string;
  city?:string;
  state?:string;
  country?:string;
  zipcode?:number;
  reviewCount?:number;
  category?:string;
  rating?:number;
  reviews?:string[];
}

const TEMP_PROFILES = [
  {
    id: 1,
    userId:1,
    photo: 'business1.jpg',
    serviceName: 'Home Organization service',
    description: 'Short description of service 1.',
    status: BUSINESS_STATUS.Listed,
    details: 'Detailed information about Service Provider 1.',
    rating:5,
    category:"Home Organization",
    reviewCount:3,
  },
  {
    id: 2,
    photo: 'business2.jpg',
    name: 'Cleaning service',
    description: 'Short description of service 2.',
    status: BUSINESS_STATUS.InProgress,
    details: 'Detailed information about Service Provider 2.'
  },
  // Add more business profiles as needed
];

@Component({
  selector: 'business_page',
  standalone: true,
  templateUrl: './business_page.component.html', 
  styleUrls: ['./business_page.component.scss'],
  imports: [MatCardModule, MatButtonModule,FormsModule,CommonModule,MatChipsModule], // Import the required modules, including Router
})
export class BusinessPageComponent {
  private router = inject(Router);
  businessProfiles: BUSINESS_PROFILE[] = [];
  businessStatus = BUSINESS_STATUS;


  ngOnInit(): void {
    // In a real application, fetch business profile data from a service
    this.businessProfiles = TEMP_PROFILES;
  }

  openDetails(profile:BUSINESS_PROFILE){
    this.router.navigate(['service', profile.id]);
  }

}