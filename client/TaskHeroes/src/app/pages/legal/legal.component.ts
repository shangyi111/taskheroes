import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'legal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss']
})
export class LegalComponent {
  private route = inject(ActivatedRoute);

  ngAfterViewInit(): void {
    // This listens to the URL (e.g., #privacy-data) when the page first loads
    this.route.fragment.subscribe((fragment: string | null) => {
      if (fragment) {
        // A tiny timeout ensures the HTML has fully painted before we try to scroll
        setTimeout(() => this.scrollToSection(fragment), 100);
      }
    });
  }
  
  // This handles the smooth scrolling when clicking a catalog link
  scrollToSection(elementId: string): void {
    const element = document.getElementById(elementId);
    
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else {
      console.warn(`Could not find section with id: ${elementId}`);
    }
  }
}