import { Directive, ElementRef,  Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appScrollSensor]',
  standalone: true
})
export class ScrollSensorDirective implements AfterViewInit, OnDestroy {
  @Output() sensorInView = new EventEmitter<void>();
  private observer!: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(([entry]) => {
      // Trigger when the element enters the viewport
      if (entry.isIntersecting) {
        this.sensorInView.emit();
      }
    }, { threshold: 0.1 }); // Fires when 10% visible

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer.disconnect(); // Prevent memory leaks
  }
}