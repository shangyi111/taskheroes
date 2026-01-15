import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { switchMap, take } from 'rxjs';

import { BusinessService } from 'src/app/services/business.service';
import { Service } from 'src/app/shared/models/service';
import { ProviderCalendarComponent } from '../calendar/provider_calendar.component';
import { AddServiceDialogComponent } from '../add_service_dialog/add_service_dialog.component';

@Component({
  selector: 'manage-service',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    ProviderCalendarComponent
  ],
  templateUrl: './manage_service.component.html',
  styleUrls: ['./manage_service.component.scss']
})
export class ManageServiceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private businessService = inject(BusinessService);
  private dialog = inject(MatDialog);

  service = signal<Service | null>(null);

  ngOnInit(): void {
    // 1. Get serviceId from route: /user/:userId/provider/manage/:serviceId
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('serviceId');
        return id ? this.businessService.getServiceById(+id) : [null];
      })
    ).subscribe(data => {
      if (data) this.service.set(data);
    });
  }

  goBack(): void {
    this.location.back();
  }

  openEditModal(): void {
  const currentService = this.service();
  if (!currentService) return;

  const dialogRef = this.dialog.open(AddServiceDialogComponent, {
    width: '650px',
    panelClass:'th-modern-dialog',
    data: { service: currentService, isEdit: true } // Pass existing data
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // If the service was updated, the signal will likely update 
      // via your socket subscription, but we can also manually refresh:
      this.businessService.getServiceById(+currentService.id!)
        .subscribe(updated => this.service.set(updated));
    }
  });
}

  deleteService(): void {
    const id = this.service()?.id;
    if (id && confirm('Are you sure you want to delete this service?')) {
      this.businessService.deleteService(id).subscribe(() => {
        this.router.navigate(['../../'], { relativeTo: this.route });
      });
    }
  }
}