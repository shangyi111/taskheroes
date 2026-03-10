import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDataService } from 'src/app/services/user_data.service';
import { User } from 'src/app/shared/models/user';
import { PortfolioService } from 'src/app/services/portfolio.service';

@Component({
  selector: 'th-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent {
  private fb = inject(FormBuilder);
  private userDataService = inject(UserDataService);
  private portfolioService = inject(PortfolioService);

  currentUser: User | null = null;
  isProfileSaved = false;
  isSecuritySaved = false;
  isEditingProfile = false;
  isUploading = false;

  
  profileForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['']
  });

  securityForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    currentPassword: [''],
    newPassword: ['', Validators.minLength(8)],
    confirmPassword: ['']
  });

  ngOnInit() {
    // Listen to the user data stream
    this.userDataService.userData$.subscribe((user) => {
      if (user && user.id) {
        this.currentUser = user;

        // Auto-fill the Profile Form
        this.profileForm.patchValue({
          username: user.username || '',
          firstName: user.profile?.legalFirstName || '',
          lastName: user.profile?.legalLastName || '',
          phone: user.profile?.phoneNumber || ''
        });

        // Auto-fill the Security Form
        this.securityForm.patchValue({
          email: user.email || ''
        });
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isUploading = true;
      const oldPublicId = this.currentUser?.profilePicture 
        ? this.extractPublicId(this.currentUser.profilePicture) 
        : null;
      // Send it to your existing backend route, placing it in a 'profiles' folder
      this.portfolioService.uploadTempImage(file, 'profiles').subscribe({
        next: (response) => {
          const newAvatarUrl = response.url;

          // Instantly update the UI so they see the new image
          if (this.currentUser) {
            this.currentUser.profilePicture = newAvatarUrl;
          }

          // Save the new URL directly to the User model in your PostgreSQL database
          this.userDataService.updateUserProfile({ profilePicture: newAvatarUrl }).subscribe({
            next: () => {
              console.log('Avatar successfully saved to database!');
              this.isUploading = false;
              if (oldPublicId) {
                this.portfolioService.deleteImage(oldPublicId,"image").subscribe();
              }
            },
            error: (err) => {
              console.error('Failed to save avatar URL to DB', err);
              alert('Image uploaded, but failed to save to your profile. Please try again.');
              this.isUploading = false;
            }
          });
        },
        error: (err) => {
          console.error('Cloudinary upload failed', err);
          alert('Failed to upload image. Please try again.');
          this.isUploading = false;
        }
      });
    }
  }

  onSaveProfile() {
    if (this.profileForm.valid) {
      const formData = this.profileForm.value;
      
      this.userDataService.updateUserProfile(formData).subscribe({
        next: () => {
          this.isProfileSaved = true;
          this.profileForm.markAsPristine(); // Resets the button state
          setTimeout(() => this.isProfileSaved = false, 3000); // Hide success message after 3s
        },
        error: (err) => {
          console.error('Save failed:', err);
          alert('Failed to update profile. Please try again.');
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  onSaveSecurity() {
    if (this.securityForm.valid) {
      const formData = this.securityForm.value;

      // Check if the passwords match before sending to the backend!
      if (formData.newPassword !== formData.confirmPassword) {
        alert('Your new passwords do not match!');
        return;
      }

      this.userDataService.updateUserSecurity(formData).subscribe({
        next: () => {
          this.isSecuritySaved = true;
          
          // Clear the password fields for security
          this.securityForm.patchValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
          this.securityForm.markAsPristine();
          
          setTimeout(() => this.isSecuritySaved = false, 3000);
        },
        error: (err) => {
          console.error('Security update failed:', err);
          alert(err.error?.message || 'Failed to update security settings.');
        }
      });
    } else {
      this.securityForm.markAllAsTouched();
    }
  }

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
    // If they cancel editing, reset the form back to their saved data
    if (!this.isEditingProfile && this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username || '',
        firstName: this.currentUser.profile?.legalFirstName || '',
        lastName: this.currentUser.profile?.legalLastName || '',
        phone: this.currentUser.profile?.phoneNumber || ''
      });
    }
  }

  private extractPublicId(cloudinaryUrl: string): string | null {
    if (!cloudinaryUrl) return null;
    try {
      // Example URL: https://res.cloudinary.com/demo/image/upload/v123456/profiles/filename.jpg
      const parts = cloudinaryUrl.split('/');
      const lastPart = parts.pop(); // filename.jpg
      const folderPart = parts.pop(); // profiles
      
      if (lastPart && folderPart) {
        const filenameWithoutExt = lastPart.split('.')[0];
        return `${folderPart}/${filenameWithoutExt}`; // returns "profiles/filename"
      }
      return null;
    } catch (e) {
      console.error('Error extracting public ID', e);
      return null;
    }
  }

  // Add the Remove method
  onRemovePicture() {
    if (!this.currentUser?.profilePicture) return;

    // Optional: Ask for confirmation
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    const publicId = this.extractPublicId(this.currentUser.profilePicture);
    
    if (publicId) {
      // 1. Delete from Cloudinary using your existing service
      this.portfolioService.deleteImage(publicId).subscribe({
        next: () => {
          // 2. Clear it from the database
          this.userDataService.updateUserProfile({ profilePicture: null }).subscribe({
            next: () => {
              if (this.currentUser) {
                this.currentUser.profilePicture = undefined; // Updates the UI instantly
              }
            },
            error: (err) => console.error('Failed to clear avatar in DB', err)
          });
        },
        error: (err) => {
          console.error('Failed to delete image from Cloudinary', err);
          alert('Could not remove the image. Please try again.');
        }
      });
    }
  }
}