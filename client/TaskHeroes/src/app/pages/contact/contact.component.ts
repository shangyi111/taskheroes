import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from 'src/app/services/contact.service';

@Component({
  selector: 'th-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  isSubmitted = false;

  contactForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  onSubmit() {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;

      // Use your new service!
      this.contactService.sendMessage(formData).subscribe({
        next: () => {
          this.isSubmitted = true;
          this.contactForm.reset();
          setTimeout(() => this.isSubmitted = false, 5000);
        },
        error: (err) => {
          console.error('Failed to send message', err);
          alert('Sorry, there was an error sending your message. Please try again.');
        }
      });
    } else {
      this.contactForm.markAllAsTouched();
    }
  }
}