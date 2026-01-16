import { Component, EventEmitter, Output, Input } from '@angular/core';
import { PortfolioService } from 'src/app/services/portfolio.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'image-upload',
  standalone : true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  previewUrl: string | null = null;
  isUploading = false;

  @Input() isMultiple: boolean = false;
  @Input() folder: string = 'general';
  @Input() maxSizeMB: number = 5;
  @Output() imageUploaded = new EventEmitter<string>();

  constructor(private portfolioService: PortfolioService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > this.maxSizeMB) {
        alert(`File is too large! Maximum size is ${this.maxSizeMB}MB. (Selected: ${fileSizeMB.toFixed(2)}MB)`);
        event.target.value = ''; // Reset input
        return;
      }
      // 1. Show local preview instantly
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(file);

      // 2. Upload to Cloudinary via Backend
      this.isUploading = true;
      this.portfolioService.uploadImage(file,this.folder).subscribe({
        next: (res) => {
          this.isUploading = false;
          this.imageUploaded.emit(res.url); // Send the new CDN URL to the parent form
          if (this.isMultiple) {
            this.previewUrl = null; 
          }
        },
        error: (err) => {
          this.isUploading = false;
          console.error('Upload failed', err);
        }
      });
    }
  }

  
}