import { Component, Inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface LightboxData {
  images: any[]; // Replace 'any' with your Image interface
  initialIndex: number;
}

@Component({
  selector: 'gallery-lightbox',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './gallery-lightbox.component.html',
  styleUrls: ['./gallery-lightbox.component.scss']
})
export class GalleryLightboxComponent {
  currentIndex = signal<number>(0);
  images: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<GalleryLightboxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LightboxData
  ) {
    this.images = data.images;
    this.currentIndex.set(data.initialIndex || 0);
  }

  // Allow keyboard navigation for that premium feel
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
    if (event.key === 'Escape') this.close();
  }

  next() {
    this.currentIndex.update(i => (i === this.images.length - 1 ? 0 : i + 1));
  }

  prev() {
    this.currentIndex.update(i => (i === 0 ? this.images.length - 1 : i - 1));
  }

  setIndex(index: number) {
    this.currentIndex.set(index);
  }

  close() {
    this.dialogRef.close();
  }
}