import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { SocketIoService } from 'src/app/services/socket-io.service';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProviderService } from 'src/app/services/provider.service';
import { UserDataService } from 'src/app/services/user_data.service';
import {ChangeDetectionStrategy, signal} from '@angular/core';
import {Provider} from 'src/app/shared/models/provider';
import {User} from 'src/app/shared/models/user';
import {switchMap} from 'rxjs/operators';
import {of as observableOf, Subscription} from 'rxjs';
import { ReactiveFormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';


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
  imports: [MatCardModule,MatIconModule,MatFormFieldModule, ReactiveFormsModule,MatInputModule,MatButtonModule,FormsModule,CommonModule,MatChipsModule, MatExpansionModule], // Import the required modules, including Router
})
export class BusinessPageComponent {
  private socketIoService = inject(SocketIoService);
  private router = inject(Router);
  private providerService = inject(ProviderService);
  private readonly userData$ = inject(UserDataService).userData$;
  readonly panelOpenState = signal(false);
  providerForm: FormGroup = inject(FormBuilder).group({
    businessName: ['', Validators.required],
    businessAddress: [''],
    phoneNumber: [''],
    description: [''],
    profilePicture: [''],
    // Add other form fields as needed
  });
  businessProfiles: BUSINESS_PROFILE[] = [];
  businessStatus = BUSINESS_STATUS;
  providers: Provider[] = [];
  private providersSubscription: Subscription | null = null;
  private socketSubscriptions: Subscription[] = [];
  ngOnInit(): void {
    this.loadInitialProviders();
    this.joinUserRoom();
    this.listenForProviderUpdates();
  }

  ngOnDestroy(): void {
    if (this.providersSubscription) {
      this.providersSubscription.unsubscribe();
    }
    this.socketSubscriptions.forEach((sub) => sub.unsubscribe());
    this.socketIoService.disconnect();
  }

  loadInitialProviders(): void {
    this.providersSubscription = this.userData$.pipe(
      switchMap((user: User | null) => {
        if (!user) return observableOf(null);
        return this.providerService.getAllProvidersByUserId(user.id!);
      })
    ).subscribe({
      next: (loadedProviders: Provider[] | null) => {
        if (loadedProviders) {
          this.providers = loadedProviders;
          // If using OnPush, trigger change detection here
        }
      },
      error: (error) => {
        console.error('Error loading initial providers:', error);
      },
    });
  }
  joinUserRoom():void{
    this.socketSubscriptions.push(
      this.userData$.subscribe({
        next: (user) => {
          if (user && user.id) {
            this.socketIoService.emit('join_user_room', user.id); // Use emit here
            console.log(`User ${user.id} joined room.`);
          }
        },
        error: (error) => {
          console.error('Error getting user data:', error);
        }
      })
    );
  }

  listenForProviderUpdates(): void {  
    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Provider>('provider_created').subscribe((newProvider) => {
        this.providers = [...this.providers, newProvider];
        console.log('Provider Created (Real-time):', newProvider);
        // If using OnPush, trigger change detection here
      })
    );

    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Provider>('provider_updated').subscribe((updatedProvider) => {
        this.providers = this.providers.map((provider) =>
          provider.id === updatedProvider.id ? updatedProvider : provider
        );
        console.log('Provider Updated (Real-time):', updatedProvider);
        // If using OnPush, trigger change detection here
      })
    );

    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<{ providerId: number }>('provider_deleted').subscribe((data) => {
        this.providers = this.providers.filter((provider:Provider) => provider.id != data.providerId.toString());
        console.log('Provider Deleted (Real-time):', data.providerId);
        // If using OnPush, trigger change detection here
      })
    );
  }

  openDetails(provider: Provider) {
    this.router.navigate(['service', provider.id]);
  }

  onSubmit() {
    if (this.providerForm.valid) {
      this.userData$.pipe(
        switchMap((user) => {
          if (user) {
            const newProvider: Provider = {
              ...this.providerForm.value,
              userId: user.id,
            };
            return this.providerService.createProvider(newProvider);
          } else {
            return observableOf(null);
          }
        })
      ).subscribe({
        next: (createdProvider) => {
          if (createdProvider) {
            console.log('Provider created via API:', createdProvider);
            this.providerForm.reset();
            this.panelOpenState.set(false);
            // The real-time update should happen via Socket.IO
          }
        },
        error: (error) => {
          console.error('Error creating provider:', error);
        },
      });
    }
  }

  clearForm(): void {
    this.providerForm.reset();
  }

  deleteProvider(providerId: string): void {
    if (confirm('Are you sure you want to delete this provider?')) {
      this.providerService.deleteProvider(providerId).subscribe({
        next: () => {
          console.log(`Provider with ID ${providerId} deleted successfully.`);
          // The real-time update should handle removing it from the list
        },
        error: (error) => {
          console.error('Error deleting provider:', error);
        },
      });
    }
  }

  editProvider(provider: Provider): void {
    // Implement the logic to change the view to a redactive form
    console.log('Edit provider:', provider);
    // You might want to set a flag to show an edit form for this specific provider
    // and populate the form with the provider's data.
  }
}