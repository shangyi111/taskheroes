import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'th-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class ThLoadingComponent {
  @Input() message: string = 'Loading...';
  @Input() height: string = '100%';
  @Input() type: 'spinner' | 'skeleton' = 'spinner'; // Default to spinner
}