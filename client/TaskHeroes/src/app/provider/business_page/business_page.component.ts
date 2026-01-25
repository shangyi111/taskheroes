import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Added for Modal
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Subscription, of as observableOf, take, switchMap } from 'rxjs';

import { SocketIoService } from 'src/app/services/socket-io.service';
import { BusinessService } from 'src/app/services/business.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { Service } from 'src/app/shared/models/service';
import { User } from 'src/app/shared/models/user';
import { AddServiceDialogComponent } from '../add_service_dialog/add_service_dialog.component';

@Component({
  selector: 'business_page',
  standalone: true,
  templateUrl: './business_page.component.html',
  styleUrls: ['./business_page.component.scss'],
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule
  ], 
})
export class BusinessPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private businessService = inject(BusinessService);
  private socketIoService = inject(SocketIoService);
  private userDataService = inject(UserDataService);
  
  readonly userData$ = this.userDataService.userData$;
  services = signal<Service[]>([]); // Using signals for cleaner template updates
  
  private socketSubscriptions: Subscription[] = [];
  private authSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.loadInitialServices();
    this.joinUserRoom();
    this.listenForServiceUpdates();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Navigate to the dedicated management page for a specific service
   */
  manageService(serviceId: string): void {
    this.userData$.pipe(take(1)).subscribe(user => {
      if (user?.id) {
        // Path: /user/:userId/provider/manage/:serviceId
        this.router.navigate(['user', user.id, 'provider', 'manage', serviceId]);
      }
    });
  }

  /**
   * Opens a Dialog/Modal to add a new service instead of an expansion panel
   */
  openAddServiceModal(): void {
    const dialogRef = this.dialog.open(AddServiceDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      panelClass: 'th-modern-dialog', // Optional: for extra styling
      disableClose: false // Allows clicking backdrop to close
    });

    dialogRef.afterClosed().subscribe(result => {
      // result will be 'true' if the service was successfully created
      if (result) {
        console.log('New service added, signal will update via Sockets or manual reload.');
        // Optional: Manual reload if Sockets aren't immediate
        // this.loadInitialServices(); 
      }
    });
  }

  loadInitialServices(): void {
    this.authSubscription = this.userData$.pipe(
      switchMap(user => user ? this.businessService.getAllServicesByUserId(user.id!) : observableOf([]))
    ).subscribe(loadedServices => {
      this.services.set(loadedServices);
    });
  }

  joinUserRoom(): void {
    this.userData$.pipe(take(1)).subscribe(user => {
      if (user?.id) {
        this.socketIoService.emit('join_user_room', user.id);
      }
    });
  }

  listenForServiceUpdates(): void {  
    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Service>('service_created').subscribe(newService => {
        this.services.update(prev => [...prev, newService]);
      }),
      this.socketIoService.onUserEvent<Service>('service_updated').subscribe(updated => {
        this.services.update(prev => prev.map(s => s.id === updated.id ? updated : s));
      }),
      this.socketIoService.onUserEvent<{ serviceId: number }>('service_deleted').subscribe(data => {
        this.services.update(prev => prev.filter(s => s.id !== data.serviceId.toString()));
      })
    );
  }
}