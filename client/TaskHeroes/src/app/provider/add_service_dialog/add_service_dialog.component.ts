import { Component, inject, signal, OnInit } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { BusinessService } from 'src/app/services/business.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { ImageUploadComponent } from 'src/app/shared/ui-components/image-upload/image-upload.component';
import { CustomSections, Service, Image } from 'src/app/shared/models/service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'add-service-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, 
    MatIconModule, FormsModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, ImageUploadComponent,
    MatCheckboxModule],
  templateUrl: './add_service_dialog.component.html',
  styleUrls: ['./add_service_dialog.component.scss']
})

export class AddServiceDialogComponent {
  public data = inject(MAT_DIALOG_DATA); 
  
  // Determine if we are editing or creating
  isEditMode = !!this.data?.isEdit;
  initialFormValues = this.data?.service || null;
  isLoading = signal(false);
  additionalSections = signal<any[]>([]);
  socialLinks = signal<any[]>([]);

  private dialogRef = inject(MatDialogRef<AddServiceDialogComponent>);
  private businessService = inject(BusinessService);
  private userDataService = inject(UserDataService);
  private router = inject(Router);

  localData: Partial<Service> = {
    businessName: '',
    category: '',
    hourlyRate: 0,
    businessAddress: '',
    profilePicture: undefined,
    portfolio: []
  };

  flattenedSlots = {
    generalContent: '',
    faqContent: '',
    faqPublic: true,
    paymentContent: '',
    paymentPublic: false
  };

  ngOnInit() {
    if (this.isEditMode && this.data.service) {
      const s = this.data.service as Service;
      // Flatten the customSections into the top-level form fields
      this.localData = { ...s };
      
      this.flattenedSlots = {
        generalContent: s.customSections?.general?.content || '',
        faqContent: s.customSections?.faq?.content || '',
        faqPublic: s.customSections?.faq?.isPublic ?? true,
        paymentContent: s.customSections?.payment?.content || '',
        paymentPublic: s.customSections?.payment?.isPublic ?? false
      };
      this.additionalSections.set(s.customSections?.additional || []);
      this.socialLinks.set(this.data.service.customSections?.links || []);
    }
  }

  handleProfilePic(img: Image) {
    this.localData.profilePicture = img;
  }

  addSocialLink() {
    // We add it to the UI, but we will scrub it before saving
    this.socialLinks.update(links => [...links, { platform: 'instagram', url: '', isPublic: true }]);
  }

  removeSocialLink(index: number) {
    this.socialLinks.update(links => {
      const updated = [...links];
      updated.splice(index, 1);
      return updated;
    });
  }

  handlePortfolio(img: Image) {
    this.localData.portfolio = [...(this.localData.portfolio || []), img];
  }
  addCustomSection() {
    this.additionalSections.update(sections => [
      ...sections, 
      { title: '', content: '', isPublic: true } // Start with empty strings
    ]);
  }

  updateSectionTitle(index: number, newTitle: string) {
    this.additionalSections.update(sections => {
      const updated = [...sections];
      updated[index].title = newTitle;
      return updated;
    });
  }
  removePortfolioItem(index: number) {
    const current = [...(this.localData.portfolio || [])];
    current.splice(index, 1);
    this.localData.portfolio = current;
  }

  removeCustomSection(index: number) {
    const current = this.additionalSections();
    current.splice(index, 1);
    this.additionalSections.set([...current]);
  }

  onAddSubmit() { 
    this.isLoading.set(true);
    this.userDataService.userData$.pipe(take(1)).subscribe(user => {
      if (!user) return;


      const cleanLinks = this.socialLinks().filter(link => link.url && link.url.trim() !== '');

      // Filter out custom sections with no title AND no content
      const cleanAdditional = this.additionalSections().filter(sec => 
        (sec.title && sec.title.trim() !== '') || (sec.content && sec.content.trim() !== '')
      );

      const customSections: CustomSections = {
        general: { content: this.flattenedSlots.generalContent, isPublic: true },
        faq: { content: this.flattenedSlots.faqContent, isPublic: this.flattenedSlots.faqPublic },
        payment: { content: this.flattenedSlots.paymentContent, isPublic: this.flattenedSlots.paymentPublic },
        links: cleanLinks,
        additional: cleanAdditional
      };

      const payload: Service = {
        ...this.localData as Service,
        customSections: customSections,
        userId: user.id!
      };

      const request = this.isEditMode 
        ? this.businessService.updateService(this.data.service.id, payload)
        : this.businessService.createService(payload);

      request.subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.dialogRef.close(true);
          if (!this.isEditMode) {
            this.router.navigate(['provider', user.id, 'manage', res.id]);
          }
        },
        error: () => this.isLoading.set(false)
      });
    });
  }

  onClose() {
    this.dialogRef.close();
  }
}