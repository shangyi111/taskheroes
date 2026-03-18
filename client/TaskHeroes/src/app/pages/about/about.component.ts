import { Component, ElementRef, HostListener, OnInit, ViewChild, signal, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'th-about',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDividerModule, ContactComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  // Track the active section for the sidebar highlighting
  activeSection = signal<string>('mission');
  private scroller = inject(ViewportScroller);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // 1. Handle deep-linking (e.g., someone clicks /about#privacy from the header)
    this.route.fragment.subscribe(frag => {
      if (frag) {
        // Short delay to ensure the DOM is rendered before scrolling
        setTimeout(() => this.scrollTo(frag), 100);
      }
    });
  }

  // 2. The Manual Scroll Trigger
  scrollTo(sectionId: string) {
    this.activeSection.set(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onScroll() {
    const sections = ['mission', 'contact', 'tos', 'privacy'];
    const container = this.scrollContainer.nativeElement;
    const scrollPosition = container.scrollTop;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        // Offset check relative to the scrollable container
        if (scrollPosition >= element.offsetTop - 50) {
          this.activeSection.set(section);
        }
      }
    }
  }
}