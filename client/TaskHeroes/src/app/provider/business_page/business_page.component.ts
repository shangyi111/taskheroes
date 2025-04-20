import { Component, inject} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { SocketIoService } from 'src/app/services/socket-io.service';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { BusinessService } from 'src/app/services/business.service';
import { FormFieldConfig } from 'src/app/ui-components/th-form/form.component';
import { UserDataService } from 'src/app/services/user_data.service';
import {signal} from '@angular/core';
import {Service} from 'src/app/shared/models/service';
import {MatIconModule} from '@angular/material/icon';
import {User} from 'src/app/shared/models/user';
import {switchMap,take} from 'rxjs/operators';
import {of as observableOf, Subscription} from 'rxjs';
import { ReactiveFormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormComponent } from 'src/app/ui-components/th-form/form.component';

@Component({
  selector: 'business_page',
  standalone: true,
  templateUrl: './business_page.component.html', 
  styleUrls: ['./business_page.component.scss'],
  imports: [MatCardModule,FormComponent,MatIconModule,MatFormFieldModule, ReactiveFormsModule,MatInputModule,MatButtonModule,FormsModule,CommonModule,MatChipsModule, MatExpansionModule], // Import the required modules, including Router
})
export class BusinessPageComponent {
  private socketIoService = inject(SocketIoService);
  private router = inject(Router);
  private businessService = inject(BusinessService);
  private readonly userData$ = inject(UserDataService).userData$;
  serviceForm: FormGroup = inject(FormBuilder).group({
    businessName: ['', Validators.required],
    businessAddress: [''],
    zipCode:[''],
    phoneNumber: [''],
    description: [''],
    profilePicture: [''],
    hourlyRate:[''],
    // Add other form fields as needed
  });
  services: Service[] = [];
  private servicesSubscription: Subscription | null = null;
  private socketSubscriptions: Subscription[] = [];
  serviceBeingEdited: Service | null = null;
  addServicePanelOpenState = signal(false); // New signal for add panel
  editOpenStates = signal<Record<string, boolean>>({});
  formFields: FormFieldConfig[] = [
    { name: 'businessName', label: 'Business Name', type: 'text', validators: [Validators.required] },
    { name: 'businessAddress', label: 'Business Address', type: 'text', validators: [] },
    { name: 'zipCode', label: 'Zip Code', type: 'text', validators: [] },
    { name: 'phoneNumber', label: 'Phone Number', type: 'tel', validators: [] },
    { name: 'hourlyRate', label: 'HourlyRate', type: 'number', validators: [] },
    { name: 'description', label: 'Description', type: 'text', validators: [] },
    { name: 'profilePicture', label: 'Profile Picture URL', type: 'url', validators: [] },
  ];

  ngOnInit(): void {
    this.loadInitialServices();
    this.joinUserRoom();
    this.listenForServiceUpdates();
  }

  ngOnDestroy(): void {
    if (this.servicesSubscription) {
      this.servicesSubscription.unsubscribe();
    }
    this.socketSubscriptions.forEach((sub) => sub.unsubscribe());
    this.socketIoService.disconnect();
  }

  loadInitialServices(): void {
    this.servicesSubscription = this.userData$.pipe(
      switchMap((user: User | null) => {
        if (!user) return observableOf(null);
        return this.businessService.getAllServicesByUserId(user.id!);
      })
    ).subscribe({
      next: (loadedServices: Service[] | null) => {
        if (loadedServices) {
          this.services = loadedServices;
          // If using OnPush, trigger change detection here
        }
      },
      error: (error) => {
        console.error('Error loading initial services:', error);
      },
    });
  }
  joinUserRoom():void{
    this.socketSubscriptions.push(
      this.userData$.pipe(take(1)).subscribe({
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

  listenForServiceUpdates(): void {  
    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Service>('service_created').subscribe((newService) => {
        this.services = [...this.services, newService];
        console.log('Service Created (Real-time):', newService);
        // If using OnPush, trigger change detection here
      })
    );

    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Service>('service_updated').subscribe((updatedService) => {
        this.services = this.services.map((service) =>
          service.id === updatedService.id ? updatedService : service
        );
        console.log('Service Updated (Real-time):', updatedService);
        // If using OnPush, trigger change detection here
      })
    );

    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<{ serviceId: number }>('service_deleted').subscribe((data) => {
        this.services = this.services.filter((service:Service) => service.id != data.serviceId.toString());
        console.log('Service Deleted (Real-time):', data.serviceId);
        // If using OnPush, trigger change detection here
      })
    );
  }

  openDetails(service: Service) {
    this.router.navigate(['service', service.id]);
  }

  onAddSubmit(formGroup:FormGroup) {
    if (formGroup.valid) {
      this.userData$
        .pipe(
          take(1),
          switchMap((user) => {
            if (user) {
              const newService: Service = {
                ...formGroup.value,
                userId: user.id,
              };
              return this.businessService.createService(newService);
            } else {
              return observableOf(null);
            }
          })
        )
        .subscribe({
          next: (createdService) => {
            if (createdService) {
              console.log('Service created via API:', createdService);
              this.serviceBeingEdited = null;
              this.addServicePanelOpenState.set(false);
            }
          },
          error: (error) => {
            console.error('Error creating service:', error);
          },
        });
    }
  }

  onEditSubmit(formGroup:FormGroup,service:Service) {
    if (formGroup.valid) {
      this.userData$
        .pipe(
          take(1),
          switchMap((user) => {
            if (user) {
              const updatedService: Service = {
                ...formGroup.value,
                userId: user.id,
                id: service.id,
              };
              return this.businessService.updateService(service.id!, updatedService);
            } else {
              return observableOf(null);
            }
          })
        )
        .subscribe({
          next: (updatedService) => {
            if (updatedService) {
              console.log('Service updated via API:', updatedService);
              this.serviceBeingEdited = null;
              this.setEditPanelOpen(service.id!, false);
            }
          },
          error: (error) => {
            console.error('Error updating service:', error);
          },
        });
    }
  }

  clearForm(): void {
    this.serviceForm.reset();
    this.serviceBeingEdited = null;
  }

  cancel():void{
    this.serviceBeingEdited = null;
  }

  deleteService(serviceId: string): void {
    if (confirm('Are you sure you want to delete this service?')) {
      this.businessService.deleteService(serviceId).subscribe({
        next: () => {
          this.addServicePanelOpenState.set(false);
          this.setEditPanelOpen(serviceId!,false);
          console.log(`Service with ID ${serviceId} deleted successfully.`);
          // The real-time update should handle removing it from the list
        },
        error: (error) => {
          console.error('Error deleting service:', error);
        },
      });
    }
  }

  editService(service: Service): void {
    this.serviceBeingEdited = service; // Set the service being edited
    this.setEditPanelOpen(service.id!,true);
  }

  isEditPanelOpen(id: string): boolean {
    return this.editOpenStates()[id] ?? false;
  }
  
  setEditPanelOpen(id: string, isOpen: boolean): void {
    const current = this.editOpenStates();
    this.editOpenStates.set({ ...current, [id]: isOpen });
  }  
}